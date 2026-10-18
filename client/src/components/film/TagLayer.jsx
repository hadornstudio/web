import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from '../../lib/motion/gsapConfig';

const LABEL_WIDTH_GUESS = 200;
const EDGE = 14;

// Name tags pinned to items in the film: dot on the item, a line that draws out to a glass label.
// Coordinates are fractions of the full film frame, mapped through the same cover-fit the canvas uses,
// so a tag stays on its item at any screen size (and is hidden if the item is cropped out, e.g. on phones).
const TagLayer = forwardRef(function TagLayer({ tags, frame, crop, isMobile, mobileCrop }, ref) {
  const rootRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const timelines = useRef(new Map());
  const shown = useRef(new Map());
  const lastProgress = useRef(0);

  useLayoutEffect(() => {
    const el = rootRef.current.parentElement; // the hero section this layer fills
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const placed = useMemo(() => {
    if (!size.w) return [];
    const visibleW = frame.width * (1 - crop);
    const scale = Math.max(size.w / visibleW, size.h / frame.height);
    const offX = (size.w - visibleW * scale) / 2;
    const offY = (size.h - frame.height * scale) / 2;
    const map = ([nx, ny]) => {
      const x = isMobile ? (nx - mobileCrop.x0) / mobileCrop.w : nx;
      return [offX + x * frame.width * scale, offY + ny * frame.height * scale];
    };
    return tags
      .map((tag, index) => {
        const [ax, ay] = map(tag.anchor);
        let [lx, ly] = map(tag.label);
        let align = tag.align;
        if (isMobile) align = lx > size.w / 2 ? 'right' : 'left';
        else if (align === 'left' && lx + LABEL_WIDTH_GUESS > size.w - EDGE) align = 'right';
        else if (align === 'right' && lx - LABEL_WIDTH_GUESS < EDGE) align = 'left';
        lx = Math.min(size.w - EDGE, Math.max(EDGE, lx));
        // Phones keep labels well above the closing call-to-action; wider screens only avoid the very edge.
        ly = Math.min(size.h - (isMobile ? 170 : 90), Math.max(70, ly));
        const onScreen = ax > 24 && ax < size.w - 24 && ay > 24 && ay < size.h - 24;
        return { ...tag, index, ax, ay, lx, ly, align, onScreen };
      })
      .filter((t) => t.onScreen);
  }, [size, tags, frame, crop, isMobile, mobileCrop]);

  useEffect(() => {
    const root = rootRef.current;
    const map = new Map();
    const ctx = gsap.context(() => {
      placed.forEach((t) => {
        const g = root.querySelector(`[data-tag="${t.id}"]`);
        const lines = g.querySelectorAll('line');
        const dot = g.querySelector('.tag-dot');
        const ring = g.querySelector('.tag-ring');
        const label = root.querySelector(`[data-label="${t.id}"]`);
        const length = Math.hypot(t.ax - t.lx, t.ay - t.ly);
        gsap.set(lines, { strokeDasharray: length, strokeDashoffset: length });
        gsap.set([dot, ring], { scale: 0, transformOrigin: '50% 50%' });
        gsap.set(label, { autoAlpha: 0, x: t.align === 'left' ? 10 : -10 });
        const pulse = gsap.to(ring, { scale: 2.4, opacity: 0, duration: 1.8, repeat: -1, ease: 'power1.out', paused: true });
        const tl = gsap
          .timeline({ paused: true })
          .to(dot, { scale: 1, duration: 0.3, ease: 'power3.out' }, 0)
          .to(lines, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut' }, 0.15)
          .to(label, { autoAlpha: 1, x: 0, duration: 0.45, ease: 'power3.out' }, 0.5)
          .add(() => pulse.play(), 0.3)
          .eventCallback('onReverseComplete', () => pulse.pause(0));
        map.set(t.id, tl);
        if (shown.current.get(t.id)) tl.progress(1);
      });
    }, root);
    timelines.current = map;
    return () => ctx.revert();
  }, [placed]);

  useImperativeHandle(
    ref,
    () => ({
      update(progress) {
        lastProgress.current = progress;
        tags.forEach((t) => {
          const on = progress >= t.at && progress <= (t.until ?? 2);
          if (shown.current.get(t.id) === on) return;
          shown.current.set(t.id, on);
          const tl = timelines.current.get(t.id);
          if (!tl) return;
          if (on) tl.play();
          else tl.reverse();
        });
      },
    }),
    [tags]
  );

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0" aria-hidden="true">
      <svg className="absolute inset-0 h-full w-full overflow-visible" width={size.w} height={size.h}>
        {placed.map((t) => (
          <g key={t.id} data-tag={t.id}>
            <line className="tag-shadow" x1={t.ax} y1={t.ay} x2={t.lx} y2={t.ly} stroke="#14100c" strokeOpacity="0.45" strokeWidth="3.5" strokeLinecap="round" />
            <line className="tag-line" x1={t.ax} y1={t.ay} x2={t.lx} y2={t.ly} stroke="#f4ede1" strokeWidth="1.25" strokeLinecap="round" />
            <circle className="tag-ring" cx={t.ax} cy={t.ay} r="9" fill="none" stroke="#f4ede1" strokeWidth="1.5" />
            <circle className="tag-dot" cx={t.ax} cy={t.ay} r="6" fill="#c9a45c" stroke="#f4ede1" strokeWidth="2" />
          </g>
        ))}
      </svg>
      {placed.map((t) => (
        <div
          key={t.id}
          className="absolute"
          style={{ left: t.lx, top: t.ly, transform: `translate(${t.align === 'right' ? '-100%' : '0'}, -50%)` }}
        >
          <div
            data-label={t.id}
            className="flex items-center gap-2.5 border border-ivory/30 bg-night/70 px-3.5 py-2 font-studio text-ivory"
          >
            <span className="text-[10px] font-normal tracking-[0.25em] text-gold">{String(t.index + 1).padStart(2, '0')}</span>
            <span className="whitespace-nowrap text-sm font-light tracking-wide">{t.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
});

export default TagLayer;
