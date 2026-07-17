"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  MessageSquare,
  Pause,
  Play,
  Video,
  X,
} from "lucide-react";
import type { GalleryPhoto, Track } from "@/lib/portfolio";

/* ------------------------------------------------------- LinkedIn badge */

declare global {
  interface Window {
    LIRenderAll?: () => void;
  }
}

export function LinkedInBadge({
  vanity,
  profileUrl,
  name,
}: {
  vanity: string;
  profileUrl: string;
  name: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const theme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    if (!mounted) return;
    const id = "linkedin-badge-script";
    if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://platform.linkedin.com/badges/js/profile.js";
      s.async = true;
      s.defer = true;
      document.body.appendChild(s);
    }
    // profile.js scans once on load; retry until our badge is rendered
    let tries = 0;
    const timer = setInterval(() => {
      const badge = ref.current?.querySelector(".LI-profile-badge");
      if (badge?.getAttribute("data-rendered") || tries++ > 12) {
        clearInterval(timer);
        return;
      }
      window.LIRenderAll?.();
    }, 700);
    return () => clearInterval(timer);
  }, [mounted, theme]);

  return (
    <div ref={ref} contentEditable={false} suppressContentEditableWarning>
      {/* key remounts a fresh, unrendered badge div when the theme flips */}
      <div
        key={theme}
        className="badge-base LI-profile-badge"
        data-locale="en_US"
        data-size="large"
        data-theme={theme}
        data-type="HORIZONTAL"
        data-vanity={vanity}
        data-version="v1"
      >
        <a
          className="badge-base__link LI-simple-link"
          href={`${profileUrl}?trk=profile-badge`}
        >
          {name}
        </a>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- logo w/ fallback */

export function Logo({
  src,
  name,
  size = 48,
  round = false,
  className = "",
}: {
  src: string;
  name: string;
  size?: number;
  round?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (!src || failed) {
    return (
      <span
        className={`flex shrink-0 select-none items-center justify-center rounded-full border border-pageline font-bold text-pagedim ${className}`}
        style={{ width: size, height: size, fontSize: Math.max(9, size * 0.3) }}
        aria-hidden
      >
        {initials}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`${name} logo`}
      width={size}
      height={size}
      loading="lazy"
      className={`shrink-0 ${round ? "rounded-full object-cover" : "object-contain"} ${className}`}
      style={{ width: size, height: size }}
      onError={() => setFailed(true)}
    />
  );
}

/* ------------------------------------------------------------ brand strip */

export function BrandStrip({ items }: { items: { name: string; logo: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
      {items.map((b) => (
        <span key={b.name} className="flex items-center gap-2.5" title={b.name}>
          <Logo
            src={b.logo}
            name={b.name}
            size={30}
            className="grayscale transition duration-300 hover:grayscale-0"
          />
          <span className="text-[13px] font-medium text-pagedim">{b.name}</span>
        </span>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------- media lightbox */

export interface MediaItem {
  type: "image" | "video";
  src: string;
  caption?: string;
}

export function MediaLightbox({
  items,
  start,
  onClose,
}: {
  items: MediaItem[];
  start: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(start);
  const touchX = useRef<number | null>(null);

  const step = useCallback(
    (dir: 1 | -1) =>
      setIndex((i) => (i + dir + items.length) % items.length),
    [items.length]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, step]);

  const item = items[index];

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col bg-black/90"
      onClick={onClose}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        touchX.current = null;
        if (Math.abs(dx) > 48) step(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex items-center justify-between p-3 sm:p-4">
        <span className="text-[13px] text-white/70">
          {index + 1} / {items.length}
        </span>
        <button
          className="p-2 text-white/80 hover:text-white"
          aria-label="Close viewer"
          onClick={onClose}
        >
          <X size={22} />
        </button>
      </div>

      <div
        className="flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-14"
        onClick={(e) => e.stopPropagation()}
      >
        {item.type === "video" ? (
          <video
            key={item.src}
            src={item.src}
            controls
            playsInline
            preload="metadata"
            className="max-h-full max-w-full"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={item.src}
            src={item.src}
            alt={item.caption ?? `media ${index + 1}`}
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {item.caption && (
        <p className="pb-4 text-center text-sm text-white/80">{item.caption}</p>
      )}

      {items.length > 1 && (
        <>
          <button
            className="absolute left-1 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white sm:left-3"
            aria-label="Previous"
            onClick={(e) => {
              e.stopPropagation();
              step(-1);
            }}
          >
            <ChevronLeft size={30} />
          </button>
          <button
            className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white sm:right-3"
            aria-label="Next"
            onClick={(e) => {
              e.stopPropagation();
              step(1);
            }}
          >
            <ChevronRight size={30} />
          </button>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------- project media buttons */

export function ProjectMedia({
  name,
  images,
  videos,
}: {
  name: string;
  images: string[];
  videos: string[];
}) {
  const [viewer, setViewer] = useState<"photos" | "videos" | null>(null);
  if (images.length === 0 && videos.length === 0) return null;

  const btn =
    "inline-flex items-center gap-2 border border-pageline px-3 py-1.5 text-[12.5px] font-medium text-pagetext hover:border-accent hover:text-accent";

  return (
    <div
      className="mt-3 flex flex-wrap gap-2"
      contentEditable={false}
      suppressContentEditableWarning
    >
      {images.length > 0 && (
        <button className={btn} onClick={() => setViewer("photos")}>
          <ImageIcon size={14} strokeWidth={1.7} />
          Photos ({images.length})
        </button>
      )}
      {videos.length > 0 && (
        <button className={btn} onClick={() => setViewer("videos")}>
          <Video size={14} strokeWidth={1.7} />
          Video ({videos.length})
        </button>
      )}
      {viewer && (
        <MediaLightbox
          items={(viewer === "photos" ? images : videos).map((src) => ({
            type: viewer === "photos" ? "image" : "video",
            src,
            caption: name,
          }))}
          start={0}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------- gallery */

export function GalleryGrid({ photos }: { photos: GalleryPhoto[] }) {
  const [active, setActive] = useState<number | null>(null);

  return (
    <>
      <div
        className="columns-2 gap-3 sm:columns-3 [&>*]:mb-3"
        contentEditable={false}
        suppressContentEditableWarning
      >
        {photos.map((p, i) => (
          <button
            key={p.src}
            className="block w-full break-inside-avoid border border-pageline"
            onClick={() => setActive(i)}
            aria-label={`Open photo: ${p.caption}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt={p.caption} loading="lazy" className="block w-full" />
          </button>
        ))}
      </div>

      {active !== null && (
        <MediaLightbox
          items={photos.map((p) => ({ type: "image", src: p.src, caption: p.caption }))}
          start={active}
          onClose={() => setActive(null)}
        />
      )}
    </>
  );
}

/* --------------------------------------------------------------- music */

export function MusicPlayer({
  tracks,
  spotifyEmbed,
}: {
  tracks: Track[];
  spotifyEmbed: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [current, setCurrent] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState(false);

  const play = (i: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    setError(false);
    if (i === current && playing) {
      audio.pause();
      setPlaying(false);
      return;
    }
    if (i !== current) {
      setCurrent(i);
      audio.src = tracks[i].src;
    }
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => setError(true));
  };

  return (
    <div contentEditable={false} suppressContentEditableWarning>
      <audio
        ref={audioRef}
        src={tracks[0]?.src}
        onEnded={() => setPlaying(false)}
        onError={() => playing && setError(true)}
      />
      <div className="flex flex-col divide-y divide-pageline border border-pageline">
        {tracks.map((t, i) => (
          <div key={`${t.title}-${i}`} className="flex items-center gap-3 px-3 py-2.5">
            <button
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-pageline text-pagetext hover:border-accent hover:text-accent"
              aria-label={playing && current === i ? `Pause ${t.title}` : `Play ${t.title}`}
              onClick={() => play(i)}
            >
              {playing && current === i ? (
                <Pause size={14} />
              ) : (
                <Play size={14} className="ml-0.5" />
              )}
            </button>
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold">{t.title}</p>
              <p className="truncate text-[12.5px] text-pagedim">{t.artist}</p>
            </div>
            {playing && current === i && (
              <span className="ml-auto flex items-end gap-[2px]" aria-hidden>
                {[0, 1, 2].map((b) => (
                  <span
                    key={b}
                    className="w-[3px] animate-pulse rounded-sm bg-accent"
                    style={{ height: 8 + b * 4, animationDelay: `${b * 150}ms` }}
                  />
                ))}
              </span>
            )}
          </div>
        ))}
      </div>
      {error && (
        <p className="mt-2 text-[12.5px] text-pagedim">
          That track has no audio file yet. Drop an mp3 into public/music and point to it
          in data/portfolio.json.
        </p>
      )}
      {spotifyEmbed && (
        <iframe
          src={spotifyEmbed}
          width="100%"
          height="152"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="mt-4 border-0"
          title="Spotify player"
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------- comments CTA */

export function CommentsCta() {
  return (
    <button
      className="inline-flex items-center gap-2 border border-pageline px-4 py-2 text-[13.5px] font-medium text-pagetext hover:border-accent hover:text-accent"
      onClick={() => window.dispatchEvent(new Event("word:open-comments"))}
    >
      <MessageSquare size={14} strokeWidth={1.8} />
      Leave a comment on this document
    </button>
  );
}
