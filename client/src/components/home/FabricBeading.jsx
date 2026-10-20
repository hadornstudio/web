import { Link } from 'react-router-dom';
import { useScrollMotion } from '../../hooks/useScrollMotion';
import { responsiveImage } from '../../utils/images';

const FABRIC_BEADING_IMAGE = 'https://images.unsplash.com/photo-1715374033196-0ff662284a7e?q=80&w=1200&auto=format&fit=crop';

export default function FabricBeading() {
  const motionRef = useScrollMotion();

  return (
    <section ref={motionRef} className="container-page grid grid-cols-1 items-center gap-12 overflow-x-clip py-24 md:grid-cols-2 md:gap-20">
      <div data-drift="40" className="order-2 md:order-1">
        <p data-slide="right" className="text-xs uppercase tracking-[0.2em] text-stone-600">A Signature Technique</p>
        <h2 data-split className="mt-3 font-display text-3xl">Beaded on fabric, row by row.</h2>
        <p data-slide="left" className="mt-6 text-stone-600">
          Alongside strung and knotted work, fabric beading runs through a great deal of what we make —
          beads woven directly onto cloth and fiber on a hand loom, one row at a time. It's slower than
          stringing and far less forgiving, but it's how we get the density, color-blending, and texture
          that a single strand of beads can't hold on its own.
        </p>
        <p data-slide="right" className="mt-4 text-stone-600">
          You'll find it in cuffs, chokers, and statement pieces throughout the collection — anywhere the
          piece needs to feel more like a small woven textile than a strand of beads.
        </p>
        <Link
          to="/gallery"
          data-slide
          className="mt-8 inline-block text-sm uppercase tracking-wide text-accent hover:text-accent-dark"
        >
          See the Work →
        </Link>
      </div>

      <div data-drift="-40" className="order-1 md:order-2">
        <div data-mask className="aspect-[4/5] overflow-hidden bg-cream">
        <img
          {...responsiveImage(FABRIC_BEADING_IMAGE, '(min-width: 768px) 45vw, 100vw', [600, 1000, 1400])}
          data-zoom
          loading="lazy"
          decoding="async"
          alt="Beads woven onto fabric on a hand loom"
          className="h-full w-full object-cover"
        />
        </div>
      </div>
    </section>
  );
}
