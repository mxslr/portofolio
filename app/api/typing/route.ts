import { NextRequest, NextResponse } from "next/server";

const TABLE = "portfolio_typing_scores";

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

// naive per-instance rate limit: 1 score per 10s per IP
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
    `${process.env.SUPABASE_URL}/rest/v1/${TABLE}?select=name,wpm,accuracy,created_at&order=wpm.desc,created_at.asc&limit=15`,
    { headers: supabaseHeaders(), next: { revalidate: 0 } }
  );
  if (!res.ok) {
    return NextResponse.json({ error: "Could not load the leaderboard." }, { status: 502 });
  }
  return NextResponse.json(await res.json());
}

export async function POST(req: NextRequest) {
  if (!configured()) {
    return NextResponse.json(
      { error: "The leaderboard is not configured yet." },
      { status: 503 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  const now = Date.now();
  if (now - (lastPost.get(ip) ?? 0) < 10_000) {
    return NextResponse.json(
      { error: "Take a breath before submitting another run." },
      { status: 429 }
    );
  }

  let payload: { name?: unknown; wpm?: unknown; accuracy?: unknown };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const wpm = typeof payload.wpm === "number" ? Math.round(payload.wpm * 10) / 10 : NaN;
  const accuracy =
    typeof payload.accuracy === "number" ? Math.round(payload.accuracy * 10) / 10 : NaN;

  if (
    !name ||
    name.length > 30 ||
    !Number.isFinite(wpm) ||
    wpm <= 0 ||
    wpm > 300 ||
    !Number.isFinite(accuracy) ||
    accuracy < 0 ||
    accuracy > 100
  ) {
    return NextResponse.json({ error: "That score does not look right." }, { status: 400 });
  }

  const res = await fetchRetry(`${process.env.SUPABASE_URL}/rest/v1/${TABLE}`, {
    method: "POST",
    headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
    body: JSON.stringify({ name, wpm, accuracy }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Could not save the score." }, { status: 502 });
  }

  lastPost.set(ip, now);
  return NextResponse.json({ ok: true }, { status: 201 });
}
