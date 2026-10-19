import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { gsap } from '../../lib/motion/gsapConfig';
import { isLowEndDevice } from '../../utils/webgl';
import { SHOWROOM, bayLayout, hallEndZ, standDistance, baseFov } from './showroomConfig';

const UP = new THREE.Vector3(0, 1, 0);
const GOLD = '#c9a45c';

function stopFor(index, aspect, work) {
  const { width, eyeHeight, startZ } = SHOWROOM.hall;
  if (index < 0) return { pos: new THREE.Vector3(0, eyeHeight, startZ), look: new THREE.Vector3(0, eyeHeight, -30) };
  const { side, z } = bayLayout(index);
  const x = side * (width / 2 - standDistance(aspect));
  // Bays with extra photos hang them to the right of the main piece, so aim a little that way.
  const shift = work?.images?.length > 1 ? 0.55 : 0;
  const lookZ = z + (side < 0 ? -shift : shift);
  // On short/portrait screens the story card covers the bottom of the view, so aim lower to lift the piece above it.
  const lift = Math.min(1, Math.max(0, (1.7 - aspect) / 1.1)) * 0.75 + 0.08;
  return { pos: new THREE.Vector3(x, eyeHeight, z), look: new THREE.Vector3(side * (width / 2), 1.55 - lift, lookZ) };
}

// Procedural textures keep the placeholder room free of image downloads.
function useRoomTextures() {
  const textures = useMemo(() => {
    const floor = document.createElement('canvas');
    floor.width = floor.height = 512;
    const g = floor.getContext('2d');
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    g.fillStyle = '#7c5535';
    g.fillRect(0, 0, 512, 512);
    const rowH = 32;
    for (let y = 0; y < 512; y += rowH) {
      let x = -rand() * 200;
      while (x < 512) {
        const len = 140 + rand() * 120;
        const tone = 118 + rand() * 40;
        g.fillStyle = `rgb(${tone + 24}, ${tone - 8}, ${tone - 52})`;
        g.fillRect(x + 1, y + 1, len - 2, rowH - 2);
        x += len;
      }
    }
    const floorTex = new THREE.CanvasTexture(floor);
    floorTex.colorSpace = THREE.SRGBColorSpace;
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.anisotropy = 4;

    const glow = document.createElement('canvas');
    glow.width = glow.height = 128;
    const gg = glow.getContext('2d');
    const grad = gg.createRadialGradient(64, 64, 0, 64, 64, 64);
    grad.addColorStop(0, 'rgba(255,236,200,0.55)');
    grad.addColorStop(1, 'rgba(255,236,200,0)');
    gg.fillStyle = grad;
    gg.fillRect(0, 0, 128, 128);
    const glowTex = new THREE.CanvasTexture(glow);
    glowTex.colorSpace = THREE.SRGBColorSpace;
    return { floorTex, glowTex };
  }, []);

  // The canvases were created by hand, so the renderer won't free them when the hall unmounts.
  useEffect(() => () => {
    textures.floorTex.dispose();
    textures.glowTex.dispose();
  }, [textures]);

  return textures;
}

