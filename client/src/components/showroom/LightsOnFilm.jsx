import { useEffect, useRef } from 'react';
import { gsap } from '../../lib/motion/gsapConfig';
import { useMediaQuery } from '../../hooks/useMediaQuery';
import frameSets from '../../config/frameSets.json';
import { useFrameSequence } from '../film/useFrameSequence';
import { SHOWROOM } from './showroomConfig';

// The "lights on" film. Scroll/swipe/arrow keys scrub it; if the visitor does nothing for ~2 s it plays itself.
export default function LightsOnFilm({ onDone }) {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const set = frameSets.showroomIntro[isMobile ? 'mobile' : 'desktop'];
  const rootRef = useRef(null);
  const canvasRef = useRef(null);
  const hintRef = useRef(null);
  const repaintRef = useRef(() => {});
  const framesRef = useFrameSequence(set, (i) => repaintRef.current(i));

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const n = set.frames;
    const cfg = SHOWROOM.film;
    let progress = 0;
    let shown = 0;
    let drawn = -1;
    let userDriven = false;
    let finished = false;
    let lastTouchY = null;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);
      canvas.width = Math.round(window.innerWidth * dpr);
      canvas.height = Math.round(window.innerHeight * dpr);
      drawn = -1;
    };

    const draw = (idx) => {
      const images = framesRef.current;
      let img = images[idx];
      for (let d = 1; d < n && !img; d++) img = images[idx - d] || images[idx + d];
      if (!img) return;
      const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
      const w = img.naturalWidth * scale;
      const h = img.naturalHeight * scale;
      ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      drawn = idx;
    };
    repaintRef.current = (i) => {
      if (Math.round(shown * (n - 1)) === i) drawn = -1;
    };

    const nudge = (delta) => {
      userDriven = true;
      progress = Math.min(1, Math.max(0, progress + delta));
    };
    const onWheel = (e) => {
      e.preventDefault();
      nudge(e.deltaY / cfg.wheelPxForFullFilm);
    };
    const onTouchStart = (e) => { lastTouchY = e.touches[0].clientY; };
    const onTouchMove = (e) => {
      if (lastTouchY == null) return;
      const y = e.touches[0].clientY;
      nudge((lastTouchY - y) / (window.innerHeight * 2.2));
      lastTouchY = y;
    };
    const onKey = (e) => {
      if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) nudge(0.12);
      if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) nudge(-0.12);
    };

    const root = rootRef.current;
    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('touchstart', onTouchStart, { passive: true });
    root.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', resize);
    resize();

    const autoStart = performance.now() + cfg.autoplayAfterMs;

    const tick = (_time, deltaTime) => {
      const dt = deltaTime / 1000;
      if (!userDriven && performance.now() > autoStart) progress = Math.min(1, progress + dt / cfg.durationSec);
      shown += (progress - shown) * (1 - Math.exp(-dt * 8));
      gsap.set(hintRef.current, { autoAlpha: 1 - Math.min(1, shown * 12) });
      const idx = Math.round(shown * (n - 1));
      if (idx !== drawn) draw(idx);
      if (!finished && shown > 0.985 && progress >= 1) {
        finished = true;
        onDone();
      }
    };
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('touchstart', onTouchStart);
      root.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', resize);
    };
  }, [set, isMobile, framesRef, onDone]);

  return (
    <div ref={rootRef} className="absolute inset-0 z-20 touch-none bg-night">
      <canvas ref={canvasRef} className="h-full w-full" aria-hidden="true" />
      <p ref={hintRef} className="pointer-events-none absolute inset-x-0 bottom-16 text-center font-studio text-[11px] font-light uppercase tracking-[0.35em] text-ivory/80">
        {SHOWROOM.filmHint}
      </p>
    </div>
  );
}
