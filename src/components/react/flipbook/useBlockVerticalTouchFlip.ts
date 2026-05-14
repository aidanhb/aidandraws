import { useEffect, type RefObject } from 'react';

/**
 * Block vertical-scroll gestures from triggering page flips.
 *
 * `touch-action: pan-y` prevents `touchmove` from firing for vertical gestures (the browser
 * owns the scroll), but `touchstart` / `touchend` still fire — react-pageflip interprets that
 * pair as a tap and flips the page. Capture-phase `touchend` here intercepts before
 * react-pageflip's bubble-phase handlers and stops propagation when the gesture was vertical.
 */
export function useBlockVerticalTouchFlip(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
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
  }, [ref]);
}