function Room({ count }) {
  const { width: W, height: H, startZ } = SHOWROOM.hall;
  const endZ = hallEndZ(count);
  const length = startZ + 1.5 - endZ;
  const cz = (startZ + 1.5 + endZ) / 2;
  const { floorTex, glowTex } = useRoomTextures();

  useEffect(() => {
    floorTex.repeat.set(W / 2.2, length / 2.2);
    floorTex.needsUpdate = true;
  }, [floorTex, W, length]);

  const wall = <meshStandardMaterial color="#ebe3d4" roughness={1} />;
  const trackZs = useMemo(() => {
    const zs = [];
    for (let z = startZ - 1; z > endZ + 1; z -= 2.5) zs.push(z);
    return zs;
  }, [startZ, endZ]);

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, cz]}>
        <planeGeometry args={[W, length]} />
        <meshStandardMaterial map={floorTex} roughness={0.55} />
      </mesh>
      <mesh rotation-x={Math.PI / 2} position={[0, H, cz]}>
        <planeGeometry args={[W, length]} />
        <meshStandardMaterial color="#e2d9c7" roughness={1} />
      </mesh>
      <mesh rotation-y={Math.PI / 2} position={[-W / 2, H / 2, cz]}>
        <planeGeometry args={[length, H]} />
        {wall}
      </mesh>
      <mesh rotation-y={-Math.PI / 2} position={[W / 2, H / 2, cz]}>
        <planeGeometry args={[length, H]} />
        {wall}
      </mesh>
      <mesh position={[0, H / 2, endZ]}>
        <planeGeometry args={[W, H]} />
        {wall}
      </mesh>
      <mesh rotation-y={Math.PI} position={[0, H / 2, startZ + 1.5]}>
        <planeGeometry args={[W, H]} />
        {wall}
      </mesh>

      {/* the dark doorway at the far end, as in the film */}
      <mesh position={[0, 1.3, endZ + 0.02]}>
        <planeGeometry args={[1.6, 2.6]} />
        <meshBasicMaterial color="#0b0806" />
      </mesh>
      <mesh position={[0, 1.3, endZ + 0.01]}>
        <planeGeometry args={[1.9, 2.8]} />
        <meshStandardMaterial color="#d9cfbd" roughness={1} />
      </mesh>

      {/* skirting */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (W / 2 - 0.02), 0.09, cz]}>
          <boxGeometry args={[0.04, 0.18, length]} />
          <meshStandardMaterial color="#d9cfbd" roughness={1} />
        </mesh>
      ))}

      {/* ceiling track lights */}
      {trackZs.map((z) => (
        <group key={z}>
          {[-1.8, 1.8].map((x) => (
            <mesh key={x} position={[x, H - 0.12, z]}>
              <cylinderGeometry args={[0.07, 0.09, 0.14, 12]} />
              <meshBasicMaterial color="#ffe9c2" toneMapped={false} />
            </mesh>
          ))}
        </group>
      ))}

      {/* soft pools of light on the floor along the hall */}
      {trackZs.map((z) =>
        [-1.8, 1.8].map((x) => (
          <mesh key={`${z}-${x}`} rotation-x={-Math.PI / 2} position={[x, 0.012, z]}>
            <planeGeometry args={[3.2, 3.2]} />
            <meshBasicMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </mesh>
        ))
      )}
    </group>
  );
}

