import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

const SETS = 3;

// A horizontally swipeable carousel that never ends. It uses native scrolling (so phones keep their own
// momentum and swipe feel): the cards are rendered three times and, whenever the visitor drifts toward
// either edge, the scroll position jumps by exactly one set — invisible, because the sets are identical.
// If every card already fits on screen (e.g. five collection tiles on a wide desktop) it stays a plain,
// non-looping row.
export default function InfiniteCarousel({
  items,
  renderItem,
  itemClassName = 'w-72',
  gapClassName = 'gap-4',
  label,
  arrows = true,
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

  const step = (direction) => {
    const el = scrollerRef.current;
    const style = getComputedStyle(el);
    const gap = parseFloat(style.columnGap) || 0;
    el.scrollBy({ left: direction * (el.children[0].offsetWidth + gap) * 1.5, behavior: 'smooth' });
  };

  if (count === 0) return null;

  return (
    <div className={`relative ${className}`} role="region" aria-roledescription="carousel" aria-label={label}>
      <div ref={scrollerRef} onScroll={onScroll} className={`carousel-scroller flex snap-x snap-proximity overflow-x-auto overscroll-x-contain ${gapClassName}`}>
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
