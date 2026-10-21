import { readFileSync } from 'node:fs';
const W = 90, H = 160, N = 300, buf = readFileSync('/Users/user/Desktop/Hadorn/capture-work/new/gray/all.raw');
const fr = (n, flip = false) => { const o = n * W * H, a = new Float32Array(W * H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) a[y * W + x] = buf[o + y * W + (flip ? W - 1 - x : x)]; return a; };
const diff = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]); return s / a.length; };
// 1. how symmetric is the dress seen from the front? (frame 0 vs its mirror)
console.log('front vs mirrored front:', diff(fr(0), fr(0, true)).toFixed(2), ' (frame 0 vs frame 3:', diff(fr(0), fr(3)).toFixed(2) + ')');
// 2. where in the clip does the mirror of an early frame reappear? (the clip rotates past 180 deg)
for (const m of [60, 100, 135, 160]) {
  let best = [1e9, -1];
  for (let n = 150; n < N; n++) { const d = diff(fr(m, true), fr(n)); if (d < best[0]) best = [d, n]; }
  console.log(`mirror of frame ${m} best matches frame ${best[1]} (diff ${best[0].toFixed(2)})`);
}
// 3. speed: frame-to-frame change over the clip
const sp = []; for (let n = 0; n < N - 5; n += 25) sp.push(diff(fr(n), fr(n + 5)).toFixed(1)); console.log('change per 5 frames, every 25:', sp.join(' '));
// 4. how close is the last frame to a mirrored early frame (the join)?
let jb = [1e9, -1]; for (let m = 0; m < 250; m++) { const d = diff(fr(N - 1), fr(m, true)); if (d < jb[0]) jb = [d, m]; }
console.log('last frame best matches mirrored frame', jb[1], 'diff', jb[0].toFixed(2));
