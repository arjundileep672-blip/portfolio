import * as THREE from 'three';

export type PlaygroundGeometryType =
  | 'torusKnot'
  | 'icosahedron'
  | 'deformedSphere'
  | 'parametricSurface'
  | 'particleSystem';

export type PlaygroundMaterialType =
  | 'metallic'
  | 'iridescent'
  | 'matte'
  | 'wireframe'
  | 'normal';

export type PlaygroundLightingPreset = 'acid' | 'studio' | 'mono';

/**
 * Generates a procedural twisted Mobius / harmonic ribbon surface BufferGeometry.
 */
export function createMobiusSurfaceGeometry(uSteps = 96, vSteps = 28): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i <= uSteps; i++) {
    const u = (i / uSteps) * Math.PI * 2;
    for (let j = 0; j <= vSteps; j++) {
      const v = (j / vSteps - 0.5) * 1.15;
      const radius = 1.25 + v * Math.cos(u * 1.5) * 0.55;
      const x = radius * Math.cos(u);
      const y = radius * Math.sin(u);
      const z = v * Math.sin(u * 1.5) * 0.85 + Math.sin(u * 3.0) * 0.18;

      positions.push(x, y, z);
      uvs.push(i / uSteps, j / vSteps);
    }
  }

  for (let i = 0; i < uSteps; i++) {
    for (let j = 0; j < vSteps; j++) {
      const a = i * (vSteps + 1) + j;
      const b = (i + 1) * (vSteps + 1) + j;
      const c = (i + 1) * (vSteps + 1) + (j + 1);
      const d = i * (vSteps + 1) + (j + 1);

      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  geo.setIndex(indices);
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.computeVertexNormals();
  return geo;
}

export const playgroundIridescentVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mvPos.xyz;
    gl_Position = projectionMatrix * mvPos;
  }
`;

export const playgroundIridescentFragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uDeform;
  uniform float uLightIntensity;
  uniform vec3 uAccentColor;

  varying vec3 vNormal;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(vViewPos);
    float NdotV = max(dot(N, V), 0.0);
    float fresnel = pow(1.0 - NdotV, 2.8);

    float phase = (NdotV * 5.0 + length(vLocalPos) * (1.2 + uDeform * 1.8) - uTime * 0.5);
    vec3 spectral = 0.5 + 0.5 * cos(phase + vec3(0.0, 2.1, 4.2));

    vec3 base = vec3(0.05, 0.06, 0.05);
    vec3 bone = vec3(0.95, 0.95, 0.92);

    vec3 L = normalize(vec3(3.0, 4.0, 4.0));
    vec3 H = normalize(L + V);
    float diff = max(dot(N, L), 0.0);
    float spec = pow(max(dot(N, H), 0.0), 48.0);

    vec3 col = base + mix(spectral, uAccentColor, 0.45) * (0.25 + fresnel * 0.95 + diff * 0.35);
    col += bone * spec * 0.9;
    col *= (0.55 + uLightIntensity * 0.55);

    gl_FragColor = vec4(col, 1.0);
  }
`;
