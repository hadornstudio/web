import { useEffect, useRef } from 'react';

export function frameUrl(set, index1) {
  return `${set.base}frame_${String(index1).padStart(set.pad, '0')}.${set.ext}`;
}

const EAGER = 20; // compressed frames fetched immediately, in parallel
const FETCH_POOL = 6;
const DECODE_POOL = 4;
const DECODE_AHEAD = 18; // decoded frames kept in the scroll direction...
const DECODE_BEHIND = 5; // ...and behind it, for a quick reverse

// A full-HD film decoded is ~1.6 GB, which no browser keeps, so a plain <img> sequence re-decodes frames on the
// main thread mid-scroll (the lag). Instead: keep every frame as a small compressed Blob, and decode only a window
// around the playhead into ImageBitmaps (off the main thread, at the size the screen actually needs).
function createStore(set, onFrame) {
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
      const res = await fetch(frameUrl(set, i + 1));
      if (!res.ok) return;
      blobs[i] = await res.blob();
      if (!closed) pump();
    } catch {
      // network hiccup: the frame is simply missing; nearest() covers it
    }
  };

  (async () => {
    await fetchFrame(0);
    await Promise.all(Array.from({ length: Math.min(EAGER, n) - 1 }, (_, k) => fetchFrame(k + 1)));
    let next = EAGER;
    const worker = async () => {
      while (!closed && next < n) await fetchFrame(next++);
    };
    await Promise.all(Array.from({ length: FETCH_POOL }, worker));
  })();

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

export function useFrameSequence(set, onFrame) {
  const storeRef = useRef(null);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    const store = createStore(set, (i) => onFrameRef.current?.(i));
    storeRef.current = store;
    return () => {
      store.close();
      if (storeRef.current === store) storeRef.current = null;
    };
  }, [set]);

  return storeRef;
}
