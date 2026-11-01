import { Canvas } from '@react-three/fiber';
import type { PlaygroundProps } from '../types';

export default function Playground({ active, quality, className }: PlaygroundProps) {
  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={quality === 'low' ? [1, 1.5] : [1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <mesh>
          <torusKnotGeometry args={[0.8, 0.25, 64, 16]} />
          <meshStandardMaterial color="#C5FF55" wireframe />
        </mesh>
      </Canvas>
    </div>
  );
}
