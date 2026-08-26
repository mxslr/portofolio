"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTheme } from "next-themes";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Image as ImageIcon,
  MessageSquare,
  Video,
  X,
} from "lucide-react";
import type { GalleryPhoto } from "@/lib/portfolio";

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
  const [near, setNear] = useState(false);

  useEffect(() => setMounted(true), []);

  /* LinkedIn's badge pulls in two third-party scripts. It sits on the last
     sheet, so nothing loads until a visitor is actually scrolling towards it. */
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const theme = mounted && resolvedTheme === "dark" ? "dark" : "light";

  useEffect(() => {
    if (!mounted || !near) return;
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
  }, [mounted, near, theme]);

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

  const alt = `${name} logo`;
  const shared = {
    width: size,
    height: size,
    loading: "lazy" as const,
    className: `shrink-0 ${round ? "rounded-full object-cover" : "object-contain"} ${className}`,
    style: { width: size, height: size },
    onError: () => setFailed(true),
  };

  /* the favicon services already hand back a thumbnail; everything under
     /public is a full-size original that has to be cut down to the badge */
  if (/^https?:/.test(src)) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} {...shared} />;
  }
  return <Image src={src} alt={alt} {...shared} />;
}

/* ------------------------------------------------------------ brand strip */

export function BrandStrip({ items }: { items: { name: string; logo: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-12 gap-y-7">
      {items.map((b) =>
        b.logo ? (
          <Image
            key={b.name}
            src={b.logo}
            alt={`${b.name} logo`}
            title={b.name}
            width={48}
            height={48}
            loading="lazy"
            className="h-12 w-auto max-w-48 object-contain grayscale transition duration-300 hover:grayscale-0"
          />
        ) : (
          <span key={b.name} className="text-[14px] font-semibold text-pagedim" title={b.name}>
            {b.name}
          </span>
        )
      )}
    </div>
  );
}

/* ---------------------------------------------------------- media lightbox */

export interface MediaItem {
  type: "image" | "video";
  src: string;
  caption?: string;
  width?: number;
  height?: number;
  blur?: string;
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
  const neighbours =
    items.length > 1
      ? [items[(index + 1) % items.length], items[(index - 1 + items.length) % items.length]].filter(
          (n) => n.type === "image" && n.src !== item.src
        )
      : [];

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
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 pb-4 sm:px-14"
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
        ) : item.width && item.height ? (
          <Image
            key={item.src}
            src={item.src}
            alt={item.caption ?? `media ${index + 1}`}
            width={item.width}
            height={item.height}
            placeholder={item.blur ? "blur" : "empty"}
            blurDataURL={item.blur}
            priority
            sizes="100vw"
            className="max-h-full w-auto object-contain"
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

        {/* warm the neighbours so swiping does not wait on the network */}
        {neighbours.map((n) =>
          n.width && n.height ? (
            <Image
              key={`pre-${n.src}`}
              src={n.src}
              alt=""
              aria-hidden
              width={n.width}
              height={n.height}
              sizes="100vw"
              className="pointer-events-none absolute h-px w-px opacity-0"
            />
          ) : null
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
  link = "",
}: {
  name: string;
  images: string[];
  videos: string[];
  link?: string;
}) {
  const [viewer, setViewer] = useState<"photos" | "videos" | null>(null);
  if (images.length === 0 && videos.length === 0 && !link) return null;

  let linkLabel = "Open link";
  try {
    linkLabel = new URL(link).hostname.replace(/^www\./, "");
  } catch {
    /* keep fallback label */
  }

  const btn =
    "inline-flex items-center gap-2 border border-pageline px-3 py-1.5 text-[12.5px] font-medium text-pagetext hover:border-accent hover:text-accent";

  return (
    <div
      className="mt-3 flex flex-wrap gap-2"
      contentEditable={false}
      suppressContentEditableWarning
    >
      {link && (
        <a
          className={`${btn} no-underline`}
          style={{ color: "inherit", textDecoration: "none" }}
          href={link}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={14} strokeWidth={1.7} />
          {linkLabel}
        </a>
      )}
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
            {/*
              Every photo is fetched up front instead of lazily: the first row
              gets a preload link through `priority`, the rest start straight
              after it. A blurred inline preview stands in while bytes arrive,
              so a slow connection sees the picture, not an empty box.
            */}
            <Image
              src={p.src}
              alt={p.caption}
              width={p.width || 1200}
              height={p.height || 1600}
              placeholder={p.blur ? "blur" : "empty"}
              blurDataURL={p.blur || undefined}
              sizes="(max-width: 640px) 50vw, (max-width: 880px) 33vw, 260px"
              {...(i < 3 ? { priority: true } : { loading: "eager" as const })}
              className="block h-auto w-full"
            />
          </button>
        ))}
      </div>

      {active !== null && (
        <MediaLightbox
          items={photos.map((p) => ({
            type: "image",
            src: p.src,
            caption: p.caption,
            width: p.width,
            height: p.height,
            blur: p.blur,
          }))}
          start={active}
          onClose={() => setActive(null)}
        />
      )}
    </>
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
