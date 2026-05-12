/*
 * FlipbookPDF — image-based flipbook viewer using react-pageflip.
 *
 * IMPORTANT: always hydrate with client:only="react" — this component cannot SSR.
 *
 * Passing images from Astro (getImage pattern):
 *
 *   // In BookLayout.astro (runs at build time, not in the browser):
 *   import { getImage } from 'astro:assets';
 *   import type { ImageMetadata } from 'astro';
 *
 *   const raw = import.meta.glob<ImageMetadata>('../assets/books/**\/*.webp', {
 *     eager: true,
 *     import: 'default',
 *   });
 *   const pageUrls = await Promise.all(
 *     Object.entries(raw)
 *       .filter(([p]) => p.includes(`/books/${book.slug}/`))
 *       .sort(([a], [b]) => a.localeCompare(b))
 *       .map(async ([, img]) => (await getImage({ src: img })).src),
 *   );
 *
 *   // In the template:
 *   <FlipbookPDF pages={pageUrls} alt="Book title" client:only="react" />
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';

export interface FlipbookProps {
  pages: string[];
  alt: string;
  pageAlts?: string[];
  startPage?: number;
  /** width / height ratio of one page — default 3/4 (portrait) */
  aspectRatio?: number;
}

// react-pageflip requires page children to be forwardRef components.
// The outer div is the DOM element the flip engine transforms.
const FlipPage = React.forwardRef<
  HTMLDivElement,
  { src: string; alt: string; loaded: boolean; error: boolean; onLoad: () => void; onError: () => void }
