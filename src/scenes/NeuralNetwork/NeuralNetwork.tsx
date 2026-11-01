import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { NeuralNetworkProps, NeuronInfo } from '../types';
import { LAYER_SPECS } from './utils/networkTopology';
import { ResNetGraph } from './components/ResNetGraph';
import NetworkControlsOverlay from './NetworkControlsOverlay';
import { StudioEnvironment } from '../shared/StudioEnvironment';
import { useResponsiveCamera } from '@/hooks/useResponsiveScene';

const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

function CameraRig({
  engaged,
  targetPos,
  hasFocus,
  resetTrigger,
}: {
  engaged: boolean;
  targetPos: THREE.Vector3;
  hasFocus: boolean;
  resetTrigger: number;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const lastResetRef = useRef(resetTrigger);

  const { cameraPos: defaultCamPos, isPortrait, aspect } = useResponsiveCamera({
    desktopPos: [0, 1.4, 11.2],
    desktopTarget: [0, 0, 0],
    portraitTarget: [0, -0.2, 0],
    baseFov: 45,
    minHorizontalSpan: 9.2,
  });

  const scaleX = aspect < 0.65 ? 0.68 : aspect < 0.95 ? 0.82 : 1.0;

  useEffect(() => {
    if (!controlsRef.current) return;
    controlsRef.current.object.position.copy(defaultCamPos);
    controlsRef.current.update();
  }, [defaultCamPos.z, isPortrait]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (resetTrigger !== lastResetRef.current && controlsRef.current) {
      lastResetRef.current = resetTrigger;
      targetRef.current.copy(DEFAULT_TARGET);
      controlsRef.current.target.copy(DEFAULT_TARGET);
      controlsRef.current.object.position.copy(defaultCamPos);
      controlsRef.current.update();
    }
  }, [resetTrigger, defaultCamPos]);

  useFrame(({ camera }, delta) => {
    if (!controlsRef.current) return;
    const dt = Math.min(delta, 0.05);
    const scaledTarget = new THREE.Vector3(
      targetPos.x * scaleX,
      isPortrait && hasFocus ? targetPos.y - 0.35 : targetPos.y,
      targetPos.z
    );
    targetRef.current.lerp(scaledTarget, Math.min(1, dt * 4.0));
    controlsRef.current.target.copy(targetRef.current);

    if (isPortrait && hasFocus) {
      const desiredZ = Math.min(defaultCamPos.z, 9.2);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, desiredZ, 3.5, dt);
    }
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={engaged}
      enablePan={false}
      enableRotate={true}
      rotateSpeed={0.7}
      minDistance={3.8}
      maxDistance={isPortrait ? 24.0 : 18.0}
      dampingFactor={0.06}
      makeDefault
    />
  );
}

export default function NeuralNetwork({
  active,
  quality,
  reducedMotion,
  engaged,
  className,
  onNeuronSelect,
}: NeuralNetworkProps) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [skipEnabled, setSkipEnabled] = useState(true);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);
  const [selectedNeuron, setSelectedNeuron] = useState<NeuronInfo | null>(null);
  const [neuronRole, setNeuronRole] = useState<string | null>(null);
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3>(DEFAULT_TARGET);
  const [resetCounter, setResetCounter] = useState(0);
  const [fireSignalCounter, setFireSignalCounter] = useState(0);

  // Handle neuron selection
  const handleSelectNeuron = (info: NeuronInfo, role: string) => {
    setSelectedNeuron(info);
    setNeuronRole(role);
    onNeuronSelect?.(info);

    const spec = LAYER_SPECS.find((l) => l.index === info.layerIndex);
    if (spec) {
      setCameraTarget(new THREE.Vector3(spec.x, 0, 0));
    }
  };

  // Handle layer selection / focus
  const handleSelectLayer = (layerIdx: number | null) => {
    setSelectedLayer(layerIdx);
    if (layerIdx === null) {
      setCameraTarget(DEFAULT_TARGET);
    } else {
      const spec = LAYER_SPECS.find((l) => l.index === layerIdx);
      if (spec) {
        setCameraTarget(new THREE.Vector3(spec.x, 0, 0));
      }
    }
  };

  // Fire signal pulse
  const handleFireSignal = () => {
    setFireSignalCounter((prev) => prev + 1);
  };

  // Reset view & simulation
  const handleReset = () => {
    setSelectedLayer(null);
    setSelectedNeuron(null);
    setNeuronRole(null);
    onNeuronSelect?.(null);
    setSpeed(1.0);
    setCameraTarget(DEFAULT_TARGET);
    setResetCounter((prev) => prev + 1);
  };

  const dprRange: [number, number] =
    quality === 'low' ? [1, 1.25] : quality === 'balanced' ? [1, 1.5] : [1, 2];

  return (
    <div className={`relative h-full w-full select-none bg-ink ${className ?? ''}`}>
      {/* HTML Overlay: Controls & Inspector */}
      <NetworkControlsOverlay
        layers={LAYER_SPECS}
        focusedLayer={selectedLayer}
        selectedNeuron={selectedNeuron}
        neuronRole={neuronRole}
        isPlaying={playing}
        speed={speed}
        skipEnabled={skipEnabled}
        onTogglePlay={() => setPlaying((p) => !p)}
        onReset={handleReset}
        onSpeedChange={setSpeed}
        onSelectLayer={handleSelectLayer}
        onFireSignal={handleFireSignal}
        onToggleSkip={() => setSkipEnabled((s) => !s)}
        onCloseNeuron={() => {
          setSelectedNeuron(null);
          setNeuronRole(null);
          onNeuronSelect?.(null);
        }}
      />

      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={dprRange}
        gl={{
          alpha: false,
          antialias: quality !== 'low',
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 1.4, 11.2], fov: 45 }}
      >
        <color attach="background" args={['#080A08']} />
        <fog attach="fog" args={['#080A08', 12, 32]} />
        <AdaptiveDpr pixelated />

        <ambientLight intensity={0.4} />
        <directionalLight position={[6, 8, 8]} intensity={1.2} color="#F2F2EA" />
        <directionalLight position={[-6, -4, -6]} intensity={0.5} color="#858B80" />

        {quality !== 'low' && <StudioEnvironment preset="acid" intensity={0.8} />}

        <ResNetGraph
          quality={quality}
          reducedMotion={reducedMotion}
          playing={playing}
          speed={speed}
          skipEnabled={skipEnabled}
          fireSignalCounter={fireSignalCounter}
          resetSignalCounter={resetCounter}
          selectedLayer={selectedLayer}
          selectedNeuron={selectedNeuron}
          onSelectNeuron={handleSelectNeuron}
          onSelectLayer={handleSelectLayer}
        />

        <CameraRig
          engaged={engaged}
          targetPos={cameraTarget}
          hasFocus={selectedLayer !== null || selectedNeuron !== null}
          resetTrigger={resetCounter}
        />
      </Canvas>
    </div>
  );
}
