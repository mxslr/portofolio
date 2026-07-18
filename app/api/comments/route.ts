import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { checkComment, checkName } from "@/lib/moderation";

const TABLE = "portfolio_comments";
const CLIENT_ID_RE = /^[A-Za-z0-9-]{8,64}$/;

function supabaseHeaders() {
  const key = process.env.SUPABASE_ANON_KEY ?? "";
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
}

function configured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

function clientIp(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

function ipHash(ip: string) {
  return createHash("sha256")
    .update(`${ip}:${process.env.SUPABASE_ANON_KEY ?? "salt"}`)
    .digest("hex")
    .slice(0, 32);
}

// fast in-process limit; the database trigger is the real enforcement
const lastPost = new Map<string, number>();

// one retry on transient network failures to Supabase
async function fetchRetry(url: string, init: RequestInit) {
  try {
    return await fetch(url, init);
  } catch {
    return fetch(url, init);
  }
}

export async function GET() {
  if (!configured()) return NextResponse.json([]);
  const res = await fetchRetry(
    `${process.env.SUPABASE_URL}/rest/v1/${TABLE}?select=id,author,body,created_at&order=created_at.desc&limit=50`,
    { headers: supabaseHeaders(), next: { revalidate: 0 } }
  );
  if (!res.ok) {
    return NextResponse.json({ error: "Could not load comments." }, { status: 502 });
  }
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  if (!configured()) {
    return NextResponse.json(
      { error: "Comments are not configured yet." },
      { status: 503 }
    );
  }

  const ip = clientIp(req);
  const now = Date.now();
  if (now - (lastPost.get(ip) ?? 0) < 20_000) {
    return NextResponse.json(
      { error: "Easy there. Wait a few seconds between comments." },
      { status: 429 }
    );
  }

  let payload: { author?: unknown; body?: unknown; clientId?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const author =
    typeof payload.author === "string"
      ? payload.author.trim().replace(/\s+/g, " ")
      : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  const clientId = typeof payload.clientId === "string" ? payload.clientId : "";

  if (!CLIENT_ID_RE.test(clientId)) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const nameVerdict = checkName(author);
  if (!nameVerdict.ok) {
    return NextResponse.json({ error: nameVerdict.reason }, { status: 400 });
  }
  const bodyVerdict = checkComment(body);
  if (!bodyVerdict.ok) {
    return NextResponse.json({ error: bodyVerdict.reason }, { status: 400 });
  }

  // one comment per browser
  const dup = await fetchRetry(
    `${process.env.SUPABASE_URL}/rest/v1/${TABLE}?select=id&client_id=eq.${encodeURIComponent(clientId)}&limit=1`,
    { headers: supabaseHeaders() }
  );
  if (dup.ok && ((await dup.json()) as unknown[]).length > 0) {
    return NextResponse.json(
      { error: "You already left a comment on this document. One per visitor.", already: true },
      { status: 409 }
    );
  }

  const res = await fetchRetry(`${process.env.SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({ author, body, client_id: clientId, ip_hash: ipHash(ip) }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (text.includes("duplicate key")) {
      return NextResponse.json(
        { error: "You already left a comment on this document. One per visitor.", already: true },
        { status: 409 }
      );
    }
    if (text.includes("rate_limited")) {
      return NextResponse.json(
        { error: "You have hit the comment limit for now. Come back later." },
        { status: 429 }
      );
    }
    return NextResponse.json(
      { error: "Could not post the comment." },
      { status: 502 }
    );
  }

  lastPost.set(ip, now);
  return NextResponse.json({ ok: true }, { status: 201 });
}
