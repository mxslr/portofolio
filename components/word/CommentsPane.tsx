"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Send, X } from "lucide-react";

interface Comment {
  id: string;
  author: string;
  body: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onCount: (n: number) => void;
}

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function CommentsPane({ open, onClose, onCount }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [author, setAuthor] = useState("");
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setStatus("loading");
    try {
      const res = await fetch("/api/comments");
      if (!res.ok) throw new Error();
      const data: Comment[] = await res.json();
      setComments(data);
      onCount(data.length);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }, [onCount]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    const saved = localStorage.getItem("word-comment-name") ?? "";
    // drop the name left behind by the build-time test post
    if (saved === "Claude") {
      localStorage.removeItem("word-comment-name");
      return;
    }
    setAuthor(saved);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!author.trim() || !body.trim() || posting) return;
    setPosting(true);
    setPostError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author: author.trim(), body: body.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Could not post the comment.");
      }
      localStorage.setItem("word-comment-name", author.trim());
      setBody("");
      await load();
      listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Could not post the comment.");
    } finally {
      setPosting(false);
    }
  };

  if (!open) return null;

  return (
    <aside className="word-panel absolute inset-y-0 right-0 z-20 flex w-full max-w-sm shrink-0 flex-col border-l border-line bg-surface min-[1360px]:static">
      <div className="flex items-center justify-between px-4 pb-2 pt-4">
        <h2 className="flex items-center gap-2 text-[13px] font-semibold text-ink">
          <MessageSquare size={14} strokeWidth={1.8} />
          Comments
        </h2>
        <button
          className="flex h-8 w-8 items-center justify-center rounded text-ink hover:bg-hover"
          aria-label="Close comments"
          onClick={onClose}
        >
          <X size={14} />
        </button>
      </div>

      {/* new comment */}
      <form onSubmit={submit} className="mx-4 mb-3 border border-line bg-commentbg p-3">
        <input
          className="mb-2 w-full border-b border-line bg-transparent pb-1.5 text-[13px] text-ink outline-none placeholder:text-dim"
          placeholder="Enter your name..."
          maxLength={60}
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          required
        />
        <textarea
          className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-ink outline-none placeholder:text-dim"
          placeholder="Leave a comment on this document..."
          rows={3}
          maxLength={500}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[11px] text-dim">{body.length}/500</span>
          <button
            type="submit"
            disabled={posting || !author.trim() || !body.trim()}
            className="inline-flex h-7 items-center gap-1.5 bg-accent px-3 text-[12px] font-medium text-white hover:opacity-90 disabled:opacity-40"
          >
            <Send size={11} strokeWidth={1.8} />
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
        {postError && (
          <p className="mt-2 text-[12px] text-[#c42b1c] dark:text-[#ff9c8f]">{postError}</p>
        )}
      </form>

      {/* list */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        {status === "loading" && comments.length === 0 && (
          <p className="py-6 text-center text-[12.5px] text-dim">Loading comments...</p>
        )}
        {status === "error" && (
          <p className="py-6 text-center text-[12.5px] text-dim">
            Comments are taking a nap. Try again in a bit.
          </p>
        )}
        {status === "idle" && comments.length === 0 && (
          <p className="py-6 text-center text-[12.5px] text-dim">
            No comments yet. Be the first reviewer of this document.
          </p>
        )}
        <div className="flex flex-col gap-2.5">
          {comments.map((c) => (
            <article key={c.id} className="border border-line p-3">
              <header className="mb-1.5 flex items-center gap-2">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-semibold uppercase text-white">
                  {c.author.slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-semibold leading-tight text-ink">
                    {c.author}
                  </p>
                  <p className="text-[11px] leading-tight text-dim">
                    {timeAgo(c.created_at)}
                  </p>
                </div>
              </header>
              <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                {c.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </aside>
  );
}
