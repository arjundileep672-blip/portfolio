import { useMemo, useRef, useEffect } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneQuality } from '../../types';
import { heroVertexShader, heroFragmentShader } from '../utils/heroShaders';
import { setSceneCursor } from '../../shared/cursor';

interface HeroSculptureProps {
  quality: SceneQuality;
  reducedMotion: boolean;
  morphIndex: number;
  secretActive: boolean;
  pulseTrigger: number;
  resetTrigger: number;
  onTransform: () => void;
  onReset: () => void;
}

export function HeroSculpture({
  quality,
  reducedMotion,
  morphIndex,
  secretActive,
  pulseTrigger,
  resetTrigger,
  onTransform,
  onReset,
}: HeroSculptureProps) {
  const { viewport } = useThree();
  const rootGroupRef = useRef<THREE.Group>(null);
  const coreMeshRef = useRef<THREE.Mesh>(null);
  const wireCageRef = useRef<THREE.Mesh>(null);
  const outerRingARef = useRef<THREE.Group>(null);
  const outerRingBRef = useRef<THREE.Group>(null);
  const particlesRef = useRef<THREE.Points>(null);

  // Local mutable animation state to avoid React re-renders inside useFrame
  const animState = useRef({
    time: 0,
    morphCurrent: 0,
    pulseCurrent: 0,
    secretCurrent: 0,
    pointerLocal: new THREE.Vector3(0.6, 0.4, 0.8),
    pointerTarget: new THREE.Vector3(0.6, 0.4, 0.8),
    pointerActive: 0,
    pointerHovered: false,
    dragDelta: 0,
    pointerDownPos: new THREE.Vector2(),
  });

  // Trigger pulse wave when pulseTrigger increments
  useEffect(() => {
    if (pulseTrigger > 0) {
      animState.current.pulseCurrent = 1.0;
    }
  }, [pulseTrigger]);

  // Reset internal orientation when resetTrigger increments
  useEffect(() => {
    if (resetTrigger > 0) {
      animState.current.pulseCurrent = 0.65;
      if (rootGroupRef.current) {
        rootGroupRef.current.rotation.set(0, 0, 0);
      }
    }
  }, [resetTrigger]);

  // Cleanup cursor on unmount
  useEffect(() => {
    return () => setSceneCursor(null);
  }, []);

  // Shader uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uPulse: { value: 0 },
      uSecret: { value: 0 },
      uPointer: { value: new THREE.Vector3(0, 0, 1) },
      uPointerActive: { value: 0 },
    }),
    []
  );

  // Geometries memoized by 3-tier quality level with proper GPU disposal
  const detail = quality === 'low' ? 28 : quality === 'balanced' ? 44 : 64;
  const coreGeo = useMemo(() => new THREE.IcosahedronGeometry(1.22, detail), [detail]);
  const cageGeo = useMemo(
    () => new THREE.IcosahedronGeometry(1.52, quality === 'low' ? 1 : 2),
    [quality]
  );

  useEffect(() => {
    return () => {
      coreGeo.dispose();
      cageGeo.dispose();
    };
  }, [coreGeo, cageGeo]);

  // Orbital atmospheric particle buffer scaled by quality tier
  const particleCount = quality === 'low' ? 95 : quality === 'balanced' ? 190 : 320;
  const { particlePositions, particlePhases } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const phases = new Float32Array(particleCount * 3); // [radius, speed, angleOffset]
    for (let i = 0; i < particleCount; i++) {
      const r = 1.75 + Math.random() * 1.65;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      phases[i * 3] = r;
      phases[i * 3 + 1] = (0.18 + Math.random() * 0.35) * (Math.random() > 0.5 ? 1 : -1);
      phases[i * 3 + 2] = theta;
    }
    return { particlePositions: positions, particlePhases: phases };
  }, [particleCount]);

  // Responsive spatial composition:
  // - Wide desktop: shift sculpture further right with refined scale so "ARJUN" and the sculpture breathe cleanly
  // - Portrait mobile/tablet: elevate sculpture into upper-center/right zone above headline
  // - Compact landscape: shift right with balanced scale
  const isPortrait = viewport.aspect < 0.95;
  const targetOffsetX =
    viewport.width > 7.2
      ? Math.min(viewport.width * 0.24, 1.95)
      : isPortrait
      ? Math.min(viewport.width * 0.06, 0.25)
      : Math.min(viewport.width * 0.18, 1.2);
  const targetOffsetY =
    viewport.width > 7.2
      ? 0.05
      : isPortrait
      ? Math.min(viewport.height * 0.09, 0.5)
      : 0.08;
  const baseScale = isPortrait
    ? THREE.MathUtils.clamp(viewport.width * 0.21, 0.64, 0.82)
    : viewport.width < 7.2
    ? 0.78
    : 0.92;

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = animState.current;

    // Advance time if not reducedMotion (still allow subtle shader breath when hovered)
    const speedFactor = reducedMotion ? 0.15 : 1.0;
    s.time += dt * speedFactor * (secretActive ? 2.1 : 1.0);

    // Smoothly interpolate morph state, pulse decay, and secret overdrive
    s.morphCurrent = THREE.MathUtils.damp(s.morphCurrent, morphIndex, 3.8, dt);
    s.pulseCurrent = THREE.MathUtils.damp(s.pulseCurrent, 0, 2.8, dt);
    s.secretCurrent = THREE.MathUtils.damp(s.secretCurrent, secretActive ? 1.0 : 0.0, 3.5, dt);

    // Global pointer fallback so moving mouse anywhere over the hero influences the sculpture
    if (!s.pointerHovered) {
      s.pointerTarget.set(state.pointer.x * 1.4, state.pointer.y * 1.4, 1.0).normalize();
    }
    const targetPointerWeight = s.pointerHovered ? 1.0 : 0.48;
    s.pointerActive = THREE.MathUtils.damp(s.pointerActive, targetPointerWeight, 4.5, dt);
    s.pointerLocal.lerp(s.pointerTarget, Math.min(1, dt * 7.5));

    // Update shader uniforms
    uniforms.uTime.value = s.time;
    uniforms.uMorph.value = s.morphCurrent;
    uniforms.uPulse.value = s.pulseCurrent;
    uniforms.uSecret.value = s.secretCurrent;
    uniforms.uPointer.value.copy(s.pointerLocal);
    uniforms.uPointerActive.value = s.pointerActive;

    // Smoothly position root group
    if (rootGroupRef.current) {
      rootGroupRef.current.position.x = THREE.MathUtils.damp(
        rootGroupRef.current.position.x,
        targetOffsetX,
        4.0,
        dt
      );
      rootGroupRef.current.position.y = THREE.MathUtils.damp(
        rootGroupRef.current.position.y,
        targetOffsetY + (reducedMotion ? 0 : Math.sin(s.time * 0.85) * 0.06),
        4.0,
        dt
      );
      const pulseScale = baseScale * (1 + s.pulseCurrent * 0.06 + s.secretCurrent * 0.08);
      rootGroupRef.current.scale.setScalar(
        THREE.MathUtils.damp(rootGroupRef.current.scale.x, pulseScale, 6.0, dt)
      );
    }

    // Idle rotation of core mesh & wireframe cage
    if (coreMeshRef.current && !reducedMotion) {
      coreMeshRef.current.rotation.y += dt * (0.16 + s.secretCurrent * 0.45);
      coreMeshRef.current.rotation.x = Math.sin(s.time * 0.35) * 0.18 + state.pointer.y * 0.15;
    }

    if (wireCageRef.current) {
      wireCageRef.current.rotation.y -= dt * (reducedMotion ? 0.02 : 0.12);
      wireCageRef.current.rotation.z = s.morphCurrent * 0.45 + Math.cos(s.time * 0.25) * 0.12;
      const cageScale = 1.0 + (s.morphCurrent % 1) * 0.08 + s.pulseCurrent * 0.12 + s.secretCurrent * 0.16;
      wireCageRef.current.scale.setScalar(cageScale);
    }

    // Gyroscopic orbital rings
    if (outerRingARef.current) {
      outerRingARef.current.rotation.z += dt * (reducedMotion ? 0.03 : 0.22);
      outerRingARef.current.rotation.x =
        0.65 + s.morphCurrent * 0.35 + state.pointer.y * 0.22;
    }
    if (outerRingBRef.current) {
      outerRingBRef.current.rotation.y -= dt * (reducedMotion ? 0.02 : 0.18);
      outerRingBRef.current.rotation.z =
        -0.5 + s.morphCurrent * 0.4 + state.pointer.x * 0.22;
    }

    // Swirl orbital particles
    if (particlesRef.current && !reducedMotion) {
      const posAttr = particlesRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const expansion = 1.0 + s.secretCurrent * 0.45 + s.pulseCurrent * 0.2;
      for (let i = 0; i < particleCount; i++) {
        const baseR = particlePhases[i * 3] * expansion;
        const speed = particlePhases[i * 3 + 1];
        const angle = particlePhases[i * 3 + 2] + s.time * speed;
        const yOrig = arr[i * 3 + 1];
        const radialXZ = Math.sqrt(Math.max(0.1, baseR * baseR - yOrig * yOrig * 0.5));
        arr[i * 3] = Math.cos(angle) * radialXZ;
        arr[i * 3 + 2] = Math.sin(angle) * radialXZ;
      }
      posAttr.needsUpdate = true;
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    animState.current.pointerDownPos.set(e.clientX, e.clientY);
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const dx = e.clientX - animState.current.pointerDownPos.x;
    const dy = e.clientY - animState.current.pointerDownPos.y;
    // Ignore if user was dragging to rotate camera
    if (Math.hypot(dx, dy) > 6) return;
    onTransform();
  };

  const handleDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onReset();
  };

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (coreMeshRef.current) {
      const localPt = coreMeshRef.current.worldToLocal(e.point.clone()).normalize();
      animState.current.pointerTarget.copy(localPt);
      animState.current.pointerHovered = true;
    }
  };

  return (
    <group ref={rootGroupRef} position={[targetOffsetX, targetOffsetY, 0]} scale={baseScale}>
      {/* Primary Interactive Procedural Shader Sculpture */}
      <mesh
        ref={coreMeshRef}
        geometry={coreGeo}
        onPointerDown={handlePointerDown}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onPointerMove={handlePointerMove}
        onPointerOver={(e) => {
          e.stopPropagation();
          animState.current.pointerHovered = true;
          setSceneCursor('Transform');
        }}
        onPointerOut={() => {
          animState.current.pointerHovered = false;
          setSceneCursor(null);
        }}
      >
        <shaderMaterial
          vertexShader={heroVertexShader}
          fragmentShader={heroFragmentShader}
          uniforms={uniforms}
        />
      </mesh>

      {/* Inner High-Polish Obsidian Core (visible when surface troughs invert) */}
      <mesh scale={0.86}>
        <icosahedronGeometry args={[1, quality === 'low' ? 16 : 32]} />
        <meshPhysicalMaterial
          color="#080A08"
          metalness={0.95}
          roughness={0.12}
          clearcoat={1}
          clearcoatRoughness={0.08}
          iridescence={0.85}
          iridescenceIOR={1.5}
          emissive="#C5FF55"
          emissiveIntensity={secretActive ? 0.35 : 0.05}
        />
      </mesh>

      {/* Subtle Geodesic Halo Lattice (only visible on morph/secret pulse so surface stays sleek) */}
      <mesh ref={wireCageRef} geometry={cageGeo} raycast={() => null}>
        <meshBasicMaterial
          color="#C5FF55"
          wireframe
          transparent
          opacity={secretActive ? 0.22 : 0.035}
        />
      </mesh>

      {/* Gyroscopic Orbital Ring A (Tighter radius so it never intersects the top navbar) */}
      <group ref={outerRingARef} rotation={[0.65, 0.2, 0]}>
        <mesh raycast={() => null}>
          <torusGeometry args={[1.56, 0.0045, 12, quality === 'low' ? 64 : 120]} />
          <meshBasicMaterial color="#C5FF55" transparent opacity={0.32} />
        </mesh>
        <mesh position={[1.56, 0, 0]} raycast={() => null}>
          <sphereGeometry args={[0.026, 12, 12]} />
          <meshBasicMaterial color="#C5FF55" />
        </mesh>
        <mesh position={[-1.56, 0, 0]} raycast={() => null}>
          <sphereGeometry args={[0.02, 12, 12]} />
          <meshBasicMaterial color="#F2F2EA" />
        </mesh>
      </group>

      {/* Gyroscopic Orbital Ring B (Architectural Ring) */}
      <group ref={outerRingBRef} rotation={[-0.45, 0.5, -0.5]}>
        <mesh raycast={() => null}>
          <torusGeometry args={[1.76, 0.0035, 8, quality === 'low' ? 64 : 120]} />
          <meshBasicMaterial color="#F2F2EA" transparent opacity={0.14} />
        </mesh>
        <mesh position={[0, 1.76, 0]} raycast={() => null}>
          <boxGeometry args={[0.036, 0.036, 0.036]} />
          <meshBasicMaterial color="#C5FF55" />
        </mesh>
      </group>

      {/* Atmospheric Orbital Particle Field */}
      <points ref={particlesRef} raycast={() => null}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#C5FF55"
          size={quality === 'low' ? 0.028 : 0.022}
          transparent
          opacity={secretActive ? 0.85 : 0.52}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}
