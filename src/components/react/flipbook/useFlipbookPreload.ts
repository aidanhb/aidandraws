import { useEffect, useRef } from 'react';
import type { FlipbookPage } from '../../../lib/flipbook-types';

/**
 * Progressive preloading. As `currentPage` advances, force-fetch pages within an offset window
 * around it so they're ready by the time the user flips. Browsers cache by URL, so calling
 * `new Image()` here hydrates the cache even if the corresponding `<img>` is `loading="lazy"`.
 */
export function useFlipbookPreload(currentPage: number, pages: FlipbookPage[]) {
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
}
