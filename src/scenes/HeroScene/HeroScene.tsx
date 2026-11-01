import { useCallback, useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Hand, Sparkles } from 'lucide-react';
import type { HeroSceneProps } from '../types';
import { HeroSculpture } from './components/HeroSculpture';
import { StudioEnvironment } from '../shared/StudioEnvironment';
import { useResponsiveCamera } from '@/hooks/useResponsiveScene';
import { useInputMode } from '@/hooks/useDevice';

const MORPH_STATES = [
  { id: 0, code: '01', name: 'HARMONIC GEODESIC' },
  { id: 1, code: '02', name: 'GYROID LATTICE' },
  { id: 2, code: '03', name: 'TECTONIC SPIRE' },
  { id: 3, code: '04', name: 'SINGULARITY FOLD' },
] as const;

function CameraRig({
  engaged,
  resetCounter,
}: {
  engaged: boolean;
  resetCounter: number;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const resettingRef = useRef(false);
  const { cameraPos, targetPos, isPortrait } = useResponsiveCamera({
    desktopPos: [0, 0, 5.2],
    desktopTarget: [0, 0, 0],
    baseFov: 42,
    minHorizontalSpan: 3.4,
  });

  useEffect(() => {
    if (resetCounter > 0) {
      resettingRef.current = true;
    }
  }, [resetCounter]);

  // Keep camera distance responsive when viewport aspect changes
  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.object.position.copy(cameraPos);
    controlsRef.current.target.copy(targetPos);
    controlsRef.current.update();
  }, [cameraPos.z, isPortrait]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame(({ camera }, delta) => {
    if (!resettingRef.current || !controlsRef.current) return;
    const dt = Math.min(delta, 0.05);
    camera.position.lerp(cameraPos, Math.min(1, dt * 6.5));
    controlsRef.current.target.lerp(targetPos, Math.min(1, dt * 6.5));
    controlsRef.current.update();

    if (
      camera.position.distanceTo(cameraPos) < 0.02 &&
      controlsRef.current.target.distanceTo(targetPos) < 0.02
    ) {
      camera.position.copy(cameraPos);
      controlsRef.current.target.copy(targetPos);
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
      maxDistance={isPortrait ? 10.5 : 8.2}
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
  const [touchSpinEnabled, setTouchSpinEnabled] = useState(false);
  const { isFinePointer } = useInputMode();

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
    setTouchSpinEnabled(false);
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

  // Respond to external secretSignal (Konami code / terminal `arjun --unleash`)
  useEffect(() => {
    if (secretSignal !== prevSecretSignal.current) {
      prevSecretSignal.current = secretSignal;
      setSecretActive((prev) => !prev);
      setPulseTrigger((prev) => prev + 1);
      onInteract?.('secret');
    }
  }, [secretSignal, onInteract]);

  const currentMorph = MORPH_STATES[morphIndex % MORPH_STATES.length];
  const effectiveEngaged = engaged || touchSpinEnabled;
  const dprRange: [number, number] =
    quality === 'low' ? [1, 1.25] : quality === 'balanced' ? [1, 1.5] : [1, 2];

  return (
    <div
      className={`relative h-full w-full select-none ${className}`}
      style={
        !isFinePointer && touchSpinEnabled
          ? { pointerEvents: 'auto' }
          : undefined
      }
      data-touch-override={!isFinePointer && touchSpinEnabled ? 'true' : undefined}
    >
      {!isFinePointer && touchSpinEnabled && (
        <style>{`[data-touch-override="true"] canvas { pointer-events: auto !important; touch-action: none !important; }`}</style>
      )}
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={dprRange}
        camera={{ position: [0, 0, 5.2], fov: 42, near: 0.1, far: 50 }}
        gl={{ alpha: true, antialias: quality !== 'low', powerPreference: 'high-performance' }}
      >
        <AdaptiveDpr pixelated />
        <ambientLight intensity={0.45} />
        <directionalLight position={[5, 6, 5]} intensity={1.8} color="#F2F2EA" />
        <pointLight position={[-4, -3, 3]} intensity={1.2} color="#C5FF55" distance={14} />
        {quality !== 'low' && <StudioEnvironment preset="acid" intensity={quality === 'high' ? 0.9 : 0.7} />}

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

        <CameraRig engaged={effectiveEngaged} resetCounter={resetCounter} />
      </Canvas>

      {/* Subtle Docked Morph Mode Pill (top-right below HUD, never overlapping the sculpture center) */}
      <div className="pointer-events-auto absolute right-4 top-20 z-20 flex flex-wrap items-center justify-end gap-1.5 sm:right-8 sm:top-28 lg:right-14 lg:top-32">
        <button
          type="button"
          onClick={handleTransform}
          className="ub-btn min-h-[38px] border-line/80 bg-ink/75 px-3 py-1 text-[10px] text-bone/90 backdrop-blur-md transition-all hover:border-acid/60 hover:text-acid sm:min-h-[34px]"
          title="Click or tap to transform 3D sculpture geometry"
          aria-label={`Sculpture state ${currentMorph.code} ${currentMorph.name}. Activate to transform.`}
        >
          <Sparkles size={11} className="text-acid" aria-hidden />
          <span>
            {secretActive ? 'OVERDRIVE // UNLEASHED' : `${currentMorph.code} // ${currentMorph.name}`}
          </span>
        </button>

        {!isFinePointer && (
          <button
            type="button"
            onClick={() => setTouchSpinEnabled((v) => !v)}
            aria-pressed={touchSpinEnabled}
            className="ub-btn min-h-[38px] border-line/80 bg-ink/75 px-2.5 py-1 text-[10px] backdrop-blur-md"
            aria-label={touchSpinEnabled ? 'Lock 3D sculpture and resume page scroll' : 'Unlock touch rotation and zoom for 3D sculpture'}
          >
            <Hand size={11} className="text-acid" aria-hidden />
            <span>{touchSpinEnabled ? 'Done 3D' : 'Spin 3D'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
