import { useScrollMotion } from '../../hooks/useScrollMotion';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import InfiniteCarousel from '../common/InfiniteCarousel';

const TESTIMONIALS = [
  {
    name: 'Maya Ellison',
    quote: 'The knotting between beads is such a nice touch — feels much more considered than anything else I own.',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: 'Priya Nair',
    quote: 'Bought a piece as a gift and my sister has not taken it off since. The packaging alone felt like a gift.',
    avatar: 'https://images.unsplash.com/photo-1489278353717-f64c6ee8a4d2?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: 'Sofia Reyes',
    quote: 'You can tell this was made by hand — no two beads are identical, and that is exactly the appeal.',
    avatar: 'https://images.unsplash.com/photo-1611695434369-a8f5d76ceb7b?q=80&w=200&auto=format&fit=crop',
  },
  {
    name: 'Grace Whitfield',
    quote: 'Lightweight, well finished, and the clasp feels genuinely well made. Wearing mine daily.',
    avatar: 'https://images.unsplash.com/photo-1623717217554-72ca676de535?q=80&w=200&auto=format&fit=crop',
  },
];

export default function Testimonials() {
  const revealRef = useScrollReveal({ y: 20, stagger: 0.1 });
  const motionRef = useScrollMotion();

  return (
    <section ref={motionRef} className="py-24">
      <div className="container-page mb-12 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-600">In Their Words</p>
        <h2 data-split className="mt-3 font-display text-3xl">From Hadorn Customers</h2>
      </div>

      <div ref={revealRef}>
        <InfiniteCarousel
          label="Customer testimonials"
          autoplay={30}
          fade
          items={TESTIMONIALS}
          gapClassName="gap-6"
          itemClassName="w-[78vw] sm:w-72 md:w-[calc((100%-3rem)/3)]"
          renderItem={(t) => (
            <div className="h-full border border-stone-300 bg-paper p-6">
              <p className="text-accent">★★★★★</p>
              <p className="mt-4 text-sm text-stone-600">&ldquo;{t.quote}&rdquo;</p>
              <div className="mt-6 flex items-center gap-3">
                <img src={t.avatar} alt={t.name} className="h-9 w-9 rounded-full object-cover" />
                <span className="text-sm text-ink">{t.name}</span>
              </div>
            </div>
          )}
        />
      </div>
    </section>
  );
}