function ArtPanel({ url, height, maxWidth, position }) {
  const texture = useTexture(url);
  // drei caches loaded textures forever; free the GPU copy (and the cache entry) when this bay is no longer near.
  useEffect(() => () => {
    texture.dispose();
    useTexture.clear(url);
  }, [texture, url]);
  const img = texture.image;
  const aspect = img.width / img.height;
  let h = height;
  let w = h * aspect;
  if (w > maxWidth) {
    w = maxWidth;
    h = w / aspect;
  }
  return (
    <group position={position}>
      <mesh position={[0, 0, -0.025]}>
        <boxGeometry args={[w + 0.16, h + 0.16, 0.05]} />
        <meshStandardMaterial color="#1b1511" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0, 0.002]}>
        <planeGeometry args={[w + 0.07, h + 0.07]} />
        <meshBasicMaterial color="#f4ede1" />
      </mesh>
      <mesh position={[0, 0, 0.004]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Placeholder({ position, size = [1.6, 1.2] }) {
  return (
    <mesh position={position}>
      <planeGeometry args={size} />
      <meshBasicMaterial color="#cfc6b4" />
    </mesh>
  );
}

function Bay({ work, index, near, glowTex }) {
  const { side, z } = bayLayout(index);
  const rotY = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  const [main, ...extras] = work.images;
  const smalls = extras.slice(0, 2);

  return (
    <group position={[side * (SHOWROOM.hall.width / 2), 0, z]} rotation={[0, rotY, 0]}>
      <mesh position={[0.4, 1.6, 0.01]}>
        <planeGeometry args={[6, 3.6]} />
        <meshBasicMaterial map={glowTex} transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {near && main ? (
        <>
          <Suspense fallback={<Placeholder position={[0, 1.55, 0.01]} />}>
            <ArtPanel url={main} height={1.5} maxWidth={2.2} position={[0, 1.55, 0.03]} />
          </Suspense>
          {smalls.map((url, i) => (
            <Suspense key={url} fallback={null}>
              <ArtPanel url={url} height={0.85} maxWidth={1.1} position={[1.95, i === 0 ? 2.0 : 0.95, 0.03]} />
            </Suspense>
          ))}
        </>
      ) : (
        <Placeholder position={[0, 1.55, 0.01]} />
      )}
    </group>
  );
}

function Marker({ position, onSelect }) {
  const ring = useRef();
  const beam = useRef();
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    ring.current.scale.setScalar(1 + Math.sin(t * 2.4) * 0.09);
    ring.current.material.opacity = 0.65 + Math.sin(t * 2.4) * 0.25;
    beam.current.material.opacity = 0.12 + Math.sin(t * 2.4) * 0.05;
  });
  return (
    <group
      position={position}
      onClick={(e) => {
        if (e.delta > 6) return; // that was a drag, not a tap
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <mesh ref={ring} rotation-x={-Math.PI / 2} position-y={0.02}>
        <ringGeometry args={[0.42, 0.58, 48]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.9} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.015}>
        <circleGeometry args={[0.38, 32]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.3} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={beam} position-y={0.8}>
        <cylinderGeometry args={[0.3, 0.3, 1.6, 24, 1, true]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.16} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={0.03}>
        <circleGeometry args={[0.8, 20]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}

function CameraRig({ works, index, instant, inputRef }) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  const poseRef = useRef(null);
  if (!poseRef.current) {
    const s = stopFor(index, aspect, works[index]);
    poseRef.current = { pos: s.pos.clone(), look: s.look.clone() };
  }
  const dir = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const pose = poseRef.current;
    const target = stopFor(index, aspect, works[index]);
    gsap.killTweensOf([pose.pos, pose.look]);
    if (instant) {
      pose.pos.copy(target.pos);
      pose.look.copy(target.look);
      return;
    }
    const opts = { duration: SHOWROOM.travelSec, ease: 'power2.inOut' };
    gsap.to(pose.pos, { x: target.pos.x, y: target.pos.y, z: target.pos.z, ...opts });
    gsap.to(pose.look, { x: target.look.x, y: target.look.y, z: target.look.z, ...opts });
  }, [index, aspect, instant, works]);

  useFrame((_, dt) => {
    const pose = poseRef.current;
    const input = inputRef.current;
    const k = 1 - Math.exp(-dt * 8);
    input.yawS += (input.yaw - input.yawS) * k;
    input.pitchS += (input.pitch - input.pitchS) * k;
    input.fovS += (input.fov - input.fovS) * k;

    dir.copy(pose.look).sub(pose.pos).normalize();
    dir.applyAxisAngle(UP, input.yawS);
    right.copy(dir).cross(UP).normalize();
    dir.applyAxisAngle(right, input.pitchS);

    camera.position.copy(pose.pos);
    camera.lookAt(pose.pos.x + dir.x, pose.pos.y + dir.y, pose.pos.z + dir.z);
    // input.fovS is a zoom factor around 50 (pinch / ctrl+wheel); the lens itself widens on portrait screens.
    const fov = baseFov(aspect) * (input.fovS / 50);
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}

function SceneContents({ works, index, instant, inputRef, onSelect }) {
  const { glowTex } = useRoomTextures();
  const { size } = useThree();
  const aspect = size.width / size.height;
  const [loaded, setLoaded] = useState(() => new Set());

  // Stream bays in as the visitor approaches: first three up front, then a window around the current one.
  useEffect(() => {
    setLoaded((prev) => {
      const next = new Set(prev);
      works.forEach((_, i) => {
        if (i < 3 || Math.abs(i - index) <= 2) next.add(i);
      });
      return next.size === prev.size ? prev : next;
    });
  }, [works, index]);

  return (
    <>
      <color attach="background" args={['#14100c']} />
      <fog attach="fog" args={['#1d1611', 18, 40]} />
      <hemisphereLight args={['#fff1da', '#6b4a2b', 1.15]} />
      <directionalLight position={[2, 4, 3]} intensity={0.55} />
      <CameraRig works={works} index={index} instant={instant} inputRef={inputRef} />
      <Room count={works.length} />
      {works.map((work, i) => (
        <Bay key={work.id} work={work} index={i} near={loaded.has(i)} glowTex={glowTex} />
      ))}
      {works.map((work, i) => {
        if (i === index) return null;
        const { side, z } = bayLayout(i);
        return (
          <Marker
            key={work.id}
            position={[side * (SHOWROOM.hall.width / 2 - standDistance(aspect)), 0, z]}
            onSelect={() => onSelect(i)}
          />
        );
      })}
    </>
  );
}

const LOW_END = isLowEndDevice();

export default function GalleryScene({ onReady, ...props }) {
  return (
    <Canvas
      dpr={LOW_END ? 1 : [1, 1.5]}
      camera={{ fov: 50, near: 0.1, far: 80 }}
      gl={{ antialias: !LOW_END, powerPreference: LOW_END ? 'default' : 'high-performance' }}
      onCreated={() => onReady?.()}
      aria-hidden="true"
    >
      <SceneContents {...props} />
    </Canvas>
  );
}
