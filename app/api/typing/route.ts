import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { checkName } from "@/lib/moderation";

const TABLE = "portfolio_typing_scores";
const CLIENT_ID_RE = /^[A-Za-z0-9-]{8,64}$/;
const MAX_WPM = 250;
const MIN_TARGET_LEN = 60;
const MAX_TARGET_LEN = 800;
const TOKEN_MAX_AGE_MS = 30 * 60 * 1000;

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

/* ------------------------------------------------- signed round tokens */

function secret() {
  return `round:${process.env.SUPABASE_ANON_KEY ?? "dev-secret"}`;
}

function signRound(issuedAt: number, targetLen: number) {
  const payload = `${issuedAt}.${targetLen}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyRound(token: string): { issuedAt: number; targetLen: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [t, len, sig] = parts;
  const expected = createHmac("sha256", secret()).update(`${t}.${len}`).digest("hex");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const issuedAt = Number(t);
  const targetLen = Number(len);
  if (!Number.isFinite(issuedAt) || !Number.isFinite(targetLen)) return null;
  return { issuedAt, targetLen };
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
  /* round token issuance for a new game */
  const roundLen = req.nextUrl.searchParams.get("round");
  if (roundLen !== null) {
    const len = Number(roundLen);
    if (!Number.isFinite(len) || len < MIN_TARGET_LEN || len > MAX_TARGET_LEN) {
      return NextResponse.json({ error: "Invalid round." }, { status: 400 });
    }
    return NextResponse.json({ token: signRound(Date.now(), Math.round(len)) });
  }

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

  const ip = clientIp(req);
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
    token?: unknown;
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const clientId = typeof payload.clientId === "string" ? payload.clientId : "";
  const name =
    typeof payload.name === "string"
      ? payload.name.trim().replace(/\s+/g, " ")
      : "";
  const wpm = typeof payload.wpm === "number" ? Math.round(payload.wpm * 10) / 10 : NaN;
  const accuracy =
    typeof payload.accuracy === "number" ? Math.round(payload.accuracy * 10) / 10 : NaN;
  const token = typeof payload.token === "string" ? payload.token : "";

  if (
    !CLIENT_ID_RE.test(clientId) ||
    !Number.isFinite(wpm) ||
    wpm <= 0 ||
    wpm > MAX_WPM ||
    !Number.isFinite(accuracy) ||
    accuracy < 0 ||
    accuracy > 100
  ) {
    return NextResponse.json({ error: "That score does not look right." }, { status: 400 });
  }

  const nameVerdict = checkName(name);
  if (!nameVerdict.ok) {
    return NextResponse.json({ error: nameVerdict.reason }, { status: 400 });
  }

  /* anti-cheat: the round token proves when the round started and how long
     the text was, so a claimed WPM cannot beat physics */
  const round = verifyRound(token);
  if (!round) {
    return NextResponse.json(
      { error: "Round expired. Start a new game." },
      { status: 400 }
    );
  }
  const elapsedMin = (now - round.issuedAt) / 60000;
  const tokenAge = now - round.issuedAt;
  if (tokenAge < 0 || tokenAge > TOKEN_MAX_AGE_MS || elapsedMin <= 0) {
    return NextResponse.json(
      { error: "Round expired. Start a new game." },
      { status: 400 }
    );
  }
  const physicalMax = (round.targetLen / 5 / elapsedMin) * 1.15;
  if (wpm > physicalMax) {
    return NextResponse.json({ error: "That score does not look right." }, { status: 400 });
  }

  const existing = await myRow(clientId);
  let improved = false;

  if (!existing) {
    const res = await fetchRetry(base(), {
      method: "POST",
      headers: { ...supabaseHeaders(), Prefer: "return=minimal" },
      body: JSON.stringify({
        client_id: clientId,
        name,
        wpm,
        accuracy,
        ip_hash: ipHash(ip),
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      if (text.includes("rate_limited")) {
        return NextResponse.json(
          { error: "You have hit the score limit for now. Come back later." },
          { status: 429 }
        );
      }
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
