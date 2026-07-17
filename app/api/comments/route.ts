import { NextRequest, NextResponse } from "next/server";

const TABLE = "portfolio_comments";

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

// naive per-instance rate limit: 1 post per 20s per IP
const lastPost = new Map<string, number>();

export async function GET() {
  if (!configured()) return NextResponse.json([]);
  const res = await fetch(
    `${process.env.SUPABASE_URL}/rest/v1/${TABLE}?select=id,author,body,created_at&order=created_at.desc&limit=100`,
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

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  if (now - (lastPost.get(ip) ?? 0) < 20_000) {
    return NextResponse.json(
      { error: "Easy there. Wait a few seconds between comments." },
      { status: 429 }
    );
  }

  let payload: { author?: unknown; body?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const author = typeof payload.author === "string" ? payload.author.trim() : "";
  const body = typeof payload.body === "string" ? payload.body.trim() : "";
  if (!author || !body || author.length > 60 || body.length > 500) {
    return NextResponse.json(
      { error: "Name (max 60) and comment (max 500) are required." },
      { status: 400 }
    );
  }

  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({ author, body }),
  });

  if (!res.ok) {
    return NextResponse.json(
      { error: "Could not post the comment." },
      { status: 502 }
    );
  }

  lastPost.set(ip, now);
  return NextResponse.json({ ok: true }, { status: 201 });
}
