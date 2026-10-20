import { Component, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import DressModel from '../showroom/DressModel';

class Boundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidUpdate(prev) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }
  render() {
    return this.state.error ? (
      <div className="flex h-full items-center justify-center bg-night px-6 text-center text-sm text-ivory/80">
        Could not load this model. Check the link, and that the file is a .splat or .glb.
      </div>
    ) : (
      this.props.children
    );
  }
}

// Same viewer the showroom uses, on a plinth, so the owner can tune size and orientation before saving.
export default function ModelPreview({ model }) {
  return (
    <div className="h-[420px] w-full overflow-hidden border border-stone-300 bg-night">
      <Boundary resetKey={`${model.url}|${model.format}`}>
        <Canvas camera={{ fov: 45, position: [0, 1.3, 3.6], near: 0.05, far: 50 }} dpr={[1, 1.5]}>
          <color attach="background" args={['#14100c']} />
          <hemisphereLight args={['#fff1da', '#6b4a2b', 1.15]} />
          <directionalLight position={[2, 4, 3]} intensity={0.6} />
          <mesh position={[0, 0.08, 0]}>
            <cylinderGeometry args={[0.5, 0.53, 0.16, 48]} />
            <meshStandardMaterial color="#241a13" roughness={0.45} metalness={0.15} />
          </mesh>
          <gridHelper args={[6, 12, '#4a3a2c', '#2a2018']} position={[0, 0.001, 0]} />
          <Suspense fallback={null}>
            <DressModel key={`${model.url}|${model.format}`} model={model} spin={0.25} position={[0, 0.16, 0]} />
          </Suspense>
          <OrbitControls target={[0, 0.16 + (model.height || 1.7) / 2, 0]} enablePan={false} minDistance={1} maxDistance={8} />
        </Canvas>
      </Boundary>
    </div>
  );
}
