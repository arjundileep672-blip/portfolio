import { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Lightformer } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { HeroSceneProps } from '../types';
import Sculpture from './Sculpture';
import Particles from './Particles';

function CameraRig({
  resetSignal,
  engaged,
}: {
  resetSignal: number;
  engaged: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const lastResetRef = useRef(resetSignal);

  useEffect(() => {
    if (resetSignal !== lastResetRef.current && controlsRef.current) {
      lastResetRef.current = resetSignal;
      controlsRef.current.reset();
    }
  }, [resetSignal]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={engaged}
      enablePan={false}
      enableRotate={true}
      rotateSpeed={0.8}
      minDistance={3.2}
      maxDistance={7.5}
      dampingFactor={0.06}
      makeDefault
    />
  );
}

export default function HeroScene({
  active,
  quality,
  reducedMotion,
  engaged,
  className,
  resetSignal = 0,
  secretSignal = 0,
  onInteract,
}: HeroSceneProps) {
  return (
    <div className={`relative w-full h-full select-none ${className ?? ''}`}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={quality === 'low' ? [1, 1.5] : [1, 2]}
        gl={{
          alpha: true,
          antialias: quality !== 'low',
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 0, 5.2], fov: 45 }}
      >
        <ambientLight intensity={0.4} />

        {/* Acid green key accent light */}
        <directionalLight position={[4, 5, 3]} intensity={1.8} color="#C5FF55" />

        {/* Soft cool fill light */}
        <directionalLight position={[-4, -3, -2]} intensity={0.5} color="#858B80" />

        {/* Procedural offline studio environment via Lightformers */}
        <Environment resolution={quality === 'low' ? 64 : 128}>
          <group rotation={[-Math.PI / 4, -0.6, 0]}>
            <Lightformer
              form="rect"
              intensity={2.5}
              color="#C5FF55"
              position={[5, 2, -2]}
              scale={[10, 5, 1]}
            />
            <Lightformer
              form="circle"
              intensity={1.2}
              color="#ffffff"
              position={[-5, 3, 2]}
              scale={[5, 5, 1]}
            />
            <Lightformer
              form="ring"
              intensity={0.8}
              color="#858B80"
              position={[0, -5, -2]}
              scale={[8, 8, 1]}
            />
          </group>
        </Environment>

        <Sculpture
          quality={quality}
          reducedMotion={reducedMotion}
          resetSignal={resetSignal}
          secretSignal={secretSignal}
          onInteract={onInteract}
        />

        <Particles
          quality={quality}
          reducedMotion={reducedMotion}
          secretSignal={secretSignal}
        />

        <CameraRig resetSignal={resetSignal} engaged={engaged} />
      </Canvas>
    </div>
  );
}
