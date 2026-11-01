import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import {
  GEO_REGIONS_DATA,
  latLonToVector3,
  regionToInspectItem,
  type GeoRegionData,
} from '../data/satelliteLabData';
import type { SatelliteLabInspectItem } from '@/scenes/types';
import { setSceneCursor } from '../../shared/cursor';

interface GeographicMarkersProps {
  showMarkers: boolean;
  showExplainability: boolean;
  reducedMotion: boolean;
  selectedId: string | null;
  onSelect: (item: SatelliteLabInspectItem, region: GeoRegionData) => void;
}

function RegionMarkerPin({
  region,
  showExplainability,
  reducedMotion,
  selected,
  onSelect,
}: {
  region: GeoRegionData;
  showExplainability: boolean;
  reducedMotion: boolean;
  selected: boolean;
  onSelect: (item: SatelliteLabInspectItem, region: GeoRegionData) => void;
}) {
  const ringRef = useRef<THREE.Mesh>(null);
  const xaiRingRef = useRef<THREE.Group>(null);

  const { position, quaternion } = useMemo(() => {
    const posArr = latLonToVector3(region.lat, region.lon, 1.675);
    const pos = new THREE.Vector3(...posArr);
    const normal = pos.clone().normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      normal
    );
    return { position: pos, quaternion: quat };
  }, [region.lat, region.lon]);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      const s = 1 + Math.sin(t * 3.0 + region.tileSeed) * 0.18;
      ringRef.current.scale.set(s, s, 1);
    }
    if (xaiRingRef.current) {
      xaiRingRef.current.rotation.z = t * 0.8;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(regionToInspectItem(region), region);
  };

  return (
    <group position={position} quaternion={quaternion}>
      {/* Interactive Hit Sphere */}
      <mesh
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation();
          setSceneCursor('Select Region');
        }}
        onPointerOut={() => setSceneCursor(null)}
      >
        <sphereGeometry args={[0.14, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Core Surface Beacon Pin */}
      <mesh position={[0, 0, 0.02]} raycast={() => null}>
        <octahedronGeometry args={[selected ? 0.055 : 0.04, 0]} />
        <meshBasicMaterial color={selected ? '#C5FF55' : '#F2F2EA'} />
      </mesh>

      {/* Surface Footprint Ring */}
      <mesh ref={ringRef} position={[0, 0, 0.005]} raycast={() => null}>
        <ringGeometry args={[0.065, 0.085, 24]} />
        <meshBasicMaterial
          color={selected ? '#C5FF55' : '#9FD4FF'}
          side={THREE.DoubleSide}
          transparent
          opacity={selected ? 0.95 : 0.65}
        />
      </mesh>

      {/* Explainable AI (XAI) Spatial Evidence Bounding Reticle */}
      {(showExplainability || selected) && (
        <group ref={xaiRingRef} position={[0, 0, 0.015]} raycast={() => null}>
          <mesh>
            <ringGeometry args={[0.12, 0.132, 4]} />
            <meshBasicMaterial
              color="#C5FF55"
              side={THREE.DoubleSide}
              transparent
              opacity={selected ? 0.9 : 0.48}
            />
          </mesh>
        </group>
      )}

      {/* Region Code Callout */}
      <Html position={[0, 0, 0.12]} center distanceFactor={11} style={{ pointerEvents: 'none' }}>
        <div
          className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider whitespace-nowrap transition-colors ${
            selected
              ? 'border-acid bg-acid text-ink font-semibold'
              : 'border-line bg-ink/90 text-bone/90'
          }`}
        >
          {region.code}
        </div>
      </Html>
    </group>
  );
}

export function GeographicMarkers({
  showMarkers,
  showExplainability,
  reducedMotion,
  selectedId,
  onSelect,
}: GeographicMarkersProps) {
  if (!showMarkers) return null;

  return (
    <group>
      {GEO_REGIONS_DATA.map((region) => (
        <RegionMarkerPin
          key={region.id}
          region={region}
          showExplainability={showExplainability}
          reducedMotion={reducedMotion}
          selected={selectedId === region.id}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}
