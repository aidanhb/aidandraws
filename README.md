# aidandraws.com

Personal portfolio site for Aidan Holloway-Bidwell, built with Astro 5, React, Tailwind CSS, and MDX. Deployed to Cloudflare Pages or Netlify.

## Setup

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # output → dist/
npm run preview # preview build locally
```

**Node 20+ required.**

## Adding a new portfolio piece

1. Create `src/content/portfolio/your-piece-name.md` (filename becomes the URL slug, e.g. `bloodcliff-keep.md` → `/bloodcliff-keep`)
2. Add the high-res image to `src/assets/portfolio/`
3. Fill in the frontmatter — all fields with their types:

```md
---
title: Bloodcliff Keep          # required — displayed as heading
description: Short description  # required — used as meta description
heroImage: ../../assets/portfolio/bloodcliff-keep.jpg  # required — path relative to this file
alt: Descriptive alt text       # required — enforced by TypeScript
year: 2024                      # optional
tags: [fantasy, battle]         # optional — shown on card hover
featured: true                  # optional — appears in the Hero section at top of page
order: 1                        # optional — controls sort order in grid (lower = earlier)
flipbook: /pdfs/bloodcliff.pdf  # optional — enables the PDF flipbook viewer on the detail page
---

Long-form text about the piece goes here. Supports full Markdown.
```

4. The piece automatically appears in the portfolio grid and gets a detail page.

## File structure

```
src/
  assets/portfolio/     ← high-res source images (Astro optimizes these at build time)
  components/
    Nav.astro
    Footer.astro
    Hero.astro           ← shows pieces with featured: true
    PortfolioGrid.astro
    PortfolioCard.astro
    About.astro
    react/
      FlipbookPDF.tsx    ← stub; implement with react-pageflip + react-pdf
  content/
    config.ts            ← Zod schema for portfolio collection
    portfolio/           ← .md / .mdx files, one per piece
  layouts/
    BaseLayout.astro     ← <html>, SEO meta, Google Fonts
    PieceLayout.astro    ← detail page layout
  pages/
    index.astro          ← single-page layout (Hero + Portfolio + About)
    [...slug].astro      ← dynamic detail pages
  styles/
    global.css           ← Tailwind directives + base styles
```

## Design tokens

| Token | Value |
|---|---|
| `bg` | `#160912` (near-black purple) |
| `text` | `#FFFFFF` |
| `text-title` | `#FFE4A8` (cream) |
| `text-link` | `#C2CEFF` (light blue) |
| `text-secondary` | `#C2FFE1` (mint) |
| `font-heading` | Josefin Sans |
| `font-body` | Space Grotesk |

## Logo

Replace the "Aidan" text placeholder in `src/components/Nav.astro` with:

```astro
<img src="/logo.svg" alt="Aidan Draws" class="h-8 w-auto" />
```

## Deployment

Add `netlify.toml` or `wrangler.toml` / `_headers` for Cloudflare Pages. Build command: `npm run build`. Publish directory: `dist/`.
