const BTN_CLASS =
  'bg-transparent border border-text-link/40 text-text-link rounded px-3.5 py-1 text-base leading-normal ' +
  'transition-[border-color,opacity] duration-150';

interface ControlsProps {
  label: string | null;
  onPrev: () => void;
  onNext: () => void;
  disablePrev: boolean;
  disableNext: boolean;
}

export default function Controls({ label, onPrev, onNext, disablePrev, disableNext }: ControlsProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-4">
      <button
        type="button"
        onClick={onPrev} disabled={disablePrev} aria-label="Previous page"
        className={`${BTN_CLASS} disabled:opacity-[0.35] disabled:cursor-default cursor-pointer`}
      >←</button>
      {label !== null && (
        <span className="text-text-secondary text-sm min-w-[5.5rem] text-center">
          {label}
        </span>
      )}
      <button
        type="button"
        onClick={onNext} disabled={disableNext} aria-label="Next page"
        className={`${BTN_CLASS} disabled:opacity-[0.35] disabled:cursor-default cursor-pointer`}
      >→</button>
    </div>
  );
}
