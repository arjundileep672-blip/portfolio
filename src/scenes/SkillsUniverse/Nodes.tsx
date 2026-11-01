import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { Skill, SkillCategoryId } from '@/data/skills';
import type { SceneQuality } from '../types';
import type { SkillNodeData, CategoryCluster } from './positions';

interface NodesProps {
  nodes: SkillNodeData[];
  categoryClusters: CategoryCluster[];
  selectedSkill: Skill | null;
  hoveredSkill: Skill | null;
  activeCategory: SkillCategoryId | 'all';
  quality: SceneQuality;
  reducedMotion: boolean;
  onSelect: (skill: Skill | null) => void;
  onSelectCategory?: (cat: SkillCategoryId | 'all') => void;
  onHover: (skill: Skill | null) => void;
}

export default function Nodes({
  nodes,
  categoryClusters,
  selectedSkill,
  hoveredSkill,
  activeCategory,
  quality,
  reducedMotion,
  onSelect,
  onSelectCategory,
  onHover,
}: NodesProps) {
  return (
    <group>
      {/* Category cluster central cores */}
      {categoryClusters.map((cluster) => {
        const isDimmed = activeCategory !== 'all' && activeCategory !== cluster.id;
        const isActiveCluster = activeCategory === cluster.id;
        return (
          <CategoryHub
            key={`cluster-${cluster.id}`}
            cluster={cluster}
            isDimmed={isDimmed}
            isActiveCluster={isActiveCluster}
            reducedMotion={reducedMotion}
            onSelectCategory={onSelectCategory}
          />
        );
      })}

      {/* Skill Sphere Nodes */}
      {nodes.map((nodeData) => {
        const isSelected = selectedSkill?.id === nodeData.skill.id;
        const isHovered = hoveredSkill?.id === nodeData.skill.id;
        const isRelated =
          selectedSkill?.related?.includes(nodeData.skill.id) ||
          nodeData.skill.related?.includes(selectedSkill?.id ?? '');
        const isCatMatch =
          activeCategory === 'all' || activeCategory === nodeData.category.id;

        const isDimmed =
          (!isCatMatch && !isSelected && !isRelated) ||
          (selectedSkill !== null && !isSelected && !isRelated);

        return (
          <SingleSkillNode
            key={nodeData.skill.id}
            data={nodeData}
            isSelected={isSelected}
            isHovered={isHovered}
            isRelated={Boolean(isRelated)}
            isDimmed={isDimmed}
            isClusterFocused={activeCategory === nodeData.category.id}
            quality={quality}
            reducedMotion={reducedMotion}
            onSelect={onSelect}
            onHover={onHover}
          />
        );
      })}
    </group>
  );
}

