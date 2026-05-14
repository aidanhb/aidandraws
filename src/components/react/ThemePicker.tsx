import { useState, useEffect, useRef, useCallback } from 'react';
import { THEMES, DEFAULT_THEME, STORAGE_KEY, type ThemeId } from '../../lib/themes';

interface Props {
  portraits: Record<string, string>;
}

export default function ThemePicker({ portraits }: Props) {
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<ThemeId>(DEFAULT_THEME);
  const [pastHero, setPastHero] = useState(false);
  // Updated only by user-driven `select` calls — kept separate from `current` so the initial
  // localStorage sync on mount doesn't fire a spurious "Theme changed to…" announcement.
  const [announcement, setAnnouncement] = useState('');
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const sentinel = document.getElementById('portfolio');
    if (!sentinel) { setPastHero(true); return; }
    const check = () => setPastHero(sentinel.getBoundingClientRect().top < window.innerHeight * 0.9);
    window.addEventListener('scroll', check, { passive: true });
    check();
    return () => window.removeEventListener('scroll', check);
  }, []);

  // Sync with whatever the inline script already applied
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const valid = THEMES.find(t => t.id === saved);
      if (valid) setCurrent(valid.id);
    } catch {}
  }, []);

  const select = useCallback((id: ThemeId) => {
    setCurrent(id);
    document.documentElement.setAttribute('data-theme', id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch {}
    const theme = THEMES.find(t => t.id === id);
    if (theme) setAnnouncement(`Theme changed to ${theme.label}`);
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  // Focus the currently-selected menuitem (or first) when the menu opens.
  useEffect(() => {
    if (!open) return;
    const currentIdx = THEMES.findIndex(t => t.id === current);
    const initialIdx = currentIdx >= 0 ? currentIdx : 0;
    // rAF: wait for layout so the menuitem is positioned before we focus it.
    const raf = requestAnimationFrame(() => itemRefs.current[initialIdx]?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open, current]);

  // Roving navigation between menuitems. Arrow keys / Home / End move focus; Tab is trapped
  // inside the menu (wraps end-to-end) so keyboard users explicitly Escape or Enter to exit.
  const onItemKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const last = THEMES.length - 1;
    let nextIdx: number | null = null;
    switch (e.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        nextIdx = idx === last ? 0 : idx + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        nextIdx = idx === 0 ? last : idx - 1;
        break;
      case 'Home':
        nextIdx = 0;
        break;
      case 'End':
        nextIdx = last;
        break;
      case 'Tab':
        nextIdx = e.shiftKey
          ? (idx === 0 ? last : idx - 1)
          : (idx === last ? 0 : idx + 1);
        break;
    }
    if (nextIdx !== null) {
      e.preventDefault();
      itemRefs.current[nextIdx]?.focus();
    }
  };

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (
        !menuRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <span className="sr-only" aria-live="polite">{announcement}</span>
      {/* Trigger */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        aria-label="Choose theme"
        aria-expanded={open}
        aria-haspopup="true"
        className={[
          'rounded-full border flex items-center justify-center shadow-lg overflow-hidden transition-all duration-300',
          pastHero
            ? 'w-24 h-24 border-white/30 hover:border-white/60 hover:scale-110 p-2'
            : 'w-10 h-10 bg-bg border-white/20 text-text/60 hover:text-text hover:border-white/40',
        ].join(' ')}
      >
        {pastHero && portraits[current] ? (
          <img
            src={portraits[current]}
            alt=""
            aria-hidden="true"
            className="w-full h-full object-cover"
          />
        ) : (
          <PaletteIcon />
        )}
      </button>

      {/* Menu */}
      <div
        ref={menuRef}
        role="menu"
        aria-label="Theme options"
        className={[
          'absolute bottom-full right-0 mb-3 w-[300px]',
          'bg-bg/50 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl p-3',
          'motion-safe:transition-all motion-safe:duration-150',
          open ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 translate-y-2 pointer-events-none',
        ].join(' ')}
      >
        <p className="text-[0.65rem] font-heading text-text uppercase tracking-widest mb-3 px-1">
          Choose a Theme
        </p>

        <div className="grid grid-cols-4 gap-1.5">
          {THEMES.map((theme, idx) => {
            const isSelected = current === theme.id;
            const portrait = portraits[theme.id];
            return (
              <button
                key={theme.id}
                ref={(el) => { itemRefs.current[idx] = el; }}
                role="menuitem"
                tabIndex={open ? 0 : -1}
                onClick={() => select(theme.id)}
                onKeyDown={(e) => onItemKeyDown(e, idx)}
                className={[
                  'flex flex-col items-center gap-1 p-1.5 rounded-lg transition-colors text-left',
                  isSelected
                    ? 'ring-1 ring-text-link bg-white/10'
                    : 'hover:bg-white/5',
                ].join(' ')}
              >
                {/* data-theme scopes the CSS variables so bg-bg / bg-text / bg-text-title / bg-text-link
                    inside use this theme's colors, not the site's current theme. */}
                <div data-theme={theme.id} className="w-full bg-bg rounded overflow-hidden">
                  <div className="flex gap-1 justify-center py-1.5" aria-hidden="true">
                    <span className="w-1.5 h-1.5 rounded-sm bg-text" />
                    <span className="w-1.5 h-1.5 rounded-sm bg-text-title" />
                    <span className="w-1.5 h-1.5 rounded-sm bg-text-link" />
                  </div>
                  <div className="w-full aspect-square">
                    {portrait ? (
                      <img
                        src={portrait}
                        alt=""
                        aria-hidden="true"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text/30">
                        <PaletteIcon size={20} />
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[0.6rem] font-body uppercase tracking-wide text-text/70 w-full text-center leading-tight">
                  {theme.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PaletteIcon({ size = 18 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" stroke="none" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" stroke="none" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" stroke="none" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}
