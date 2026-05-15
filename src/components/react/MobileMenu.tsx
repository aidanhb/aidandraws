import { useEffect, useRef, useState } from 'react';

interface Link {
  label: string;
  labelHtml?: string;
  href: string;
  highlight?: boolean;
}

interface Props {
  links: Link[];
}

const MENU_ID = 'mobile-menu';

export default function MobileMenu({ links }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // On open, move focus into the first link so keyboard / SR users land in the menu.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => firstLinkRef.current?.focus());
    return () => cancelAnimationFrame(raf);
  }, [open]);

  // Escape closes the menu and returns focus to the toggle. Mobile touch users never trigger
  // this; it's for narrow-viewport desktop browsing, paired keyboards, and a11y tooling.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls={MENU_ID}
        className="p-1 text-text/70 hover:text-text transition-colors"
      >
        {open ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <line x1="3" y1="7" x2="21" y2="7" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="17" x2="21" y2="17" />
          </svg>
        )}
      </button>

      <nav
        id={MENU_ID}
        aria-label="Mobile navigation"
        className={`absolute top-full left-0 right-0 bg-bg/95 backdrop-blur-md border-b border-white/10 transition-all duration-200 ${
          open ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'
        }`}
      >
        <ul className="flex flex-col px-6 py-4 gap-5 list-none m-0">
          {links.map((link, idx) => (
            <li key={link.href}>
              <a
                href={link.href}
                ref={idx === 0 ? firstLinkRef : undefined}
                tabIndex={open ? 0 : -1}
                onClick={() => setOpen(false)}
                aria-label={link.labelHtml ? link.label : undefined}
                className={link.highlight
                  ? 'inline-flex items-center tracking-wider no-underline px-2 py-0.5 rounded-full bg-accent/20 text-accent hover:bg-accent/30 transition-colors'
                  : 'inline-flex items-center px-2 py-0.5 text-text uppercase tracking-wider no-underline hover:text-text-link transition-colors'
                }
              >
                {link.labelHtml
                  ? <span aria-hidden="true" className="block h-5 [&>svg]:h-full [&>svg]:w-auto" dangerouslySetInnerHTML={{ __html: link.labelHtml }} />
                  : link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
