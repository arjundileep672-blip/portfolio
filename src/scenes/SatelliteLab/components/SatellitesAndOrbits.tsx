import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import {
  SATELLITES_DATA,
  satelliteToInspectItem,
  type SatelliteModelData,
} from '../data/satelliteLabData';
import type { SatelliteLabInspectItem } from '@/scenes/types';
import { setSceneCursor } from '../../shared/cursor';

interface SatellitesAndOrbitsProps {
  showOrbits: boolean;
  showSatellites: boolean;
  reducedMotion: boolean;
  selectedId: string | null;
  onSelect: (item: SatelliteLabInspectItem, sat: SatelliteModelData) => void;
}

function OrbitingSatellite({
  sat,
  showOrbit,
  showModel,
  reducedMotion,
  selected,
  onSelect,
}: {
  sat: SatelliteModelData;
  showOrbit: boolean;
  showModel: boolean;
  reducedMotion: boolean;
  selected: boolean;
  onSelect: (item: SatelliteLabInspectItem, sat: SatelliteModelData) => void;
}) {
  const satGroupRef = useRef<THREE.Group>(null);
  const pulseConeRef = useRef<THREE.Mesh>(null);

  const { orbitPlaneQuat, orbitGeo } = useMemo(() => {
    const inc = (sat.inclinationDeg * Math.PI) / 180;
    const asc = (sat.ascNodeDeg * Math.PI) / 180;
    const euler = new THREE.Euler(inc, asc, 0, 'YXZ');
    const quat = new THREE.Quaternion().setFromEuler(euler);

    const pts: THREE.Vector3[] = [];
    const segments = 96;
    for (let i = 0; i <= segments; i++) {
      const a = (i / segments) * Math.PI * 2;
      const p = new THREE.Vector3(
        Math.cos(a) * sat.orbitRadius,
        0,
        Math.sin(a) * sat.orbitRadius
      ).applyQuaternion(quat);
      pts.push(p);
    }
    const g = new THREE.BufferGeometry().setFromPoints(pts);
    return { orbitPlaneQuat: quat, orbitGeo: g };
  }, [sat.inclinationDeg, sat.ascNodeDeg, sat.orbitRadius]);

  useFrame((state) => {
    if (!satGroupRef.current) return;
    const t = reducedMotion
      ? sat.initialPhase
      : state.clock.getElapsedTime() * sat.speed + sat.initialPhase;

    const localPos = new THREE.Vector3(
      Math.cos(t) * sat.orbitRadius,
      0,
      Math.sin(t) * sat.orbitRadius
    ).applyQuaternion(orbitPlaneQuat);

    satGroupRef.current.position.copy(localPos);
    // Orient satellite nadir toward Earth center (0, 0, 0)
    satGroupRef.current.lookAt(0, 0, 0);

    if (pulseConeRef.current && !reducedMotion) {
      const s = 0.92 + Math.sin(state.clock.getElapsedTime() * 3.2) * 0.08;
      pulseConeRef.current.scale.set(s, 1, s);
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect(satelliteToInspectItem(sat), sat);
  };

  return (
    <group>
      {/* Orbital Trajectory Ring */}
      {showOrbit && (
        // @ts-expect-error R3F line primitive conflicts with SVG line in React JSX types
        <line geometry={orbitGeo as unknown as THREE.BufferGeometry}>
          <lineBasicMaterial
            color={selected ? '#C5FF55' : sat.color}
            transparent
            opacity={selected ? 0.85 : 0.28}
          />
        </line>
      )}

      {/* Procedural 3D Satellite Bus, Solar Wings, Dish & Nadir Scanning Cone */}
      {showModel && (
        <group ref={satGroupRef}>
          {/* Hit Volume for easy click/tap selection */}
          <mesh
            onClick={handleClick}
            onPointerOver={(e) => {
              e.stopPropagation();
              setSceneCursor('Inspect Satellite');
            }}
            onPointerOut={() => setSceneCursor(null)}
          >
            <sphereGeometry args={[0.24, 12, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>

          {/* Main Foil-Insulated Bus Body */}
          <mesh raycast={() => null}>
            <boxGeometry args={[0.14, 0.14, 0.22]} />
            <meshStandardMaterial
              color={selected ? '#C5FF55' : '#F2F2EA'}
              emissive={selected ? '#C5FF55' : sat.color}
              emissiveIntensity={selected ? 0.55 : 0.18}
              metalness={0.85}
              roughness={0.22}
            />
          </mesh>

          {/* Port & Starboard Solar Panel Arrays */}
          {[-0.3, 0.3].map((x) => (
            <group key={`wing-${x}`} position={[x, 0, 0]} raycast={() => null}>
              <mesh>
                <boxGeometry args={[0.38, 0.015, 0.13]} />
                <meshStandardMaterial
                  color="#14222E"
                  emissive={sat.color}
                  emissiveIntensity={selected ? 0.35 : 0.12}
                  metalness={0.9}
                  roughness={0.18}
                />
              </mesh>
              {/* Strut */}
              <mesh position={[x > 0 ? -0.18 : 0.18, 0, 0]}>
                <boxGeometry args={[0.08, 0.02, 0.02]} />
                <meshStandardMaterial color="#858B80" metalness={0.8} roughness={0.3} />
              </mesh>
            </group>
          ))}

          {/* Nadir SAR / Optical Payload Dish & Boom (points +Z which faces Earth via lookAt) */}
          <mesh position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
            <cylinderGeometry args={[0.06, 0.03, 0.07, 12]} />
            <meshStandardMaterial color={sat.color} metalness={0.8} roughness={0.2} />
          </mesh>

          {/* Animated Nadir Sensor Swath Cone */}
          <mesh
            ref={pulseConeRef}
            position={[0, 0, 0.48]}
            rotation={[-Math.PI / 2, 0, 0]}
            raycast={() => null}
          >
            <coneGeometry args={[0.24, 0.65, 16, 1, true]} />
            <meshBasicMaterial
              color={sat.color}
              transparent
              opacity={selected ? 0.28 : 0.12}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>

          {/* In-world Telemetry Tag */}
          <Html position={[0, 0.24, 0]} center distanceFactor={12} style={{ pointerEvents: 'none' }}>
            <div
              className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider whitespace-nowrap ${
                selected
                  ? 'border-acid bg-acid text-ink font-semibold'
                  : 'border-line bg-ink-2/90 text-bone/90'
              }`}
            >
              {sat.code}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}

export function SatellitesAndOrbits({
  showOrbits,
  showSatellites,
  reducedMotion,
  selectedId,
  onSelect,
}: SatellitesAndOrbitsProps) {
  return (
    <group>
      {SATELLITES_DATA.map((sat) => (
        <OrbitingSatellite
          key={sat.id}
          sat={sat}
          showOrbit={showOrbits}
          showModel={showSatellites}
          reducedMotion={reducedMotion}
          selected={selectedId === sat.id}
          onSelect={onSelect}
        />
      ))}
    </group>
  );
}
