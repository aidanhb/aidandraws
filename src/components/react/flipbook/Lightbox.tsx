import { useEffect, useRef } from 'react';
import type { FlipbookPage } from '../../../lib/flipbook-types';

interface LightboxProps {
  page: FlipbookPage;
  label: string | null;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}

const NAV_BTN =
  'flex items-center justify-center w-11 h-11 rounded-full bg-black/40 border border-white/40 ' +
  'text-white text-xl leading-none cursor-pointer';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]),[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

export default function Lightbox({ page, label, onClose, onPrev, onNext }: LightboxProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus management. Lightbox is mounted on open and unmounted on close, so this useEffect
  // doubles as open/close hooks.
  useEffect(() => {
    // Save the element that opened the lightbox so we can return focus on close.
    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the dialog. The container (tabindex=-1) is the focus target — SRs then
    // announce the dialog's aria-label (the page alt) before the user navigates.
    dialogRef.current?.focus();

    // Trap Tab inside the dialog: wrap from last → first and first → last. Re-query the
    // focusable set on each keypress because the Prev/Next buttons render conditionally.
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const focusables = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!first || !last) {
        // Nothing focusable — keep focus on the dialog container itself.
        e.preventDefault();
        dialog.focus();
        return;
      }
      const active = document.activeElement;
      // If focus has escaped the dialog (or sits on the container itself), bring it back.
      if (!dialog.contains(active) || active === dialog) {
        e.preventDefault();
        (e.shiftKey ? last : first).focus();
        return;
      }
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      // Restore focus to whatever was focused before the lightbox opened.
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      ref={dialogRef}
      role="dialog" aria-modal="true" aria-label={page.alt}
      tabIndex={-1}
      onClick={onClose}
      className="fixed inset-0 z-1000 flex items-center justify-center bg-black/85 p-8 outline-none"
    >
      <img
        src={page.src} alt={page.alt}
        onClick={(e) => e.stopPropagation()}
        className="block object-contain max-w-[min(90vw,1200px)] max-h-[90vh]"
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
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 text-white text-sm px-3 py-1 rounded-full">
          {label}
        </div>
      )}
    </div>
  );
}
