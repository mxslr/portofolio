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
| `experience` | Work and organizational entries. `type: "Internship"` goes to Work Experience, anything else goes to Organizational Experience |
| `projects` | Projects with `images`, `videos`, `stack`, `points`, optional `link`. Photos and videos open in a swipeable viewer via the buttons under each project |
| `awards` | Honors and awards, optional `image` |
| `certifications` | Certificates, optional `image` (certificate photo) and `url` (verify link) |
| `brands` | The logo strip. `logo` can be any image URL or a local `/logos/...` path |
| `playground.gallery` | Personal photo gallery. Put files in `public/gallery/` and list them here |
| `playground.music` | Tracks. Put mp3 files in `public/music/` and point `src` at them. `spotifyEmbed` accepts a Spotify embed URL |
| `playground.faq` | The FAQ page |

Notes:

- **Videos**: put direct video URLs in a project's `videos` array. Recommended: upload to Cloudinary and paste the delivery URL (keeps the repo small, saves Vercel bandwidth, and Cloudinary compresses and streams for you). Local files also work: drop an mp4 into `public/videos/` and use `"/videos/demo.mp4"`.
- **Images**: portrait or landscape both work. Project and certificate images keep their natural aspect ratio; the gallery lays photos out in columns.
- **Company logos**: drop a transparent PNG into `public/logos/` and set `"logo": "/logos/yourfile.png"` on an experience entry or brand. If a logo is empty or fails to load, a monogram fallback shows instead.
- **Certificate photos**: `sertifikat-1/2/3.png` are currently mapped to the first three certifications. Check that the mapping matches and reorder in the JSON if needed.
- **CV files**: the download buttons point at `meta.cvPdf` and `meta.cvDocx` inside `public/`.

## Visitor comments

Comments are shared across all visitors, stored in Supabase (table `portfolio_comments`, project `sapa-db`). Configuration lives in `.env.local`:

```
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

When deploying (Vercel), add both variables in the project's environment settings. Without them the comment pane still renders but posting is disabled.

## Features cheat sheet

- **Viewing / Editing mode** (top right): in Editing mode visitors can select text and use Bold, Italic, Underline, Highlight, and font size from the ribbon or the floating mini toolbar. Everything resets on refresh. Ctrl+Click follows links while editing.
- **Font switcher** (Home tab): Segoe UI, Times New Roman, Courier New. Per-visitor, resets on refresh.
- **Design tab**: light and dark theme. Defaults to light.
- **View tab**: navigation pane, comments pane, zoom (also on the status bar).
- **File menu / Save icon / Ctrl+S / Close button**: CV download flows.
- **Documents**: `Resume.docx` is `/`, `Playground.docx` is `/playground` (gallery, music, FAQ). Switch via the title bar dropdown or the navigation pane.
