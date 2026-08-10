import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import { gsap, DURATION, EASE, prefersReducedMotion } from '../../lib/motion/gsapConfig';

const FABRIC_BEADING_IMAGE = 'https://images.unsplash.com/photo-1715374033196-0ff662284a7e?q=80&w=1200&auto=format&fit=crop';

export default function FabricBeading() {
  const textRef = useScrollReveal({ y: 20, stagger: 0.12 });
  const imageWrapRef = useRef(null);

  useGSAP(
    () => {
      if (!imageWrapRef.current || prefersReducedMotion()) return;
      const image = imageWrapRef.current.querySelector('img');
      gsap.fromTo(
        image,
        { clipPath: 'inset(0 100% 0 0)' },
        {
          clipPath: 'inset(0 0% 0 0)',
          duration: DURATION.slow,
          ease: EASE.reveal,
          scrollTrigger: { trigger: imageWrapRef.current, start: 'top 80%', once: true },
        }
      );
    },
    { scope: imageWrapRef }
  );

  return (
    <section className="container-page grid grid-cols-1 items-center gap-12 py-24 md:grid-cols-2 md:gap-20">
      <div ref={textRef} className="order-2 md:order-1">
        <p className="text-xs uppercase tracking-[0.2em] text-stone-600">A Signature Technique</p>
        <h2 className="mt-3 font-display text-3xl">Beaded on fabric, row by row.</h2>
        <p className="mt-6 text-stone-600">
          Alongside strung and knotted work, fabric beading runs through a great deal of what we make —
          beads woven directly onto cloth and fiber on a hand loom, one row at a time. It's slower than
          stringing and far less forgiving, but it's how we get the density, color-blending, and texture
          that a single strand of beads can't hold on its own.
        </p>
        <p className="mt-4 text-stone-600">
          You'll find it in cuffs, chokers, and statement pieces throughout the collection — anywhere the
          piece needs to feel more like a small woven textile than a strand of beads.
        </p>
        <Link
          to="/gallery"
          className="mt-8 inline-block text-sm uppercase tracking-wide text-accent hover:text-accent-dark"
        >
          See the Work →
        </Link>
      </div>

      <div ref={imageWrapRef} className="order-1 aspect-[4/5] overflow-hidden bg-cream md:order-2">
        <img
          src={FABRIC_BEADING_IMAGE}
          alt="Beads woven onto fabric on a hand loom"
          className="h-full w-full object-cover"
        />
      </div>
    </section>
  );
}
