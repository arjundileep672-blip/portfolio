import { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { projects } from '@/data/projects';
import type { ProjectLabProps, ProjectLabItem } from '../types';
import { WarehouseScene, type WarehouseLayers } from './components/WarehouseScene';
import ProjectDetailsOverlay from './ProjectDetailsOverlay';
import { StudioEnvironment } from '../shared/StudioEnvironment';

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 5.8, 7.8);
const DEFAULT_TARGET = new THREE.Vector3(0, 0.6, 0);

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
  const targetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.6, 0));
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
      minDistance={3.8}
      maxDistance={14.0}
      maxPolarAngle={Math.PI / 2.08}
      dampingFactor={0.06}
      makeDefault
    />
  );
}

export default function ProjectLab({
  active,
  quality,
  reducedMotion,
  engaged,
  className,
  project = projects[0],
  onSelectItem,
}: ProjectLabProps) {
  const [selectedItem, setSelectedItem] = useState<ProjectLabItem | null>(null);
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3>(DEFAULT_TARGET);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  const [layers, setLayers] = useState<WarehouseLayers>({
    structure: true,
    racks: true,
    routes: true,
    shipments: true,
    recoveryHighlight: false,
  });

  const handleToggleLayer = (layer: keyof WarehouseLayers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleSelectItem = (item: ProjectLabItem | null) => {
    setSelectedItem(item);
    onSelectItem?.(item);

    if (!item) {
      setCameraTarget(DEFAULT_TARGET);
    }
  };

  const handleResetCamera = () => {
    setSelectedItem(null);
    onSelectItem?.(null);
    setCameraTarget(DEFAULT_TARGET);
    setResetTrigger((prev) => prev + 1);
  };

  return (
    <div className={`relative w-full h-full select-none bg-ink ${className ?? ''}`}>
      {/* HTML Overlay: Controls & Inspector */}
      <ProjectDetailsOverlay
        project={project}
        selectedItem={selectedItem}
        layers={layers}
        onToggleLayer={handleToggleLayer}
        onSelectItem={handleSelectItem}
        onResetCamera={handleResetCamera}
      />

      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={quality === 'low' ? [1, 1.5] : [1, 2]}
        gl={{
          alpha: false,
          antialias: quality !== 'low',
          powerPreference: 'high-performance',
        }}
        camera={{ position: [0, 5.8, 7.8], fov: 46 }}
      >
        <color attach="background" args={['#080A08']} />
        <fog attach="fog" args={['#080A08', 8, 22]} />

        <ambientLight intensity={0.4} />
        <directionalLight
          position={[6, 9, 5]}
          intensity={1.4}
          color="#F2F2EA"
          castShadow={quality !== 'low'}
        />
        <directionalLight position={[-6, 4, -4]} intensity={0.5} color="#858B80" />

        <StudioEnvironment preset="studio" intensity={0.7} />

        <WarehouseScene
          quality={quality}
          reducedMotion={reducedMotion}
          layers={layers}
          selectedItem={selectedItem}
          onSelectItem={handleSelectItem}
        />

        <CameraRig
          engaged={engaged}
          targetPos={cameraTarget}
          resetTrigger={resetTrigger}
        />
      </Canvas>
    </div>
  );
}
