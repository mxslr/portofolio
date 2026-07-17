import { NextRequest, NextResponse } from "next/server";

const TABLE = "portfolio_typing_scores";
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

interface Row {
  name: string;
  wpm: number;
  accuracy: number;
  created_at: string;
}

const base = () => `${process.env.SUPABASE_URL}/rest/v1/${TABLE}`;

async function countWhere(filter: string): Promise<number> {
  const res = await fetchRetry(`${base()}?select=id&${filter}&limit=1`, {
    headers: { ...supabaseHeaders(), Prefer: "count=exact" },
  });
  const range = res.headers.get("content-range") ?? "";
  const total = Number(range.split("/")[1]);
  return Number.isFinite(total) ? total : 0;
}

async function rankOf(row: Row): Promise<number> {
  const better = await countWhere(`wpm=gt.${row.wpm}`);
  const tiesEarlier = await countWhere(
    `wpm=eq.${row.wpm}&created_at=lt.${encodeURIComponent(row.created_at)}`
  );
  return better + tiesEarlier + 1;
}

async function myRow(clientId: string): Promise<Row | null> {
  const res = await fetchRetry(
    `${base()}?select=name,wpm,accuracy,created_at&client_id=eq.${encodeURIComponent(clientId)}&limit=1`,
    { headers: supabaseHeaders() }
  );
  if (!res.ok) return null;
  const rows: Row[] = await res.json();
  return rows[0] ?? null;
}

export async function GET(req: NextRequest) {
  if (!configured()) return NextResponse.json({ top: [], me: null });

  const res = await fetchRetry(
    `${base()}?select=name,wpm,accuracy,created_at&order=wpm.desc,created_at.asc&limit=10`,
    { headers: supabaseHeaders(), next: { revalidate: 0 } }
  );
  if (!res.ok) {
    return NextResponse.json({ error: "Could not load the leaderboard." }, { status: 502 });
  }
  const top: Row[] = await res.json();

  const clientId = req.nextUrl.searchParams.get("client") ?? "";
  let me: (Row & { rank: number }) | null = null;
  if (CLIENT_ID_RE.test(clientId)) {
    const row = await myRow(clientId);
    if (row) me = { ...row, rank: await rankOf(row) };
  }

  return NextResponse.json({ top, me });
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

  let payload: {
    clientId?: unknown;
    name?: unknown;
    wpm?: unknown;
    accuracy?: unknown;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const clientId = typeof payload.clientId === "string" ? payload.clientId : "";
  const name = typeof payload.name === "string" ? payload.name.trim() : "";
  const wpm = typeof payload.wpm === "number" ? Math.round(payload.wpm * 10) / 10 : NaN;
  const accuracy =
    typeof payload.accuracy === "number" ? Math.round(payload.accuracy * 10) / 10 : NaN;

  if (
    !CLIENT_ID_RE.test(clientId) ||
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

  const existing = await myRow(clientId);
  let improved = false;

  if (!existing) {
    const res = await fetchRetry(base(), {
      method: "POST",
      headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({ client_id: clientId, name, wpm, accuracy }),
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Could not save the score." }, { status: 502 });
    }
    improved = true;
  } else if (wpm > existing.wpm) {
    const res = await fetchRetry(
      `${base()}?client_id=eq.${encodeURIComponent(clientId)}`,
      {
        method: "PATCH",
        headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
        body: JSON.stringify({ wpm, accuracy }),
      }
    );
    if (!res.ok) {
      return NextResponse.json({ error: "Could not save the score." }, { status: 502 });
    }
    improved = true;
  }

  lastPost.set(ip, now);

  const row = (await myRow(clientId)) ?? {
    name,
    wpm,
    accuracy,
    created_at: new Date().toISOString(),
  };
  const rank = await rankOf(row);

  return NextResponse.json(
    { ok: true, improved, best: row.wpm, rank },
    { status: 201 }
  );
}
