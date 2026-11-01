import { Canvas } from '@react-three/fiber';
import type { SkillsUniverseProps } from '../types';

export default function SkillsUniverse({ active, quality, className }: SkillsUniverseProps) {
  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={quality === 'low' ? [1, 1.5] : [1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <mesh>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="#9FD4FF" wireframe />
        </mesh>
      </Canvas>
    </div>
  );
}
