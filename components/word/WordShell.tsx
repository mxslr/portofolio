"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import gsap from "gsap";
import {
  AlignLeft,
  Bold,
  Check,
  ChevronDown,
  Eraser,
  Eye,
  FileText,
  Github,
  Highlighter,
  Image as ImageIcon,
  Instagram,
  Italic,
  Linkedin,
  Mail,
  Maximize2,
  MessageSquare,
  Minus,
  Moon,
  Music,
  PanelLeft,
  Pencil,
  Plus,
  Printer,
  Redo2,
  Save,
  Search,
  Share2,
  Sun,
  Underline,
  Undo2,
  X,
} from "lucide-react";
import CommentsPane from "./CommentsPane";

/* ---------------------------------------------------------------- types */

export interface NavItem {
  id: string;
  label: string;
}

interface ShellMeta {
  name: string;
  initials: string;
  documentName: string;
  cvPdf: string;
  cvDocx: string;
  email: string;
}

interface Props {
  docId: "resume" | "playground";
  meta: ShellMeta;
  nav: NavItem[];
  children: ReactNode;
}

/* ------------------------------------------------------------- constants */

const FONTS = [
  {
    id: "segoe",
    label: "Segoe UI",
    css: '"Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif',
  },
  {
    id: "times",
    label: "Times New Roman",
    css: '"Times New Roman", Times, Georgia, serif',
  },
  {
    id: "courier",
    label: "Courier New",
    css: '"Courier New", Courier, monospace',
  },
] as const;

const SIZES = [
  { label: "8", v: "1" },
  { label: "10", v: "2" },
  { label: "12", v: "3" },
  { label: "14", v: "4" },
  { label: "18", v: "5" },
  { label: "24", v: "6" },
  { label: "36", v: "7" },
];

const DOCS = [
  { id: "resume", href: "/", file: "Resume.docx" },
  { id: "playground", href: "/playground", file: "Playground.docx" },
];

/* --------------------------------------------------------------- helpers */

function useClickOutside(onAway: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onAway();
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onAway();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
      document.removeEventListener("keydown", esc);
    };
  }, [onAway]);
  return ref;
}

/* --------------------------------------------------- word-style dropdown */

