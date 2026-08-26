"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import assistant from "@/data/assistant.json";

interface Msg {
  role: "user" | "assistant";
  content: string;
  sticker?: string;
}

const SESSION_LIMIT = 10;

function getClientId() {
  let id = localStorage.getItem("typing-client-id");
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem("typing-client-id", id);
  }
  return id;
}

function LaughSticker({ src }: { src: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt="Laughing sticker"
      width={120}
      height={120}
      className="h-28 w-28 object-contain"
    />
  );
}

function pickSticker() {
  return assistant.stickers[Math.floor(Math.random() * assistant.stickers.length)];
}

export default function Assistant() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uses, setUses] = useState(0);
  const [teaser, setTeaser] = useState<string | null>(null);
  const [lang, setLang] = useState<"en" | "id">("en");
  const listRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const teaserCount = useRef(0);

  useEffect(() => {
    const l = navigator.language?.toLowerCase().startsWith("id") ? "id" : "en";
    setLang(l);
    setMsgs([{ role: "assistant", content: assistant.greeting[l] }]);
    setUses(Number(sessionStorage.getItem("assistant-uses") ?? 0));
  }, []);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  /* idle teasers while closed */
  useEffect(() => {
    const timer = setInterval(() => {
      if (openRef.current || teaserCount.current >= 4) return;
      teaserCount.current += 1;
      setTeaser(assistant.teasers[(teaserCount.current - 1) % assistant.teasers.length]);
      setTimeout(() => setTeaser(null), 6500);
    }, 18_000);
    return () => clearInterval(timer);
  }, []);

  const scrollDown = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const send = async () => {
    const text = input.trim();
    if (!text || sending || uses >= SESSION_LIMIT) return;
    const next: Msg[] = [...msgs, { role: "user" as const, content: text }];
    setMsgs(next);
    setInput("");
    setSending(true);
    scrollDown();

    const newUses = uses + 1;
    setUses(newUses);
    sessionStorage.setItem("assistant-uses", String(newUses));

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: getClientId(),
          messages: next
            .filter((m) => !m.sticker)
            .slice(-8)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong.");
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content: data.text,
          sticker: data.sticker ? pickSticker() : undefined,
        },
      ]);
    } catch (err) {
      setMsgs((m) => [
        ...m,
        {
          role: "assistant",
          content:
            err instanceof Error ? err.message : "Something went wrong. Try again.",
        },
      ]);
    } finally {
      setSending(false);
      scrollDown();
    }
  };

  const limitReached = uses >= SESSION_LIMIT;

  return (
    <div ref={rootRef}>
      {/* ------------------------------------------------------- launcher */}
      {!open && (
        <div className="fixed bottom-10 right-3 z-40 flex flex-col items-end gap-2 sm:right-5">
          {teaser && (
            <button
              data-teaser
              className="assistant-pop max-w-56 border border-line bg-surface px-3 py-2 text-left text-[12.5px] leading-snug text-ink"
              onClick={() => {
                setTeaser(null);
                setOpen(true);
              }}
            >
              {teaser}
            </button>
          )}
          <button
            aria-label="Chat with Baymax, Marshall's assistant"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white hover:opacity-90"
            onClick={() => {
              setTeaser(null);
              setOpen(true);
            }}
          >
            <MessageCircle size={21} strokeWidth={1.8} />
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------- panel */}
      {open && (
        <div
          ref={panelRef}
          className="assistant-panel-in fixed inset-0 z-50 flex flex-col border-line bg-surface sm:inset-auto sm:bottom-12 sm:right-5 sm:h-[540px] sm:max-h-[80dvh] sm:w-[372px] sm:border"
        >
          {/* header */}
          <header className="flex items-center gap-2.5 border-b border-line bg-chrome px-3 py-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={assistant.avatar}
              alt="Baymax"
              width={32}
              height={32}
              className="h-8 w-8 shrink-0 rounded-full border border-line object-cover"
            />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[13px] font-semibold text-ink">
                {assistant.name}
              </p>
              <p className="text-[11.5px] text-dim">
                {sending
                  ? "typing..."
                  : lang === "id"
                    ? "Tanya apa saja tentang Marshall"
                    : "Ask anything about Marshall"}
              </p>
            </div>
            <button
              className="flex h-8 w-8 items-center justify-center rounded text-ink hover:bg-hover"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              <X size={15} />
            </button>
          </header>

          {/* messages */}
          <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-2.5">
              {msgs.map((m, i) =>
                m.sticker ? (
                  <div key={i} className="flex flex-col items-start gap-1 text-ink">
                    <LaughSticker src={m.sticker} />
                    <p className="max-w-[85%] text-[12.5px] text-dim">{m.content}</p>
                  </div>
                ) : (
                  <p
                    key={i}
                    className={`max-w-[85%] whitespace-pre-wrap rounded-md px-3 py-2 text-[13.5px] leading-relaxed ${
                      m.role === "user"
                        ? "self-end bg-accent text-white"
                        : "self-start border border-line bg-commentbg text-ink"
                    }`}
                  >
                    {m.content}
                  </p>
                )
              )}
              {sending && (
                <span className="flex items-center gap-1 self-start border border-line bg-commentbg px-3 py-2.5" aria-label="Assistant is typing">
                  {[0, 1, 2].map((d) => (
                    <span
                      key={d}
                      className="h-1.5 w-1.5 animate-pulse rounded-full bg-dim"
                      style={{ animationDelay: `${d * 180}ms` }}
                    />
                  ))}
                </span>
              )}
            </div>
          </div>

          {/* input */}
          <div className="border-t border-line p-2.5">
            {limitReached ? (
              <p className="px-1 py-1 text-[12.5px] text-dim">
                {assistant.limitNote[lang]}
              </p>
            ) : (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
              >
                <input
                  className="h-9 w-full border border-line bg-surface px-3 text-[13.5px] text-ink outline-none placeholder:text-dim focus:border-accent"
                  placeholder={lang === "id" ? "Tulis pertanyaan..." : "Type a question..."}
                  value={input}
                  maxLength={400}
                  onChange={(e) => setInput(e.target.value)}
                />
                <button
                  type="submit"
                  aria-label="Send"
                  disabled={sending || !input.trim()}
                  className="flex h-9 w-9 shrink-0 items-center justify-center bg-accent text-white hover:opacity-90 disabled:opacity-40"
                >
                  <Send size={15} strokeWidth={1.8} />
                </button>
              </form>
            )}
            <p className="mt-1.5 px-1 text-[10.5px] text-dim">
              {SESSION_LIMIT - uses > 0
                ? `${SESSION_LIMIT - uses} ${lang === "id" ? "pesan tersisa sesi ini" : "messages left this session"}`
                : ""}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
