import { getImage } from 'astro:assets';
import type { ImageMetadata } from 'astro';
import type { FlipbookPage, PageType } from './flipbook-types';

type PageMetadata = { type?: PageType; alt?: string };
type FlipbookMetadata = Record<string, PageMetadata>;

// Glob all flipbook page images across every flipbook; filter by slug at call time.
// `import.meta.glob` only accepts literal patterns, so the broad pattern is unavoidable.
const allFlipbookImages = import.meta.glob<ImageMetadata>(
  '../assets/flipbooks/**/page-*.{png,jpg,jpeg,webp}',
  { eager: true, import: 'default' },
);

const allFlipbookMetadata = import.meta.glob<FlipbookMetadata>(
  '../assets/flipbooks/**/_pages.json',
  { eager: true, import: 'default' },
);

/**
 * Load a flipbook's pages from src/assets/flipbooks/{slug}/.
 *
 * Pages are read from `page-*.{png,jpg,jpeg,webp}` files sorted alphabetically (so use
 * zero-padded numbering). Per-page overrides can be supplied in an optional `_pages.json`
 * file in the same directory, keyed by filename stem:
 *
 *   { "page-000": { "type": "cover", "alt": "Front cover" } }
 *
 * Defaults: `type: 'content'`, `alt: 'Page {n}'` where {n} is the 1-based index among
 * content-typed pages.
 */
export async function loadFlipbook(slug: string): Promise<FlipbookPage[]> {
  const slugPattern = `/flipbooks/${slug}/`;

  const metadataEntry = Object.entries(allFlipbookMetadata).find(
    ([path]) => path.includes(slugPattern),
  );
  const metadata: FlipbookMetadata = metadataEntry ? metadataEntry[1] : {};

  const pageEntries = Object.entries(allFlipbookImages)
    .filter(([path]) => path.includes(slugPattern))
    .sort(([a], [b]) => a.localeCompare(b));

  // Resolve type + alt first so we can run getImage calls in parallel.
  let contentCount = 0;
  const resolved = pageEntries.map(([path, img]) => {
    const stem = path.split('/').pop()!.replace(/\.[^.]+$/, '');
    const meta = metadata[stem] ?? {};
    const type: PageType = meta.type ?? 'content';
    if (type === 'content') contentCount += 1;
    return { img, type, alt: meta.alt ?? `Page ${contentCount}` };
  });

  // getImage with explicit width/format keeps URLs deterministic — without them parallel
  // calls produce colliding URLs that serve the wrong image.
  const optimized = await Promise.all(
    resolved.map(({ img }) => getImage({ src: img, width: 1000, format: 'webp' })),
  );

  return resolved.map(({ type, alt }, i) => ({
    src: optimized[i].src,
    alt,
    type,
  }));
}
