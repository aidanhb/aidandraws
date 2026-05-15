import { useEffect, useState } from 'react';
import Lightbox from './Lightbox';

interface LightboxImage {
  src: string;
  alt: string;
}

export default function LightboxPortal() {
  const [image, setImage] = useState<LightboxImage | null>(null);

  useEffect(() => {
    const open = (e: Event) => {
      const { src, alt } = (e as CustomEvent<LightboxImage>).detail;
      setImage({ src, alt });
    };
    window.addEventListener('lightbox:open', open);
    return () => window.removeEventListener('lightbox:open', open);
  }, []);

  useEffect(() => {
    if (!image) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); setImage(null); }
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [image]);

  if (!image) return null;
  return <Lightbox src={image.src} alt={image.alt} onClose={() => setImage(null)} />;
}
