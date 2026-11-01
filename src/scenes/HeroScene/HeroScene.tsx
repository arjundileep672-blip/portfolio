import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { Sparkles } from 'lucide-react';
import type { HeroSceneProps } from '../types';
import { HeroSculpture } from './components/HeroSculpture';
import { StudioEnvironment } from '../shared/StudioEnvironment';

const MORPH_STATES = [
  { id: 0, code: '01', name: 'HARMONIC GEODESIC' },
  { id: 1, code: '02', name: 'GYROID LATTICE' },
  { id: 2, code: '03', name: 'TECTONIC SPIRE' },
  { id: 3, code: '04', name: 'SINGULARITY FOLD' },
] as const;

const DEFAULT_CAM_POS = new THREE.Vector3(0, 0, 5.2);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

function CameraRig({
  engaged,
  resetCounter,
}: {
  engaged: boolean;
  resetCounter: number;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const resettingRef = useRef(false);

  useEffect(() => {
    if (resetCounter > 0) {
      resettingRef.current = true;
    }
  }, [resetCounter]);

  useFrame(({ camera }, delta) => {
    if (!resettingRef.current || !controlsRef.current) return;
    const dt = Math.min(delta, 0.05);
    camera.position.lerp(DEFAULT_CAM_POS, Math.min(1, dt * 6.5));
    controlsRef.current.target.lerp(DEFAULT_TARGET, Math.min(1, dt * 6.5));
    controlsRef.current.update();

    if (
      camera.position.distanceTo(DEFAULT_CAM_POS) < 0.02 &&
      controlsRef.current.target.distanceTo(DEFAULT_TARGET) < 0.02
    ) {
      camera.position.copy(DEFAULT_CAM_POS);
      controlsRef.current.target.copy(DEFAULT_TARGET);
      controlsRef.current.update();
      resettingRef.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableRotate
      enableZoom={engaged}
      enablePan={false}
      enableDamping
      dampingFactor={0.06}
      rotateSpeed={0.75}
      zoomSpeed={0.8}
      minDistance={2.8}
      maxDistance={8.2}
      onStart={() => {
        resettingRef.current = false;
      }}
    />
  );
}

export default function HeroScene({
  active,
  quality,
  reducedMotion,
  engaged,
  resetSignal,
  secretSignal,
  onInteract,
  className = '',
}: HeroSceneProps) {
  const [morphIndex, setMorphIndex] = useState(0);
  const [secretActive, setSecretActive] = useState(false);
  const [pulseTrigger, setPulseTrigger] = useState(0);
  const [resetCounter, setResetCounter] = useState(0);

  const prevResetSignal = useRef(resetSignal);
  const prevSecretSignal = useRef(secretSignal);

  const handleTransform = useCallback(() => {
    setMorphIndex((prev) => (prev + 1) % MORPH_STATES.length);
    setPulseTrigger((prev) => prev + 1);
    onInteract?.('transform');
  }, [onInteract]);

  const handleReset = useCallback(() => {
    setMorphIndex(0);
    setSecretActive(false);
    setResetCounter((prev) => prev + 1);
    onInteract?.('reset');
  }, [onInteract]);

  // Respond to external resetSignal from Hero "Reset camera" button
  useEffect(() => {
    if (resetSignal !== prevResetSignal.current) {
      prevResetSignal.current = resetSignal;
      handleReset();
    }
  }, [resetSignal, handleReset]);

  // Respond to external secretSignal (Konami code / terminal `unbound --unleash`)
  useEffect(() => {
    if (secretSignal !== prevSecretSignal.current) {
      prevSecretSignal.current = secretSignal;
      setSecretActive((prev) => !prev);
      setPulseTrigger((prev) => prev + 1);
      onInteract?.('secret');
    }
  }, [secretSignal, onInteract]);

  const currentMorph = MORPH_STATES[morphIndex % MORPH_STATES.length];

  return (
    <div className={`relative h-full w-full select-none ${className}`}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={quality === 'low' ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 0, 5.2], fov: 42, near: 0.1, far: 50 }}
        gl={{ alpha: true, antialias: quality !== 'low', powerPreference: 'high-performance' }}
      >
        <AdaptiveDpr pixelated />
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 6, 5]} intensity={1.8} color="#F2F2EA" />
        <pointLight position={[-4, -3, 3]} intensity={1.2} color="#C5FF55" distance={14} />
        {quality === 'high' && <StudioEnvironment preset="acid" intensity={0.9} />}

        <HeroSculpture
          quality={quality}
          reducedMotion={reducedMotion}
          morphIndex={morphIndex}
          secretActive={secretActive}
          pulseTrigger={pulseTrigger}
          resetTrigger={resetCounter}
          onTransform={handleTransform}
          onReset={handleReset}
        />

        <CameraRig engaged={engaged} resetCounter={resetCounter} />
      </Canvas>

      {/* Accessible Interactive Morph Mode Pill (top-right on mobile, mid-right on desktop) */}
      <div className="pointer-events-auto absolute right-5 top-20 z-20 hidden sm:flex items-center gap-2 lg:right-14 lg:top-1/2 lg:-translate-y-1/2 lg:flex-col lg:items-end">
        <button
          type="button"
          onClick={handleTransform}
          className="ub-btn !min-h-[34px] !px-2.5 !py-1 bg-ink/85 backdrop-blur-sm"
          title="Click to transform 3D sculpture geometry"
          aria-label={`Sculpture state ${currentMorph.code} ${currentMorph.name}. Activate to transform.`}
        >
          <Sparkles size={12} className="text-acid" aria-hidden />
          <span>
            {secretActive ? 'OVERDRIVE // UNLEASHED' : `${currentMorph.code} // ${currentMorph.name}`}
          </span>
        </button>
      </div>
    </div>
  );
}
