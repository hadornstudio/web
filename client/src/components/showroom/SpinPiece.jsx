import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useFrameSequence } from '../film/useFrameSequence';

// A piece shown as a photographic turntable: the frames of a video of the piece turning, cut out from their backdrop.
// A flat cutout always faces the visitor; turning the piece (drag in the showroom, orbit in the admin preview) moves
// through the frames, so it reads as the real dress rotating, with all its detail.
//   model.url         base path of the frames:  <url>frame_0001.webp ...
//   model.frames      number of frames in the clip
//   model.mirrorFrom  if the clip stops short of a full turn, the missing arc is filled by playing the first
//                     `mirrorFrom` frames backwards, mirrored (the piece is near-symmetrical). -1 = clip is a full turn.
//   model.height      height of the piece in metres (the cutout is scaled to this)
const BLEND = 8; // frames of crossfade where the real and mirrored runs meet
const smooth01 = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
const clampI = (v, lo, hi) => Math.min(hi, Math.max(lo, Math.round(v)));

export default function SpinPiece({ model, inputRef, spin = 0.18, position = [0, 0, 0], cameraDriven = false }) {
  const F = model.frames || 120;
  const MF = model.mirrorFrom >= 0 ? Math.min(model.mirrorFrom, F - 1) : -1;
  const L = F + (MF >= 0 ? MF + 1 : 0); // frames in one full loop
  const height = model.height || 1.76;

  // two decoders: one follows the real run, one the mirrored run (they can be far apart while crossfading)
  const baseSet = useMemo(() => ({ base: model.url, frames: F, width: 720, height: 1188, pad: 4, ext: 'webp' }), [model.url, F]);
  const mirrorSet = useMemo(() => ({ ...baseSet, frames: MF >= 0 ? Math.min(F, MF + BLEND + 8) : 1 }), [baseSet, MF]);
  const realRef = useFrameSequence(baseSet);
  const mirRef = useFrameSequence(mirrorSet);

  const canvas = useMemo(() => Object.assign(document.createElement('canvas'), { width: 720, height: 1188 }), []);
  const texture = useMemo(() => {
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = false;
    t.minFilter = t.magFilter = THREE.LinearFilter;
    return t;
  }, [canvas]);
  useEffect(() => () => texture.dispose(), [texture]);

  const group = useRef(), mesh = useRef();
  const base = useRef(0), last = useRef({ key: '', p: 0 }), aspect = useRef(0.606);
  const { camera } = useThree();
  const wp = useMemo(() => new THREE.Vector3(), []);

  // which frames (and how strongly) make up position p of the loop
  const layersAt = (p) => {
    const real = (q) => ({ idx: clampI(q, 0, F - 1), flip: false });
    const mir = (q) => ({ idx: clampI(MF - (q - F), 0, F - 1), flip: true });
    if (MF < 0) return [[real(p), 1]];
    if (p < BLEND) p += L; // the start of the loop continues past the end of it
    if (p >= L - BLEND) { const rw = smooth01((p - (L - BLEND)) / (2 * BLEND)); return [[mir(p), 1 - rw], [real(p - L), rw]]; }
    if (p > F - BLEND && p < F + BLEND) { const mw = smooth01((p - (F - BLEND)) / (2 * BLEND)); return [[real(p), 1 - mw], [mir(p), mw]]; }
    return p < F ? [[real(p), 1]] : [[mir(p), 1]];
  };

  useFrame((state, dt) => {
    if (!group.current) return;
    group.current.getWorldPosition(wp);
    const azimuth = Math.atan2(camera.position.x - wp.x, camera.position.z - wp.z);
    group.current.rotation.y = azimuth; // the cutout always faces the viewer

    // how far the piece has been turned: showroom = idle spin + drag; admin preview (cameraDriven) = where the camera is
    base.current += spin * dt;
    const rotY = cameraDriven ? -azimuth : base.current + (inputRef?.current?.orbitS || 0);
    let p = ((-rotY / (Math.PI * 2)) * L) % L;
    if (p < 0) p += L;

    const dir = Math.sign(p - last.current.p) || 1;
    last.current.p = p;
    const layers = layersAt(p);
    layers.forEach(([{ idx, flip }]) => (flip ? mirRef : realRef).current?.focus(idx, dir));

    const key = layers.map(([{ idx, flip }, w]) => `${idx}${flip ? 'm' : 'r'}${w.toFixed(2)}`).join('|');
    if (key === last.current.key) return;
    const ctx = canvas.getContext('2d');
    let drew = false;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'lighter'; // premultiplied add = a true crossfade, no see-through dip
    for (const [{ idx, flip }, w] of layers) {
      const bmp = (flip ? mirRef : realRef).current?.nearest(idx);
      if (!bmp || w <= 0.001) continue;
      ctx.globalAlpha = layers.length > 1 ? w : 1;
      if (flip) { ctx.save(); ctx.translate(canvas.width, 0); ctx.scale(-1, 1); ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height); ctx.restore(); }
      else ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
      aspect.current = bmp.width / bmp.height;
      drew = true;
    }
    ctx.globalAlpha = 1;
    if (drew) {
      last.current.key = key;
      texture.needsUpdate = true;
      if (mesh.current) { mesh.current.visible = true; mesh.current.scale.x = aspect.current / (720 / 1188); }
    }
  });

  const w = height * (720 / 1188);
  return (
    <group position={position}>
      <group ref={group}>
        <mesh ref={mesh} position={[0, height / 2, 0]} visible={false}>
          <planeGeometry args={[w, height]} />
          <meshBasicMaterial map={texture} transparent alphaTest={0.04} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}
