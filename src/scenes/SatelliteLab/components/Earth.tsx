import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { SatelliteSensorMode, SceneQuality } from '@/scenes/types';

const EARTH_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  // Compact 3D hash & value noise for procedural terrain relief
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.04;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vUv = uv;
    vec3 norm = normalize(normal);
    float h = fbm(norm * 3.2);
    float land = smoothstep(0.46, 0.58, h);
    vec3 displaced = position + norm * (land * 0.032);

    vPosition = displaced;
    vNormal = normalize(normalMatrix * norm);
    vec4 worldPos = modelMatrix * vec4(displaced, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

const EARTH_FRAGMENT_SHADER = /* glsl */ `
  uniform float uTime;
  uniform int uSensorMode; // 0 = optical, 1 = sar, 2 = split
  uniform float uShowGrid;
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p *= 2.1;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 dir = normalize(vPosition);
    float n = fbm(dir * 3.2);
    float detail = fbm(dir * 14.0);
    float micro = noise(dir * 48.0);

    float landMask = smoothstep(0.47, 0.51, n);
    float coastMask = smoothstep(0.45, 0.50, n) - smoothstep(0.50, 0.54, n);
    float vegMask = smoothstep(0.48, 0.68, detail) * landMask;
    float urbanCluster = smoothstep(0.76, 0.84, detail * micro * 1.9) * landMask;
    float ridgeMask = smoothstep(0.64, 0.78, n) * landMask;

    // 1. Simulated Optical Multispectral Composite
    vec3 deepWater = vec3(0.035, 0.075, 0.11);
    vec3 shallowWater = vec3(0.06, 0.16, 0.20);
    vec3 waterCol = mix(deepWater, shallowWater, smoothstep(0.35, 0.48, n));

    vec3 lowLand = vec3(0.11, 0.19, 0.12);
    vec3 denseVeg = vec3(0.17, 0.34, 0.16);
    vec3 aridLand = vec3(0.24, 0.22, 0.16);
    vec3 alpine = vec3(0.68, 0.72, 0.68);

    vec3 landCol = mix(aridLand, lowLand, smoothstep(0.35, 0.6, detail));
    landCol = mix(landCol, denseVeg, vegMask);
    landCol = mix(landCol, alpine, ridgeMask);
    // Subtle urban signature in optical
    landCol = mix(landCol, vec3(0.77, 1.0, 0.33), urbanCluster * 0.55);

    vec3 opticalCol = mix(waterCol, landCol, landMask);
    opticalCol += coastMask * vec3(0.14, 0.28, 0.22);

    // 2. Simulated SAR Backscatter (Radar Grayscale + High-Return Scatterers)
    // Specular water = very dark; rough terrain = mid gray; urban corner reflectors & steep ridges = bright
    float speckle = 0.82 + 0.36 * hash(dir * 120.0 + fract(uTime * 0.05));
    float sarWater = 0.04 * speckle;
    float sarLand = (0.24 + 0.38 * detail + 0.35 * ridgeMask) * speckle;
    float sarDoubleBounce = smoothstep(0.62, 0.76, detail * micro * 1.75) * landMask;
    float sarIntensity = mix(sarWater, sarLand, landMask) + sarDoubleBounce * 0.65 + coastMask * 0.22;

    vec3 sarCol = vec3(sarIntensity * 0.88, sarIntensity * 0.93, sarIntensity * 0.86);
    // Highlight strong corner scatterers with subtle cyan/acid telemetry tint
    sarCol = mix(sarCol, vec3(0.77, 1.0, 0.33), sarDoubleBounce * 0.45);

    // Determine active mode (0 = optical, 1 = sar, 2 = split comparison)
    float splitSweep = sin(uTime * 0.45) * 0.35;
    float splitFactor = smoothstep(splitSweep - 0.03, splitSweep + 0.03, dir.x);
    float splitLine = 1.0 - smoothstep(0.0, 0.018, abs(dir.x - splitSweep));

    vec3 baseCol = opticalCol;
    if (uSensorMode == 1) {
      baseCol = sarCol;
    } else if (uSensorMode == 2) {
      baseCol = mix(opticalCol, sarCol, splitFactor);
      baseCol = mix(baseCol, vec3(0.77, 1.0, 0.33), splitLine * 0.85);
    }

    // Lat/Lon Graticule Grid
    if (uShowGrid > 0.5) {
      float latLines = abs( fract(vUv.y * 18.0) - 0.5 );
      float lonLines = abs( fract(vUv.x * 36.0) - 0.5 );
      float grid = 1.0 - smoothstep(0.0, 0.028, min(latLines, lonLines));
      baseCol = mix(baseCol, vec3(0.77, 1.0, 0.33), grid * 0.16);
    }

    // Directional solar + rim lighting
    vec3 lightDir = normalize(vec3(1.2, 0.8, 1.0));
    float diff = max(dot(vNormal, lightDir), 0.0);
    float rim = pow(1.0 - max(dot(vNormal, vec3(0.0, 0.0, 1.0)), 0.0), 2.6);

    vec3 finalCol = baseCol * (0.38 + 0.78 * diff) + vec3(0.45, 0.68, 0.32) * rim * 0.28;
    gl_FragColor = vec4(finalCol, 1.0);
  }
`;

interface EarthProps {
  quality: SceneQuality;
  sensorMode: SatelliteSensorMode;
  showGrid: boolean;
  showAtmosphere: boolean;
  showSwathOverlay: boolean;
  reducedMotion: boolean;
}

export function Earth({
  quality,
  sensorMode,
  showGrid,
  showAtmosphere,
  showSwathOverlay,
  reducedMotion,
}: EarthProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const scanRingRef = useRef<THREE.Mesh>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSensorMode: { value: 0 },
      uShowGrid: { value: 1.0 },
    }),
    []
  );

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = reducedMotion ? 0 : t;
      matRef.current.uniforms.uSensorMode.value =
        sensorMode === 'optical' ? 0 : sensorMode === 'sar' ? 1 : 2;
      matRef.current.uniforms.uShowGrid.value = showGrid ? 1.0 : 0.0;
    }
    if (scanRingRef.current && !reducedMotion) {
      scanRingRef.current.rotation.z = t * 0.35;
      scanRingRef.current.rotation.x = Math.sin(t * 0.25) * 0.35;
    }
  });

  const segments = quality === 'low' ? 40 : quality === 'balanced' ? 64 : 96;

  return (
    <group>
      {/* Core Procedural Globe */}
      <mesh>
        <sphereGeometry args={[1.65, segments, segments]} />
        <shaderMaterial
          ref={matRef}
          vertexShader={EARTH_VERTEX_SHADER}
          fragmentShader={EARTH_FRAGMENT_SHADER}
          uniforms={uniforms}
        />
      </mesh>

      {/* Atmospheric Fresnel Shell */}
      {showAtmosphere && (
        <mesh raycast={() => null}>
          <sphereGeometry args={[1.72, 48, 48]} />
          <meshBasicMaterial
            color={sensorMode === 'sar' ? '#9FD4FF' : '#C5FF55'}
            transparent
            opacity={0.07}
            side={THREE.BackSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}

      {/* Outer Equator & Meridian Calibration Rings */}
      {showGrid && (
        <group raycast={() => null}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.76, 1.768, 96]} />
            <meshBasicMaterial
              color="#282D27"
              side={THREE.DoubleSide}
              transparent
              opacity={0.7}
            />
          </mesh>
          <mesh>
            <ringGeometry args={[1.78, 1.785, 96]} />
            <meshBasicMaterial
              color="#282D27"
              side={THREE.DoubleSide}
              transparent
              opacity={0.45}
            />
          </mesh>
        </group>
      )}

      {/* Orbital Sensor Swath Coverage Band */}
      {showSwathOverlay && (
        <mesh ref={scanRingRef} raycast={() => null}>
          <torusGeometry args={[1.69, 0.012, 12, 96]} />
          <meshBasicMaterial
            color={sensorMode === 'sar' ? '#9FD4FF' : '#C5FF55'}
            transparent
            opacity={0.42}
          />
        </mesh>
      )}
    </group>
  );
}
