"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Maximize2,
  Minus,
  Plus,
  X,
} from "lucide-react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";

/* ------------------------------------------------------------ pdf.js glue */

type PdfLib = typeof import("pdfjs-dist");

let libPromise: Promise<PdfLib> | null = null;

function loadLib() {
  if (!libPromise) {
    libPromise = import("pdfjs-dist/legacy/build/pdf.mjs").then((lib) => {
      lib.GlobalWorkerOptions.workerSrc = "/pdf/pdf.worker.min.mjs";
      return lib as unknown as PdfLib;
    });
  }
  return libPromise;
}

const docCache = new Map<string, Promise<PDFDocumentProxy>>();

function loadDoc(src: string) {
  let doc = docCache.get(src);
  if (!doc) {
    doc = loadLib().then((lib) => lib.getDocument({ url: src }).promise);
    docCache.set(src, doc);
  }
  return doc;
}

/* ------------------------------------------------------------ page canvas */

function PdfPage({
  src,
  page,
  width,
  className = "",
}: {
  src: string;
  page: number;
  width: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (width <= 0) return;
    let cancelled = false;
    let task: RenderTask | null = null;

    (async () => {
      const doc = await loadDoc(src);
      if (cancelled) return;
      const pdfPage = await doc.getPage(page);
      if (cancelled) return;

      const base = pdfPage.getViewport({ scale: 1 });
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const viewport = pdfPage.getViewport({ scale: (width / base.width) * dpr });
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${Math.round(viewport.height / dpr)}px`;

      task = pdfPage.render({ canvas, canvasContext: ctx, viewport });
      await task.promise;
      if (!cancelled) setReady(true);
    })().catch(() => {
      /* cancelled renders and load failures fall back to the skeleton */
    });

    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [src, page, width]);

  return (
    <canvas
      ref={canvasRef}
      aria-label={`Page ${page}`}
      className={`${className} ${ready ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
    />
  );
}

/* breathing room kept around the sheet when it is scaled to fit */
const GAP = 28;

/* -------------------------------------------------------------- full view */

function FullView({
  src,
  title,
  pages,
  startPage,
  onClose,
}: {
  src: string;
  title: string;
  pages: number;
  startPage: number;
  onClose: () => void;
}) {
  const [page, setPage] = useState(startPage);
  const [zoom, setZoom] = useState(1);
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const touchX = useRef<number | null>(null);

  const step = useCallback(
    (dir: 1 | -1) => setPage((n) => Math.min(pages, Math.max(1, n + dir))),
    [pages]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "PageDown") step(1);
      if (e.key === "ArrowLeft" || e.key === "PageUp") step(-1);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, step]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setBox({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* the page shape has to be known before sizing, otherwise the first paint
     lands at the wrong scale and has to be thrown away */
  useEffect(() => {
    let alive = true;
    loadDoc(src)
      .then((doc) => doc.getPage(page))
      .then((pdfPage) => {
        const v = pdfPage.getViewport({ scale: 1 });
        if (alive) setRatio(v.height / v.width);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [src, page]);

  /* fit the whole sheet inside the stage, height included, so the paper is
     readable as a page instead of arriving pre-zoomed into its top corner */
  const fit =
    box && ratio
      ? Math.max(200, Math.min(box.w - GAP, (box.h - GAP) / ratio, 920))
      : 0;
  const pageWidth = Math.round(fit * zoom);
  const pageHeight = ratio ? Math.round(pageWidth * ratio) : 0;

  return createPortal(
    <div className="pdf-full fixed inset-x-0 top-0 z-[75] flex h-dvh flex-col">
      {/* -------------------------------------------------------- top bar */}
      <header className="flex shrink-0 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-2.5">
        <p className="min-w-0 truncate text-[14px] font-semibold text-white sm:text-[17px]">
          {title}
        </p>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <span className="mr-1 hidden text-[12.5px] text-white/70 sm:inline">
            {pages} pages
          </span>
          <a
            className="pdf-ctl"
            href={src}
            download
            title="Download the PDF"
            aria-label="Download the PDF"
          >
            <Download size={17} strokeWidth={1.7} />
          </a>
          <button
            className="pdf-ctl"
            onClick={onClose}
            title="Close"
            aria-label="Close the article"
          >
            <X size={18} strokeWidth={1.7} />
          </button>
        </div>
      </header>

      {/* ---------------------------------------------------------- stage */}
      <div className="relative min-h-0 flex-1">
        <div
          ref={stageRef}
          className="h-full overflow-auto"
          onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchX.current === null) return;
            const dx = e.changedTouches[0].clientX - touchX.current;
            touchX.current = null;
            if (Math.abs(dx) > 56) step(dx < 0 ? 1 : -1);
          }}
        >
          {/* m-auto keeps the sheet centred while it fits and still lets the
              scroller reach every edge once it is zoomed past the stage */}
          <div className="flex min-h-full min-w-full">
            <div
              className="m-auto shrink-0 bg-white"
              style={{ width: pageWidth || 200, height: pageHeight || 280 }}
            >
              {fit > 0 && (
                <PdfPage
                  key={`${page}-${pageWidth}`}
                  src={src}
                  page={page}
                  width={pageWidth}
                  className="block"
                />
              )}
            </div>
          </div>
        </div>

        {page > 1 && (
          <button
            className="pdf-arrow left-1 sm:left-3"
            onClick={() => step(-1)}
            aria-label="Previous page"
          >
            <ChevronLeft size={20} strokeWidth={1.8} />
          </button>
        )}
        {page < pages && (
          <button
            className="pdf-arrow right-1 sm:right-3"
            onClick={() => step(1)}
            aria-label="Next page"
          >
            <ChevronRight size={20} strokeWidth={1.8} />
          </button>
        )}
      </div>

      {/* ----------------------------------------------------- bottom bar */}
      <footer className="flex shrink-0 items-center gap-2 px-3 py-2 sm:gap-3 sm:px-5 sm:py-2.5">
        <span className="shrink-0 text-[12px] tabular-nums text-white/85 sm:text-[12.5px]">
          {page} / {pages}
        </span>
        <input
          type="range"
          min={1}
          max={pages}
          step={1}
          value={page}
          aria-label="Go to page"
          className="pdf-range min-w-0 flex-1"
          onChange={(e) => setPage(Number(e.target.value))}
        />
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <button
            className="pdf-ctl"
            aria-label="Zoom out"
            disabled={zoom <= 1}
            onClick={() => setZoom((z) => Math.max(1, Math.round((z - 0.25) * 100) / 100))}
          >
            <Minus size={16} strokeWidth={1.8} />
          </button>
          <button
            className="hidden w-12 text-[12px] tabular-nums text-white/85 hover:text-white sm:block"
            title="Fit the page"
            onClick={() => setZoom(1)}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            className="pdf-ctl"
            aria-label="Zoom in"
            disabled={zoom >= 3}
            onClick={() => setZoom((z) => Math.min(3, Math.round((z + 0.25) * 100) / 100))}
          >
            <Plus size={16} strokeWidth={1.8} />
          </button>
        </div>
      </footer>
    </div>,
    document.body
  );
}

/* ------------------------------------------------------------- component */

export default function PdfViewer({
  src,
  title = "Article",
  pages,
}: {
  src: string;
  title?: string;
  pages: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  const [strip, setStrip] = useState(0);
  const [full, setFull] = useState(false);
  const [failed, setFailed] = useState(false);

  /* only pull pdf.js and the file once the card is close to the viewport */
  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- no observer, load right away
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
      { rootMargin: "500px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* a viewer that cannot load still has to hand the visitor the paper */
  useEffect(() => {
    if (!near) return;
    let alive = true;
    loadDoc(src).catch(() => {
      if (alive) setFailed(true);
    });
    return () => {
      alive = false;
    };
  }, [near, src]);

  useEffect(() => {
    const el = stripRef.current;
    if (!el) return;
    const measure = () => setStrip(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* two pages side by side on a page-width card, one and a peek on a phone,
     so the thumbnails never shrink into unreadable slivers */
  const inner = strip - 24;
  const columns = inner < 420 ? 1.5 : 2;
  const pageWidth = strip > 0 ? Math.max(140, Math.min(300, (inner - 12) / columns)) : 0;
  const preview = Math.min(pages, 3);

  return (
    <div
      ref={cardRef}
      className="pdf-card relative"
      contentEditable={false}
      suppressContentEditableWarning
    >
      {/* -------------------------------------------------------- head bar */}
      <div className="pdf-card-head">
        <FileText size={14} strokeWidth={1.8} className="shrink-0" />
        <span className="font-semibold">{title}</span>
        <span className="text-white/55">|</span>
        <span className="text-white/85">{pages} pages</span>
        <span className="ml-auto hidden text-[11.5px] text-white/70 sm:inline">
          Click to read
        </span>
      </div>

      {/* --------------------------------------------------------- preview */}
      {failed ? (
        <a
          className="flex items-center gap-2 px-4 py-5 text-[13.5px] font-medium text-accent"
          href={src}
          target="_blank"
          rel="noreferrer"
        >
          <FileText size={15} strokeWidth={1.8} />
          Open the PDF, {pages} pages
        </a>
      ) : (
        <button
          type="button"
          className="pdf-card-body"
          onClick={() => setFull(true)}
          aria-label={`Open ${title} in full size`}
        >
          <div ref={stripRef} className="flex w-full gap-3 overflow-hidden px-3 py-3">
            {Array.from({ length: preview }, (_, i) => (
              <span
                key={i}
                className="block shrink-0 border border-pageline bg-white"
                style={{
                  width: pageWidth || 132,
                  height: Math.round((pageWidth || 132) * 1.414),
                }}
              >
                {near && pageWidth > 0 && (
                  <PdfPage src={src} page={i + 1} width={pageWidth} className="block" />
                )}
              </span>
            ))}
          </div>
        </button>
      )}

      {!failed && (
        <button
          type="button"
          className="pdf-expand"
          onClick={() => setFull(true)}
          title="Open full size"
          aria-label="Open full size"
        >
          <Maximize2 size={15} strokeWidth={1.9} />
        </button>
      )}

      {full && (
        <FullView
          src={src}
          title={title}
          pages={pages}
          startPage={1}
          onClose={() => setFull(false)}
        />
      )}
    </div>
  );
}
