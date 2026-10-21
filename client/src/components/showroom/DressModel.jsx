import { use, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Splat, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import SpinPiece from './SpinPiece';

// The converter script (scripts/ply-to-splat.mjs) normalises captures to this height, so `model.height` is a scale
// relative to it. Files that did not go through the converter can be sized by hand in the admin preview.
const SPLAT_NATIVE_HEIGHT = 1.7;

// drei's <Splat> sizes its buffers from the response's Content-Length header, which servers and CDNs drop when they
// compress (chunked transfer). So download the file here and hand the loader a blob: URL, whose size is always known.
// Cached per URL for the session: coming back to a piece reuses the same blob URL, so the splat renderer finds its
// already-uploaded buffers instead of downloading and uploading the file again.
const blobs = new Map(); // url -> { promise, blobUrl }
function acquireBlob(url) {
  let entry = blobs.get(url);
  if (!entry) {
    entry = { blobUrl: null };
    entry.promise = fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return res.blob();
      })
      .then((blob) => (entry.blobUrl = URL.createObjectURL(blob)));
    blobs.set(url, entry);
  }
  return entry;
}

function SplatPiece({ url, scale }) {
  const entry = acquireBlob(url);
  const src = use(entry.promise); // suspends while downloading; a failed download reaches the bay's error boundary
  return <Splat src={src} scale={scale} />;
}

function GlbPiece({ url, height }) {
  const { scene } = useGLTF(url);
  // Fit to `height` metres, centred on its footprint and standing on y = 0. Cloned so one file can be shown twice.
  const { object, scale } = useMemo(() => {
    const clone = scene.clone(true);
    // Unlit (baked-lighting) materials already carry the photographed light: no tone mapping on top of it.
    clone.traverse((o) => o.isMesh && o.material?.isMeshBasicMaterial && (o.material.toneMapped = false));
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const k = height / Math.max(1e-6, size.y);
    clone.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    const holder = new THREE.Group();
    holder.add(clone);
    return { object: holder, scale: k };
  }, [scene, height]);
  return <primitive object={object} scale={scale} />;
}

// One showroom piece: a splat or glb, normalised and hand-adjusted, turning slowly on the spot.
//   model       { url, format, height, rotation: [x, y, z] degrees, offsetY }
//   inputRef    showroom gesture state; `orbitS` (smoothed drag) is added to the idle spin while inspecting
//   spin        idle turntable speed in rad/s (0 = still)
export default function DressModel(props) {
  // A photographic turntable (frames of a video) is a different kind of object from a mesh or splat.
  return props.model.format === 'spin' ? <SpinPiece {...props} /> : <MeshPiece {...props} />;
}

function MeshPiece({ model, inputRef, spin = 0.18, position = [0, 0, 0] }) {
  const group = useRef();
  const base = useRef(0);
  const [rx, ry, rz] = model.rotation || [0, 0, 0];
  const height = model.height || SPLAT_NATIVE_HEIGHT;

  useFrame((_, dt) => {
    if (!group.current) return;
    base.current += spin * dt;
    group.current.rotation.y = base.current + (inputRef?.current?.orbitS || 0);
  });

  // Free the GPU copy of a glb when the piece leaves the scene.
  useEffect(() => () => model.format === 'glb' && useGLTF.clear(model.url), [model.format, model.url]);

  return (
    <group position={position}>
      <group ref={group}>
        <group rotation={[THREE.MathUtils.degToRad(rx), THREE.MathUtils.degToRad(ry), THREE.MathUtils.degToRad(rz)]} position={[0, model.offsetY || 0, 0]}>
          {model.format === 'glb' ? (
            <GlbPiece url={model.url} height={height} />
          ) : (
            // drei's <Splat> assumes the file's y axis points down (COLMAP convention) and flips it; our files are y-up
            // (scripts/ply-to-splat.mjs writes them upright), so flip back.
            <group rotation={[Math.PI, 0, 0]}>
              <SplatPiece url={model.url} scale={height / SPLAT_NATIVE_HEIGHT} />
            </group>
          )}
        </group>
      </group>
    </group>
  );
}
