import { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';

// useLayoutEffect warns when run on the server. Astro SSRs this component, so fall back to
// useEffect on the server side — the restore only needs to run on the client anyway.
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface Slide {
  src: string;
  alt: string;
  title: string;
  slug: string;
  objectPosition?: string;
}

interface Props {
  slides: Slide[];
}

const STORAGE_KEY = 'hero-carousel-index';

export default function HeroCarousel({ slides }: Props) {
  const [current, setCurrent] = useState(0);
  // Skip the opacity transition on the very first paint after mount — otherwise restoring the
  // saved index (e.g. after browser back from a painting page) fades from slide 0 to the
  // restored slide, which looks like a jitter.
  const [animate, setAnimate] = useState(false);
  // Hide the entire carousel until React has restored state. SSR paints slide 0 visible; without
  // this gate, the browser shows slide 0 for a frame on back-nav before useLayoutEffect runs.
  const [ready, setReady] = useState(false);

  // Restore last-viewed slide (e.g. when returning via back button and bfcache didn't preserve
  // React state). Must run before paint — useEffect would let the browser show slide 0 first
  // and then jump to the stored slide, which is the "blink" we're avoiding.
  useIsoLayoutEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const idx = parseInt(stored, 10);
        if (Number.isFinite(idx) && idx >= 0 && idx < slides.length) setCurrent(idx);
      }
    } catch {}
    setReady(true);
    const raf = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist on change.
  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, String(current)); } catch {}
  }, [current]);

  const prev = useCallback(() => {
    setCurrent((i) => (i - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const next = useCallback(() => {
    setCurrent((i) => (i + 1) % slides.length);
  }, [slides.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [prev, next]);

  // Swipe handling — track horizontal drag; cancel the wrapping <a>'s click if the gesture
  // was a swipe rather than a tap.
  const startX = useRef(0);
  const startY = useRef(0);
  const isSwipe = useRef(false);

  const onTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    isSwipe.current = false;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;
    if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
      isSwipe.current = true;
    }
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!isSwipe.current) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) next();
      else prev();
    }
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (isSwipe.current) {
      e.preventDefault();
      e.stopPropagation();
      isSwipe.current = false;
    }
  };

  if (slides.length === 0) return null;

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{
        touchAction: 'pan-y',
        opacity: ready ? 1 : 0,
        transition: ready ? 'opacity 250ms ease-out' : 'none',
      }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClickCapture={onClickCapture}
    >
      {slides.map((slide, i) => (
        <a
          key={slide.slug}
          href={`/${slide.slug}`}
          className={`absolute inset-0 ${animate ? 'transition-opacity duration-700' : ''} ${
            i === current ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          tabIndex={i === current ? 0 : -1}
          aria-hidden={i !== current ? true : undefined}
        >
          <img
            src={slide.src}
            alt={slide.alt}
            className="w-full h-full object-cover"
            style={slide.objectPosition ? { objectPosition: slide.objectPosition } : undefined}
          />
        </a>
      ))}

      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous painting"
            className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/50 transition-colors"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="13.5 18 7.5 12 13.5 6" />
            </svg>
          </button>

          <button
            onClick={next}
            aria-label="Next painting"
            className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/50 text-white/70 hover:text-white hover:bg-black/50 transition-colors"
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-2.5 bg-black/50 rounded-full px-3 py-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                aria-label={`Go to painting ${i + 1}`}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === current ? 'bg-white' : 'bg-white/35'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