>(({ src, alt, loaded, error, onLoad, onError }, ref) => (
  <div ref={ref} style={{ position: 'relative', overflow: 'hidden', backgroundColor: 'rgb(var(--color-bg))' }}>
    {!loaded && !error && (
      <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgb(var(--color-text) / 0.06)' }} />
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
      src={src}
      alt={alt}
      onLoad={onLoad}
      onError={onError}
      style={{
        width: '100%', height: '100%', objectFit: 'fill', display: 'block',
        opacity: loaded ? 1 : 0, transition: 'opacity 0.2s',
      }}
    />
  </div>
));
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

function Controls({
  label, onPrev, onNext, disablePrev, disableNext,
}: {
  label: string; onPrev: () => void; onNext: () => void;
  disablePrev: boolean; disableNext: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
      <button
        onClick={onPrev} disabled={disablePrev} aria-label="Previous page"
        style={{ ...BTN, opacity: disablePrev ? 0.35 : 1, cursor: disablePrev ? 'default' : 'pointer' }}
      >←</button>
      <span style={{ color: 'rgb(var(--color-text-secondary))', fontSize: '0.875rem', minWidth: '5.5rem', textAlign: 'center' }}>
        {label}
      </span>
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
  pageAlts = [],
  startPage = 0,
  aspectRatio = 3 / 4,
}: FlipbookProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // react-pageflip types its own ref as `any`
  const bookRef = useRef<any>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [currentPage, setCurrentPage] = useState(startPage);
  const [loadedSet, setLoadedSet] = useState<Set<number>>(new Set());
  const [errorSet, setErrorSet] = useState<Set<number>>(new Set());
  const [reducedMotion, setReducedMotion] = useState(false);
  const [fadePage, setFadePage] = useState(startPage);

  const isTwoPage = containerWidth >= 768;
  const pageWidth = isTwoPage ? Math.floor(containerWidth / 2) : containerWidth;
  const pageHeight = pageWidth > 0 ? Math.floor(pageWidth / aspectRatio) : 0;

  // ResizeObserver — measure the container, not the window
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver((entries) => setContainerWidth(entries[0].contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
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
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
      e.preventDefault();
      if (reducedMotion) {
        const totalSpreads = isTwoPage ? Math.ceil(pages.length / 2) : pages.length;
        setFadePage((p) => {
          if (e.key === 'ArrowRight') return Math.min(p + 1, totalSpreads - 1);
          if (e.key === 'ArrowLeft') return Math.max(p - 1, 0);
          if (e.key === 'Home') return 0;
          return totalSpreads - 1;
        });
      } else {
        const pf = bookRef.current?.pageFlip?.();
        if (!pf) return;
        if (e.key === 'ArrowRight') pf.flipNext();
        else if (e.key === 'ArrowLeft') pf.flipPrev();
        else if (e.key === 'Home') pf.flip(0);
        else pf.flip(pages.length - 1);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [pages.length, reducedMotion, isTwoPage]);

  const markLoaded = useCallback((i: number) => setLoadedSet((p) => new Set([...p, i])), []);
  const markError  = useCallback((i: number) => setErrorSet((p)  => new Set([...p, i])), []);

  // ── Reduced-motion: cross-fade single-spread viewer ───────────────────────
  if (reducedMotion) {
    const totalSpreads = isTwoPage ? Math.ceil(pages.length / 2) : pages.length;
    const spread = isTwoPage
      ? [fadePage * 2, fadePage * 2 + 1].filter((i) => i < pages.length)
      : [fadePage];

    return (
      <div ref={containerRef} role="region" aria-label={alt} tabIndex={-1} style={{ outline: 'none' }}>
        <span className="sr-only" aria-live="polite">
          {isTwoPage
            ? `Pages ${fadePage * 2 + 1}–${Math.min(fadePage * 2 + 2, pages.length)} of ${pages.length}`
            : `Page ${fadePage + 1} of ${pages.length}`}
        </span>
        <div style={{ display: 'flex', gap: '2px', width: '100%' }}>
          {spread.map((idx) => (
            <img
              key={idx}
              src={pages[idx]}
              alt={pageAlts[idx] ?? `${alt}, page ${idx + 1}`}
              style={{ flex: 1, width: 0, display: 'block', objectFit: 'cover', borderRadius: '2px', transition: 'opacity 300ms ease' }}
            />
          ))}
        </div>
        <Controls
          label={`${fadePage + 1} / ${totalSpreads}`}
          onPrev={() => setFadePage((p) => Math.max(p - 1, 0))}
          onNext={() => setFadePage((p) => Math.min(p + 1, totalSpreads - 1))}
          disablePrev={fadePage === 0}
          disableNext={fadePage === totalSpreads - 1}
        />
        <details style={{ marginTop: '1rem' }}>
          <summary
            style={{ color: 'rgb(var(--color-text-link))', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none' }}
          >
            View all pages
          </summary>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '0.75rem' }}>
            {pages.map((src, i) => (
              <img key={i} src={src} alt={pageAlts[i] ?? `${alt}, page ${i + 1}`}
                style={{ width: '80px', height: 'auto', borderRadius: '2px' }} />
            ))}
          </div>
        </details>
      </div>
    );
  }

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

  const displayLabel =
    currentPage === 0
      ? 'Front Cover'
      : currentPage === pages.length - 1
        ? 'Back Cover'
        : isTwoPage
          ? `${currentPage + 1}–${Math.min(currentPage + 2, pages.length - 1)} / ${pages.length - 2}`
          : `${currentPage} / ${pages.length - 2}`;

  return (
    <div ref={containerRef} role="region" aria-label={alt} tabIndex={-1} style={{ outline: 'none' }}>
      <span className="sr-only" aria-live="polite">{displayLabel}</span>
      <div style={{ overflow: 'hidden', touchAction: 'pan-y' }}>
        <div style={{ display: 'flex', justifyContent: 'center', transform: `translateX(${shiftX}px)`, transition: `transform 400ms ease` }}>
        <HTMLFlipBook
          key={isTwoPage ? 'two' : 'one'}
          ref={bookRef}
          width={pageWidth}
          height={pageHeight}
          size="fixed"
          startPage={currentPage}
          usePortrait={!isTwoPage}
          drawShadow={true}
          flippingTime={FLIP_MS}
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
          style={{}}
          onFlip={(e: any) => setCurrentPage(e.data)}
        >
          {pages.map((src, i) => (
            <FlipPage
              key={src}
              src={src}
              alt={pageAlts[i] ?? `${alt}, page ${i + 1}`}
              loaded={loadedSet.has(i)}
              error={errorSet.has(i)}
              onLoad={() => markLoaded(i)}
              onError={() => markError(i)}
            />
          ))}
        </HTMLFlipBook>
        </div>
      </div>
      <Controls
        label={displayLabel}
        onPrev={() => bookRef.current?.pageFlip?.()?.flipPrev()}
        onNext={() => bookRef.current?.pageFlip?.()?.flipNext()}
        disablePrev={currentPage === 0}
        disableNext={currentPage >= pages.length - (isTwoPage ? 2 : 1)}
      />
    </div>
  );
}
