import React, { useEffect, useRef } from 'react';

export interface FlipPageProps {
  src: string;
  alt: string;
  loaded: boolean;
  error: boolean;
  eager: boolean;
  reducedMotion: boolean;
  onLoad: () => void;
  onError: () => void;
  // Optional from the caller's perspective: react-pageflip injects this ref via
  // React.cloneElement on the child, so Flipbook.tsx renders <FlipPage /> without it.
  ref?: React.Ref<HTMLDivElement>;
}

// react-pageflip requires page children to be forwardRef components.
// The outer div is the DOM element the flip engine transforms.
function FlipPage({ src, alt, loaded, error, eager, reducedMotion, onLoad, onError, ref }: FlipPageProps) {
  // If the <img> has already completed by the time React attaches its ref (e.g. served from
  // disk cache), the onLoad event may not fire. Reconcile via the `complete` property.
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0 && !loaded) onLoad();
  }, [src, loaded, onLoad]);
  return (
    <div ref={ref} className="relative overflow-hidden bg-white backface-hidden">
      {!loaded && !error && (
        <div
          className={`absolute inset-0 bg-[#e8e8e8] ${reducedMotion ? '' : 'flipbook-shimmer'}`}
        />
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center text-text-secondary text-[0.8rem] text-center p-4">
          Failed to load page
        </div>
      )}
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={onLoad}
        onError={onError}
        className={[
          'block w-full h-full object-fill',
          loaded ? 'opacity-100' : 'opacity-0',
          reducedMotion ? '' : 'transition-opacity duration-200 ease-out',
        ].join(' ')}
      />
    </div>
  );
};
FlipPage.displayName = 'FlipPage';

export default FlipPage;
