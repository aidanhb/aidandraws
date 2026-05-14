import { getCollection } from 'astro:content';
import { getImage } from 'astro:assets';

export const HERO_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 700px';
const HERO_WIDTHS = [400, 800, 1200, 1800];

export interface HeroSlide {
  src: string;
  srcSetWebp: string;
  srcSetAvif: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  slug: string;
  objectPosition?: string;
}

export async function getHeroSlides(): Promise<HeroSlide[]> {
  const all = await getCollection('portfolio');
  const featured = all
    .filter((p) => p.data.featured)
    .sort((a, b) => (a.data.order ?? 99) - (b.data.order ?? 99));

  return Promise.all(
    featured.map(async (piece) => {
      // Different format on each call disambiguates the generated URLs (see
      // feedback_astro_getimage memory) and `widths` produces the per-source srcset entries.
      const [webp, avif] = await Promise.all([
        getImage({
          src: piece.data.heroImage,
          widths: HERO_WIDTHS,
          sizes: HERO_SIZES,
          format: 'webp',
          quality: 85,
        }),
        getImage({
          src: piece.data.heroImage,
          widths: HERO_WIDTHS,
          sizes: HERO_SIZES,
          format: 'avif',
          quality: 70,
        }),
      ]);
      return {
        src: webp.src,
        srcSetWebp: webp.srcSet.attribute,
        srcSetAvif: avif.srcSet.attribute,
        width: Number(webp.attributes.width) || 0,
        height: Number(webp.attributes.height) || 0,
        alt: piece.data.alt,
        title: piece.data.title,
        slug: piece.id,
        objectPosition: piece.data.objectPosition,
      };
    }),
  );
}
