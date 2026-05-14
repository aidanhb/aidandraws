/**
 * Theme-tinted favicon.
 *
 * Rasterizes a logo SVG to a PNG via canvas, filling each `<path>` with the current value
 * of `--color-text`, and installs the result as the page favicon. A MutationObserver on
 * `data-theme` re-runs the pipeline whenever the user switches themes.
 *
 * Why this is more involved than it looks:
 *
 * - Tailwind v3's `rgb(var(--color) / <alpha-value>)` pattern requires CSS variables to be
 *   bare RGB triplets (e.g. `"255 136 184"`). Canvas's `fillStyle` and SVG's `fill`
 *   attribute don't accept the bare form, so we wrap in legacy comma `rgb(R, G, B)`.
 * - The Image → Canvas SVG rasterizer doesn't reliably inherit `fill` from the root `<svg>`,
 *   so we apply `fill` directly to every `<path>`.
 * - `Image()` needs intrinsic dimensions to rasterize reliably, so we strip and re-set
 *   `width` / `height` on the root `<svg>`.
 * - Chrome caches favicons by `<link>` element identity, so we remove + recreate the link
 *   on every update.
 */

const FAVICON_SIZE = 64;

function escapeAttr(s: string): string {
  return s.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Read `--color-text` and normalize it to a value canvas/SVG can use. Returns null if the
 *  variable hasn't resolved yet (Vite injects styles via JS in dev — they may not be applied
 *  on the first frame). */
function readThemeTextColor(): string | null {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-text')
    .trim();
  if (!raw) return null;
  return /^[\d\s.]+$/.test(raw)
    ? `rgb(${raw.split(/\s+/).join(', ')})`
    : raw;
}

/** Inject explicit width/height + per-path fill into the source SVG. */
function tintLogo(logoRaw: string, color: string): string {
  const safe = escapeAttr(color);
  return logoRaw
    .replace(/^<\?xml[^>]*\?>\s*/, '')
    .replace(/<svg\b([^>]*)>/, (_, attrs) => {
      const stripped = (attrs as string)
        .replace(/\s+fill="[^"]*"/, '')
        .replace(/\s+width="[^"]*"/, '')
        .replace(/\s+height="[^"]*"/, '');
      return `<svg${stripped} width="${FAVICON_SIZE}" height="${FAVICON_SIZE}">`;
    })
    .replace(/<path\b([^>]*?)\s*\/?>/g, (_, attrs) => {
      const stripped = (attrs as string).replace(/\s+fill="[^"]*"/, '');
      return `<path${stripped} fill="${safe}"/>`;
    });
}

/** Rasterize an SVG string to a PNG data URL via an offscreen canvas, then install it as
 *  the page favicon. */
function setFaviconFromSvg(svg: string): void {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = FAVICON_SIZE;
    canvas.height = FAVICON_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, 0, 0, FAVICON_SIZE, FAVICON_SIZE);
    const href = canvas.toDataURL('image/png');
    document.querySelectorAll('link[rel*="icon"]').forEach((l) => l.remove());
    const link = document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/png';
    link.href = href;
    document.head.appendChild(link);
  };
  img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
}

/**
 * Install a theme-tinted favicon. Runs once on load (or on `DOMContentLoaded` if invoked
 * during HTML parsing) and re-runs whenever `data-theme` changes on `<html>`.
 */
export function installThemedFavicon(logoRaw: string): void {
  const update = () => {
    const color = readThemeTextColor();
    if (color === null) {
      // CSS variable not yet resolved — retry next frame.
      requestAnimationFrame(update);
      return;
    }
    setFaviconFromSvg(tintLogo(logoRaw, color));
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', update);
  } else {
    update();
  }
  new MutationObserver(update).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });
}
