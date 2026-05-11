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

### Use `.md` or `.mdx`?

| Format | When to use |
|---|---|
| `.md` | Simple pieces — hero image + plain prose, no custom components |
| `.mdx` | When you need `<Figure>` captions, `<FlipbookPDF>`, or any other custom component |

Both formats use identical frontmatter and produce identical detail pages. The only difference is MDX lets you import and use Astro/React components inline.

### Steps

1. Create `src/content/portfolio/your-piece-name.md` (or `.mdx`) — the filename becomes the URL slug
2. Add the hero image (and any process images) to `src/assets/portfolio/`
3. Fill in the frontmatter:

```md
---
title: Bloodcliff Keep          # required
description: Short description  # required — used as meta description
heroImage: ../../assets/portfolio/bloodcliff-keep.jpg  # required — relative to this file
alt: Descriptive alt text       # required — enforced by TypeScript
year: 2024                      # optional
tags: [fantasy, battle]         # optional — shown on card hover
featured: true                  # optional — appears in the hero carousel
order: 1                        # optional — sort order in grid (lower = earlier)
objectPosition: "50% 30%"       # optional — CSS object-position for carousel crop anchor
flipbook: /pdfs/bloodcliff.pdf  # optional — enables the PDF flipbook viewer
---

Plain Markdown body goes here.
```

4. For `.mdx` files, add imports **after** the frontmatter closing `---`:

```mdx
---
# ...frontmatter...
---

import Figure from '../../components/Figure.astro';
import sketchImg from '../../assets/portfolio/my-piece/sketch.png';

Prose goes here...

<Figure
  src={sketchImg}
  alt="Descriptive alt text."
  caption="Optional caption in mint."
  widthHint="narrow"
/>
```

5. The piece automatically appears in the portfolio grid and gets a detail page.

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

## Themes

The site ships with a character-class theme switcher (palette icon, bottom-right of every page). Users can pick a color palette and their choice is persisted in `localStorage`.

### Adding or editing a theme

1. Add a `[data-theme="your-id"]` block to `src/styles/global.css` with the four CSS variables:

```css
[data-theme="your-id"] {
  --color-bg: #...;
  --color-text-title: #...;   /* headings — cream-ish */
  --color-text-link: #...;    /* links / interactive — periwinkle-ish */
  --color-text-secondary: #...; /* accents / tags / captions — mint-ish */
}
```

2. Add an entry to `THEMES` in `src/lib/themes.ts`:

```ts
{ id: 'your-id', label: 'Your Label' },
```

3. Add a portrait image at `src/assets/themes/your-id.webp` — it shows as the thumbnail in the picker.

**Note:** Body text color (`#ffffff`) is intentionally constant across all themes for accessibility. Only `--color-bg` and the three accent variables change.

**Contrast:** Before shipping a new palette, verify WCAG AA contrast (≥ 4.5:1 for body text, ≥ 3:1 for large text/UI) using [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/).

## Deployment

Add `netlify.toml` or `wrangler.toml` / `_headers` for Cloudflare Pages. Build command: `npm run build`. Publish directory: `dist/`.
