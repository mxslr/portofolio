# Marshall's Portfolio, but it's Microsoft Word

A personal portfolio that looks and behaves like a Word document. Title bar, ribbon, ruler, pages, comments, the whole thing. Built with Next.js 16, Tailwind CSS 4, and GSAP.

## Running it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Editing your content (the important part)

Everything on the site lives in one file: **`data/portfolio.json`**. Add, edit, or remove anything there and the site updates. No code changes needed.

| Section in JSON | What it controls |
| --- | --- |
| `meta` | Name, contacts, CV file paths, site title and description |
| `about` | Profile paragraphs, education, skills |
| `socials` | The links in Let's Connect and the Share menu |
| `linkedinBadge` | Your LinkedIn badge (vanity name) |
| `experience` | Work and organizational entries. `type: "Internship"` or `"Apprenticeship"` goes to Work Experience, anything else goes to Organizational Experience. An optional `status` (for example `"Soon"`) shows as a small tag next to the role |
| `projects` | Projects with `images`, `videos`, `stack`, `points`, optional `link`. Photos and videos open in a swipeable viewer via the buttons under each project |
| `publications` | Published papers. Each one shows title, publisher, issue, authors, an inline PDF reader, and a description. Put the file in `public/publications/` and set `pdf` and `pages` |
| `awards` | Honors and awards, optional `image` |
| `certifications` | Certificates, optional `image` (certificate photo) and `url` (verify link) |
| `brands` | The logo strip. `logo` can be any image URL or a local `/logos/...` path |
| `playground.gallery` | Personal photo gallery. Put files in `public/gallery/` and list them here with `width`, `height`, and a `blur` data URI (see below) |
| `playground.typing` | Typing Race sentences and intro. Scores are stored in Supabase (`portfolio_typing_scores`) on a shared leaderboard |
| `playground.faq` | The FAQ page |

Notes:

- **Videos**: put direct video URLs in a project's `videos` array. Recommended: upload to Cloudinary and paste the delivery URL (keeps the repo small, saves Vercel bandwidth, and Cloudinary compresses and streams for you). Local files also work: drop an mp4 into `public/videos/` and use `"/videos/demo.mp4"`.
- **Images**: portrait or landscape both work. Project and certificate images keep their natural aspect ratio; the gallery lays photos out in columns.
- **Gallery photos load up front, not lazily.** Each entry carries `width`, `height`, and `blur`, a tiny inline WebP that shows while the real file arrives, so a slow connection sees the picture instead of an empty box. Next.js serves a resized copy for the column width, roughly 40 KB instead of the multi-megabyte original. To add a photo, drop the file in `public/gallery/` and generate the three fields:

  ```bash
  node -e "const s=require('sharp');(async()=>{const f='public/gallery/YOURFILE.webp';const m=await s(f).metadata();const b=await s(f).resize({width:12}).webp({quality:35}).toBuffer();console.log(JSON.stringify({width:m.width,height:m.height,blur:'data:image/webp;base64,'+b.toString('base64')},null,2))})()"
  ```

- **Long copy collapses.** Profile paragraphs, experience summaries, project bullets, the publication description, and FAQ answers run through `MoreText`, which cuts anything genuinely long down to a preview with a `...more` link. Short text is left alone.
- **Company logos**: drop a transparent PNG into `public/logos/` and set `"logo": "/logos/yourfile.png"` on an experience entry or brand. If a logo is empty or fails to load, a monogram fallback shows instead.
- **Certificate photos**: `sertifikat-1/2/3.png` are currently mapped to the first three certifications. Check that the mapping matches and reorder in the JSON if needed.
- **CV files**: the download buttons point at `meta.cvPdf` and `meta.cvDocx` inside `public/`.
- **Publication PDFs**: the reader renders the file with pdf.js. The worker lives at `public/pdf/pdf.worker.min.mjs` and is copied from `node_modules/pdfjs-dist/legacy/build/`. If `pdfjs-dist` is ever upgraded, copy the worker again so the two versions match:

  ```bash
  cp node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs public/pdf/pdf.worker.min.mjs
  ```


## Visitor comments

Comments are shared across all visitors, stored in Supabase (tables `portfolio_comments` and `portfolio_typing_scores`, project `portfolio-db`). Configuration lives in `.env.local`:

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

When deploying (Vercel), add both variables in the project's environment settings. Without them the comment pane still renders but posting is disabled.

## AI assistant

A floating chat (bottom right) answers visitor questions about Marshall only, in English or Indonesian. It reads the whole of `data/portfolio.json` through `lib/assistant-context.ts`, so anything published on the site is something it can answer, and it stays in sync automatically. Personality and the personal details that are not on the page (birthday, schools, favourites, and so on) live in `data/assistant.json`. It needs `OPENAI_API_KEY` (and optional `OPENAI_MODEL`, default gpt-4o-mini) in `.env.local` and in Vercel. Limits: 10 messages per browser session, 6 per minute and 40 per day per IP, short replies, off topic questions get a laughing sticker.

## Features cheat sheet

- **Viewing / Editing mode** (top right): in Editing mode visitors can select text and use Bold, Italic, Underline, Highlight, and font size from the ribbon or the floating mini toolbar. Everything resets on refresh. Ctrl+Click follows links while editing.
- **Font switcher** (Home tab): Segoe UI, Times New Roman, Courier New. With text selected it restyles only the selection, like Word; with nothing selected it changes the whole document. Per-visitor, resets on refresh.
- **Design tab**: light and dark theme. Defaults to light.
- **View tab**: navigation pane, comments pane, zoom (also on the status bar).
- **AutoSave** (title bar): a working Word toggle. It slides, fills, flips Off to On, and runs the short Saving then Saved status. Nothing actually leaves the browser.
- **File menu / Save icon / Ctrl+S / Close button**: CV download flows.
- **Documents**: `Resume.docx` is `/`, `Playground.docx` is `/playground` (gallery, typing race, FAQ). Switch via the title bar dropdown or the navigation pane.
