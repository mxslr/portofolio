"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard, RotateCcw, Trophy } from "lucide-react";

interface Row {
  name: string;
  wpm: number;
  accuracy: number;
  created_at: string;
}

interface Board {
  top: Row[];
  me: (Row & { rank: number }) | null;
}

type Phase = "idle" | "running" | "done";

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

export default function TypingTest({
  sentences,
  perRound,
}: {
  sentences: string[];
  perRound: number;
}) {
  const [name, setName] = useState("");
  const [locked, setLocked] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [target, setTarget] = useState("");
  const [typed, setTyped] = useState("");
  const [startAt, setStartAt] = useState(0);
  const [liveWpm, setLiveWpm] = useState(0);
  const [result, setResult] = useState<{ wpm: number; accuracy: number } | null>(null);
  const [board, setBoard] = useState<Board>({ top: [], me: null });
  const [boardError, setBoardError] = useState(false);
  const [submitNote, setSubmitNote] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const clientIdRef = useRef("");
  // synchronous mirrors of typing state: onChange can fire faster than React
  // commits state, so guards must not read from the render closure
  const typedRef = useRef("");
  const mistakesRef = useRef(0);
  const startRef = useRef(0);

  const loadBoard = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/typing?client=${encodeURIComponent(clientIdRef.current)}`
      );
      if (!res.ok) throw new Error();
      setBoard(await res.json());
      setBoardError(false);
    } catch {
      setBoardError(true);
    }
  }, []);

  useEffect(() => {
    clientIdRef.current = getClientId();
    const savedName = localStorage.getItem("typing-player-name") ?? "";
    if (savedName) {
      setName(savedName);
      setLocked(true);
    } else {
      setName(localStorage.getItem("word-comment-name") ?? "");
    }
    loadBoard();
  }, [loadBoard]);

  /* live WPM ticker */
  useEffect(() => {
    if (phase !== "running" || !startAt) return;
    const t = setInterval(() => {
      const minutes = (Date.now() - startAt) / 60000;
      if (minutes > 0) setLiveWpm(Math.round(typed.length / 5 / minutes));
    }, 500);
    return () => clearInterval(t);
  }, [phase, startAt, typed.length]);

  const start = () => {
    if (!name.trim()) return;
    if (!locked) {
      localStorage.setItem("typing-player-name", name.trim());
      setLocked(true);
    }
    const pool = [...sentences];
    const picked: string[] = [];
    const rounds = Math.max(1, Math.min(perRound, pool.length));
    for (let i = 0; i < rounds; i++) {
      picked.push(...pool.splice(Math.floor(Math.random() * pool.length), 1));
    }
    setTarget(picked.join(" "));
    typedRef.current = "";
    mistakesRef.current = 0;
    startRef.current = 0;
    setTyped("");
    setResult(null);
    setSubmitNote("");
    setStartAt(0);
    setLiveWpm(0);
    setPhase("running");
    requestAnimationFrame(() => inputRef.current?.focus({ preventScroll: true }));
  };

  const finish = useCallback(
    async (finalTyped: string, startedAt: number, mistakeCount: number) => {
      const minutes = (Date.now() - startedAt) / 60000;
      const wpm = Math.min(300, Math.round((finalTyped.length / 5 / minutes) * 10) / 10);
      const totalStrokes = finalTyped.length + mistakeCount;
      const accuracy =
        totalStrokes === 0
          ? 100
          : Math.round((finalTyped.length / totalStrokes) * 1000) / 10;
      setResult({ wpm, accuracy });
      setPhase("done");
      try {
        const res = await fetch("/api/typing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: clientIdRef.current,
            name: name.trim(),
            wpm,
            accuracy,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.error ?? "Could not save the score.");
        setSubmitNote(
          data.improved
            ? `New personal best. You are rank ${data.rank}.`
            : `Your best stays at ${data.best} WPM, rank ${data.rank}.`
        );
        loadBoard();
      } catch (err) {
        setSubmitNote(
          err instanceof Error ? err.message : "Could not save the score."
        );
      }
    },
    [name, loadBoard]
  );

  const onType = (value: string) => {
    if (phase !== "running") return;
    const prev = typedRef.current;
    // block paste-sized jumps while still allowing fast typists and swipe keyboards
    if (value.length > prev.length + 12) return;

    if (!startRef.current && value.length > 0) {
      startRef.current = Date.now();
      setStartAt(startRef.current);
    }

    // count every newly added wrong character as a mistake
    for (let i = prev.length; i < value.length; i++) {
      if (value[i] !== target[i]) mistakesRef.current += 1;
    }

    typedRef.current = value;
    setTyped(value);
    if (value === target) {
      finish(value, startRef.current, mistakesRef.current);
    }
  };

  const meInTop = board.me
    ? board.top.findIndex((r) => r.created_at === board.me?.created_at)
    : -1;

  const chip =
    "inline-flex items-center gap-2 border border-pageline px-4 py-2 text-[13.5px] font-medium text-pagetext hover:border-accent hover:text-accent disabled:opacity-40";

  return (
    <div contentEditable={false} suppressContentEditableWarning>
      {/* ------------------------------------------------ setup / play area */}
      {phase === "idle" && (
        <div>
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            {locked ? (
              <span className="border border-pageline px-3 py-2 text-[13.5px] text-pagetext">
                Playing as <strong>{name}</strong>
              </span>
            ) : (
              <input
                className="w-full border border-pageline bg-transparent px-3 py-2 text-[13.5px] text-pagetext outline-none placeholder:text-pagedim focus:border-accent sm:w-56"
                placeholder="Enter your name..."
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && start()}
              />
            )}
            <button className={chip} disabled={!name.trim()} onClick={start}>
              <Keyboard size={14} strokeWidth={1.8} />
              Start typing test
            </button>
          </div>
          <p className="mt-2 text-[12px] text-pagedim">
            {locked
              ? "Your name is locked to this browser and your best score counts."
              : "Pick wisely. This name sticks to this browser."}
          </p>
        </div>
      )}

      {phase !== "idle" && (
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12.5px] text-pagedim">
            <span>
              Player: <strong className="text-pagetext">{name.trim()}</strong>
            </span>
            <span>
              WPM:{" "}
              <strong className="text-pagetext">
                {phase === "done" ? result?.wpm : liveWpm}
              </strong>
            </span>
            {phase === "done" && result && (
              <span>
                Accuracy: <strong className="text-pagetext">{result.accuracy}%</strong>
              </span>
            )}
          </div>

          <label
            className="relative block cursor-text border border-pageline p-4 font-[inherit] text-[16px] leading-relaxed"
            onClick={() => inputRef.current?.focus({ preventScroll: true })}
          >
            {target.split("").map((ch, i) => {
              const typedCh = typed[i];
              const state =
                typedCh === undefined ? "pending" : typedCh === ch ? "ok" : "bad";
              return (
                <span
                  key={i}
                  className={
                    state === "pending"
                      ? i === typed.length && phase === "running"
                        ? "border-b-2 border-accent text-pagedim"
                        : "text-pagedim"
                      : state === "ok"
                        ? "text-pagetext"
                        : "bg-[#f8c9c4] text-[#a4262c] dark:bg-[#5a2321] dark:text-[#ff9c8f]"
                  }
                >
                  {ch}
                </span>
              );
            })}
            <input
              ref={inputRef}
              className="absolute inset-0 h-full w-full cursor-text opacity-0"
              value={typed}
              onChange={(e) => onType(e.target.value)}
              onPaste={(e) => e.preventDefault()}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Type the sentences shown above"
            />
          </label>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button className={chip} onClick={start}>
              <RotateCcw size={13} strokeWidth={1.8} />
              {phase === "done" ? "Play again" : "Restart"}
            </button>
            {phase === "done" && submitNote && (
              <span className="text-[12.5px] text-pagedim">{submitNote}</span>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------ leaderboard */}
      <h3 className="mb-3 mt-10 flex items-center gap-2 text-[15px] font-bold">
        <Trophy size={15} strokeWidth={1.8} className="text-pagedim" />
        Leaderboard
      </h3>
      {boardError ? (
        <p className="text-[13px] text-pagedim">
          The leaderboard is taking a nap. Try again in a bit.
        </p>
      ) : board.top.length === 0 ? (
        <p className="text-[13px] text-pagedim">
          No scores yet. The throne is empty and it is judging you.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[380px] border-collapse text-[13.5px]">
            <thead>
              <tr className="border-b border-pageline text-left text-[12px] uppercase tracking-wide text-pagedim">
                <th className="py-1.5 pr-3 font-semibold">#</th>
                <th className="py-1.5 pr-3 font-semibold">Name</th>
                <th className="py-1.5 pr-3 text-right font-semibold">WPM</th>
                <th className="py-1.5 pr-3 text-right font-semibold">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {board.top.map((s, i) => (
                <tr
                  key={`${i}-${s.name}-${s.wpm}`}
                  className={`border-b border-pageline ${
                    i === meInTop ? "font-semibold text-accent" : ""
                  }`}
                >
                  <td className="py-1.5 pr-3 text-pagedim">{i + 1}</td>
                  <td className="max-w-45 truncate py-1.5 pr-3 font-medium">
                    {s.name}
                    {i === meInTop ? " (you)" : ""}
                  </td>
                  <td className="py-1.5 pr-3 text-right font-semibold">{s.wpm}</td>
                  <td className="py-1.5 pr-3 text-right text-pagedim">{s.accuracy}%</td>
                </tr>
              ))}
              {board.me && meInTop === -1 && (
                <>
                  <tr>
                    <td colSpan={4} className="py-1 text-center text-pagedim">
                      ...
                    </td>
                  </tr>
                  <tr className="border-b border-pageline font-semibold text-accent">
                    <td className="py-1.5 pr-3">{board.me.rank}</td>
                    <td className="max-w-45 truncate py-1.5 pr-3">
                      {board.me.name} (you)
                    </td>
                    <td className="py-1.5 pr-3 text-right">{board.me.wpm}</td>
                    <td className="py-1.5 pr-3 text-right">{board.me.accuracy}%</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
