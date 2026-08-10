import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { prefersReducedMotion } from '../lib/motion/gsapConfig';

const VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Soft, slow-moving noise field — reads as ambient light/grain, not an obvious effect.
// Blended at low alpha via mix-blend-soft-light on the canvas element itself.
const FRAGMENT_SHADER = `
  varying vec2 vUv;
  uniform float uTime;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  void main() {
    vec2 p = vUv * 3.0 + vec2(uTime * 0.02, uTime * 0.015);
    float n = noise(p) * 0.6 + noise(p * 2.0) * 0.4;
    gl_FragColor = vec4(vec3(n), 0.12);
  }
`;

export function useHeroShimmer() {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (prefersReducedMotion() || !canvasRef.current) return;

    const canvas = canvasRef.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    } catch {
      return; // WebGL unavailable — canvas stays empty, falls back to the static image beneath it.
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const geometry = new THREE.PlaneGeometry(2, 2);
    const uniforms = { uTime: { value: 0 } };
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX_SHADER,
      fragmentShader: FRAGMENT_SHADER,
      uniforms,
      transparent: true,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const resize = () => {
      const { clientWidth, clientHeight } = canvas;
      renderer.setSize(clientWidth, clientHeight, false);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    };
    resize();
    window.addEventListener('resize', resize);

    let frameId;
    const clock = new THREE.Clock();
    const animate = () => {
      uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return canvasRef;
}
