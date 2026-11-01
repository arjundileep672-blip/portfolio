import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { Skill, SkillCategoryId } from '@/data/skills';
import type { ConnectionLine, CategoryCluster, SkillNodeData } from './positions';

interface ConnectionsProps {
  connections: ConnectionLine[];
  nodes: SkillNodeData[];
  categoryClusters: CategoryCluster[];
  selectedSkill: Skill | null;
  hoveredSkill: Skill | null;
  activeCategory: SkillCategoryId | 'all';
  reducedMotion: boolean;
}

export default function Connections({
  connections,
  nodes,
  categoryClusters,
  selectedSkill,
  hoveredSkill,
  activeCategory,
  reducedMotion,
}: ConnectionsProps) {
  const activeFocusId = selectedSkill?.id ?? hoveredSkill?.id ?? null;
  const pulsesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Split connections into highlighted, dimmed, normal, and hub spokes
  const { highlightedGeo, normalGeo, dimmedGeo, spokeGeo } = useMemo(() => {
    const hlPos: number[] = [];
    const normPos: number[] = [];
    const dimPos: number[] = [];
    const spokePos: number[] = [];

    // Hub-to-skill spokes
    const clusterMap = new Map<SkillCategoryId, THREE.Vector3>();
    categoryClusters.forEach((c) => clusterMap.set(c.id, c.center));

    nodes.forEach((n) => {
      const center = clusterMap.get(n.category.id);
      if (!center) return;
      if (activeCategory === 'all' || activeCategory === n.category.id) {
        spokePos.push(
          center.x,
          center.y,
          center.z,
          n.position.x,
          n.position.y,
          n.position.z
        );
      }
    });

    connections.forEach((conn) => {
      const isConnectedToFocus =
        activeFocusId !== null &&
        (conn.sourceId === activeFocusId || conn.targetId === activeFocusId);

      const isDimmedByCat =
        activeCategory !== 'all' && !isConnectedToFocus;

      const segment = [
        conn.sourcePos.x,
        conn.sourcePos.y,
        conn.sourcePos.z,
        conn.targetPos.x,
        conn.targetPos.y,
        conn.targetPos.z,
      ];

      if (isConnectedToFocus) {
        hlPos.push(...segment);
      } else if (activeFocusId !== null || isDimmedByCat) {
        dimPos.push(...segment);
      } else {
        normPos.push(...segment);
      }
    });

    const createGeo = (coords: number[]) => {
      const geo = new THREE.BufferGeometry();
      if (coords.length > 0) {
        geo.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(coords, 3)
        );
      }
      return geo;
    };

    return {
      highlightedGeo: createGeo(hlPos),
      normalGeo: createGeo(normPos),
      dimmedGeo: createGeo(dimPos),
      spokeGeo: createGeo(spokePos),
    };
  }, [connections, nodes, categoryClusters, activeFocusId, activeCategory]);

  // Animate data pulses traveling along connections
  const pulseCount = Math.min(connections.length, 32);
  useFrame((state) => {
    if (!pulsesRef.current || pulseCount === 0) return;
    const t = reducedMotion ? 0.35 : state.clock.getElapsedTime();

    for (let i = 0; i < pulseCount; i++) {
      const conn = connections[i];
      const isFocused =
        activeFocusId === null ||
        conn.sourceId === activeFocusId ||
        conn.targetId === activeFocusId;

      const progress = (t * (0.35 + (i % 5) * 0.08) + i * 0.17) % 1.0;
      dummy.position.lerpVectors(conn.sourcePos, conn.targetPos, progress);
      const scale = isFocused ? 1.0 : 0.3;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      pulsesRef.current.setMatrixAt(i, dummy.matrix);
    }
    pulsesRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* Category hub spokes */}
      <lineSegments geometry={spokeGeo}>
        <lineBasicMaterial
          color="#858B80"
          transparent
          opacity={0.14}
          depthWrite={false}
        />
      </lineSegments>

      {/* Normal lines */}
      <lineSegments geometry={normalGeo}>
        <lineBasicMaterial
          color="#858B80"
          transparent
          opacity={0.26}
          depthWrite={false}
        />
      </lineSegments>

      {/* Dimmed lines */}
      <lineSegments geometry={dimmedGeo}>
        <lineBasicMaterial
          color="#282D27"
          transparent
          opacity={0.07}
          depthWrite={false}
        />
      </lineSegments>

      {/* Highlighted active lines */}
      <lineSegments geometry={highlightedGeo}>
        <lineBasicMaterial
          color="#C5FF55"
          transparent
          opacity={0.95}
          linewidth={2}
          depthWrite={false}
        />
      </lineSegments>

      {/* Traveling data signal packets along connections */}
      {pulseCount > 0 && (
        <instancedMesh
          ref={pulsesRef}
          args={[undefined, undefined, pulseCount]}
          raycast={() => null}
        >
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshBasicMaterial color="#C5FF55" transparent opacity={0.85} />
        </instancedMesh>
      )}
    </group>
  );
}
