/**
 * Page types drive the page-indicator label:
 * - `content` — numbered "N / total". The default when no metadata is supplied.
 * - `cover` — labeled "Cover".
 * - `endpaper`, `frontmatter`, `backmatter`, `blank` — labeled "- / total".
 *
 * Screen-reader announcements use "Page N of total" for content, "Cover" for covers,
 * and the page's `alt` text for everything else.
 */
export type PageType =
  | 'cover'
  | 'endpaper'
  | 'frontmatter'
  | 'backmatter'
  | 'content'
  | 'blank';

export interface FlipbookPage {
  src: string;
  alt: string;
  type: PageType;
}
