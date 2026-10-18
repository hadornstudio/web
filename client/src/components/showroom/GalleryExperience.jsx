import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from '../../lib/motion/gsapConfig';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import BrandSvg from '../brand/BrandSvg';
import GalleryScene from './GalleryScene';
import { SHOWROOM, bayLayout, hallEndZ } from './showroomConfig';

const BASE_FOV = 50;
const MIN_FOV = 28;
const MAX_FOV = 62;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const BTN = 'border border-ivory/60 bg-night/40 px-5 py-2.5 font-studio text-[11px] uppercase tracking-[0.25em] text-ivory backdrop-blur-sm transition-colors hover:bg-ivory hover:text-night';

function MiniMap({ works, index, onSelect }) {
  const { width, startZ } = SHOWROOM.hall;
  const endZ = hallEndZ(works.length);
  const length = startZ + 1.5 - endZ;
  const scale = Math.min(6, 200 / length);
  const toX = (x) => (x + width / 2) * scale;
  const toY = (z) => (startZ + 1.5 - z) * scale;
  return (
    <svg width={width * scale} height={length * scale} className="overflow-visible" role="group" aria-label="Gallery map">
      <rect width={width * scale} height={length * scale} fill="rgba(20,16,12,0.45)" stroke="rgba(244,237,225,0.35)" />
      <circle cx={toX(0)} cy={toY(startZ)} r="4" fill={index === -1 ? '#c9a45c' : 'rgba(244,237,225,0.5)'} onClick={() => onSelect(-1)} className="cursor-pointer" />
      {works.map((work, i) => {
        const { side, z } = bayLayout(i);
        const active = i === index;
        return (
          <g key={work.id} onClick={() => onSelect(i)} className="cursor-pointer">
            <circle cx={toX(side * (width / 2 - 1.5))} cy={toY(z)} r={active ? 5 : 3.5} fill={active ? '#c9a45c' : 'rgba(244,237,225,0.6)'} />
            <title>{work.title}</title>
          </g>
        );
      })}
    </svg>
  );
}

