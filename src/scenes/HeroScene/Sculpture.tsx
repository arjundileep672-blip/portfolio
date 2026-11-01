import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { HeroInteraction } from '../types';
import { sculptureVertexShader, sculptureFragmentShader } from './shaders';

interface SculptureProps {
  quality: 'high' | 'low';
  reducedMotion: boolean;
  resetSignal: number;
  secretSignal: number;
  onInteract?: (type: HeroInteraction) => void;
}

export default function Sculpture({
  quality,
  reducedMotion,
  resetSignal,
  secretSignal,
  onInteract,
}: SculptureProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const { size } = useThree();

  // Morph mode state: 0 (liquid), 1 (crystalline), 2 (kinetic tendrils)
  const morphTarget = useRef<number>(0);
  const currentMorph = useRef<number>(0);
  const pulseRef = useRef<number>(0);
  const explodeTarget = useRef<number>(0);
  const currentExplode = useRef<number>(0);
  const glowRef = useRef<number>(0);
  const mouseTarget = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const currentMouse = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));

  // Shader uniforms
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uMorph: { value: 0 },
      uExplode: { value: 0 },
      uPulse: { value: 0 },
      uGlow: { value: 0 },
    }),
    []
  );

  // Handle external reset signal
  const lastResetRef = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal !== lastResetRef.current) {
      lastResetRef.current = resetSignal;
      morphTarget.current = 0;
      explodeTarget.current = 0;
      glowRef.current = 0;
      pulseRef.current = 0;
      if (groupRef.current) {
        groupRef.current.rotation.set(0, 0, 0);
      }
      onInteract?.('reset');
    }
  }, [resetSignal, onInteract]);

  // Handle secret signal (easter egg animation)
  const lastSecretRef = useRef(secretSignal);
  useEffect(() => {
    if (secretSignal !== lastSecretRef.current) {
      lastSecretRef.current = secretSignal;
      explodeTarget.current = 1.0;
      glowRef.current = 1.0;
      onInteract?.('secret');

      // Re-collapse after peak
      const timer = setTimeout(() => {
        explodeTarget.current = 0.0;
      }, 1400);
      return () => clearTimeout(timer);
    }
  }, [secretSignal, onInteract]);

  // Click interaction: morph cycle
  const handleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    morphTarget.current = (morphTarget.current + 1) % 3;
    pulseRef.current = 1.0;
    glowRef.current = 0.6;
    onInteract?.('transform');
  };

  // Double click: reset
  const handleDoubleClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    morphTarget.current = 0;
    explodeTarget.current = 0;
    pulseRef.current = 0;
    glowRef.current = 0;
    onInteract?.('reset');
  };

  // Pointer hover and cursor dispatch
  const handlePointerOver = () => {
    window.dispatchEvent(new CustomEvent('unbound:cursor', { detail: 'Drag' }));
  };

  const handlePointerOut = () => {
    window.dispatchEvent(new CustomEvent('unbound:cursor', { detail: null }));
    mouseTarget.current.set(0, 0);
  };

  const handlePointerMove = (e: { uv?: THREE.Vector2; point: THREE.Vector3 }) => {
    // Map hit coordinates to normalized 2D offset [-1, 1]
    const p = e.point;
    mouseTarget.current.set(p.x * 0.5, p.y * 0.5);
  };

  // Geometry detail based on quality
  const sphereArgs: [number, number, number] = quality === 'low' ? [1.4, 48, 48] : [1.5, 96, 96];

  // Animation frame loop
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Uniform updates
    uniforms.uTime.value = time;

    // Smooth lerps
    currentMorph.current = THREE.MathUtils.lerp(currentMorph.current, morphTarget.current, delta * 3.5);
    uniforms.uMorph.value = currentMorph.current;

    currentExplode.current = THREE.MathUtils.lerp(currentExplode.current, explodeTarget.current, delta * 2.8);
    uniforms.uExplode.value = currentExplode.current;

    if (pulseRef.current > 0.001) {
      pulseRef.current = THREE.MathUtils.lerp(pulseRef.current, 0, delta * 2.5);
    }
    uniforms.uPulse.value = pulseRef.current;

    if (glowRef.current > 0.001) {
      glowRef.current = THREE.MathUtils.lerp(glowRef.current, 0, delta * 1.8);
    }
    uniforms.uGlow.value = glowRef.current;

    currentMouse.current.lerp(mouseTarget.current, delta * 5.0);
    uniforms.uMouse.value.copy(currentMouse.current);

    // Idle motion and levitation
    if (groupRef.current) {
      if (!reducedMotion) {
        // Smooth floating levitation
        groupRef.current.position.y = Math.sin(time * 0.8) * 0.12;
        // Subtle organic pitch and yaw
        groupRef.current.rotation.y = time * 0.12;
        groupRef.current.rotation.x = Math.sin(time * 0.5) * 0.08;
      } else {
        groupRef.current.position.y = 0;
      }
    }
  });

  // Responsive weighting: desktop (>=1024px) weights right to leave hero typography clear
  const isDesktop = size.width >= 1024;
  const rootPosition: [number, number, number] = isDesktop ? [1.3, 0, 0] : [0, 0.2, 0];

  return (
    <group position={rootPosition}>
      <group ref={groupRef}>
        <mesh
          ref={meshRef}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerMove={handlePointerMove}
        >
          <sphereGeometry args={sphereArgs} />
          <shaderMaterial
            vertexShader={sculptureVertexShader}
            fragmentShader={sculptureFragmentShader}
            uniforms={uniforms}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
}
