import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../../lib/motion/gsapConfig';

const SETS = 3;

// A horizontally swipeable carousel that never ends. It uses native scrolling (so phones keep their own
// momentum and swipe feel): the cards are rendered three times and, whenever the visitor drifts toward
// either edge, the scroll position jumps by exactly one set — invisible, because the sets are identical.
// If every card already fits on screen (e.g. five collection tiles on a wide desktop) it stays a plain,
// non-looping row.
//
// `autoplay` (px per second) makes it drift on its own, like a marquee. It pauses while the visitor hovers,
// touches, focuses or scrolls it, while it's off-screen or the tab is hidden, and never runs for visitors
// who prefer reduced motion. `fade` softens both edges (the cards dissolve and blur as they leave).
export default function InfiniteCarousel({
  items,
  renderItem,
  itemClassName = 'w-72',
  gapClassName = 'gap-4',
  label,
  arrows = true,
  autoplay = 0,
  fade = false,
  className = '',
}) {
  const scrollerRef = useRef(null);
  const setWidth = useRef(0);
  const needsStart = useRef(true);
  const [loop, setLoop] = useState(true);
  const loopRef = useRef(true);
  const count = items.length;

  const measure = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || count === 0) return null;
    const style = getComputedStyle(el);
    const gap = parseFloat(style.columnGap) || 0;
    const contentWidth = el.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
    const kids = el.children;
    const first = kids[0];
    const single =
      loopRef.current && kids.length >= count * 2
        ? kids[count].offsetLeft - first.offsetLeft
        : kids[count - 1].offsetLeft + kids[count - 1].offsetWidth - first.offsetLeft + gap;
    return { single, fits: single - gap <= contentWidth + 1 };
  }, [count]);

  const sync = useCallback(() => {
    const el = scrollerRef.current;
    const m = measure();
    if (!el || !m) return;
    if (m.fits && loopRef.current) {
      loopRef.current = false;
      needsStart.current = true;
      setLoop(false);
      return;
    }
    if (!m.fits && !loopRef.current) {
      loopRef.current = true;
      needsStart.current = true;
      setLoop(true);
      return;
    }
    const previous = setWidth.current;
    setWidth.current = m.single;
    if (!loopRef.current) return;
    if (needsStart.current) {
      el.scrollLeft = m.single; // start on the first card of the middle set
      needsStart.current = false;
    } else if (previous && previous !== m.single) {
      el.scrollLeft = ((el.scrollLeft % previous) / previous) * m.single + m.single; // keep the place after a resize
    }
  }, [measure]);

  useLayoutEffect(() => {
    sync();
  }, [sync, loop, count]);

  useEffect(() => {
    const el = scrollerRef.current;
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [sync]);

  const onScroll = () => {
    if (!loopRef.current) return;
    const el = scrollerRef.current;
    const w = setWidth.current;
    if (!w) return;
    const x = el.scrollLeft;
    if (x < w * 0.3) el.scrollLeft = x + w;
    else if (x > w * 1.7) el.scrollLeft = x - w;
  };

  // Auto-drift. `pos` is a float accumulator because scrollLeft is quantised to whole pixels (slow speeds would stall).
  const hold = useRef({ hover: false, touch: false, focus: false, visible: true, until: 0 });
  useEffect(() => {
    const el = scrollerRef.current;
    if (!autoplay || !loop || !el || prefersReducedMotion()) return undefined;
    const h = hold.current;
    let raf = 0;
    let last = 0;
    let pos = el.scrollLeft;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - (last || now)) / 1000);
      last = now;
      const paused = h.hover || h.touch || h.focus || !h.visible || document.hidden || now < h.until;
      if (paused) {
        pos = el.scrollLeft;
        return;
      }
      pos += autoplay * dt;
      el.scrollLeft = pos;
      onScroll();
      pos = el.scrollLeft;
    };
    raf = requestAnimationFrame(frame);
    const io = new IntersectionObserver(([entry]) => {
      h.visible = entry.isIntersecting;
    });
    io.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoplay, loop, count]);

  const pause = (key, on) => () => {
    hold.current[key] = on;
    if (!on) hold.current.until = performance.now() + 1800; // let momentum / a click settle before drifting again
  };
  const hoverProps = autoplay
    ? {
        onMouseEnter: pause('hover', true),
        onMouseLeave: pause('hover', false),
        onTouchStart: pause('touch', true),
        onTouchEnd: pause('touch', false),
        onTouchCancel: pause('touch', false),
        onFocus: pause('focus', true),
        onBlur: pause('focus', false),
        onWheel: () => {
          hold.current.until = performance.now() + 1800;
        },
      }
    : {};

  const step = (direction) => {
    const el = scrollerRef.current;
    const style = getComputedStyle(el);
    const gap = parseFloat(style.columnGap) || 0;
    el.scrollBy({ left: direction * (el.children[0].offsetWidth + gap) * 1.5, behavior: 'smooth' });
  };

  if (count === 0) return null;

  return (
    <div className={`relative ${className}`} role="region" aria-roledescription="carousel" aria-label={label} {...hoverProps}>
      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className={`carousel-scroller flex overflow-x-auto overscroll-x-contain ${autoplay ? '' : 'snap-x snap-proximity'} ${fade ? 'carousel-fade' : ''} ${gapClassName}`}
      >
        {Array.from({ length: loop ? SETS : 1 }).map((_, set) =>
          items.map((item, i) => {
            const isClone = loop && set !== 1;
            return (
              <div
                key={`${set}-${i}`}
                className={`shrink-0 snap-start ${itemClassName}`}
                {...(isClone ? { 'aria-hidden': true, inert: true } : {})}
              >
                {renderItem(item, i)}
              </div>
            );
          })
        )}
      </div>

      {fade && (
        <>
          <span aria-hidden="true" className="carousel-blur carousel-blur-left" />
          <span aria-hidden="true" className="carousel-blur carousel-blur-right" />
        </>
      )}

      {arrows && loop && (
        <>
          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous"
            className="absolute left-3 top-1/3 z-10 hidden h-11 w-11 items-center justify-center border border-stone-300 bg-paper/95 text-ink shadow-sm transition-colors hover:bg-ink hover:text-paper md:flex"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next"
            className="absolute right-3 top-1/3 z-10 hidden h-11 w-11 items-center justify-center border border-stone-300 bg-paper/95 text-ink shadow-sm transition-colors hover:bg-ink hover:text-paper md:flex"
          >
            ›
          </button>
        </>
      )}
    </div>
  );
}
