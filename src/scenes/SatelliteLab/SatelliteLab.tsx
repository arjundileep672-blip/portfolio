import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { projects } from '@/data/projects';
import type {
  SatelliteLabInspectItem,
  SatelliteLabProps,
  SatelliteSensorMode,
} from '../types';
import {
  GEO_REGIONS_DATA,
  latLonToVector3,
  type AgentNodeData,
  type GeoRegionData,
  type SatelliteModelData,
} from './data/satelliteLabData';
import { Earth } from './components/Earth';
import { SatellitesAndOrbits } from './components/SatellitesAndOrbits';
import { GeographicMarkers } from './components/GeographicMarkers';
import { AgentPipeline } from './components/AgentPipeline';
import { ControlPanel, type SatelliteLabLayers } from './components/ControlPanel';
import { StudioEnvironment } from '../shared/StudioEnvironment';
import { setSceneCursor } from '../shared/cursor';

const DEFAULT_CAMERA_POS = new THREE.Vector3(0, 1.85, 5.4);
const DEFAULT_TARGET = new THREE.Vector3(0, 0.2, 0);

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
  const currentTarget = useRef<THREE.Vector3>(DEFAULT_TARGET.clone());
  const lastReset = useRef<number>(resetTrigger);

  useEffect(() => {
    if (resetTrigger !== lastReset.current && controlsRef.current) {
      lastReset.current = resetTrigger;
      currentTarget.current.copy(DEFAULT_TARGET);
      controlsRef.current.target.copy(DEFAULT_TARGET);
      controlsRef.current.object.position.copy(DEFAULT_CAMERA_POS);
      controlsRef.current.update();
    }
  }, [resetTrigger]);

  useFrame((_, delta) => {
    if (!controlsRef.current) return;
    currentTarget.current.lerp(targetPos, Math.min(1, delta * 3.5));
    controlsRef.current.target.copy(currentTarget.current);
    controlsRef.current.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={engaged}
      enablePan={false}
      enableRotate={true}
      rotateSpeed={0.68}
      minDistance={2.6}
      maxDistance={9.5}
      dampingFactor={0.06}
      makeDefault
    />
  );
}

function RotatingEarthSystem({
  reducedMotion,
  paused,
  children,
}: {
  reducedMotion: boolean;
  paused: boolean;
  children: React.ReactNode;
}) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!groupRef.current || reducedMotion || paused) return;
    groupRef.current.rotation.y += delta * 0.08;
  });
  return <group ref={groupRef}>{children}</group>;
}

export default function SatelliteLab({
  active,
  quality,
  reducedMotion,
  engaged,
  className,
  project = projects[0],
  onSelectItem,
}: SatelliteLabProps) {
  const [sensorMode, setSensorMode] = useState<SatelliteSensorMode>('optical');
  const [selectedItem, setSelectedItem] = useState<SatelliteLabInspectItem | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<GeoRegionData>(GEO_REGIONS_DATA[0]);
  const [cameraTarget, setCameraTarget] = useState<THREE.Vector3>(DEFAULT_TARGET);
  const [resetTrigger, setResetTrigger] = useState<number>(0);

  const [layers, setLayers] = useState<SatelliteLabLayers>({
    grid: true,
    atmosphere: true,
    orbits: true,
    satellites: true,
    markers: true,
    swath: true,
    pipeline: true,
    explainability: true,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedItem) {
        setSelectedItem(null);
        onSelectItem?.(null);
        setCameraTarget(DEFAULT_TARGET);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      setSceneCursor(null);
    };
  }, [selectedItem, onSelectItem]);

  const handleToggleLayer = (layer: keyof SatelliteLabLayers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const handleSelectRegion = (item: SatelliteLabInspectItem, region: GeoRegionData) => {
    setSelectedRegion(region);
    setSelectedItem(item);
    onSelectItem?.(item);
    const [x, y, z] = latLonToVector3(region.lat, region.lon, 0.65);
    setCameraTarget(new THREE.Vector3(x, y, z));
  };

  const handleSelectSatellite = (item: SatelliteLabInspectItem, _sat: SatelliteModelData) => {
    setSelectedItem(item);
    onSelectItem?.(item);
    setCameraTarget(new THREE.Vector3(0, 0.1, 0));
  };

  const handleSelectAgent = (item: SatelliteLabInspectItem, agent: AgentNodeData) => {
    setSelectedItem(item);
    onSelectItem?.(item);
    setCameraTarget(
      new THREE.Vector3(
        agent.position[0] * 0.45,
        agent.position[1] * 0.55,
        agent.position[2] * 0.45
      )
    );
  };

  const handleClearSelection = () => {
    setSelectedItem(null);
    onSelectItem?.(null);
    setCameraTarget(DEFAULT_TARGET);
  };

  const handleResetCamera = () => {
    setSelectedItem(null);
    onSelectItem?.(null);
    setCameraTarget(DEFAULT_TARGET);
    setResetTrigger((prev) => prev + 1);
  };

  return (
    <div className={`relative h-full w-full select-none bg-ink ${className ?? ''}`}>
      <ControlPanel
        project={project}
        sensorMode={sensorMode}
        onChangeSensorMode={setSensorMode}
        layers={layers}
        onToggleLayer={handleToggleLayer}
        selectedItem={selectedItem}
        selectedRegion={selectedRegion}
        onSelectRegion={handleSelectRegion}
        onSelectSatellite={handleSelectSatellite}
        onSelectAgent={handleSelectAgent}
        onClearSelection={handleClearSelection}
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
        camera={{ position: [0, 1.85, 5.4], fov: 45 }}
      >
        <color attach="background" args={['#080A08']} />
        <fog attach="fog" args={['#080A08', 7.5, 18]} />

        <ambientLight intensity={0.45} />
        <directionalLight position={[6, 5, 5]} intensity={1.35} color="#F2F2EA" />
        <directionalLight position={[-5, -3, -4]} intensity={0.4} color="#9FD4FF" />

        <StudioEnvironment preset="studio" intensity={0.65} />

        {/* Rotating Globe + Geographic Region Markers */}
        <RotatingEarthSystem
          reducedMotion={reducedMotion}
          paused={selectedItem?.kind === 'region'}
        >
          <Earth
            quality={quality}
            sensorMode={sensorMode}
            showGrid={layers.grid}
            showAtmosphere={layers.atmosphere}
            showSwathOverlay={layers.swath}
            reducedMotion={reducedMotion}
          />
          <GeographicMarkers
            showMarkers={layers.markers}
            showExplainability={layers.explainability}
            reducedMotion={reducedMotion}
            selectedId={selectedItem?.id ?? null}
            onSelect={handleSelectRegion}
          />
        </RotatingEarthSystem>

        {/* Orbital Satellites & Trajectory Paths */}
        <SatellitesAndOrbits
          showOrbits={layers.orbits}
          showSatellites={layers.satellites}
          reducedMotion={reducedMotion}
          selectedId={selectedItem?.id ?? null}
          onSelect={handleSelectSatellite}
        />

        {/* 10-Stage Multi-Agent Processing Pipeline Constellation */}
        <AgentPipeline
          visible={layers.pipeline}
          reducedMotion={reducedMotion}
          selectedId={selectedItem?.id ?? null}
          onSelect={handleSelectAgent}
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
