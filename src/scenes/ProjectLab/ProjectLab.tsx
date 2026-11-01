import { Canvas } from '@react-three/fiber';
import type { ProjectLabProps } from '../types';

export default function ProjectLab({ active, quality, className }: ProjectLabProps) {
  return (
    <div className={`relative w-full h-full ${className ?? ''}`}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={quality === 'low' ? [1, 1.5] : [1, 2]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#FFB86B" wireframe />
        </mesh>
      </Canvas>
    </div>
  );
}
