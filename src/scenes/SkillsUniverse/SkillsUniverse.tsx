import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import type { SkillsUniverseProps } from '../types';
import type { Skill, SkillCategoryId } from '@/data/skills';
import { computeUniverseLayout, CATEGORY_CENTERS } from './positions';
import Nodes from './Nodes';
import Connections from './Connections';
import ControlsOverlay from './ControlsOverlay';
import { setSceneCursor } from '../shared/cursor';
import { useResponsiveCamera } from '@/hooks/useResponsiveScene';

const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

function AmbientStarfield({ count, reducedMotion }: { count: number; reducedMotion: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 5.5 + Math.random() * 7.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [count]);

  useFrame((_, delta) => {
    if (pointsRef.current && !reducedMotion) {
      pointsRef.current.rotation.y += Math.min(delta, 0.05) * 0.025;
    }
  });

  return (
    <points ref={pointsRef} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#858B80"
        size={0.032}
        transparent
        opacity={0.45}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function UniverseCameraRig({
  engaged,
  reducedMotion,
  focusTarget,
  focusCameraPos,
  resetCounter,
  hasSelection,
}: {
  engaged: boolean;
  reducedMotion: boolean;
  focusTarget: THREE.Vector3;
  focusCameraPos: THREE.Vector3 | null;
  resetCounter: number;
  hasSelection: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const animatingCamRef = useRef(false);

  const { cameraPos: defaultCamPos, isPortrait } = useResponsiveCamera({
    desktopPos: [0, 1.4, 8.6],
    desktopTarget: [0, 0, 0],
    portraitTarget: [0, -0.25, 0],
    baseFov: 46,
    minHorizontalSpan: 7.5,
  });

  const effectiveTarget = useMemo(() => {
    if (isPortrait && hasSelection) {
      // Shift target slightly down on portrait so focused node sits above the mobile bottom sheet
      return focusTarget.clone().add(new THREE.Vector3(0, -0.45, 0));
    }
    return focusTarget;
  }, [focusTarget, isPortrait, hasSelection]);

  const effectiveCamPos = useMemo(() => {
    if (!focusCameraPos) return defaultCamPos;
    if (!hasSelection) return defaultCamPos;
    if (isPortrait) {
      return focusCameraPos.clone().add(new THREE.Vector3(0, 0.2, 1.6));
    }
    return focusCameraPos;
  }, [focusCameraPos, defaultCamPos, hasSelection, isPortrait]);

  useEffect(() => {
    animatingCamRef.current = true;
  }, [effectiveTarget, effectiveCamPos, resetCounter]);

  useFrame(({ camera }, delta) => {
    if (!controlsRef.current) return;
    const dt = Math.min(delta, 0.05);

    // Smoothly interpolate OrbitControls target to focused node or cluster
    controlsRef.current.target.lerp(effectiveTarget, Math.min(1, dt * 5.0));

    if (animatingCamRef.current && effectiveCamPos) {
      camera.position.lerp(effectiveCamPos, Math.min(1, dt * 4.2));
      if (camera.position.distanceTo(effectiveCamPos) < 0.08) {
        animatingCamRef.current = false;
      }
    }

    controlsRef.current.update();
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
      autoRotate={!reducedMotion && !hasSelection}
      autoRotateSpeed={0.38}
      minDistance={2.8}
      maxDistance={isPortrait ? 20.0 : 14.5}
      onStart={() => {
        animatingCamRef.current = false;
      }}
    />
  );
}

export default function SkillsUniverse({
  active,
  quality,
  reducedMotion,
  engaged,
  skills,
  onSelectSkill,
  className = '',
}: SkillsUniverseProps) {
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [hoveredSkill, setHoveredSkill] = useState<Skill | null>(null);
  const [activeCategory, setActiveCategory] = useState<SkillCategoryId | 'all'>('all');
  const [resetCounter, setResetCounter] = useState(0);

  const { nodes, categoryClusters, connections, nodeMap } = useMemo(
    () => computeUniverseLayout(skills),
    [skills]
  );

  const allSkills = useMemo(() => skills.flatMap((c) => c.skills), [skills]);

  useEffect(() => {
    return () => setSceneCursor(null);
  }, []);

  const handleSelectSkill = useCallback(
    (skill: Skill | null) => {
      setSelectedSkill(skill);
      onSelectSkill?.(skill);
    },
    [onSelectSkill]
  );

  const handleSelectCategory = useCallback(
    (cat: SkillCategoryId | 'all') => {
      setActiveCategory(cat);
      if (cat !== 'all' && selectedSkill && selectedSkill.category !== cat) {
        handleSelectSkill(null);
      }
    },
    [selectedSkill, handleSelectSkill]
  );

  const handleResetCamera = useCallback(() => {
    setActiveCategory('all');
    handleSelectSkill(null);
    setHoveredSkill(null);
    setResetCounter((prev) => prev + 1);
  }, [handleSelectSkill]);

  // Compute camera target & position based on selection or active category
  const { focusTarget, focusCameraPos } = useMemo(() => {
    if (selectedSkill) {
      const node = nodeMap.get(selectedSkill.id);
      if (node) {
        const dir = node.position.clone().normalize();
        const camPos = node.position.clone().add(dir.multiplyScalar(3.6)).add(new THREE.Vector3(0, 0.6, 1.4));
        return { focusTarget: node.position.clone(), focusCameraPos: camPos };
      }
    }
    if (activeCategory !== 'all') {
      const centerCoords = CATEGORY_CENTERS[activeCategory] ?? [0, 0, 0];
      const center = new THREE.Vector3(...centerCoords);
      const camPos = center.clone().multiplyScalar(1.85).add(new THREE.Vector3(0, 0.8, 2.6));
      return { focusTarget: center, focusCameraPos: camPos };
    }
    return {
      focusTarget: DEFAULT_TARGET.clone(),
      focusCameraPos: null,
    };
  }, [selectedSkill, activeCategory, nodeMap]);

  const dprRange: [number, number] =
    quality === 'low' ? [1, 1.25] : quality === 'balanced' ? [1, 1.5] : [1, 2];
  const starCount = quality === 'low' ? 80 : quality === 'balanced' ? 160 : 240;

  return (
    <div className={`relative h-full w-full select-none bg-ink ${className}`}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={dprRange}
        camera={{ position: [0, 1.4, 8.6], fov: 46, near: 0.1, far: 60 }}
        gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
        onPointerMissed={() => handleSelectSkill(null)}
      >
        <color attach="background" args={['#080A08']} />
        <fog attach="fog" args={['#080A08', 10, 26]} />
        <AdaptiveDpr pixelated />

        <ambientLight intensity={0.65} />
        <directionalLight position={[6, 8, 6]} intensity={1.4} color="#F2F2EA" />
        <pointLight position={[0, 0, 0]} intensity={1.2} color="#C5FF55" distance={12} />

        {/* Central ARJUN Core Nexus */}
        <mesh raycast={() => null}>
          <octahedronGeometry args={[0.28, 0]} />
          <meshBasicMaterial color="#C5FF55" wireframe transparent opacity={0.35} />
        </mesh>

        <Connections
          connections={connections}
          nodes={nodes}
          categoryClusters={categoryClusters}
          selectedSkill={selectedSkill}
          hoveredSkill={hoveredSkill}
          activeCategory={activeCategory}
          reducedMotion={reducedMotion}
        />

        <Nodes
          nodes={nodes}
          categoryClusters={categoryClusters}
          selectedSkill={selectedSkill}
          hoveredSkill={hoveredSkill}
          activeCategory={activeCategory}
          quality={quality}
          reducedMotion={reducedMotion}
          onSelect={handleSelectSkill}
          onSelectCategory={handleSelectCategory}
          onHover={setHoveredSkill}
        />

        <AmbientStarfield
          count={starCount}
          reducedMotion={reducedMotion}
        />

        <UniverseCameraRig
          engaged={engaged}
          reducedMotion={reducedMotion}
          focusTarget={focusTarget}
          focusCameraPos={focusCameraPos}
          resetCounter={resetCounter}
          hasSelection={selectedSkill !== null || hoveredSkill !== null || activeCategory !== 'all'}
        />
      </Canvas>

      <ControlsOverlay
        categories={skills}
        allSkills={allSkills}
        activeCategory={activeCategory}
        selectedSkill={selectedSkill}
        hoveredSkill={hoveredSkill}
        onSelectCategory={handleSelectCategory}
        onSelectSkill={handleSelectSkill}
        onResetCamera={handleResetCamera}
      />
    </div>
  );
}
