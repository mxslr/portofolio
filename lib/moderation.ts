/*
 * Lightweight server-side moderation for visitor-submitted names and comments.
 * Normalization defeats the usual disguises: leetspeak (k0nt0l), spacing
 * (k o n t o l), repeats (fuuuck), and mixed case.
 */

const LEET: Record<string, string> = {
  "0": "o",
  "1": "i",
  "2": "z",
  "3": "e",
  "4": "a",
  "5": "s",
  "6": "g",
  "7": "t",
  "8": "b",
  "9": "g",
  "@": "a",
  "$": "s",
  "!": "i",
  "|": "i",
  "+": "t",
  "€": "e",
};

/* matched as substrings of the fully collapsed string */
const STRONG_WORDS = [
  "kontol",
  "memek",
  "ngentot",
  "ngewe",
  "jancok",
  "jancuk",
  "bangsat",
  "bajingan",
  "goblok",
  "tolol",
  "pantek",
  "pepek",
  "peler",
  "lonte",
  "pelacur",
  "jablay",
  "colmek",
  "bokep",
  "itil",
  "kimak",
  "fuck",
  "bitch",
  "asshole",
  "dickhead",
  "pussy",
  "cunt",
  "nigger",
  "nigga",
  "faggot",
  "retard",
  "whore",
  "slut",
  "hitler",
];

/* short words that would cause false positives as substrings,
   matched only as whole tokens */
const WORD_ONLY = [
  "anjing",
  "babi",
  "asu",
  "bego",
  "tai",
  "titit",
  "coli",
  "perek",
  "ass",
  "dick",
  "cock",
  "porn",
  "sex",
  "anj",
  "kntl",
  "mmk",
];

function normalize(input: string) {
  const lowered = input.toLowerCase();
  let mapped = "";
  for (const ch of lowered) {
    mapped += LEET[ch] ?? ch;
  }
  // keep only letters as token separators for the word check
  const rawTokens = mapped
    .split(/[^a-z]+/)
    .filter(Boolean)
    .map((t) => t.replace(/(.)\1+/g, "$1"));
  // merge runs of single letters so "a n j i n g" becomes "anjing"
  const tokens: string[] = [];
  let run = "";
  for (const t of rawTokens) {
    if (t.length === 1) {
      run += t;
      continue;
    }
    if (run.length > 1) tokens.push(run);
    run = "";
    tokens.push(t);
  }
  if (run.length > 1) tokens.push(run);
  // collapsed: letters only, repeats squashed, for substring checks
  const collapsed = mapped.replace(/[^a-z]/g, "").replace(/(.)\1+/g, "$1");
  return { tokens, collapsed };
}

export function containsProfanity(input: string): boolean {
  const { tokens, collapsed } = normalize(input);
  if (STRONG_WORDS.some((w) => collapsed.includes(w))) return true;
  if (WORD_ONLY.some((w) => tokens.includes(w))) return true;
  return false;
}

const URL_RE = /(https?:\/\/|www\.|\.com\b|\.id\b|\.net\b|\.xyz\b|bit\.ly)/i;

export interface Verdict {
  ok: boolean;
  reason?: string;
}

export function checkName(raw: string): Verdict {
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name || name.length > 30) {
    return { ok: false, reason: "Name must be 1 to 30 characters." };
  }
  if ((name.match(/[a-zA-Z]/g) ?? []).length < 2) {
    return { ok: false, reason: "Use a real name with at least two letters." };
  }
  if (URL_RE.test(name)) {
    return { ok: false, reason: "Links do not belong in a name." };
  }
  if (containsProfanity(name)) {
    return { ok: false, reason: "Pick a friendlier name. This is a family document." };
  }
  return { ok: true };
}

export function checkComment(raw: string): Verdict {
  const body = raw.trim();
  if (!body || body.length > 500) {
    return { ok: false, reason: "Comment must be 1 to 500 characters." };
  }
  if (URL_RE.test(body)) {
    return { ok: false, reason: "Links are not allowed in comments." };
  }
  if (containsProfanity(body)) {
    return { ok: false, reason: "Keep it civil. This document has feelings." };
  }
  // crude flood check: one character repeated endlessly
  if (/(.)\1{15,}/.test(body)) {
    return { ok: false, reason: "That looks like keyboard spam." };
  }
  return { ok: true };
}