export default function GalleryExperience({ works, instant, onReady }) {
  const [index, setIndex] = useState(-1);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hintGone, setHintGone] = useState(false);
  const isTouch = useMediaQuery('(pointer: coarse)');
  const wrapRef = useRef(null);
  const inputRef = useRef({ yaw: 0, yawS: 0, pitch: 0, pitchS: 0, fov: BASE_FOV, fovS: BASE_FOV });
  const indexRef = useRef(-1);
  const lastNav = useRef(0);
  const cardRef = useRef(null);

  const go = useCallback(
    (i) => {
      const next = clamp(i, -1, works.length - 1);
      if (next === indexRef.current) return;
      indexRef.current = next;
      const input = inputRef.current;
      input.yaw = input.pitch = 0;
      input.fov = BASE_FOV;
      setIndex(next);
      setHintGone(true);
      setMenuOpen(false);
    },
    [works.length]
  );

  const step = useCallback((dir) => {
    const now = performance.now();
    if (now - lastNav.current < 650) return;
    lastNav.current = now;
    go(indexRef.current + dir);
  }, [go]);

  // Wheel = walk to the next/previous bay; ctrl+wheel (also trackpad pinch) = zoom.
  useEffect(() => {
    const el = wrapRef.current;
    let acc = 0;
    const onWheel = (e) => {
      e.preventDefault();
      if (e.ctrlKey) {
        const input = inputRef.current;
        input.fov = clamp(input.fov + e.deltaY * 0.08, MIN_FOV, MAX_FOV);
        return;
      }
      acc += e.deltaY;
      if (Math.abs(acc) > 40) {
        step(acc > 0 ? 1 : -1);
        acc = 0;
      }
    };
    const onKey = (e) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key)) step(1);
      else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) step(-1);
      else if (e.key === 'Home') go(-1);
      else if (e.key === 'Escape') setMenuOpen(false);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey);
    };
  }, [step, go]);

  // Drag / swipe = look around (limited so nobody gets lost); two fingers = pinch zoom.
  useEffect(() => {
    const el = wrapRef.current;
    const pointers = new Map();
    let pinchStart = null;
    const onDown = (e) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), fov: inputRef.current.fov };
      }
    };
    const onMove = (e) => {
      const prev = pointers.get(e.pointerId);
      if (!prev) return;
      const input = inputRef.current;
      if (pointers.size === 1) {
        input.yaw = clamp(input.yaw + (e.clientX - prev.x) * 0.004, -0.65, 0.65);
        input.pitch = clamp(input.pitch + (e.clientY - prev.y) * 0.003, -0.3, 0.3);
      }
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2 && pinchStart) {
        const [a, b] = [...pointers.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        input.fov = clamp(pinchStart.fov * (pinchStart.dist / dist), MIN_FOV, MAX_FOV);
      }
    };
    const onUp = (e) => {
      pointers.delete(e.pointerId);
      pinchStart = null;
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  useEffect(() => {
    if (!cardRef.current || instant) return;
    gsap.fromTo(cardRef.current, { autoAlpha: 0, y: 14 }, { autoAlpha: 1, y: 0, duration: 0.5, delay: SHOWROOM.travelSec * 0.6, ease: 'power3.out' });
  }, [index, instant]);

  const work = index >= 0 ? works[index] : null;
  const cta = work
    ? work.productSlug
      ? { to: `/product/${work.productSlug}`, state: undefined }
      : { to: '/custom-order', state: { referenceImage: work.images[0], pieceTitle: work.title } }
    : null;

  return (
    <div ref={wrapRef} className="absolute inset-0 touch-none select-none bg-night font-studio text-ivory">
      <GalleryScene works={works} index={index} instant={instant} inputRef={inputRef} onSelect={go} onReady={onReady} />

      {/* top bar */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-gradient-to-b from-night/70 to-transparent px-5 py-4">
        <Link to="/" aria-label="Hadorn Studio — home" className="pointer-events-auto flex items-center gap-3 text-ivory">
          <BrandSvg name="mark" className="w-8" />
          <BrandSvg name="wordmark" className="hidden w-24 sm:block" />
        </Link>
        <nav className="pointer-events-auto flex items-center gap-5 text-[11px] uppercase tracking-[0.25em]">
          <Link to="/gallery" className="text-ivory/80 hover:text-gold">View as list</Link>
          <Link to="/shop" className="text-ivory/80 hover:text-gold">Shop</Link>
        </nav>
      </div>

      {/* map + rooms menu */}
      <div className="absolute right-5 top-20 flex flex-col items-end gap-3">
        <button type="button" onClick={() => setMenuOpen((o) => !o)} className="text-[11px] uppercase tracking-[0.25em] text-ivory/80 hover:text-gold" aria-expanded={menuOpen}>
          {menuOpen ? 'Close' : 'The rooms'}
        </button>
        {menuOpen ? (
          <ul className="max-h-[50vh] w-64 overflow-auto border border-ivory/25 bg-night/80 p-2 text-sm font-light backdrop-blur-md">
            <li>
              <button type="button" onClick={() => go(-1)} className={`w-full px-3 py-2 text-left hover:bg-ivory/10 ${index === -1 ? 'text-gold' : ''}`}>Entrance</button>
            </li>
            {works.map((w, i) => (
              <li key={w.id}>
                <button type="button" onClick={() => go(i)} className={`w-full px-3 py-2 text-left hover:bg-ivory/10 ${i === index ? 'text-gold' : ''}`}>
                  <span className="mr-2 text-ivory/50">{i + 1}</span>{w.title}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="hidden sm:block"><MiniMap works={works} index={index} onSelect={go} /></div>
        )}
      </div>

      {/* story card + progress */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col gap-3 bg-gradient-to-t from-night/80 via-night/40 to-transparent px-5 pb-6 pt-24 md:px-10">
        {!hintGone && (
          <p className="w-full text-center text-[11px] font-light uppercase tracking-[0.3em] text-ivory/80">
            {isTouch ? SHOWROOM.hint.touch : SHOWROOM.hint.desktop}
          </p>
        )}
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div ref={cardRef} className="pointer-events-auto order-2 w-full max-w-md border border-ivory/20 bg-night/55 p-5 backdrop-blur-md md:order-1">
            {work ? (
              <>
                <p className="text-[11px] font-normal uppercase tracking-[0.3em] text-gold">
                  {[work.category, work.year].filter(Boolean).join(' · ') || 'From the studio'}
                </p>
                <h2 className="mt-2 font-studio text-2xl font-light leading-snug">{work.title}</h2>
                {work.story && <p className="mt-2 max-h-28 overflow-auto text-sm font-light leading-relaxed text-ivory/80">{work.story}</p>}
                <Link to={cta.to} state={cta.state} className={`${BTN} mt-4 inline-flex`}>{SHOWROOM.ctaLabel}</Link>
              </>
            ) : (
              <>
                <p className="text-[11px] font-normal uppercase tracking-[0.3em] text-gold">{SHOWROOM.title}</p>
                <h2 className="mt-2 font-studio text-2xl font-light leading-snug">{works.length} pieces from our studio</h2>
                <p className="mt-2 text-sm font-light leading-relaxed text-ivory/80">Walk the hall at your own pace — each piece has its story.</p>
                <button type="button" onClick={() => go(0)} className={`${BTN} mt-4`}>Begin</button>
              </>
            )}
          </div>

          <div className="pointer-events-auto order-1 flex items-center gap-3 self-end md:order-2">
            <button type="button" onClick={() => go(index - 1)} disabled={index < 0} aria-label="Previous piece" className="flex h-10 w-10 items-center justify-center border border-ivory/50 bg-night/40 backdrop-blur-sm disabled:opacity-30">‹</button>
            <p className="min-w-[4.5rem] text-center text-xs font-light uppercase tracking-[0.25em]" aria-live="polite">
              {index < 0 ? `– / ${works.length}` : `${index + 1} / ${works.length}`}
            </p>
            <button type="button" onClick={() => go(index + 1)} disabled={index >= works.length - 1} aria-label="Next piece" className="flex h-10 w-10 items-center justify-center border border-ivory/50 bg-night/40 backdrop-blur-sm disabled:opacity-30">›</button>
          </div>
        </div>
      </div>
    </div>
  );
}
