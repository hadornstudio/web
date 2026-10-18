import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/motion/gsapConfig';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import BrandSvg from '../brand/BrandSvg';
import frameSets from '../../config/frameSets.json';
import { HERO_CONFIG as C } from './heroConfig';
import { mapProgress, smoothstep } from './filmMath';
import { frameUrl, useFrameSequence } from './useFrameSequence';

const HERO_HEIGHT = `calc(100svh - ${C.headerOffset}px)`;
const FILM_BUTTON =
  'inline-flex items-center justify-center border border-ivory/80 bg-night/30 px-7 py-3 font-studio text-xs uppercase tracking-[0.25em] text-ivory backdrop-blur-sm transition-colors duration-300 hover:bg-ivory hover:text-night';
const TEXT_SHADOW = '[text-shadow:0_1px_14px_rgba(20,16,12,0.85)]';

function A11yHeading() {
  return <h1 className="sr-only">Hadorn Studio — handcrafted beadwork, attire and accessories</h1>;
}

function StaticHero({ isMobile }) {
  const set = frameSets.hero[isMobile ? 'mobile' : 'desktop'];
  return (
    <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden bg-night" style={{ height: HERO_HEIGHT }}>
      <img src={frameUrl(set, set.frames)} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-night/75 via-night/20 to-night/30" />
      <A11yHeading />
      <div className="relative flex flex-col items-center px-6 text-center text-ivory">
        <p className="mb-6 font-studio text-xs font-light uppercase tracking-[0.3em] md:text-sm">{C.brand.tagline}</p>
        <BrandSvg name="studio" className="w-[clamp(260px,70vw,900px)] drop-shadow-[0_2px_24px_rgba(20,16,12,0.55)]" aria-hidden="true" />
        <p className="mt-6 font-studio text-base font-light md:text-lg">{C.brand.line}</p>
        <Link to={C.brand.cta.to} className={`${FILM_BUTTON} mt-8`}>{C.brand.cta.label}</Link>
      </div>
    </section>
  );
}

