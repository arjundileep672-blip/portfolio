import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { NeuralNetworkProps, NeuronInfo } from '../types';
import { LAYER_SPECS } from './utils/networkTopology';
import { ResNetGraph } from './components/ResNetGraph';
import NetworkControlsOverlay from './NetworkControlsOverlay';
import { StudioEnvironment } from '../shared/StudioEnvironment';

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 1.4, 11.2);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

function CameraRig({
  engaged,
  targetPos,
  resetTrigger,
}: {
  engaged: boolean;
  targetPos: THREE.Vector3;
  resetTrigger: number;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const lastResetRef = useRef(resetTrigger);

  useEffect(() => {
    if (resetTrigger !== lastResetRef.current && controlsRef.current) {
      lastResetRef.current = resetTrigger;
      targetRef.current.copy(DEFAULT_TARGET);
      controlsRef.current.target.copy(DEFAULT_TARGET);
      controlsRef.current.object.position.copy(DEFAULT_CAMERA_POS);
      controlsRef.current.update();
    }
  }, [resetTrigger]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    targetRef.current.lerp(targetPos, delta * 3.5);
    controlsRef.current.target.copy(targetRef.current);
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={engaged}
      enablePan={false}
      enableRotate={true}
      rotateSpeed={0.7}
      minDistance={4.2}
      maxDistance={18.0}
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

  return (
    <div className={`relative w-full h-full select-none bg-ink ${className ?? ''}`}>
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
        dpr={quality === 'low' ? [1, 1.5] : [1, 2]}
        gl={{
          alpha: false,
          antialias: quality !== 'low',
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 1.4, 11.2], fov: 45 }}
      >
        <color attach="background" args={['#080A08']} />
        <fog attach="fog" args={['#080A08', 12, 28]} />

        <ambientLight intensity={0.4} />
        <directionalLight position={[6, 8, 8]} intensity={1.2} color="#F2F2EA" />
        <directionalLight position={[-6, -4, -6]} intensity={0.5} color="#858B80" />

        <StudioEnvironment preset="acid" intensity={0.8} />

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
          resetTrigger={resetCounter}
        />
      </Canvas>
    </div>
  );
}
