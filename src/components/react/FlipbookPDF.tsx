/*
 * FlipbookPDF — image-based flipbook viewer using react-pageflip.
 *
 * IMPORTANT: always hydrate with client:only="react" — this component cannot SSR.
 *
 * Pages are typed via `FlipbookPage` (src/lib/flipbook-types.ts); load them with
 * `loadFlipbook(slug)` from src/lib/load-flipbook.ts in your .astro file:
 *
 *   const pages = await loadFlipbook(slug);
 *   <FlipbookPDF pages={pages} alt="My flipbook" client:only="react" />
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import type { FlipbookPage } from '../../lib/flipbook-types';

export interface FlipbookProps {
  pages: FlipbookPage[];
  alt: string;
  startPage?: number;
  /** width / height ratio of one page — default 3/4 (portrait) */
  aspectRatio?: number;
}

// react-pageflip requires page children to be forwardRef components.
// The outer div is the DOM element the flip engine transforms.
interface FlipPageProps {
  src: string;
  alt: string;
  loaded: boolean;
  error: boolean;
  eager: boolean;
  reducedMotion: boolean;
  onLoad: () => void;
  onError: () => void;
}
const FlipPage = React.forwardRef<HTMLDivElement, FlipPageProps>(
  ({ src, alt, loaded, error, eager, reducedMotion, onLoad, onError }, ref) => {
    // If the <img> has already completed by the time React attaches its ref (e.g. served from
    // disk cache), the onLoad event may not fire. Reconcile via the `complete` property.
    const imgRef = useRef<HTMLImageElement>(null);
    useEffect(() => {
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0 && !loaded) onLoad();
    }, [src, loaded, onLoad]);
    return (
      <div ref={ref} style={{ position: 'relative', overflow: 'hidden', backgroundColor: '#fff', backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
        {!loaded && !error && (
          <div
            className={reducedMotion ? undefined : 'flipbook-shimmer'}
            style={{ position: 'absolute', inset: 0, backgroundColor: '#e8e8e8' }}
          />
        )}
        {error && (
          <div
            style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgb(var(--color-text-secondary))', fontSize: '0.8rem',
              textAlign: 'center', padding: '1rem',
            }}
          >
            Failed to load page
          </div>
        )}
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={onLoad}
          onError={onError}
          style={{
            width: '100%', height: '100%', objectFit: 'fill', display: 'block',
            opacity: loaded ? 1 : 0,
            transition: reducedMotion ? 'none' : 'opacity 200ms ease-out',
          }}
        />
      </div>
    );
  },
);
FlipPage.displayName = 'FlipPage';

const BTN: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgb(var(--color-text-link) / 0.4)',
  color: 'rgb(var(--color-text-link))',
  borderRadius: '4px',
  padding: '0.25rem 0.875rem',
  fontSize: '1rem',
  lineHeight: '1.5',
  transition: 'border-color 150ms, opacity 150ms',
};

