import { useEffect, useRef } from 'react';

export function frameUrl(set, index1) {
  return `${set.base}frame_${String(index1).padStart(set.pad, '0')}.${set.ext}`;
}

const EAGER = 20; // fetched immediately, in parallel
const POOL = 6; // concurrent fetches for the rest

// Loads a frame sequence into memory: first ~20 frames at once, the rest progressively in scroll
// order. `onFrame(index0)` fires as each frame lands so the canvas can repaint if it was waiting.
export function useFrameSequence(set, onFrame) {
  const framesRef = useRef([]);
  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  useEffect(() => {
    let cancelled = false;
    const images = new Array(set.frames);
    framesRef.current = images;

    const load = (i) =>
      new Promise((resolve) => {
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
          if (!cancelled) {
            images[i] = img;
            onFrameRef.current?.(i);
          }
          resolve();
        };
        img.onerror = () => resolve();
        img.src = frameUrl(set, i + 1);
      });

    (async () => {
      await load(0);
      await Promise.all(Array.from({ length: Math.min(EAGER, set.frames) - 1 }, (_, k) => load(k + 1)));

      let next = EAGER;
      const worker = async () => {
        while (!cancelled && next < set.frames) {
          const i = next++;
          await load(i);
        }
      };
      await Promise.all(Array.from({ length: POOL }, worker));
    })();

    return () => {
      cancelled = true;
    };
  }, [set]);

  return framesRef;
}
