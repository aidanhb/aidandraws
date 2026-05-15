import { useCallback, useEffect, useRef, useState } from 'react';

interface LightboxProps {
  src: string;
  alt: string;
  label?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

const NAV_BTN =
  'flex items-center justify-center w-11 h-11 rounded-full bg-black/40 border border-white/40 ' +
  'text-white text-xl leading-none cursor-pointer';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const ZOOM_STEP = 1.12;

export default function Lightbox({ src, alt, label, onClose, onPrev, onNext }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Zoom/pan — refs mirror state so non-React event handlers always read current values.
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  const applyTransform = useCallback((s: number, o: { x: number; y: number }) => {
    const clamped = Math.min(Math.max(s, MIN_SCALE), MAX_SCALE);
    const next = clamped === MIN_SCALE ? { x: 0, y: 0 } : o;
    scaleRef.current = clamped;
    offsetRef.current = next;
    setScale(clamped);
    setOffset(next);
  }, []);

  // Zoom centered on a viewport point (cx, cy).
  // Uses window center as the untransformed image center (valid because the lightbox
  // uses flex centering, placing the image exactly at the viewport midpoint).
  const zoomAt = useCallback((clientX: number, clientY: number, newScale: number) => {
    const s = scaleRef.current;
    const { x: ox, y: oy } = offsetRef.current;
    const vcx = window.innerWidth / 2;
    const vcy = window.innerHeight / 2;
    const ratio = Math.min(Math.max(newScale, MIN_SCALE), MAX_SCALE) / s;
    applyTransform(newScale, {
      x: (clientX - vcx) * (1 - ratio) + ox * ratio,
      y: (clientY - vcy) * (1 - ratio) + oy * ratio,
    });
  }, [applyTransform]);

  // Reset when the image changes (prev/next navigation).
  useEffect(() => {
    applyTransform(1, { x: 0, y: 0 });
  }, [src, applyTransform]);

  // Wheel zoom — must be a non-passive DOM listener to call preventDefault.
  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
      zoomAt(e.clientX, e.clientY, scaleRef.current * factor);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  // ── Mouse drag ────────────────────────────────────────────────────────
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    drag.current = { x: e.clientX, y: e.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y };
    setIsDragging(true);
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!drag.current) return;
    applyTransform(scaleRef.current, {
      x: drag.current.ox + e.clientX - drag.current.x,
      y: drag.current.oy + e.clientY - drag.current.y,
    });
  };

  const onMouseUp = () => {
    drag.current = null;
    setIsDragging(false);
  };

  // Double-click: zoom in to 2.5× at cursor, or reset if already zoomed.
  const onDblClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    scaleRef.current > 1 ? applyTransform(1, { x: 0, y: 0 }) : zoomAt(e.clientX, e.clientY, 2.5);
  };

  // ── Pinch / touch pan ─────────────────────────────────────────────────
  const pinch = useRef<{ dist: number; scale: number; cx: number; cy: number } | null>(null);
  const touchDrag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const [a, b] = [e.touches[0], e.touches[1]];
      pinch.current = {
        dist: Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY),
        scale: scaleRef.current,
        cx: (a.clientX + b.clientX) / 2,
        cy: (a.clientY + b.clientY) / 2,
      };
      touchDrag.current = null;
    } else if (e.touches.length === 1) {
      const t = e.touches[0];
      touchDrag.current = { x: t.clientX, y: t.clientY, ox: offsetRef.current.x, oy: offsetRef.current.y };
      pinch.current = null;
    }
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinch.current) {
      const [a, b] = [e.touches[0], e.touches[1]];
      const dist = Math.hypot(b.clientX - a.clientX, b.clientY - a.clientY);
      zoomAt(pinch.current.cx, pinch.current.cy, pinch.current.scale * (dist / pinch.current.dist));
    } else if (e.touches.length === 1 && touchDrag.current) {
      const t = e.touches[0];
      applyTransform(scaleRef.current, {
        x: touchDrag.current.ox + t.clientX - touchDrag.current.x,
        y: touchDrag.current.oy + t.clientY - touchDrag.current.y,
      });
    }
  };

  const onTouchEnd = () => {
    pinch.current = null;
    touchDrag.current = null;
  };

  // ── Focus trap ────────────────────────────────────────────────────────
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) { e.preventDefault(); dialog.focus(); return; }
      const active = document.activeElement;
      if (!dialog.contains(active) || active === dialog) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, []);

  const isZoomed = scale > 1;

  return (
    <div
      ref={dialogRef}
      role="dialog" aria-modal="true" aria-label={alt}
      tabIndex={-1}
      onClick={onClose}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/85 p-8 outline-none select-none"
      style={{ cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : undefined }}
    >
      <img
        src={src} alt={alt}
        onClick={(e) => e.stopPropagation()}
        onDoubleClick={onDblClick}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        draggable={false}
        className="block object-contain max-w-[min(90vw,1200px)] max-h-[90vh]"
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
          cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : undefined,
          willChange: isZoomed ? 'transform' : undefined,
          touchAction: 'none',
          userSelect: 'none',
        }}
      />
      <button
        type="button" onClick={onClose} aria-label="Close"
        className={`${NAV_BTN} absolute top-4 right-4`}
      >×</button>
      {onPrev && (
        <button
          type="button" onClick={(e) => { e.stopPropagation(); onPrev(); }} aria-label="Previous page"
          className={`${NAV_BTN} absolute left-4 top-1/2 -translate-y-1/2`}
        >←</button>
      )}
      {onNext && (
        <button
          type="button" onClick={(e) => { e.stopPropagation(); onNext(); }} aria-label="Next page"
          className={`${NAV_BTN} absolute right-4 top-1/2 -translate-y-1/2`}
        >→</button>
      )}
      {label && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white text-sm px-3 py-1 rounded-full pointer-events-none">
          {label}
        </div>
      )}
    </div>
  );
}
