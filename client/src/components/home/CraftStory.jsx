import { useScrollMotion } from '../../hooks/useScrollMotion';
import { useParallax } from '../../hooks/useParallax';
import { responsiveImage } from '../../utils/images';

const CRAFT_IMAGE = 'https://images.unsplash.com/photo-1659032882718-3e54e7da86ab?q=80&w=1200&auto=format&fit=crop';

export default function CraftStory() {
  const imageRef = useParallax({ amount: 30 });
  const wrapperRef = useScrollMotion();

  return (
    <section
      id="craft"
      ref={wrapperRef}
      className="container-page grid grid-cols-1 gap-12 overflow-x-clip py-24 md:grid-cols-2 md:min-h-[80vh] md:gap-20"
    >
      {/* Sticky (not GSAP-pinned) so it can't fight the surrounding grid/container layout —
          holds the image in view while the text column scrolls past, the "one pinned
          editorial beat" for the homepage. self-start + the section's own min-height gives
          the sticky wrapper real room to hold within — without it, a sticky element whose
          grid cell is only as tall as its own content has nowhere to visibly stick. */}
      <div className="md:sticky md:top-28 md:self-start">
        <div data-mask className="aspect-[4/5] overflow-hidden bg-cream">
          <img ref={imageRef} data-zoom {...responsiveImage(CRAFT_IMAGE, '(min-width: 768px) 45vw, 100vw', [600, 1000, 1400])} loading="lazy" decoding="async" alt="Hadorn's workspace" className="h-full w-full object-cover" />
        </div>
      </div>

      <div data-drift="40" className="md:flex md:flex-col md:justify-center">
        <p data-slide="left" className="text-xs uppercase tracking-[0.2em] text-stone-600">Our Craft</p>
        <h2 data-split className="mt-3 font-display text-3xl">Made by hand, deliberately slow.</h2>
        <p data-slide="right" className="mt-6 text-stone-600">
          Every Hadorn piece begins with loose beads — freshwater pearl, sterling silver, lava stone, glass —
          sorted by hand for tone and shape before a single knot is tied. Much of our work is woven directly
          into fabric and fiber on a hand loom, a technique we return to again and again for how it lets
          color and texture build row by row. Nothing is cast in bulk. Nothing is rushed.
        </p>
        <p data-slide="left" className="mt-4 text-stone-600">
          We work in small batches from a single studio, stringing and knotting each strand individually so
          the drape, weight, and finish feel considered rather than manufactured. If a piece isn't right, we
          take it apart and start again.
        </p>
        <p data-slide className="mt-6 text-sm uppercase tracking-wide text-ink">— The Hadorn Studio</p>
      </div>
    </section>
  );
}
