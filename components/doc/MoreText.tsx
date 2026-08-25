"use client";

import { useState } from "react";

/**
 * Long copy that collapses to a preview with a "...more" link, the way a long
 * comment collapses. Short text renders untouched so nothing changes for it.
 */
export default function MoreText({
  text,
  limit = 240,
  className = "",
}: {
  text: string;
  limit?: number;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  // ignore the clamp when the hidden tail is barely worth a click
  if (text.length <= limit + 40) {
    return <span className={className}>{text}</span>;
  }

  const cutAt = text.lastIndexOf(" ", limit);
  const preview = text.slice(0, cutAt > limit * 0.6 ? cutAt : limit).trimEnd();

  return (
    <span className={className}>
      {open ? text : `${preview.replace(/[.,;:]$/, "")}`}
      <span contentEditable={false} suppressContentEditableWarning>
        <button
          type="button"
          className="more-toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? " less" : "...more"}
        </button>
      </span>
    </span>
  );
}
