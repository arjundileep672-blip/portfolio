import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import type { SceneQuality } from '../../types';
import {
  createMobiusSurfaceGeometry,
  playgroundIridescentVertexShader,
  playgroundIridescentFragmentShader,
  type PlaygroundGeometryType,
  type PlaygroundMaterialType,
  type PlaygroundLightingPreset,
} from '../utils/playgroundGeometries';
import { setSceneCursor } from '../../shared/cursor';

interface PlaygroundStageProps {
  quality: SceneQuality;
  reducedMotion: boolean;
  geometryType: PlaygroundGeometryType;
  materialType: PlaygroundMaterialType;
  lightingPreset: PlaygroundLightingPreset;
  lightingIntensity: number;
  rotationSpeed: number;
  deformation: number;
  particleDensity: number;
  onPulseTrigger: () => void;
}

export function PlaygroundStage({
  quality,
  reducedMotion,
  geometryType,
  materialType,
  lightingPreset,
  lightingIntensity,
  rotationSpeed,
  deformation,
  particleDensity,
  onPulseTrigger,
}: PlaygroundStageProps) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const vortexInstancedRef = useRef<THREE.InstancedMesh>(null);
  const ambientParticlesRef = useRef<THREE.Points>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const animRef = useRef({
    time: 0,
    transitionScale: 0.2,
    clickPulse: 0,
    pointerLocal: new THREE.Vector3(0, 0, 1),
  });

  // Trigger smooth scale-in transition whenever geometryType changes
  useEffect(() => {
    animRef.current.transitionScale = 0.35;
  }, [geometryType]);

  useEffect(() => {
    return () => setSceneCursor(null);
  }, []);

  // Build and store base vertex positions for real-time procedural deformation
  const { activeGeo, basePositions, baseNormals } = useMemo(() => {
    let geo: THREE.BufferGeometry;
    const isLow = quality === 'low';

    switch (geometryType) {
      case 'torusKnot':
        geo = new THREE.TorusKnotGeometry(0.95, 0.28, isLow ? 96 : 160, isLow ? 18 : 32, 3, 7);
        break;
      case 'icosahedron':
        geo = new THREE.IcosahedronGeometry(1.32, isLow ? 3 : 5);
        break;
      case 'deformedSphere':
        geo = new THREE.SphereGeometry(1.28, isLow ? 36 : 64, isLow ? 36 : 64);
        break;
      case 'parametricSurface':
        geo = createMobiusSurfaceGeometry(isLow ? 56 : 96, isLow ? 16 : 28);
        break;
      case 'particleSystem':
      default:
        geo = new THREE.IcosahedronGeometry(1.1, 2);
        break;
    }

    const posAttr = geo.getAttribute('position') as THREE.BufferAttribute;
    const normAttr = geo.getAttribute('normal') as THREE.BufferAttribute;
    const savedPos = new Float32Array(posAttr.array.length);
    savedPos.set(posAttr.array);
    const savedNorm = new Float32Array(normAttr.array.length);
    savedNorm.set(normAttr.array);

    return { activeGeo: geo, basePositions: savedPos, baseNormals: savedNorm };
  }, [geometryType, quality]);

  // Dispose old geometry when switching
  useEffect(() => {
    return () => {
      activeGeo.dispose();
    };
  }, [activeGeo]);

  // Shader uniforms for Iridescent Shader material
  const shaderUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uDeform: { value: 0 },
      uLightIntensity: { value: 1 },
      uAccentColor: { value: new THREE.Color('#C5FF55') },
    }),
    []
  );

  // Max ambient orbital particles
  const maxParticles = quality === 'low' ? 180 : 450;
  const particleBasePositions = useMemo(() => {
    const arr = new Float32Array(maxParticles * 3);
    for (let i = 0; i < maxParticles; i++) {
      const r = 1.9 + Math.random() * 2.4;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, [maxParticles]);

  // Vortex lattice count when geometryType === 'particleSystem'
  const vortexCount = quality === 'low' ? 160 : 360;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    const s = animRef.current;

    const effectiveRotSpeed = reducedMotion ? rotationSpeed * 0.25 : rotationSpeed;
    s.time += dt * (0.6 + effectiveRotSpeed * 0.8);
    s.transitionScale = THREE.MathUtils.damp(s.transitionScale, 1.0, 7.5, dt);
    s.clickPulse = THREE.MathUtils.damp(s.clickPulse, 0.0, 3.5, dt);

    // Update shader uniforms
    shaderUniforms.uTime.value = s.time;
    shaderUniforms.uDeform.value = deformation + s.clickPulse * 0.4;
    shaderUniforms.uLightIntensity.value = lightingIntensity;
    shaderUniforms.uAccentColor.value.set(
      lightingPreset === 'acid'
        ? '#C5FF55'
        : lightingPreset === 'studio'
        ? '#9FD4FF'
        : '#F2F2EA'
    );

    if (groupRef.current) {
      groupRef.current.rotation.y += dt * effectiveRotSpeed * 0.55;
      groupRef.current.rotation.x += dt * effectiveRotSpeed * 0.22;
      const sc = s.transitionScale * (1 + s.clickPulse * 0.08);
      groupRef.current.scale.setScalar(sc);
    }

    // Real-time vertex displacement on active solid geometry
    if (geometryType !== 'particleSystem' && meshRef.current) {
      const posAttr = activeGeo.getAttribute('position') as THREE.BufferAttribute;
      const arr = posAttr.array as Float32Array;
      const totalDeform = deformation + s.clickPulse * 0.45;
      const t = s.time;
      const vCount = posAttr.count;

      for (let i = 0; i < vCount; i++) {
        const idx = i * 3;
        const bx = basePositions[idx];
        const by = basePositions[idx + 1];
        const bz = basePositions[idx + 2];

        if (totalDeform < 0.002) {
          arr[idx] = bx;
          arr[idx + 1] = by;
          arr[idx + 2] = bz;
          continue;
        }

        const nx = baseNormals[idx];
        const ny = baseNormals[idx + 1];
        const nz = baseNormals[idx + 2];

        // Multi-harmonic spatial wave deformation
        const wave =
          Math.sin(bx * 3.2 + t * 1.4) *
            Math.cos(by * 3.2 - t * 1.1) *
            Math.sin(bz * 3.2 + t * 0.9) +
          0.45 * Math.sin((bx + by + bz) * 5.0 - t * 2.2);

        const disp = wave * 0.28 * totalDeform;
        arr[idx] = bx + nx * disp;
        arr[idx + 1] = by + ny * disp;
        arr[idx + 2] = bz + nz * disp;
      }

      posAttr.needsUpdate = true;
      if (materialType !== 'wireframe') {
        activeGeo.computeVertexNormals();
      }
    }

    // Update 3D Vortex Lattice when geometryType === 'particleSystem'
    if (geometryType === 'particleSystem' && vortexInstancedRef.current) {
      const t = s.time;
      const deformAmp = 0.35 + deformation * 0.65 + s.clickPulse * 0.5;
      for (let i = 0; i < vortexCount; i++) {
        const ratio = i / vortexCount;
        const phi = Math.acos(1 - 2 * ratio);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i + t * 0.4;

        const r =
          1.35 +
          Math.sin(phi * 6.0 + t * 1.8) * Math.cos(theta * 3.0 - t) * 0.42 * deformAmp;

        dummy.position.set(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.sin(phi) * Math.sin(theta),
          r * Math.cos(phi)
        );
        dummy.rotation.set(theta, phi, t * 0.5);
        const nodeScale = 0.75 + 0.45 * Math.sin(i * 0.3 + t * 2.5);
        dummy.scale.setScalar(nodeScale);
        dummy.updateMatrix();
        vortexInstancedRef.current.setMatrixAt(i, dummy.matrix);
      }
      vortexInstancedRef.current.instanceMatrix.needsUpdate = true;
    }

    // Rotate surrounding ambient particle field
    if (ambientParticlesRef.current) {
      ambientParticlesRef.current.rotation.y -= dt * (0.08 + effectiveRotSpeed * 0.15);
      ambientParticlesRef.current.rotation.z += dt * 0.04;
    }
  });

  const handleObjectClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    animRef.current.clickPulse = 1.0;
    onPulseTrigger();
  };

  const accentHex =
    lightingPreset === 'acid'
      ? '#C5FF55'
      : lightingPreset === 'studio'
      ? '#9FD4FF'
      : '#F2F2EA';

  const visibleParticleCount = Math.floor((particleDensity / 100) * maxParticles);

  const renderMaterial = () => {
    switch (materialType) {
      case 'metallic':
        return (
          <meshPhysicalMaterial
            color="#181C17"
            metalness={0.94}
            roughness={0.14}
            clearcoat={1.0}
            clearcoatRoughness={0.1}
            side={THREE.DoubleSide}
          />
        );
      case 'iridescent':
        return (
          <shaderMaterial
            vertexShader={playgroundIridescentVertexShader}
            fragmentShader={playgroundIridescentFragmentShader}
            uniforms={shaderUniforms}
            side={THREE.DoubleSide}
          />
        );
      case 'matte':
        return (
          <meshStandardMaterial
            color="#F2F2EA"
            roughness={0.86}
            metalness={0.08}
            side={THREE.DoubleSide}
          />
        );
      case 'wireframe':
        return (
          <meshStandardMaterial
            color={accentHex}
            emissive={accentHex}
            emissiveIntensity={0.45}
            wireframe
          />
        );
      case 'normal':
      default:
        return <meshNormalMaterial side={THREE.DoubleSide} />;
    }
  };

  return (
    <group>
      <group ref={groupRef}>
        {geometryType === 'particleSystem' ? (
          <instancedMesh
            ref={vortexInstancedRef}
            args={[undefined, undefined, vortexCount]}
            onClick={handleObjectClick}
            onPointerOver={(e) => {
              e.stopPropagation();
              setSceneCursor('Pulse Field');
            }}
            onPointerOut={() => setSceneCursor(null)}
          >
            <octahedronGeometry args={[0.065, 0]} />
            {renderMaterial()}
          </instancedMesh>
        ) : (
          <mesh
            ref={meshRef}
            geometry={activeGeo}
            onClick={handleObjectClick}
            onPointerOver={(e) => {
              e.stopPropagation();
              setSceneCursor('Pulse Specimen');
            }}
            onPointerOut={() => setSceneCursor(null)}
          >
            {renderMaterial()}
          </mesh>
        )}
      </group>

      {/* Dynamic Orbital Particle Field controlled by Particle Density slider */}
      {visibleParticleCount > 0 && (
        <points ref={ambientParticlesRef} raycast={() => null}>
          <bufferGeometry drawRange={{ start: 0, count: visibleParticleCount }}>
            <bufferAttribute
              attach="attributes-position"
              count={maxParticles}
              array={particleBasePositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color={accentHex}
            size={quality === 'low' ? 0.032 : 0.025}
            transparent
            opacity={0.65}
            sizeAttenuation
            depthWrite={false}
          />
        </points>
      )}
    </group>
  );
}
