import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';

interface ParticlesProps {
  quality: 'high' | 'low';
  reducedMotion: boolean;
  secretSignal: number;
}

export default function Particles({ quality, reducedMotion, secretSignal }: ParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const count = quality === 'low' ? 30 : 120;
  const { size } = useThree();

  const [positions, initialPositions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const init = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 2.0 + Math.random() * 1.8;

      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);

      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;

      init[i * 3] = x;
      init[i * 3 + 1] = y;
      init[i * 3 + 2] = z;
    }

    return [pos, init];
  }, [count]);

  const burstRef = useRef(0);
  const lastSecretRef = useRef(secretSignal);

  useEffect(() => {
    if (secretSignal !== lastSecretRef.current) {
      lastSecretRef.current = secretSignal;
      burstRef.current = 1.0;
    }
  }, [secretSignal]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    const geo = pointsRef.current.geometry;
    const posAttr = geo.attributes.position;
    if (!posAttr) return;

    if (burstRef.current > 0.001) {
      burstRef.current = THREE.MathUtils.lerp(burstRef.current, 0, delta * 1.2);
    }

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      if (!reducedMotion) {
        // Orbit around Y axis
        const x = initialPositions[idx];
        const z = initialPositions[idx + 2];
        const angle = time * 0.15 + (i * 0.05);
        const radius = Math.sqrt(x * x + z * z);

        const burstMultiplier = 1.0 + burstRef.current * 1.5;

        posAttr.array[idx] = Math.cos(angle) * radius * burstMultiplier;
        posAttr.array[idx + 1] = initialPositions[idx + 1] + Math.sin(time * 0.5 + i) * 0.2;
        posAttr.array[idx + 2] = Math.sin(angle) * radius * burstMultiplier;
      }
    }
    posAttr.needsUpdate = true;
  });

  const isDesktop = size.width >= 1024;
  const rootPosition: [number, number, number] = isDesktop ? [1.3, 0, 0] : [0, 0.2, 0];

  return (
    <group position={rootPosition}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={count}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={quality === 'low' ? 0.04 : 0.055}
          color="#C5FF55"
          transparent
          opacity={0.65}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
