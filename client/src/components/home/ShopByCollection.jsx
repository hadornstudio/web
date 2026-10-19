import { Link } from 'react-router-dom';
import { responsiveImage } from '../../utils/images';
import { useCategories } from '../../hooks/useCategories';
import Spinner from '../common/Spinner';
import InfiniteCarousel from '../common/InfiniteCarousel';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useGSAP } from '@gsap/react';
import { gsap, DURATION, EASE, prefersReducedMotion } from '../../lib/motion/gsapConfig';

export default function ShopByCollection() {
  const { data, isLoading } = useCategories();
  const categories = data?.data?.categories || [];
  const gridRef = useScrollReveal({ y: 20, stagger: 0.08, deps: [categories.length] });

  useGSAP(
    () => {
      if (!gridRef.current || prefersReducedMotion()) return;
      const images = gridRef.current.querySelectorAll('.collection-tile-image');
      if (!images.length) return;

      gsap.fromTo(
        images,
        { clipPath: 'inset(100% 0 0 0)' },
        {
          clipPath: 'inset(0% 0 0 0)',
          duration: DURATION.slow,
          ease: EASE.reveal,
          stagger: 0.08,
          scrollTrigger: { trigger: gridRef.current, start: 'top 80%', once: true },
        }
      );
    },
    { scope: gridRef, dependencies: [categories.length] }
  );

  if (isLoading) return <Spinner />;

  return (
    <section className="container-page py-24">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-600">Explore</p>
        <h2 className="mt-3 font-display text-3xl">Shop by Collection</h2>
      </div>

      <div ref={gridRef} className="-mx-6 md:-mx-12">
        <InfiniteCarousel
          label="Shop by collection"
          items={categories}
          gapClassName="gap-4"
          itemClassName="w-[44vw] sm:w-[30vw] md:w-[calc((100%-3rem)/4)]"
          renderItem={(category) => (
            <Link to={`/shop/${category.slug}`} className="group block">
              <div className="collection-tile-image aspect-[3/4] overflow-hidden bg-cream">
                <img
                  {...responsiveImage(category.image, '(min-width: 768px) 24vw, 44vw', [300, 600, 900])}
                  loading="lazy"
                  decoding="async"
                  alt={category.name}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>
              <p className="mt-3 text-center text-sm uppercase tracking-wide text-ink">{category.name}</p>
            </Link>
          )}
        />
      </div>
    </section>
  );
}