function Lightbox({
  page, label, onClose, onPrev, onNext,
}: {
  page: FlipbookPage;
  label: string | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const navBtn: React.CSSProperties = {
    background: 'rgb(0 0 0 / 0.4)',
    border: '1px solid rgb(255 255 255 / 0.4)',
    color: 'white',
    borderRadius: '999px',
    width: '2.75rem',
    height: '2.75rem',
    fontSize: '1.25rem',
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
  return (
    <div
      role="dialog" aria-modal="true" aria-label={page.alt}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgb(0 0 0 / 0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 1000, padding: '2rem',
      }}
    >
      <img
        src={page.src} alt={page.alt}
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 'min(90vw, 1200px)', maxHeight: '90vh', objectFit: 'contain', display: 'block' }}
      />
      <button
        type="button" onClick={onClose} aria-label="Close"
        style={{ ...navBtn, position: 'absolute', top: '1rem', right: '1rem' }}
      >×</button>
      {onPrev && (
        <button
          type="button" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous page"
          style={{ ...navBtn, position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
        >←</button>
      )}
      {onNext && (
        <button
          type="button" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next page"
          style={{ ...navBtn, position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)' }}
        >→</button>
      )}
      {label && (
        <div style={{
          position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)',
          color: 'white', fontSize: '0.875rem', background: 'rgb(0 0 0 / 0.4)',
          padding: '0.25rem 0.75rem', borderRadius: '999px',
        }}>{label}</div>
      )}
    </div>
  );
}

function Controls({
  label, onPrev, onNext, disablePrev, disableNext,
}: {
  label: string | null; onPrev: () => void; onNext: () => void;
  disablePrev: boolean; disableNext: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
      <button
        onClick={onPrev} disabled={disablePrev} aria-label="Previous page"
        style={{ ...BTN, opacity: disablePrev ? 0.35 : 1, cursor: disablePrev ? 'default' : 'pointer' }}
      >←</button>
      {label !== null && (
        <span style={{ color: 'rgb(var(--color-text-secondary))', fontSize: '0.875rem', minWidth: '5.5rem', textAlign: 'center' }}>
          {label}
        </span>
      )}
      <button
        onClick={onNext} disabled={disableNext} aria-label="Next page"
        style={{ ...BTN, opacity: disableNext ? 0.35 : 1, cursor: disableNext ? 'default' : 'pointer' }}
      >→</button>
    </div>
  );
}

export default function FlipbookPDF({
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

  // Block vertical-scroll gestures from triggering page flips.
  // touch-action:pan-y prevents touchmove from firing for vertical gestures (browser owns
  // the scroll), but touchstart/touchend still fire — react-pageflip interprets that as a
  // tap/flip. Capture-phase touchend intercepts before react-pageflip's bubble handlers.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startX = 0, startY = 0;
    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      startX = t.clientX;
      startY = t.clientY;
    };
    const onEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);
      if (dy > dx) e.stopPropagation();
    };
    el.addEventListener('touchstart', onStart, { capture: true, passive: true });
    el.addEventListener('touchend', onEnd, { capture: true, passive: true });
    return () => {
      el.removeEventListener('touchstart', onStart, { capture: true });
      el.removeEventListener('touchend', onEnd, { capture: true, passive: true } as EventListenerOptions);
    };
  }, []);

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

  // Progressive preloading: as currentPage advances, force-fetch nearby pages so they're
  // ready by the time the user flips. Browsers cache by URL, so calling `new Image()` here
  // hydrates the cache even if the same <img> below is `loading="lazy"`.
  const preloadedRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    for (let offset = -2; offset <= 4; offset++) {
      const i = currentPage + offset;
      const page = pages[i];
      if (!page) continue;
      if (preloadedRef.current.has(i)) continue;
      preloadedRef.current.add(i);
      const img = new Image();
      img.src = page.src;
    }
  }, [currentPage, pages]);

  // ── Loading skeleton (before ResizeObserver fires) ────────────────────────
  if (containerWidth === 0 || pageWidth === 0) {
    return (
      <div
        ref={containerRef}
        style={{
          width: '100%',
          // preview a half-width page at the correct aspect while we wait
          paddingBottom: `${(1 / aspectRatio) * 50}%`,
          backgroundColor: 'rgb(var(--color-text) / 0.06)',
          borderRadius: '4px',
        }}
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
      style={{ outline: 'none' }} className="flipbook-root">
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
      <div style={{
        padding: `${BED_PAD}px`,
        border: '1px solid rgb(var(--color-text) / 0.2)',
        borderRadius: '4px',
      }}>
      {view === 'grid' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(${isTwoPage ? 120 : 90}px, 1fr))`,
          gap: '8px',
        }}>
          {pages.map((page, i) => (
            <button
              key={page.src}
              type="button"
              onClick={() => setLightboxIdx(i)}
              aria-label={`View ${pageLabel(i) ?? page.alt}`}
              style={{
                padding: 0, border: '1px solid rgb(var(--color-text) / 0.15)',
                background: '#fff', cursor: 'pointer',
                aspectRatio: `${aspectRatio}`, position: 'relative', overflow: 'hidden',
                borderRadius: '2px',
              }}
            >
              <img
                src={page.src} alt={page.alt}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </button>
          ))}
        </div>
      ) : (
      <div style={{ touchAction: 'pan-y' }}>
        <div style={{ display: 'flex', justifyContent: 'center', transform: `translateX(${shiftX}px)`, transition: reducedMotion ? 'none' : 'transform 400ms ease' }}>
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
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}>
        <button
          type="button"
          onClick={() => setView((v) => (v === 'book' ? 'grid' : 'book'))}
          style={{
            background: 'transparent', border: 'none', padding: 0,
            color: 'rgb(var(--color-text-link))', fontSize: '0.75rem',
            cursor: 'pointer', textDecoration: 'underline', userSelect: 'none',
          }}
        >
          {view === 'book' ? 'View all pages' : 'Back to book'}
        </button>
      </div>
      {lightboxIdx !== null && pages[lightboxIdx] && (
        <Lightbox
          page={pages[lightboxIdx]}
          label={pageLabel(lightboxIdx)}
          onClose={() => setLightboxIdx(null)}
          onPrev={lightboxIdx > 0 ? () => setLightboxIdx(lightboxIdx - 1) : undefined}
          onNext={lightboxIdx < pages.length - 1 ? () => setLightboxIdx(lightboxIdx + 1) : undefined}
        />
      )}
    </div>
  );
}
