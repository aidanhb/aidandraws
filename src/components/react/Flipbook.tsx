/*
 * Flipbook — image-based flipbook viewer using react-pageflip.
 *
 * IMPORTANT: always hydrate with client:only="react" — this component cannot SSR.
 *
 * Pages are typed via `FlipbookPage` (src/lib/flipbook-types.ts); load them with
 * `loadFlipbook(slug)` from src/lib/load-flipbook.ts in your .astro file:
 *
 *   const pages = await loadFlipbook(slug);
 *   <Flipbook pages={pages} alt="My flipbook" client:only="react" />
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { FlipbookPage } from '../../lib/flipbook-types';
import FlipPage from './flipbook/FlipPage';
import Lightbox from './Lightbox';
import Controls from './flipbook/Controls';
import { useFlipbookPreload } from './flipbook/useFlipbookPreload';
import { useBlockVerticalTouchFlip } from './flipbook/useBlockVerticalTouchFlip';

export interface FlipbookProps {
  pages: FlipbookPage[];
  alt: string;
  startPage?: number;
  /** width / height ratio of one page — default 3/4 (portrait) */
  aspectRatio?: number;
}

export default function Flipbook({
  pages,
  alt,
  startPage = 0,
  aspectRatio = 3 / 4,
}: FlipbookProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // react-pageflip types its own ref as `any`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bookRef = useRef<any>(null);
  // Tracks whether the most recent focus came from a pointer (touch/click) vs keyboard.
  // Pointer-initiated focus is immediately blurred to prevent mobile scroll-to-view;
  // keyboard (tab) focus is kept so arrow-key navigation works.
  const pointerActivatedRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(startPage);
  const [loadedSet, setLoadedSet] = useState<Set<number>>(new Set());
  const [errorSet, setErrorSet] = useState<Set<number>>(new Set());
  const [reducedMotion, setReducedMotion] = useState(false);
  const [view, setView] = useState<'book' | 'grid'>('book');
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  // Visual "bed" around the book — gives a frame even when only the cover is showing.
  const BED_PAD = 16;
  const isTwoPage = containerWidth >= 768;
  const usableWidth = Math.max(0, containerWidth - 2 * BED_PAD);
  const pageWidth = isTwoPage ? Math.floor(usableWidth / 2) : usableWidth;
  const pageHeight = pageWidth > 0 ? Math.floor(pageWidth / aspectRatio) : 0;

  // Per-page numbering: contentNumbers[i] is the 1-based index among content-typed pages,
  // or 0 for non-content pages. totalContent is the total count of content-typed pages.
  const { contentNumbers, totalContent } = useMemo(() => {
    const nums: number[] = [];
    let running = 0;
    for (const p of pages) {
      if (p.type === 'content') running += 1;
      nums.push(p.type === 'content' ? running : 0);
    }
    return { contentNumbers: nums, totalContent: running };
  }, [pages]);

  // Visible label for a single page index. Non-content non-cover pages (endpaper,
  // frontmatter, backmatter, blank) show "- / total" so the indicator stays anchored
  // and the running total is always visible.
  const pageLabel = useCallback((i: number): string | null => {
    const p = pages[i];
    if (!p) return null;
    if (p.type === 'content') return `${contentNumbers[i]} / ${totalContent}`;
    if (p.type === 'cover') return 'Cover';
    return `- / ${totalContent}`;
  }, [pages, contentNumbers, totalContent]);

  // Visible label for a spread (one or two pages).
  const spreadLabel = useCallback((leftIdx: number, rightIdx?: number): string | null => {
    const left = pages[leftIdx];
    const right = rightIdx != null ? pages[rightIdx] : undefined;
    if (!left) return null;
    if (!right) return pageLabel(leftIdx);
    const leftL = pageLabel(leftIdx);
    const rightL = pageLabel(rightIdx!);
    if (left.type === 'content' && right.type === 'content') {
      return `${contentNumbers[leftIdx]}–${contentNumbers[rightIdx!]} / ${totalContent}`;
    }
    if (left.type === 'content') return leftL;
    if (right.type === 'content') return rightL;
    return leftL ?? rightL;
  }, [pages, contentNumbers, totalContent, pageLabel]);

  // Screen-reader announcement — always returns a meaningful string (alt text for
  // non-content non-cover pages, "Page X of Y" for content).
  const spreadAnnouncement = useCallback((leftIdx: number, rightIdx?: number): string => {
    const announceOne = (i: number): string => {
      const p = pages[i];
      if (!p) return '';
      if (p.type === 'content') return `Page ${contentNumbers[i]} of ${totalContent}`;
      if (p.type === 'cover') return 'Cover';
      return p.alt;
    };
    if (rightIdx == null || !pages[rightIdx]) return announceOne(leftIdx);
    const left = pages[leftIdx];
    const right = pages[rightIdx];
    if (!left || !right) return announceOne(leftIdx);
    if (left.type === 'content' && right.type === 'content') {
      return `Pages ${contentNumbers[leftIdx]} to ${contentNumbers[rightIdx]} of ${totalContent}`;
    }
    if (left.type === 'content') return announceOne(leftIdx);
    if (right.type === 'content') return announceOne(rightIdx);
    return announceOne(leftIdx);
  }, [pages, contentNumbers, totalContent]);

  // ResizeObserver — measure the container, not the window
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useBlockVerticalTouchFlip(containerRef);

  // prefers-reduced-motion
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', h);
    return () => mq.removeEventListener('change', h);
  }, []);

  // Keyboard navigation — arrow keys + Home/End
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (lightboxIdx !== null) {
        if (e.key === 'Escape') { e.preventDefault(); setLightboxIdx(null); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); setLightboxIdx((i) => i === null ? null : Math.max(i - 1, 0)); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); setLightboxIdx((i) => i === null ? null : Math.min(i + 1, pages.length - 1)); }
        return;
      }
      if (view !== 'book') return;
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      const pf = bookRef.current?.pageFlip?.();
      if (!pf) return;
      if (e.key === 'ArrowRight') pf.flipNext();
      else if (e.key === 'ArrowLeft') pf.flipPrev();
      else if (e.key === 'Home') pf.flip(0);
      else pf.flip(pages.length - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [pages.length, view, lightboxIdx]);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    if (lightboxIdx === null) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [lightboxIdx]);

  const markLoaded = useCallback((i: number) => setLoadedSet((p) => new Set([...p, i])), []);
  const markError  = useCallback((i: number) => setErrorSet((p)  => new Set([...p, i])), []);

  useFlipbookPreload(currentPage, pages);

  // ── Loading skeleton (before ResizeObserver fires) ────────────────────────
  if (containerWidth === 0 || pageWidth === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full bg-text/[0.06] rounded"
        // paddingBottom is dynamic from `aspectRatio` — previews a half-width page at the correct aspect while we wait.
        style={{ paddingBottom: `${(1 / aspectRatio) * 50}%` }}
      />
    );
  }

  // ── Flip animation viewer ─────────────────────────────────────────────────
  const FLIP_MS = 700;

  // In two-page mode, showCover renders the first/last pages as single pages on
  // the right/left half of the spread respectively. Shift the book so the visible
  // page is always centered in the container.
  const shiftX = isTwoPage
    ? currentPage === 0
      ? -pageWidth / 2
      : currentPage === pages.length - 1
        ? pageWidth / 2
        : 0
    : 0;

  // The visible flip spread is either a single page (cover alone at start/end in two-page
  // showCover mode, or any page in one-page mode) or a two-page spread.
  const flipRightIdx = isTwoPage && currentPage !== 0 && currentPage !== pages.length - 1
    ? currentPage + 1
    : undefined;
  const visibleLabel = spreadLabel(currentPage, flipRightIdx);
  const announcement = spreadAnnouncement(currentPage, flipRightIdx);

  return (
    <div ref={containerRef} role="region" aria-label={alt} tabIndex={0}
      onPointerDown={() => { pointerActivatedRef.current = true; }}
      onFocus={(e) => { if (pointerActivatedRef.current) { pointerActivatedRef.current = false; e.currentTarget.blur(); } }}
      className="flipbook-root outline-none">
      {/* Force pan-y on every internal react-pageflip element so vertical scroll is never captured */}
      <style>{`
        .flipbook-root * { touch-action: pan-y !important; }
        .flipbook-root .stf__item { background-color: #fff; }
        @keyframes flipbook-shimmer {
          0%   { background-position: -150% 0; }
          100% { background-position: 150% 0; }
        }
        .flipbook-shimmer {
          background-image: linear-gradient(
            90deg,
            rgb(255 255 255 / 0) 0%,
            rgb(255 255 255 / 0.7) 50%,
            rgb(255 255 255 / 0) 100%
          );
          background-size: 200% 100%;
          background-repeat: no-repeat;
          animation: flipbook-shimmer 1.6s ease-in-out infinite;
        }
      `}</style>
      <span className="sr-only" aria-live="polite">{announcement}</span>
      <div className="p-4 border border-text/20 rounded">
      {view === 'grid' ? (
        <div
          className="grid gap-2"
          // gridTemplateColumns is dynamic on isTwoPage — can't be a static Tailwind class.
          style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${isTwoPage ? 120 : 90}px, 1fr))` }}
        >
          {pages.map((page, i) => (
            <button
              key={page.src}
              type="button"
              onClick={() => setLightboxIdx(i)}
              aria-label={`View ${pageLabel(i) ?? page.alt}`}
              className="relative overflow-hidden p-0 rounded-sm border border-text/[0.15] bg-white cursor-pointer"
              style={{ aspectRatio: `${aspectRatio}` }}
            >
              <img
                src={page.src} alt={page.alt}
                className="block w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : (
      <div className="touch-pan-y">
        <div
          className="flex justify-center"
          style={{
            transform: `translateX(${shiftX}px)`,
            transition: reducedMotion ? 'none' : 'transform 400ms ease',
          }}
        >
        <HTMLFlipBook
          key={isTwoPage ? 'two' : 'one'}
          ref={bookRef}
          width={pageWidth}
          height={pageHeight}
          size="fixed"
          startPage={currentPage}
          usePortrait={!isTwoPage}
          drawShadow={!reducedMotion}
          flippingTime={reducedMotion ? 1 : FLIP_MS}
          showCover={true}
          mobileScrollSupport
          clickEventForward={false}
          showPageCorners
          disableFlipByClick={false}
          maxShadowOpacity={0.4}
          useMouseEvents
          swipeDistance={30}
          // satisfy required-but-defaulted fields
          minWidth={100}
          maxWidth={2000}
          minHeight={100}
          maxHeight={2800}
          startZIndex={0}
          autoSize={false}
          renderOnlyPageLengthChange={false}
          className=""
          style={{ touchAction: 'pan-y' }}
          // react-pageflip's onFlip is untyped
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onFlip={(e: any) => setCurrentPage(e.data)}
        >
          {pages.map((page, i) => (
            <FlipPage
              key={page.src}
              src={page.src}
              alt={page.alt}
              loaded={loadedSet.has(i)}
              error={errorSet.has(i)}
              eager={i < 3}
              reducedMotion={reducedMotion}
              onLoad={() => markLoaded(i)}
              onError={() => markError(i)}
            />
          ))}
        </HTMLFlipBook>
        </div>
      </div>
      )}
      </div>
      {view === 'book' && (
        <Controls
          label={visibleLabel}
          onPrev={() => bookRef.current?.pageFlip?.()?.flipPrev()}
          onNext={() => bookRef.current?.pageFlip?.()?.flipNext()}
          disablePrev={currentPage === 0}
          disableNext={currentPage >= pages.length - (isTwoPage ? 2 : 1)}
        />
      )}
      <div className="flex justify-center mt-4">
        <button
          type="button"
          onClick={() => setView((v) => (v === 'book' ? 'grid' : 'book'))}
          className="bg-transparent border-0 p-0 text-text-link text-xs underline cursor-pointer select-none"
        >
          {view === 'book' ? 'View all pages' : 'Back to book'}
        </button>
      </div>
      {lightboxIdx !== null && pages[lightboxIdx] && (
        <Lightbox
          src={pages[lightboxIdx].src}
          alt={pages[lightboxIdx].alt}
          label={pageLabel(lightboxIdx) ?? undefined}
          onClose={() => setLightboxIdx(null)}
          onPrev={lightboxIdx > 0 ? () => setLightboxIdx(lightboxIdx - 1) : undefined}
          onNext={lightboxIdx < pages.length - 1 ? () => setLightboxIdx(lightboxIdx + 1) : undefined}
        />
      )}
    </div>
  );
}