function FilmHero({ isMobile }) {
  const set = frameSets.hero[isMobile ? 'mobile' : 'desktop'];

  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const cueRef = useRef(null);
  const wordWrapRef = useRef(null);
  const wordRef = useRef(null);
  const textWrapRef = useRef(null);
  const lineWrapRef = useRef(null);
  const taglineRef = useRef(null);
  const lineRef = useRef(null);
  const ctaRef = useRef(null);
  const cardRefs = useRef([]);
  const finalRef = useRef(null);
  const veilRef = useRef(null);
  const repaintRef = useRef(() => {});

  const framesRef = useFrameSequence(set, (i) => repaintRef.current(i));

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const n = set.frames;
    const crop = isMobile ? C.cropRight.mobile : C.cropRight.desktop;
    const screens = isMobile ? C.scrollScreens.mobile : C.scrollScreens.desktop;

    let cur = 0;
    let target = 0;
    let drawn = -1;
    let progress = 0;
    let dpr = 1;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      const { width, height } = section.getBoundingClientRect();
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      drawn = -1;
    };

    const draw = (idx) => {
      const images = framesRef.current;
      let img = images[idx];
      if (!img) {
        for (let d = 1; d < n && !img; d++) img = images[idx - d] || images[idx + d];
      }
      if (!img) return;
      const sw = img.naturalWidth * (1 - crop);
      const sh = img.naturalHeight;
      const scale = Math.max(canvas.width / sw, canvas.height / sh);
      const dw = sw * scale;
      const dh = sh * scale;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, sw, sh, (canvas.width - dw) / 2, (canvas.height - dh) / 2, dw, dh);
      drawn = idx;
    };

    repaintRef.current = (loadedIndex) => {
      if (Math.round(cur) === loadedIndex) drawn = -1;
    };

    const letters = [...wordRef.current.querySelectorAll('path[id]')];
    const hadornLetters = letters.filter((p) => !p.id.startsWith('studio-'));
    const studioLetters = letters.filter((p) => p.id.startsWith('studio-'));
    const unit = 1607 / wordRef.current.clientWidth;

    const ctxGsap = gsap.context(() => {
      gsap.set([taglineRef.current, lineRef.current, ctaRef.current, finalRef.current, veilRef.current, ...cardRefs.current], { autoAlpha: 0 });
      gsap.set(letters, { opacity: 0 });

      const wordIn = gsap
        .timeline({ paused: true })
        .fromTo(hadornLetters, { opacity: 0, y: 28 * unit }, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07 }, 0)
        .fromTo(studioLetters, { opacity: 0, y: 14 * unit }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.05 }, 0.35)
        .fromTo(taglineRef.current, { autoAlpha: 0, y: 10 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out' }, 0.1)
        .fromTo([lineRef.current, ctaRef.current], { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: 'power3.out', stagger: 0.12 }, 0.5);

      let wordShown = false;

      const updateOverlays = (p) => {
        const w = C.wordmark;
        gsap.set(cueRef.current, { autoAlpha: 1 - smoothstep(0, 0.03, p) });

        if (p >= w.appearAt && !wordShown) {
          wordShown = true;
          wordIn.play();
        } else if (p < w.appearAt && wordShown) {
          wordShown = false;
          wordIn.reverse();
        }

        const swell = smoothstep(w.appearAt, w.fadeEnd, p);
        gsap.set(wordWrapRef.current, { scale: 1 + (w.scaleTo - 1) * swell, autoAlpha: 1 - smoothstep(w.fadeStart, w.fadeEnd, p) });
        hadornLetters.forEach((el, i) => gsap.set(el, { x: (i - (hadornLetters.length - 1) / 2) * w.spread * swell }));
        studioLetters.forEach((el, i) => gsap.set(el, { x: (i - (studioLetters.length - 1) / 2) * w.spread * 0.4 * swell }));

        gsap.set([textWrapRef.current, lineWrapRef.current], { autoAlpha: 1 - smoothstep(C.textFadeOut.start, C.textFadeOut.end, p) });

        C.cards.forEach((card, i) => {
          const el = cardRefs.current[i];
          const fadeIn = smoothstep(card.at, card.at + 0.03, p);
          const fadeOut = 1 - smoothstep(card.at + C.cardWindow - 0.03, card.at + C.cardWindow, p);
          gsap.set(el, { autoAlpha: Math.min(fadeIn, fadeOut), y: (1 - fadeIn) * 24 });
        });

        gsap.set(veilRef.current, { autoAlpha: smoothstep(w.appearAt, w.appearAt + 0.04, p) * (1 - smoothstep(w.fadeStart, w.fadeEnd, p)) });

        gsap.set(finalRef.current, { autoAlpha: smoothstep(C.finalCta.appearAt, C.finalCta.appearAt + 0.05, p) });
      };

      ScrollTrigger.create({
        trigger: section,
        start: `top top+=${C.headerOffset}`,
        end: () => `+=${window.innerHeight * screens}`,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          progress = self.progress;
          target = mapProgress(progress, C.slowStart) * (n - 1);
          updateOverlays(progress);
        },
      });

      const tick = (_time, deltaTime) => {
        const ease = 1 - Math.exp(-(deltaTime / 1000) * 10);
        cur += (target - cur) * ease;
        if (Math.abs(target - cur) < 0.01) cur = target;
        const idx = Math.round(cur);
        if (idx !== drawn) draw(idx);
      };
      gsap.ticker.add(tick);
      return () => gsap.ticker.remove(tick);
    }, section);

    const observer = new ResizeObserver(() => {
      resize();
      draw(Math.round(cur));
    });
    observer.observe(section);
    resize();

    return () => {
      observer.disconnect();
      ctxGsap.revert();
    };
  }, [set, isMobile, framesRef]);

  // ScrollTrigger wraps the pinned section in its own spacer div; this stable outer element is
  // what React removes on unmount/remount, so React never tries to detach a re-parented node.
  return (
    <div>
      <section ref={sectionRef} className="relative min-h-[520px] overflow-hidden bg-night" style={{ height: HERO_HEIGHT }}>
        <img src={frameUrl(set, 1)} alt="" fetchPriority="high" className="absolute inset-0 h-full w-full object-cover" />
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-night/25" />
        <A11yHeading />
        <div ref={veilRef} className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(20,16,12,0.55),transparent_70%)]" />

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center text-ivory">
          <div ref={textWrapRef} className="pointer-events-auto">
            <p ref={taglineRef} className={`mb-6 font-studio text-xs font-light uppercase tracking-[0.3em] md:text-sm ${TEXT_SHADOW}`}>
              {C.brand.tagline}
            </p>
          </div>
          <div ref={wordWrapRef} className="w-[clamp(240px,62vw,1000px)] drop-shadow-[0_2px_24px_rgba(20,16,12,0.55)]">
            <BrandSvg ref={wordRef} name="studio" aria-hidden="true" />
          </div>
          <div ref={lineWrapRef} className="pointer-events-auto flex flex-col items-center">
            <p ref={lineRef} className={`mt-6 font-studio text-base font-light md:text-lg ${TEXT_SHADOW}`}>{C.brand.line}</p>
            <Link ref={ctaRef} to={C.brand.cta.to} className={`${FILM_BUTTON} mt-8`}>{C.brand.cta.label}</Link>
          </div>
        </div>

        {C.cards.map((card, i) => (
          <div
            key={card.label}
            className={`pointer-events-none absolute inset-x-0 bottom-10 flex justify-center px-5 ${card.side === 'right' ? 'md:justify-end md:px-16' : 'md:justify-start md:px-16'}`}
          >
            <div
              ref={(el) => (cardRefs.current[i] = el)}
              className="w-[min(92vw,340px)] border border-ivory/25 bg-night/40 p-5 font-studio text-ivory backdrop-blur-md"
            >
              <p className="text-[11px] font-normal uppercase tracking-[0.3em] text-gold">{card.label}</p>
              <p className="mt-2 text-xl font-light leading-snug">{card.title}</p>
              <p className="mt-2 text-sm font-light leading-relaxed text-ivory/80">{card.text}</p>
            </div>
          </div>
        ))}

        <div ref={finalRef} className="absolute inset-x-0 bottom-12 flex flex-col items-center px-6 text-center font-studio text-ivory">
          <p className={`mb-5 text-sm font-light uppercase tracking-[0.3em] ${TEXT_SHADOW}`}>{C.finalCta.text}</p>
          <Link to={C.finalCta.to} className={FILM_BUTTON}>{C.finalCta.label}</Link>
        </div>

        <div ref={cueRef} className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-3 font-studio text-ivory">
          <span className="text-[11px] font-light uppercase tracking-[0.35em]">{C.brand.scrollCue}</span>
          <span className="h-10 w-px animate-pulse bg-ivory/70" />
        </div>
      </section>
    </div>
  );
}

export default function ScrollFilmHero() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const saveData = typeof navigator !== 'undefined' && navigator.connection?.saveData;

  // Reduced motion / data saver: one still frame with the same wordmark and CTA, no scrubbing.
  if (prefersReducedMotion() || saveData) return <StaticHero isMobile={isMobile} />;
  return <FilmHero key={isMobile ? 'm' : 'd'} isMobile={isMobile} />;
}