function RibbonSelect({
  ariaLabel,
  value,
  options,
  onPick,
  className = "",
  buttonStyle,
}: {
  ariaLabel: string;
  value: string;
  options: { v: string; label: string; css?: string }[];
  onPick: (v: string) => void;
  className?: string;
  buttonStyle?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<{ x: number; y: number; w: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent | TouchEvent) => {
      const t = e.target as Node;
      if (!ref.current?.contains(t) && !listRef.current?.contains(t)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", away);
    document.addEventListener("touchstart", away);
    document.addEventListener("keydown", esc);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("touchstart", away);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = () => {
    if (!open) {
      const r = ref.current?.getBoundingClientRect();
      if (r) setRect({ x: r.left, y: r.bottom, w: r.width });
    }
    setOpen((v) => !v);
  };

  const current = options.find((o) => o.v === value);

  return (
    <div ref={ref} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`flex h-8 w-full items-center justify-between gap-1.5 rounded border px-2 text-[13px] text-ink hover:bg-hover ${
          open ? "border-accent" : "border-line"
        }`}
        style={buttonStyle}
        onMouseDown={(e) => e.preventDefault()}
        onClick={toggle}
      >
        <span className="truncate">{current?.label ?? value}</span>
        <ChevronDown
          size={12}
          className={`shrink-0 text-dim transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open &&
        rect &&
        createPortal(
          <div
            ref={listRef}
            role="listbox"
            aria-label={ariaLabel}
            className="fixed z-[80] max-h-72 overflow-y-auto border border-line bg-surface py-1"
            style={{ left: rect.x, top: rect.y + 4, minWidth: rect.w }}
          >
            {options.map((o) => (
              <button
                key={o.v}
                type="button"
                role="option"
                aria-selected={o.v === value}
                className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[13px] hover:bg-hover ${
                  o.v === value ? "font-semibold text-accent" : "text-ink"
                }`}
                style={o.css ? { fontFamily: o.css } : undefined}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(o.v);
                  setOpen(false);
                }}
              >
                {o.label}
                {o.v === value && <Check size={13} className="shrink-0" />}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}

/* ------------------------------------------------------------ component */

export default function WordShell({ docId, meta, nav, children }: Props) {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [fontId, setFontId] = useState<string>("segoe");
  const [sizeV, setSizeV] = useState("3");
  const [editing, setEditing] = useState(false);
  const [banner, setBanner] = useState<"protected" | "editing" | null>(
    "protected"
  );
  const [navOpen, setNavOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState<number | null>(null);
  const [zoom, setZoom] = useState(100);
  const [menu, setMenu] = useState<"none" | "file" | "doc" | "share">("none");
  const [tab, setTab] = useState<"home" | "insert" | "design" | "view">(
    "home"
  );
  const [saveDlg, setSaveDlg] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [words, setWords] = useState(0);
  const [navQuery, setNavQuery] = useState("");
  const [mini, setMini] = useState<{ x: number; y: number } | null>(null);

  const shellRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const font = FONTS.find((f) => f.id === fontId) ?? FONTS[0];
  const dark = mounted && resolvedTheme === "dark";

  // eslint-disable-next-line react-hooks/set-state-in-effect -- standard next-themes hydration guard
  useEffect(() => setMounted(true), []);

  /* default: navigation pane open on wide screens */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time viewport measurement on mount
    if (window.innerWidth >= 1360) setNavOpen(true);
    if (sessionStorage.getItem("word-banner-done")) setBanner(null);
  }, []);

  const dismissBanner = useCallback(() => {
    sessionStorage.setItem("word-banner-done", "1");
    setBanner(null);
  }, []);

  /* ------------------------------------------------ formatting commands */

  const exec = useCallback(
    (cmd: string, value?: string) => {
      if (!editing) {
        setEditing(true);
        setBanner("editing");
      }
      // wait a tick so contentEditable is active before the command runs
      requestAnimationFrame(() => {
        document.execCommand(cmd, false, value);
      });
    },
    [editing]
  );

  const stepFontSize = useCallback(
    (dir: 1 | -1) => {
      const cur = parseInt(document.queryCommandValue("fontSize") || "3", 10);
      const next = Math.min(7, Math.max(1, (isNaN(cur) ? 3 : cur) + dir));
      exec("fontSize", String(next));
    },
    [exec]
  );

  /* ------------------------------------------------------ selection mini */

  useEffect(() => {
    if (!editing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears toolbar when leaving edit mode
      setMini(null);
      return;
    }
    const update = () => {
      const sel = window.getSelection();
      if (
        !sel ||
        sel.isCollapsed ||
        sel.rangeCount === 0 ||
        !contentRef.current?.contains(sel.anchorNode)
      ) {
        setMini(null);
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (rect.width < 2) {
        setMini(null);
        return;
      }
      setMini({
        x: Math.min(Math.max(rect.left + rect.width / 2, 130), window.innerWidth - 130),
        y: Math.max(rect.top, 90),
      });
    };
    const off = () => setMini(null);
    document.addEventListener("mouseup", update);
    document.addEventListener("keyup", update);
    scrollRef.current?.addEventListener("scroll", off, { passive: true });
    const scroller = scrollRef.current;
    return () => {
      document.removeEventListener("mouseup", update);
      document.removeEventListener("keyup", update);
      scroller?.removeEventListener("scroll", off);
    };
  }, [editing]);

  /* -------------------------------------------------- links in edit mode */

  const onContentClick = useCallback(
    (e: React.MouseEvent) => {
      if (!editing) return;
      const a = (e.target as HTMLElement).closest("a");
      if (a && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
      }
    },
    [editing]
  );

  /* -------------------------------------------------- page + word counts */

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const pages = contentRef.current?.querySelectorAll(".word-page");
      setPageCount(pages?.length ?? 1);
      const text = contentRef.current?.innerText ?? "";
      setWords(text.split(/\s+/).filter(Boolean).length);
    });
    return () => cancelAnimationFrame(id);
  }, [children]);

  useEffect(() => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const pages = Array.from(
          contentRef.current?.querySelectorAll<HTMLElement>(".word-page") ?? []
        );
        const mark = scroller.scrollTop + scroller.clientHeight * 0.35;
        let current = 1;
        pages.forEach((p, i) => {
          if (p.offsetTop <= mark) current = i + 1;
        });
        setPage(current);
      });
    };
    onScroll();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

  /* --------------------------------------------------------- global keys */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        setSaveDlg(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* --------------------------------------------------- open-comments bus */

  useEffect(() => {
    const open = () => setCommentsOpen(true);
    window.addEventListener("word:open-comments", open);
    return () => window.removeEventListener("word:open-comments", open);
  }, []);

  /* ------------------------------------------------------------ entrance */

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from("[data-anim='titlebar']", { yPercent: -110, duration: 0.45 })
        .from(
          "[data-anim='ribbon']",
          { opacity: 0, y: -14, duration: 0.4 },
          "-=0.2"
        )
        .from(
          ".word-page",
          { opacity: 0, y: 32, duration: 0.55, stagger: 0.07, clearProps: "all" },
          "-=0.15"
        )
        .from(
          "[data-anim='statusbar']",
          { yPercent: 110, duration: 0.35 },
          "-=0.4"
        );
    }, shellRef);
    return () => ctx.revert();
  }, []);

  /* ------------------------------------------------------------- actions */

  const download = (path: string) => {
    const a = document.createElement("a");
    a.href = encodeURI(path);
    a.download = "";
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen?.();
  };

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    if (window.innerWidth < 1360) setNavOpen(false);
  };

  const closeMenus = useCallback(() => setMenu("none"), []);
  const menuRef = useClickOutside(closeMenus);

  const filteredNav = nav.filter((n) =>
    n.label.toLowerCase().includes(navQuery.toLowerCase())
  );

  /* ---------------------------------------------------------- UI helpers */

  const rBtn =
    "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded px-2 text-[13px] text-ink hover:bg-hover active:bg-active disabled:opacity-40";
  const rIconBtn =
    "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded text-ink hover:bg-hover active:bg-active";
  const menuItem =
    "flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[13px] text-ink hover:bg-hover";

  const currentDoc = DOCS.find((d) => d.id === docId) ?? DOCS[0];

  return (
    <div
      ref={shellRef}
      className="flex h-dvh flex-col overflow-hidden"
      style={{ ["--doc-font" as string]: font.css }}
    >
      {/* ============================================= TITLE BAR */}
      <header
        data-anim="titlebar"
        className="word-chrome relative z-40 flex h-11 shrink-0 items-center gap-1 border-b border-line bg-chrome px-2"
      >
        {/* left cluster */}
        <div className="flex items-center gap-1">
          <span className="hidden select-none items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] text-dim sm:flex">
            AutoSave
            <span className="inline-block h-3.5 w-7 rounded-full border border-line bg-hover p-[2px]">
              <span className="block h-full w-3 rounded-full bg-dim" />
            </span>
            Off
          </span>
          <button
            className={rIconBtn}
            title="Save (downloads my CV)"
            onClick={() => setSaveDlg(true)}
          >
            <Save size={15} strokeWidth={1.6} />
          </button>
          <button
            className={`${rIconBtn} hidden sm:inline-flex`}
            title="Undo your edits"
            onClick={() => document.execCommand("undo")}
          >
            <Undo2 size={15} strokeWidth={1.6} />
          </button>
          <button
            className={`${rIconBtn} hidden sm:inline-flex`}
            title="Redo"
            onClick={() => document.execCommand("redo")}
          >
            <Redo2 size={15} strokeWidth={1.6} />
          </button>
        </div>

        {/* center: document name switcher */}
        <div className="relative mx-auto flex min-w-0 items-center" ref={menu === "doc" ? menuRef : undefined}>
          <button
            className="flex min-w-0 items-center gap-1 rounded px-2 py-1 text-[13px] text-ink hover:bg-hover"
            onClick={() => setMenu(menu === "doc" ? "none" : "doc")}
          >
            <span className="truncate font-medium">
              {meta.documentName.replace(".docx", "")}_{currentDoc.file}
            </span>
            <ChevronDown size={13} className="shrink-0 text-dim" />
          </button>
          {menu === "doc" && (
            <div className="absolute left-1/2 top-full z-50 mt-1 w-64 -translate-x-1/2 border border-line bg-surface py-1.5">
              <p className="px-3.5 pb-1 pt-1 text-[11px] uppercase tracking-wide text-dim">
                Open document
              </p>
              {DOCS.map((d) => (
                <Link
                  key={d.id}
                  href={d.href}
                  className={`${menuItem} ${d.id === docId ? "text-accent" : ""}`}
                  onClick={closeMenus}
                >
                  <FileText size={14} strokeWidth={1.6} />
                  {d.file}
                  {d.id === docId && (
                    <span className="ml-auto text-[11px] text-dim">open</span>
                  )}
                </Link>
              ))}
              <div className="my-1 border-t border-line" />
              <button className={menuItem} onClick={() => download(meta.cvPdf)}>
                <FileText size={14} strokeWidth={1.6} /> Download CV (PDF)
              </button>
              <button
                className={menuItem}
                onClick={() => download(meta.cvDocx)}
              >
                <FileText size={14} strokeWidth={1.6} /> Download CV (DOCX)
              </button>
            </div>
          )}
        </div>

        {/* right cluster */}
        <div className="flex items-center gap-1">
          <button
            className={rIconBtn}
            title={dark ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme(dark ? "light" : "dark")}
          >
            {mounted && dark ? (
              <Sun size={15} strokeWidth={1.6} />
            ) : (
              <Moon size={15} strokeWidth={1.6} />
            )}
          </button>
          <span
            className="mx-1 hidden h-7 w-7 select-none items-center justify-center rounded-full bg-accent text-[11px] font-semibold text-white sm:flex"
            title={meta.name}
          >
            {meta.initials}
          </span>
          <button className={`${rIconBtn} hidden md:inline-flex`} title="Nice try" >
            <Minus size={15} strokeWidth={1.6} />
          </button>
          <button
            className={`${rIconBtn} hidden md:inline-flex`}
            title="Toggle fullscreen"
            onClick={toggleFullscreen}
          >
            <Maximize2 size={13} strokeWidth={1.6} />
          </button>
          <button
            className={`${rIconBtn} hover:bg-[#c42b1c] hover:text-white`}
            title="Close"
            onClick={() => setSaveDlg(true)}
          >
            <X size={16} strokeWidth={1.6} />
          </button>
        </div>
      </header>

      {/* ============================================= RIBBON */}
      <div
        data-anim="ribbon"
        className="word-chrome relative z-30 shrink-0 border-b border-line bg-surface"
      >
        {/* tab row */}
        <div className="flex items-center gap-0.5 px-2 pt-1">
          <div className="relative" ref={menu === "file" ? menuRef : undefined}>
            <button
              className={`rounded-t px-3 py-1.5 text-[13px] font-medium ${
                menu === "file"
                  ? "bg-accent text-white"
                  : "text-accent hover:bg-hover"
              }`}
              onClick={() => setMenu(menu === "file" ? "none" : "file")}
            >
              File
            </button>
            {menu === "file" && (
              <div className="absolute left-0 top-full z-50 w-60 border border-line bg-surface py-1.5">
                <button className={menuItem} onClick={() => download(meta.cvPdf)}>
                  <FileText size={14} strokeWidth={1.6} /> Download CV (PDF)
                </button>
                <button className={menuItem} onClick={() => download(meta.cvDocx)}>
                  <FileText size={14} strokeWidth={1.6} /> Download CV (DOCX)
                </button>
                <button className={menuItem} onClick={() => window.print()}>
                  <Printer size={14} strokeWidth={1.6} /> Print this portfolio
                </button>
                <div className="my-1 border-t border-line" />
                <a className={menuItem} href={`mailto:${meta.email}`}>
                  <Mail size={14} strokeWidth={1.6} /> Email me
                </a>
              </div>
            )}
          </div>
          {(["home", "insert", "design", "view"] as const).map((t) => (
            <button
              key={t}
              className={`relative rounded-t px-3 py-1.5 text-[13px] capitalize ${
                tab === t ? "text-accent" : "text-ink hover:bg-hover"
              }`}
              onClick={() => setTab(t)}
            >
              {t}
              {tab === t && (
                <span className="absolute inset-x-3 -bottom-px h-[2.5px] rounded-full bg-accent" />
              )}
            </button>
          ))}

          {/* right side of tab row */}
          <div className="ml-auto flex items-center gap-1">
            <button
              className={`${rBtn} relative hidden sm:inline-flex`}
              onClick={() => setCommentsOpen((v) => !v)}
            >
              <MessageSquare size={14} strokeWidth={1.6} />
              Comments
              {commentCount !== null && commentCount > 0 && (
                <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold leading-4 text-white">
                  {commentCount}
                </span>
              )}
            </button>
            <div className="relative">
              <button
                className={rBtn}
                onClick={() => {
                  const next = !editing;
                  setEditing(next);
                  setBanner(next ? "editing" : null);
                }}
                title={
                  editing
                    ? "Switch to Viewing mode"
                    : "Switch to Editing mode and mess with this document"
                }
              >
                {editing ? (
                  <Pencil size={14} strokeWidth={1.6} />
                ) : (
                  <Eye size={14} strokeWidth={1.6} />
                )}
                <span className="hidden sm:inline">
                  {editing ? "Editing" : "Viewing"}
                </span>
                <ChevronDown size={12} className="text-dim" />
              </button>
            </div>
            <div className="relative" ref={menu === "share" ? menuRef : undefined}>
              <button
                className="inline-flex h-8 items-center gap-1.5 rounded bg-accent px-3 text-[13px] font-medium text-white hover:opacity-90"
                onClick={() => setMenu(menu === "share" ? "none" : "share")}
              >
                <Share2 size={13} strokeWidth={1.8} />
                <span className="hidden sm:inline">Share</span>
              </button>
              {menu === "share" && (
                <div className="absolute right-0 top-full z-50 mt-1 w-56 border border-line bg-surface py-1.5">
                  <button
                    className={menuItem}
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      closeMenus();
                    }}
                  >
                    <Share2 size={14} strokeWidth={1.6} /> Copy link
                  </button>
                  <a
                    className={menuItem}
                    href="https://www.linkedin.com/in/mxslr/"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Linkedin size={14} strokeWidth={1.6} /> LinkedIn
                  </a>
                  <a
                    className={menuItem}
                    href="https://github.com/mxslr"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Github size={14} strokeWidth={1.6} /> GitHub
                  </a>
                  <a
                    className={menuItem}
                    href="https://www.instagram.com/marshallrasendria"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Instagram size={14} strokeWidth={1.6} /> Instagram
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* control row */}
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-line px-2 py-1.5">
          {tab === "home" && (
            <>
              <RibbonSelect
                ariaLabel="Font"
                value={fontId}
                options={FONTS.map((f) => ({ v: f.id, label: f.label, css: f.css }))}
                onPick={setFontId}
                className="w-44"
                buttonStyle={{ fontFamily: font.css }}
              />
              <RibbonSelect
                ariaLabel="Font size for selected text"
                value={sizeV}
                options={SIZES.map((s) => ({ v: s.v, label: s.label }))}
                onPick={(v) => {
                  setSizeV(v);
                  exec("fontSize", v);
                }}
                className="w-16"
              />
              <button
                className={rIconBtn}
                title="Grow font"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => stepFontSize(1)}
              >
                <span className="text-[14px] font-semibold">A</span>
                <Plus size={9} className="-ml-0.5 -mt-2" />
              </button>
              <button
                className={rIconBtn}
                title="Shrink font"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => stepFontSize(-1)}
              >
                <span className="text-[12px] font-semibold">A</span>
                <Minus size={9} className="-ml-0.5 -mt-2" />
              </button>
              <span className="mx-1 h-6 w-px shrink-0 bg-line" />
              <button
                className={rIconBtn}
                title="Bold (Ctrl+B)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec("bold")}
              >
                <Bold size={14} strokeWidth={2.2} />
              </button>
              <button
                className={rIconBtn}
                title="Italic (Ctrl+I)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec("italic")}
              >
                <Italic size={14} strokeWidth={1.8} />
              </button>
              <button
                className={rIconBtn}
                title="Underline (Ctrl+U)"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec("underline")}
              >
                <Underline size={14} strokeWidth={1.8} />
              </button>
              <button
                className={rIconBtn}
                title="Highlight"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec("hiliteColor", "#ffe066")}
              >
                <Highlighter size={14} strokeWidth={1.8} />
              </button>
              <button
                className={rIconBtn}
                title="Clear formatting"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec("removeFormat")}
              >
                <Eraser size={14} strokeWidth={1.8} />
              </button>
              <span className="mx-1 h-6 w-px shrink-0 bg-line" />
              <p className="shrink-0 whitespace-nowrap px-1 text-[12px] text-dim">
                {editing
                  ? "Select any text and format it. Refresh to reset."
                  : "Formatting switches you to Editing mode."}
              </p>
            </>
          )}

          {tab === "insert" && (
            <>
              <button
                className={rBtn}
                onClick={() => setCommentsOpen(true)}
              >
                <MessageSquare size={14} strokeWidth={1.6} /> New comment
              </button>
              <span className="mx-1 h-6 w-px shrink-0 bg-line" />
              <Link href="/playground#gallery" className={rBtn}>
                <ImageIcon size={14} strokeWidth={1.6} /> Photo gallery
              </Link>
              <Link href="/playground#music" className={rBtn}>
                <Music size={14} strokeWidth={1.6} /> Music
              </Link>
              <Link href="/playground#faq" className={rBtn}>
                <AlignLeft size={14} strokeWidth={1.6} /> FAQ
              </Link>
            </>
          )}

          {tab === "design" && (
            <>
              <button
                className={`flex shrink-0 items-center gap-2 rounded border px-2 py-1 text-[12px] ${
                  !dark ? "border-accent text-accent" : "border-line text-ink hover:bg-hover"
                }`}
                onClick={() => setTheme("light")}
              >
                <span className="block h-7 w-10 border border-line bg-white">
                  <span className="mx-1.5 mt-1.5 block h-0.5 bg-neutral-400" />
                  <span className="mx-1.5 mt-1 block h-0.5 bg-neutral-300" />
                </span>
                Light
              </button>
              <button
                className={`flex shrink-0 items-center gap-2 rounded border px-2 py-1 text-[12px] ${
                  dark ? "border-accent text-accent" : "border-line text-ink hover:bg-hover"
                }`}
                onClick={() => setTheme("dark")}
              >
                <span className="block h-7 w-10 border border-line bg-neutral-800">
                  <span className="mx-1.5 mt-1.5 block h-0.5 bg-neutral-500" />
                  <span className="mx-1.5 mt-1 block h-0.5 bg-neutral-600" />
                </span>
                Dark
              </button>
              <span className="mx-1 h-6 w-px shrink-0 bg-line" />
              <p className="shrink-0 whitespace-nowrap px-1 text-[12px] text-dim">
                Document themes. Your eyes, your rules.
              </p>
            </>
          )}

          {tab === "view" && (
            <>
              <button
                className={`${rBtn} ${navOpen ? "bg-hover" : ""}`}
                onClick={() => setNavOpen((v) => !v)}
              >
                <PanelLeft size={14} strokeWidth={1.6} /> Navigation
              </button>
              <button
                className={`${rBtn} ${commentsOpen ? "bg-hover" : ""}`}
                onClick={() => setCommentsOpen((v) => !v)}
              >
                <MessageSquare size={14} strokeWidth={1.6} /> Comments
              </button>
              <span className="mx-1 h-6 w-px shrink-0 bg-line" />
              <button
                className={rIconBtn}
                title="Zoom out"
                onClick={() => setZoom((z) => Math.max(50, z - 10))}
              >
                <Minus size={14} />
              </button>
              <button
                className={`${rBtn} w-14 justify-center`}
                title="Reset zoom"
                onClick={() => setZoom(100)}
              >
                {zoom}%
              </button>
              <button
                className={rIconBtn}
                title="Zoom in"
                onClick={() => setZoom((z) => Math.min(200, z + 10))}
              >
                <Plus size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ============================================= BANNER */}
      {banner === "protected" && (
        <div className="word-chrome flex shrink-0 items-center gap-3 border-b border-line bg-[#fff4ce] px-3 py-1.5 text-[12.5px] text-[#5c4a00] dark:bg-[#433519] dark:text-[#ffd970]">
          <span className="font-semibold uppercase tracking-wide">
            Protected view
          </span>
          <span className="hidden min-w-0 truncate sm:inline">
            This portfolio opened in Viewing mode. It is safe, I checked.
          </span>
          <button
            className="shrink-0 border border-current px-2.5 py-0.5 font-medium hover:opacity-75"
            onClick={() => {
              sessionStorage.setItem("word-banner-done", "1");
              setEditing(true);
              setBanner("editing");
            }}
          >
            Enable Editing
          </button>
          <button
            className="ml-auto shrink-0 hover:opacity-75"
            aria-label="Dismiss"
            onClick={dismissBanner}
          >
            <X size={14} />
          </button>
        </div>
      )}
      {banner === "editing" && (
        <div className="word-chrome flex shrink-0 items-center gap-3 border-b border-line bg-accent-soft px-3 py-1.5 text-[12.5px] text-accent">
          <Pencil size={13} className="shrink-0" />
          <span className="min-w-0 truncate">
            Editing is on. Your changes live only in this tab and vanish on
            refresh. Ctrl+Click follows links.
          </span>
          <button
            className="ml-auto shrink-0 hover:opacity-75"
            aria-label="Dismiss"
            onClick={() => setBanner(null)}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ============================================= RULER */}
      <div className="word-chrome hidden h-6 shrink-0 items-end justify-center border-b border-line bg-surface md:flex">
        <div className="ruler-ticks h-3 w-full max-w-[816px] opacity-60" />
      </div>

      {/* ============================================= BODY */}
      <div className="relative flex min-h-0 flex-1">
        {/* navigation pane */}
        {navOpen && (
          <aside className="word-panel absolute inset-y-0 left-0 z-20 flex w-72 shrink-0 flex-col border-r border-line bg-surface min-[1360px]:static">
            <div className="flex items-center justify-between px-4 pb-2 pt-4">
              <h2 className="text-[13px] font-semibold text-ink">Navigation</h2>
              <button
                className={rIconBtn}
                aria-label="Close navigation"
                onClick={() => setNavOpen(false)}
              >
                <X size={14} />
              </button>
            </div>
            <div className="mx-4 mb-3 flex items-center gap-2 border border-line px-2.5 py-1.5">
              <Search size={13} className="text-dim" />
              <input
                className="w-full bg-transparent text-[13px] text-ink outline-none placeholder:text-dim"
                placeholder="Search this document"
                value={navQuery}
                onChange={(e) => setNavQuery(e.target.value)}
              />
            </div>
            <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
              {filteredNav.map((n) => (
                <button
                  key={n.id}
                  className="block w-full rounded px-3 py-2 text-left text-[13px] text-ink hover:bg-hover"
                  onClick={() => scrollToSection(n.id)}
                >
                  {n.label}
                </button>
              ))}
              <div className="my-2 border-t border-line" />
              {DOCS.map((d) => (
                <Link
                  key={d.id}
                  href={d.href}
                  className={`block rounded px-3 py-2 text-[13px] hover:bg-hover ${
                    pathname === d.href ? "font-semibold text-accent" : "text-ink"
                  }`}
                >
                  {d.file}
                </Link>
              ))}
            </nav>
          </aside>
        )}

        {/* document canvas */}
        <div
          ref={scrollRef}
          className="min-w-0 flex-1 overflow-y-auto overscroll-contain"
        >
          <div
            className="page-zoom mx-auto flex max-w-[900px] flex-col gap-4 px-2 py-4 sm:gap-6 sm:px-6 sm:py-8 md:gap-8"
            style={{ ["--page-zoom" as string]: zoom / 100 }}
          >
            <div
              ref={contentRef}
              contentEditable={editing}
              suppressContentEditableWarning
              spellCheck={false}
              className="flex flex-col gap-4 sm:gap-6 md:gap-8"
              onClickCapture={onContentClick}
            >
              {children}
            </div>
            <p className="pb-6 text-center text-[12px] text-dim">
              Built with Next.js, styled after the world&apos;s most famous
              document editor. No actual documents were harmed.
            </p>
          </div>
        </div>

        {/* comments pane */}
        <CommentsPane
          open={commentsOpen}
          onClose={() => setCommentsOpen(false)}
          onCount={setCommentCount}
        />
      </div>

      {/* ============================================= STATUS BAR */}
      <footer
        data-anim="statusbar"
        className="word-chrome flex h-7 shrink-0 select-none items-center gap-4 border-t border-line bg-chrome px-3 text-[11.5px] text-dim"
      >
        <span>
          Page {page} of {pageCount}
        </span>
        <span className="hidden sm:inline">{words} words</span>
        <span className="hidden md:inline">English (Indonesia)</span>
        <span className="hidden lg:inline">
          {editing ? "Editing" : "Viewing"}
        </span>
        <div className="ml-auto hidden items-center gap-2 sm:flex">
          <button
            aria-label="Zoom out"
            className="hover:text-ink"
            onClick={() => setZoom((z) => Math.max(50, z - 10))}
          >
            <Minus size={12} />
          </button>
          <input
            aria-label="Zoom"
            type="range"
            min={50}
            max={200}
            step={10}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-1 w-24 accent-[var(--accent)]"
          />
          <button
            aria-label="Zoom in"
            className="hover:text-ink"
            onClick={() => setZoom((z) => Math.min(200, z + 10))}
          >
            <Plus size={12} />
          </button>
          <button className="w-10 text-right hover:text-ink" onClick={() => setZoom(100)}>
            {zoom}%
          </button>
        </div>
      </footer>

      {/* ============================================= MINI TOOLBAR */}
      {mini && editing && (
        <div
          className="fixed z-50 flex -translate-x-1/2 -translate-y-full items-center gap-0.5 border border-line bg-surface p-1"
          style={{ left: mini.x, top: mini.y - 8 }}
        >
          <button className={rIconBtn} title="Bold" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")}>
            <Bold size={13} strokeWidth={2.2} />
          </button>
          <button className={rIconBtn} title="Italic" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")}>
            <Italic size={13} strokeWidth={1.8} />
          </button>
          <button className={rIconBtn} title="Underline" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("underline")}>
            <Underline size={13} strokeWidth={1.8} />
          </button>
          <button className={rIconBtn} title="Highlight" onMouseDown={(e) => e.preventDefault()} onClick={() => exec("hiliteColor", "#ffe066")}>
            <Highlighter size={13} strokeWidth={1.8} />
          </button>
          <span className="mx-0.5 h-5 w-px bg-line" />
          <button className={rIconBtn} title="Grow font" onMouseDown={(e) => e.preventDefault()} onClick={() => stepFontSize(1)}>
            <span className="text-[13px] font-semibold">A</span>
            <Plus size={8} className="-ml-0.5 -mt-2" />
          </button>
          <button className={rIconBtn} title="Shrink font" onMouseDown={(e) => e.preventDefault()} onClick={() => stepFontSize(-1)}>
            <span className="text-[11px] font-semibold">A</span>
            <Minus size={8} className="-ml-0.5 -mt-2" />
          </button>
        </div>
      )}

      {/* ============================================= SAVE DIALOG */}
      {saveDlg && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm border border-line bg-surface">
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <span className="text-[13px] font-semibold text-ink">
                {meta.documentName}
              </span>
              <button
                className={rIconBtn}
                aria-label="Close dialog"
                onClick={() => setSaveDlg(false)}
              >
                <X size={14} />
              </button>
            </div>
            <p className="px-4 py-5 text-[13.5px] leading-relaxed text-ink">
              Want to save a copy of Marshall before you go? Saving downloads
              the real CV. Not saving throws away your edits, which honestly is
              fine too.
            </p>
            <div className="flex flex-wrap justify-end gap-2 px-4 pb-4">
              <button
                className="h-8 border border-line bg-accent px-4 text-[13px] font-medium text-white hover:opacity-90"
                onClick={() => {
                  download(meta.cvPdf);
                  setSaveDlg(false);
                }}
              >
                Save
              </button>
              <button
                className="h-8 border border-line px-4 text-[13px] text-ink hover:bg-hover"
                onClick={() => window.location.reload()}
              >
                Don&apos;t Save
              </button>
              <button
                className="h-8 border border-line px-4 text-[13px] text-ink hover:bg-hover"
                onClick={() => setSaveDlg(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
