import { useEffect, useRef } from 'react';

export function frameUrl(set, index1) {
  return `${set.base}frame_${String(index1).padStart(set.pad, '0')}.${set.ext}`;
}

const EAGER = 12; // compressed frames fetched first, in parallel (once the page is idle)
const FETCH_POOL = 6;
const DECODE_POOL = 4;
const DECODE_AHEAD = 18; // decoded frames kept in the scroll direction...
const DECODE_BEHIND = 5; // ...and behind it, for a quick reverse
const LAZY_AHEAD = 48; // on slow / data-saver connections, only fetch this far past the playhead

// Data-saver or a slow link: don't pull the whole film for someone who may never scroll it.
function constrainedConnection() {
  const c = typeof navigator !== 'undefined' ? navigator.connection : null;
  return Boolean(c && (c.saveData || /^(slow-2g|2g|3g)$/.test(c.effectiveType || '')));
}

// A full-HD film decoded is ~1.6 GB, which no browser keeps, so a plain <img> sequence re-decodes frames on the
// main thread mid-scroll (the lag). Instead: keep every frame as a small compressed Blob, and decode only a window
// around the playhead into ImageBitmaps (off the main thread, at the size the screen actually needs).
function createStore(set, onFrame, eager = false) {
  const n = set.frames;
  const blobs = new Array(n);
  const bitmaps = new Map();
  const decoding = new Set();
  let decodeWidth = set.width;
  let focusIdx = 0;
  let dir = 1;
  let active = 0;
  let closed = false;

  const range = () => {
    const lo = dir >= 0 ? focusIdx - DECODE_BEHIND : focusIdx - DECODE_AHEAD;
    const hi = dir >= 0 ? focusIdx + DECODE_AHEAD : focusIdx + DECODE_BEHIND;
    return [Math.max(0, lo), Math.min(n - 1, hi)];
  };

  const pump = () => {
    if (closed) return;
    const [lo, hi] = range();
    for (const [i, bm] of bitmaps) {
      if (i < lo - 4 || i > hi + 4) {
        bm.close();
        bitmaps.delete(i);
      }
    }
    // nearest-to-playhead first
    const wanted = [];
    for (let i = lo; i <= hi; i++) if (blobs[i] && !bitmaps.has(i) && !decoding.has(i)) wanted.push(i);
    wanted.sort((a, b) => Math.abs(a - focusIdx) - Math.abs(b - focusIdx));
    for (const i of wanted) {
      if (active >= DECODE_POOL) break;
      active += 1;
      decoding.add(i);
      const width = decodeWidth;
      createImageBitmap(blobs[i], { resizeWidth: width, resizeQuality: 'high' })
        .then((bm) => {
          decoding.delete(i);
          active -= 1;
          const [l, h] = range();
          if (closed || width !== decodeWidth || i < l - 4 || i > h + 4) bm.close();
          else {
            bitmaps.set(i, bm);
            onFrame?.(i);
          }
          pump();
        })
        .catch(() => {
          decoding.delete(i);
          active -= 1;
          blobs[i] = undefined; // undecodable: skip it, nearest() will cover the gap
        });
    }
  };

  const fetchFrame = async (i) => {
    try {
      // Frame 1 is also the poster <img> (cached, high priority); everything else must never compete with
      // the page's own content, so it goes out at low priority.
      const res = await fetch(frameUrl(set, i + 1), { priority: i === 0 ? 'high' : 'low' });
      if (!res.ok) return;
      blobs[i] = await res.blob();
      if (!closed) pump();
    } catch {
      // network hiccup: the frame is simply missing; nearest() covers it
    }
  };

  // Start after the first paint settles: the poster alone is enough to show, and the film's frames are
  // only needed once the visitor begins to scroll.
  const whenIdle = (fn) => {
    if (typeof requestIdleCallback === 'function') requestIdleCallback(fn, { timeout: 1500 });
    else setTimeout(fn, 600);
  };

  const run = async () => {
    if (closed) return;
    await fetchFrame(0);
    await Promise.all(Array.from({ length: Math.min(EAGER, n) - 1 }, (_, k) => fetchFrame(k + 1)));
    let next = EAGER;
    const lazy = constrainedConnection();
    const worker = async () => {
      while (!closed && next < n) {
        if (lazy && next > focusIdx + LAZY_AHEAD) {
          await new Promise((r) => setTimeout(r, 300));
          continue;
        }
        await fetchFrame(next++);
      }
    };
    await Promise.all(Array.from({ length: FETCH_POOL }, worker));
  };
  // A piece the visitor is about to look at should appear at once; the home film can wait for the page to settle.
  if (eager) run();
  else whenIdle(run);

  return {
    // Move the playhead; decodes the window around it.
    focus(idx, direction = 1) {
      focusIdx = idx;
      dir = direction;
      pump();
    },
    // How wide decoded frames need to be for the current screen (smaller screens decode far less memory).
    setDecodeWidth(width) {
      const next = Math.max(320, Math.min(set.width, Math.round(width)));
      if (Math.abs(next - decodeWidth) / decodeWidth < 0.15) return;
      decodeWidth = next;
      for (const bm of bitmaps.values()) bm.close();
      bitmaps.clear();
      pump();
    },
    // The decoded frame closest to idx (exact when ready), or null before the first one lands.
    nearest(idx) {
      const exact = bitmaps.get(idx);
      if (exact) return exact;
      for (let d = 1; d < 40; d++) {
        const hit = bitmaps.get(idx - d) || bitmaps.get(idx + d);
        if (hit) return hit;
      }
      return null;
    },
    close() {
      closed = true;
      for (const bm of bitmaps.values()) bm.close();
      bitmaps.clear();
    },
  };
}

export function useFrameSequence(set, onFrame, { eager = false } = {}) {
  const storeRef = useRef(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    const store = createStore(set, (i) => onFrameRef.current?.(i), eager);
    storeRef.current = store;
    return () => {
      store.close();
      if (storeRef.current === store) storeRef.current = null;
    };
  }, [set]);

  return storeRef;
}
