import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { NeuronInfo, SceneQuality } from '../../types';
import {
  buildResNetTopology,
  type NeuronNode,
  type LayerSpec,
} from '../utils/networkTopology';
import { setSceneCursor } from '../../shared/cursor';

interface ResNetGraphProps {
  quality: SceneQuality;
  reducedMotion: boolean;
  playing: boolean;
  speed: number;
  skipEnabled: boolean;
  fireSignalCounter: number;
  resetSignalCounter: number;
  selectedLayer: number | null;
  selectedNeuron: NeuronInfo | null;
  onSelectNeuron: (info: NeuronInfo, role: string) => void;
  onSelectLayer: (layerIdx: number | null) => void;
}

export function ResNetGraph({
  quality,
  reducedMotion,
  playing,
  speed,
  skipEnabled,
  fireSignalCounter,
  resetSignalCounter,
  selectedLayer,
  selectedNeuron,
  onSelectNeuron,
  onSelectLayer,
}: ResNetGraphProps) {
  const { layers, neurons, synapses, skipArcs } = useMemo(() => buildResNetTopology(), []);

  const neuronMeshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const forwardPulsesRef = useRef<THREE.InstancedMesh>(null);
  const skipPulsesRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Mutable simulation clock so play/pause/speed/reset work smoothly without React re-renders
  const simRef = useRef({
    phase: 0,
    burstWave: -10,
  });

  useEffect(() => {
    if (fireSignalCounter > 0) {
      simRef.current.burstWave = 0;
    }
  }, [fireSignalCounter]);

  useEffect(() => {
    if (resetSignalCounter > 0) {
      simRef.current.phase = 0;
      simRef.current.burstWave = -10;
    }
  }, [resetSignalCounter]);

  useEffect(() => {
    return () => setSceneCursor(null);
  }, []);

  // Synapse Line Geometries (normal vs highlighted)
  const { normalSynapseGeo, activeSynapseGeo } = useMemo(() => {
    const normCoords: number[] = [];
    const actCoords: number[] = [];

    synapses.forEach((syn) => {
      const isLayerFocused =
        selectedLayer !== null &&
        (syn.fromLayer === selectedLayer || syn.toLayer === selectedLayer);
      const isNeuronFocused =
        selectedNeuron !== null &&
        ((syn.fromLayer === selectedNeuron.layerIndex &&
          syn.fromNeuron === selectedNeuron.neuronIndex) ||
          (syn.toLayer === selectedNeuron.layerIndex &&
            syn.toNeuron === selectedNeuron.neuronIndex));

      const seg = [
        syn.from.x,
        syn.from.y,
        syn.from.z,
        syn.to.x,
        syn.to.y,
        syn.to.z,
      ];

      if (isNeuronFocused || isLayerFocused) {
        actCoords.push(...seg);
      } else {
        normCoords.push(...seg);
      }
    });

    const toGeo = (arr: number[]) => {
      const g = new THREE.BufferGeometry();
      if (arr.length > 0) {
        g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3));
      }
      return g;
    };

    return {
      normalSynapseGeo: toGeo(normCoords),
      activeSynapseGeo: toGeo(actCoords),
    };
  }, [synapses, selectedLayer, selectedNeuron]);

  // Skip Arc Line Geometries
  const skipArcGeos = useMemo(
    () =>
      skipArcs.map((arc) => ({
        ...arc,
        geo: new THREE.BufferGeometry().setFromPoints(arc.points),
      })),
    [skipArcs]
  );

  const forwardParticleCount = quality === 'low' ? 36 : 84;
  const skipParticleCount = quality === 'low' ? 12 : 24;

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);
    if (playing && !reducedMotion) {
      simRef.current.phase += dt * speed * 1.45;
    }
    if (simRef.current.burstWave >= 0) {
      simRef.current.burstWave += dt * Math.max(speed, 0.8) * 3.2;
      if (simRef.current.burstWave > 8.5) {
        simRef.current.burstWave = -10;
      }
    }

    const waveLayerPos = (simRef.current.phase % 7.5) - 0.5;
    const burstLayerPos = simRef.current.burstWave;

    // 1. Update Neuron sphere scales & emissive intensities
    neurons.forEach((n, idx) => {
      const mesh = neuronMeshRefs.current[idx];
      if (!mesh) return;

      const distToWave = Math.abs(n.layerIndex - waveLayerPos);
      const distToBurst = Math.abs(n.layerIndex - burstLayerPos);
      const waveExcitation = Math.max(0, 1 - distToWave * 0.85);
      const burstExcitation = Math.max(0, 1 - distToBurst * 0.95) * 1.35;

      // Without residual skip connections, deep layers (L3..L6) attenuate significantly
      const depthAttenuation =
        !skipEnabled && n.layerIndex >= 3 ? Math.max(0.18, 1 - (n.layerIndex - 2) * 0.24) : 1.0;

      const isSelected =
        selectedNeuron?.layerIndex === n.layerIndex &&
        selectedNeuron?.neuronIndex === n.neuronIndex;
      const isLayerMatch = selectedLayer === null || selectedLayer === n.layerIndex;

      const excitement =
        (n.baseBias * 0.4 + waveExcitation * 0.75 + burstExcitation) * depthAttenuation;
      const targetScale =
        (isSelected ? 1.45 : isLayerMatch ? 1.0 : 0.78) * (1 + excitement * 0.28);

      mesh.scale.setScalar(THREE.MathUtils.damp(mesh.scale.x, targetScale, 8, dt));

      const mat = mesh.material as THREE.MeshStandardMaterial;
      if (mat) {
        mat.emissiveIntensity = isSelected
          ? 1.4
          : (0.2 + excitement * 0.95) * (isLayerMatch ? 1 : 0.25);
        mat.opacity = isLayerMatch || isSelected ? 0.96 : 0.25;
      }
    });

    // 2. Update Feed-Forward Signal Particles
    if (forwardPulsesRef.current && synapses.length > 0) {
      const stride = Math.max(1, Math.floor(synapses.length / forwardParticleCount));
      for (let i = 0; i < forwardParticleCount; i++) {
        const syn = synapses[(i * stride) % synapses.length];
        const t = (simRef.current.phase * 0.55 + (i % 7) * 0.14 + syn.fromLayer * 0.18) % 1.0;
        dummy.position.lerpVectors(syn.from, syn.to, t);

        const attenuated = !skipEnabled && syn.fromLayer >= 3 ? 0.35 : 1.0;
        const layerVisible =
          selectedLayer === null ||
          syn.fromLayer === selectedLayer ||
          syn.toLayer === selectedLayer;
        dummy.scale.setScalar(layerVisible ? 0.95 * attenuated : 0.25);
        dummy.updateMatrix();
        forwardPulsesRef.current.setMatrixAt(i, dummy.matrix);
      }
      forwardPulsesRef.current.instanceMatrix.needsUpdate = true;
    }

    // 3. Update Residual Skip Connection Particles
    if (skipPulsesRef.current) {
      for (let i = 0; i < skipParticleCount; i++) {
        if (!skipEnabled) {
          dummy.scale.setScalar(0);
          dummy.updateMatrix();
          skipPulsesRef.current.setMatrixAt(i, dummy.matrix);
          continue;
        }
        const arc = skipArcs[i % skipArcs.length];
        const t = (simRef.current.phase * 0.48 + (i / skipParticleCount)) % 1.0;
        const pt = arc.curve.getPointAt(t);
        dummy.position.copy(pt);
        dummy.scale.setScalar(1.15);
        dummy.updateMatrix();
        skipPulsesRef.current.setMatrixAt(i, dummy.matrix);
      }
      skipPulsesRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  const handleNeuronClick = (e: ThreeEvent<MouseEvent>, n: NeuronNode) => {
    e.stopPropagation();
    const waveLayerPos = (simRef.current.phase % 7.5) - 0.5;
    const dist = Math.abs(n.layerIndex - waveLayerPos);
    const depthFactor = !skipEnabled && n.layerIndex >= 3 ? 0.35 : 1.0;
    const rawAct = Math.min(0.99, Math.max(0.04, (n.baseBias + Math.max(0, 1 - dist * 0.7) * 0.6) * depthFactor));

    onSelectNeuron(
      {
        layerIndex: n.layerIndex,
        layerName: n.layerName,
        neuronIndex: n.neuronIndex,
        activation: Number(rawAct.toFixed(3)),
      },
      n.role
    );
  };

  return (
    <group>
      {/* Layer Frame Planes & Overhead Badges */}
      {layers.map((spec: LayerSpec) => {
        const isSelectedLayer = selectedLayer === spec.index;
        return (
          <group key={`layer-frame-${spec.index}`} position={[spec.x, 0, 0]}>
            {/* Subtle Layer Slice Frame */}
            <mesh
              rotation={[0, Math.PI / 2, 0]}
              onClick={(e) => {
                e.stopPropagation();
                onSelectLayer(isSelectedLayer ? null : spec.index);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setSceneCursor('Focus Layer');
              }}
              onPointerOut={() => setSceneCursor(null)}
            >
              <planeGeometry args={[2.1, 3.1]} />
              <meshBasicMaterial
                color={isSelectedLayer ? '#C5FF55' : '#282D27'}
                wireframe
                transparent
                opacity={isSelectedLayer ? 0.45 : 0.14}
              />
            </mesh>

            {/* Layer Overhead Label */}
            <Html position={[0, -1.85, 0]} center distanceFactor={15} style={{ pointerEvents: 'none' }}>
              <div
                className={`border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider whitespace-nowrap transition-colors ${
                  isSelectedLayer
                    ? 'border-acid bg-acid text-ink font-semibold'
                    : spec.isResidualAdd
                    ? 'border-acid/60 bg-ink-2/90 text-acid'
                    : 'border-line bg-ink/85 text-muted'
                }`}
              >
                {spec.shortCode}
              </div>
            </Html>
          </group>
        );
      })}

      {/* Feed-Forward Synapse Connections */}
      <lineSegments geometry={normalSynapseGeo}>
        <lineBasicMaterial
          color="#858B80"
          transparent
          opacity={selectedLayer !== null || selectedNeuron !== null ? 0.08 : 0.18}
          depthWrite={false}
        />
      </lineSegments>

      <lineSegments geometry={activeSynapseGeo}>
        <lineBasicMaterial
          color="#9FD4FF"
          transparent
          opacity={0.78}
          depthWrite={false}
        />
      </lineSegments>

      {/* Residual Identity Skip Connection Arcs: y = F(x) + x */}
      {skipArcGeos.map((arc, idx) => (
        <group key={arc.id}>
          {/* @ts-expect-error R3F line primitive conflicts with SVG line in React JSX types */}
          <line geometry={arc.geo as unknown as THREE.BufferGeometry}>
            <lineBasicMaterial
              color={skipEnabled ? '#C5FF55' : '#282D27'}
              transparent
              opacity={skipEnabled ? 0.88 : 0.18}
            />
          </line>
          {idx % 3 === 1 && (
            <Html
              position={[
                (LAYER_SPECS_X(arc.fromLayer) + LAYER_SPECS_X(arc.toLayer)) * 0.5,
                2.45,
                0,
              ]}
              center
              distanceFactor={15}
              style={{ pointerEvents: 'none' }}
            >
              <div
                className={`border px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest whitespace-nowrap ${
                  skipEnabled
                    ? 'border-acid bg-ink-2/95 text-acid'
                    : 'border-line bg-ink/70 text-muted line-through'
                }`}
              >
                {arc.label} · (+x)
              </div>
            </Html>
          )}
        </group>
      ))}

      {/* Neuron Spheres */}
      {neurons.map((n, idx) => {
        const isSelected =
          selectedNeuron?.layerIndex === n.layerIndex &&
          selectedNeuron?.neuronIndex === n.neuronIndex;
        return (
          <mesh
            key={n.id}
            ref={(el) => {
              neuronMeshRefs.current[idx] = el;
            }}
            position={n.position}
            onClick={(e) => handleNeuronClick(e, n)}
            onPointerOver={(e) => {
              e.stopPropagation();
              setSceneCursor('Inspect Neuron');
            }}
            onPointerOut={() => setSceneCursor(null)}
          >
            <sphereGeometry args={[0.13, quality === 'low' ? 14 : 22, quality === 'low' ? 14 : 22]} />
            <meshStandardMaterial
              color={isSelected ? '#C5FF55' : n.color}
              emissive={isSelected ? '#C5FF55' : n.color}
              emissiveIntensity={0.45}
              roughness={0.22}
              metalness={0.65}
              transparent
              opacity={0.95}
            />
          </mesh>
        );
      })}

      {/* Feed-Forward Signal Particles */}
      <instancedMesh
        ref={forwardPulsesRef}
        args={[undefined, undefined, forwardParticleCount]}
        raycast={() => null}
      >
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshBasicMaterial color="#9FD4FF" transparent opacity={0.9} />
      </instancedMesh>

      {/* Residual Shortcut Signal Particles */}
      <instancedMesh
        ref={skipPulsesRef}
        args={[undefined, undefined, skipParticleCount]}
        raycast={() => null}
      >
        <sphereGeometry args={[0.048, 10, 10]} />
        <meshBasicMaterial color="#C5FF55" />
      </instancedMesh>
    </group>
  );
}

function LAYER_SPECS_X(layerIndex: number): number {
  const xs = [-5.4, -3.5, -1.6, 0.3, 2.2, 4.0, 5.6];
  return xs[layerIndex] ?? 0;
}
