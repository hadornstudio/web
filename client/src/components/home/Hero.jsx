import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { useParallax } from '../../hooks/useParallax';
import { useHeroShimmer } from '../../hooks/useHeroShimmer';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1611170947204-5ab96c3e37a1?q=80&w=1920&auto=format&fit=crop';

export default function Hero() {
  const contentRef = useScrollReveal({ y: 24, stagger: 0.12, scrollTrigger: false });
  const parallaxRef = useParallax({ amount: 50 });
  const shimmerRef = useHeroShimmer();

  return (
    <section className="relative flex h-[85vh] min-h-[560px] items-end overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <img
          ref={parallaxRef}
          src={HERO_IMAGE}
          alt="Handcrafted Hadorn jewelry"
          className="absolute -top-[15%] left-0 h-[130%] w-full object-cover"
        />
        <canvas ref={shimmerRef} className="absolute inset-0 h-full w-full mix-blend-soft-light" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-ink/10 to-transparent" />

      <div ref={contentRef} className="container-page relative pb-20 text-paper">
        <p className="text-xs uppercase tracking-[0.2em]">Handcrafted, One Bead at a Time</p>
        <h1 className="mt-4 max-w-xl font-display text-5xl font-light leading-tight md:text-6xl">
          Quiet pieces, made by hand.
        </h1>
        <div className="mt-8">
          <Button as={Link} to="/shop">Shop the Collection</Button>
        </div>
      </div>
    </section>
  );
}