function CategoryHub({
  cluster,
  isDimmed,
  isActiveCluster,
  reducedMotion,
  onSelectCategory,
}: {
  cluster: CategoryCluster;
  isDimmed: boolean;
  isActiveCluster: boolean;
  reducedMotion: boolean;
  onSelectCategory?: (cat: SkillCategoryId | 'all') => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (reducedMotion) return;
    const t = state.clock.getElapsedTime();
    if (ringRef.current) {
      ringRef.current.rotation.z = t * 0.4;
      ringRef.current.rotation.x = t * 0.2;
    }
  });

  return (
    <group position={cluster.center}>
      {/* Larger invisible touch hit target for selecting category cluster */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelectCategory?.(isActiveCluster ? 'all' : cluster.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          window.dispatchEvent(new CustomEvent('unbound:cursor', { detail: cluster.label }));
        }}
        onPointerOut={() => {
          window.dispatchEvent(new CustomEvent('unbound:cursor', { detail: null }));
        }}
      >
        <sphereGeometry args={[0.38, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh ref={meshRef} raycast={() => null}>
        <sphereGeometry args={[0.22, 24, 24]} />
        <meshStandardMaterial
          color={cluster.color}
          emissive={cluster.color}
          emissiveIntensity={isDimmed ? 0.1 : isActiveCluster ? 0.9 : 0.6}
          roughness={0.2}
          metalness={0.8}
          transparent
          opacity={isDimmed ? 0.25 : 0.9}
        />
      </mesh>

      {/* Orbiting wireframe ring around category hub */}
      <mesh ref={ringRef} raycast={() => null}>
        <ringGeometry args={[0.32, 0.36, 32]} />
        <meshBasicMaterial
          color={cluster.color}
          wireframe
          transparent
          opacity={isDimmed ? 0.15 : 0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Label for Category */}
      <Html
        position={[0, -0.4, 0]}
        center
        distanceFactor={13}
        style={{ pointerEvents: 'none' }}
      >
        <div
          className={`px-2 py-0.5 border text-[10px] tracking-widest font-mono uppercase whitespace-nowrap transition-opacity duration-300 ${
            isDimmed
              ? 'opacity-20 border-line text-muted bg-ink/60'
              : isActiveCluster
              ? 'opacity-100 border-acid text-ink bg-acid font-semibold shadow-sm'
              : 'opacity-90 border-line text-bone bg-ink-2/90 shadow-sm'
          }`}
        >
          {cluster.label}
        </div>
      </Html>
    </group>
  );
}

function SingleSkillNode({
  data,
  isSelected,
  isHovered,
  isRelated,
  isDimmed,
  isClusterFocused,
  quality,
  reducedMotion,
  onSelect,
  onHover,
}: {
  data: SkillNodeData;
  isSelected: boolean;
  isHovered: boolean;
  isRelated: boolean;
  isDimmed: boolean;
  isClusterFocused: boolean;
  quality: SceneQuality;
  reducedMotion: boolean;
  onSelect: (skill: Skill | null) => void;
  onHover: (skill: Skill | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Scale animation
    const targetScale = isSelected ? 1.4 : isHovered ? 1.25 : isRelated ? 1.15 : 1.0;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      delta * 10
    );

    // Subtle breathing pulse if selected or related
    if (!reducedMotion && (isSelected || isRelated)) {
      const pulse = Math.sin(state.clock.getElapsedTime() * 4) * 0.08;
      meshRef.current.scale.addScalar(pulse);
    }
  });

  const handlePointerOver = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onHover(data.skill);
    window.dispatchEvent(new CustomEvent('unbound:cursor', { detail: 'Inspect' }));
  };

  const handlePointerOut = () => {
    onHover(null);
    window.dispatchEvent(new CustomEvent('unbound:cursor', { detail: null }));
  };

  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    onSelect(isSelected ? null : data.skill);
  };

  const emissiveColor = isSelected
    ? '#C5FF55'
    : isRelated
    ? data.category.color
    : data.category.color;

  const emissiveIntensity = isSelected
    ? 1.2
    : isHovered
    ? 0.9
    : isRelated
    ? 0.5
    : isDimmed
    ? 0.05
    : 0.35;

  const opacity = isDimmed ? 0.22 : 0.95;

  // Prevent label crowding on mobile/portrait: show individual skill labels when selected, hovered,
  // related, when its category cluster is focused, or on high quality desktop mode
  const showLabel =
    isSelected ||
    isHovered ||
    isRelated ||
    isClusterFocused ||
    (quality === 'high' && !isDimmed);

  const segments = quality === 'low' ? 14 : quality === 'balanced' ? 18 : 24;

  return (
    <group position={data.position}>
      {/* Generous Touch/Click Hit Sphere */}
      <mesh
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.26, 10, 10]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      <mesh ref={meshRef} raycast={() => null}>
        <sphereGeometry args={[0.14, segments, segments]} />
        <meshStandardMaterial
          color={data.category.color}
          emissive={emissiveColor}
          emissiveIntensity={emissiveIntensity}
          roughness={0.25}
          metalness={0.7}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Selected halo ring */}
      {(isSelected || isHovered) && (
        <mesh ref={haloRef} raycast={() => null}>
          <ringGeometry args={[0.22, 0.26, 32]} />
          <meshBasicMaterial
            color="#C5FF55"
            transparent
            opacity={isSelected ? 0.85 : 0.5}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* HTML Tag Label */}
      {showLabel && (
        <Html
          position={[0, 0.24, 0]}
          center
          distanceFactor={14}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`px-1.5 py-0.5 text-[9px] font-mono tracking-wider uppercase transition-all duration-200 border whitespace-nowrap ${
              isSelected
                ? 'bg-acid text-ink font-semibold border-acid shadow-md'
                : isHovered
                ? 'bg-ink-2 text-acid border-acid'
                : isRelated
                ? 'bg-ink-2 text-bone border-line'
                : 'bg-ink/80 text-muted border-line/60'
            }`}
          >
            {data.skill.name}
          </div>
        </Html>
      )}
    </group>
  );
}
