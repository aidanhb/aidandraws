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

## Adding a book

1. Create `src/content/books/your-book-name.md` (or `.mdx`) — the filename becomes the URL slug (`/books/your-book-name`)
2. Add the card cover image at `src/assets/books/your-book-name/cover.webp`
3. Add the flipbook page images at `src/assets/flipbooks/your-book-name/page-000.webp`, `page-001.webp`, … — pages are sorted alphabetically, so zero-pad the numbers. Conventionally `page-000.webp` is the front cover and the last `page-NNN.webp` is the back cover.
4. Fill in the frontmatter:

```md
---
title: "My Book"
description: "A short description, used for the SEO meta tag."
cover: ../../assets/books/my-book/cover.webp   # required — book card cover
alt: "Cover of My Book"                        # required
year: 2024                                     # optional
numPages: 320                                  # optional
order: 1                                       # optional — sort order on the index page
---

Body content (markdown / MDX) is rendered on the detail page above the flipbook.
```

5. (Optional) Override page types and alt text by adding `src/assets/flipbooks/your-book-name/_pages.json`. Keys are filename stems:

```json
{
  "page-000": { "type": "cover", "alt": "Front cover" },
  "page-001": { "type": "endpaper" },
  "page-002": { "type": "frontmatter" },
  "page-035": { "type": "backmatter" },
  "page-036": { "type": "endpaper" },
  "page-037": { "type": "cover", "alt": "Back cover" }
}
```

Page types drive how the page indicator labels the spread:

| Type | Visible label |
|---|---|
| `content` (default) | `N / total` |
| `cover` | `Cover` |
| `endpaper`, `frontmatter`, `backmatter`, `blank` | `- / total` |

Both `type` and `alt` are optional within each entry — missing fields fall back to `type: 'content'` and `alt: 'Page N'` (where N is the running count of content-typed pages).

6. The book card appears in the Books section, linking to `/books/your-book-name`. The detail page renders the flipbook automatically when pages exist in `src/assets/flipbooks/your-book-name/`.

### Flipbook in any layout

`loadFlipbook(slug)` from `src/lib/load-flipbook.ts` resolves a flipbook directory into typed pages:

```astro
---
import FlipbookPDF from '../components/react/FlipbookPDF';
import { loadFlipbook } from '../lib/load-flipbook';

const pages = await loadFlipbook('sketchbook');
---

<FlipbookPDF pages={pages} alt="Sketchbook" client:only="react" />
```

The slug refers to a directory under `src/assets/flipbooks/`. The component cannot SSR — `client:only="react"` is required.

**FlipbookPDF props:**

| Prop | Type | Default | Description |
|---|---|---|---|
| `pages` | `FlipbookPage[]` | required | Output of `loadFlipbook()` — `{ src, alt, type }` per page |
| `alt` | `string` | required | `aria-label` for the region |
| `startPage` | `number` | `0` | Initial page index |
| `aspectRatio` | `number` | `0.75` | Width ÷ height of one page (3/4 = portrait) |

## File structure

```
src/
  assets/
    portfolio/           ← hero + process images, one folder per piece
    books/               ← book card covers (my-book/cover.webp)
    flipbooks/           ← flipbook page images (my-book/page-NNN.webp + optional _pages.json)
    themes/              ← theme picker portraits
    about/               ← headshot, etc.
  lib/
    flipbook-types.ts    ← PageType + FlipbookPage interface
    load-flipbook.ts     ← loadFlipbook(slug) helper used by .astro layouts
  components/
    Nav.astro
    Footer.astro
    Hero.astro           ← shows pieces with featured: true
    PortfolioGrid.astro
    PortfolioCard.astro
    BookCard.astro
    Books.astro
    About.astro
    react/
      FlipbookPDF.tsx    ← image-based flipbook viewer (react-pageflip)
      ThemePicker.tsx
      MobileMenu.tsx
  content/
    config.ts            ← Zod schemas for portfolio + books collections
    portfolio/           ← .md / .mdx files, one per piece
    books/               ← .md / .mdx files, one per book
  layouts/
    BaseLayout.astro     ← <html>, SEO meta, Google Fonts, ThemePicker
    PieceLayout.astro    ← portfolio detail page layout
    BookLayout.astro     ← book detail page layout (includes FlipbookPDF)
  pages/
    index.astro          ← single-page layout (Hero + Portfolio + Books + About)
    [...slug].astro      ← portfolio detail pages
    books/
      [slug].astro       ← book detail pages
  styles/
    global.css           ← Tailwind directives + base styles + theme variables
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
