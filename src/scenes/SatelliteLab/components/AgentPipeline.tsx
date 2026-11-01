import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import {
  AGENT_PIPELINE_DATA,
  agentToInspectItem,
  type AgentNodeData,
} from '../data/satelliteLabData';
import type { SatelliteLabInspectItem } from '@/scenes/types';
import { setSceneCursor } from '../../shared/cursor';

interface AgentPipelineProps {
  visible: boolean;
  reducedMotion: boolean;
  selectedId: string | null;
  onSelect: (item: SatelliteLabInspectItem, agent: AgentNodeData) => void;
}

export function AgentPipeline({
  visible,
  reducedMotion,
  selectedId,
  onSelect,
}: AgentPipelineProps) {
  const pulseRefs = useRef<(THREE.Mesh | null)[]>([]);

  const { curve, lineGeo } = useMemo(() => {
    const pts = AGENT_PIPELINE_DATA.map((a) => new THREE.Vector3(...a.position));
    const c = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.35);
    const sampled = c.getPoints(96);
    const g = new THREE.BufferGeometry().setFromPoints(sampled);
    return { curve: c, lineGeo: g };
  }, []);

  useFrame((state) => {
    if (!visible) return;
    const t = state.clock.getElapsedTime();
    for (let i = 0; i < 4; i++) {
      const m = pulseRefs.current[i];
      if (!m) continue;
      const u = reducedMotion ? i * 0.25 : (t * 0.16 + i * 0.25) % 1.0;
      const pos = curve.getPointAt(u);
      m.position.copy(pos);
    }
  });

  if (!visible) return null;

  return (
    <group>
      {/* Pipeline Spine Curve */}
      {/* @ts-expect-error R3F line primitive conflicts with SVG line in React JSX types */}
      <line geometry={lineGeo as unknown as THREE.BufferGeometry}>
        <lineBasicMaterial color="#C5FF55" transparent opacity={0.45} />
      </line>

      {/* Animated Data / Reasoning Tokens Moving Along the Pipeline */}
      {[0, 1, 2, 3].map((idx) => (
        <mesh
          key={`pulse-${idx}`}
          ref={(el) => {
            pulseRefs.current[idx] = el;
          }}
          raycast={() => null}
        >
          <sphereGeometry args={[0.055, 10, 10]} />
          <meshBasicMaterial color="#C5FF55" />
        </mesh>
      ))}

      {/* 10 Interconnected Architecture Nodes */}
      {AGENT_PIPELINE_DATA.map((node) => {
        const selected = selectedId === node.id;
        const handleClick = (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          onSelect(agentToInspectItem(node), node);
        };

        return (
          <group key={node.id} position={node.position}>
            {/* Hit Sphere */}
            <mesh
              onClick={handleClick}
              onPointerOver={(e) => {
                e.stopPropagation();
                setSceneCursor('Inspect Stage');
              }}
              onPointerOut={() => setSceneCursor(null)}
            >
              <sphereGeometry args={[0.25, 12, 12]} />
              <meshBasicMaterial transparent opacity={0} depthWrite={false} />
            </mesh>

            {/* 3D Node Core */}
            <mesh raycast={() => null}>
              <octahedronGeometry args={[selected ? 0.14 : 0.105, 0]} />
              <meshStandardMaterial
                color={selected ? '#C5FF55' : '#F2F2EA'}
                emissive={selected ? '#C5FF55' : '#9FD4FF'}
                emissiveIntensity={selected ? 0.85 : 0.3}
                metalness={0.75}
                roughness={0.2}
              />
            </mesh>

            {/* Wireframe Outer Cage */}
            <mesh raycast={() => null}>
              <boxGeometry args={[0.21, 0.21, 0.21]} />
              <meshBasicMaterial
                color={selected ? '#C5FF55' : '#282D27'}
                wireframe
                transparent
                opacity={selected ? 0.9 : 0.55}
              />
            </mesh>

            {/* Stage Label */}
            <Html
              position={[0, 0.25, 0]}
              center
              distanceFactor={12}
              style={{ pointerEvents: 'none' }}
            >
              <div
                className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider whitespace-nowrap transition-colors ${
                  selected
                    ? 'border-acid bg-acid text-ink font-semibold'
                    : 'border-line bg-ink-2/95 text-bone/90'
                }`}
              >
                {node.shortLabel}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}
