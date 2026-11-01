import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { RotateCcw, Sliders, Sparkles } from 'lucide-react';
import type { PlaygroundProps } from '../types';
import {
  type PlaygroundGeometryType,
  type PlaygroundMaterialType,
  type PlaygroundLightingPreset,
} from './utils/playgroundGeometries';
import { PlaygroundStage } from './components/PlaygroundStage';
import { StudioEnvironment } from '../shared/StudioEnvironment';

const GEOMETRY_OPTIONS: { id: PlaygroundGeometryType; label: string }[] = [
  { id: 'torusKnot', label: 'Torus Knot' },
  { id: 'icosahedron', label: 'Icosahedron' },
  { id: 'deformedSphere', label: 'Deformed Sphere' },
  { id: 'parametricSurface', label: 'Mobius Surface' },
  { id: 'particleSystem', label: 'Particle Lattice' },
];

const MATERIAL_OPTIONS: { id: PlaygroundMaterialType; label: string }[] = [
  { id: 'metallic', label: 'Metallic' },
  { id: 'iridescent', label: 'Iridescent' },
  { id: 'matte', label: 'Matte' },
  { id: 'wireframe', label: 'Wireframe' },
  { id: 'normal', label: 'Normal Map' },
];

const LIGHTING_PRESETS: { id: PlaygroundLightingPreset; label: string; color: string }[] = [
  { id: 'acid', label: 'Acid Lab', color: '#C5FF55' },
  { id: 'studio', label: 'Studio Cool', color: '#9FD4FF' },
  { id: 'mono', label: 'Editorial Mono', color: '#F2F2EA' },
];

const DEFAULT_CAM_POS = new THREE.Vector3(0, 0.4, 4.8);
const DEFAULT_TARGET = new THREE.Vector3(0, 0, 0);

function PlaygroundCameraRig({
  engaged,
  resetCounter,
}: {
  engaged: boolean;
  resetCounter: number;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const resettingRef = useRef(false);

  useEffect(() => {
    if (resetCounter > 0) {
      resettingRef.current = true;
    }
  }, [resetCounter]);

  useFrame(({ camera }, delta) => {
    if (!resettingRef.current || !controlsRef.current) return;
    const dt = Math.min(delta, 0.05);
    camera.position.lerp(DEFAULT_CAM_POS, Math.min(1, dt * 6.0));
    controlsRef.current.target.lerp(DEFAULT_TARGET, Math.min(1, dt * 6.0));
    controlsRef.current.update();

    if (camera.position.distanceTo(DEFAULT_CAM_POS) < 0.04) {
      resettingRef.current = false;
    }
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
      minDistance={2.4}
      maxDistance={9.5}
      onStart={() => {
        resettingRef.current = false;
      }}
    />
  );
}

export default function Playground({
  active,
  quality,
  reducedMotion,
  engaged,
  className = '',
}: PlaygroundProps) {
  const [geometryType, setGeometryType] = useState<PlaygroundGeometryType>('torusKnot');
  const [materialType, setMaterialType] = useState<PlaygroundMaterialType>('iridescent');
  const [lightingPreset, setLightingPreset] = useState<PlaygroundLightingPreset>('acid');
  const [rotationSpeed, setRotationSpeed] = useState<number>(0.8);
  const [deformation, setDeformation] = useState<number>(0.45);
  const [lightingIntensity, setLightingIntensity] = useState<number>(1.2);
  const [particleDensity, setParticleDensity] = useState<number>(65);
  const [pulseCount, setPulseCount] = useState<number>(0);
  const [resetCounter, setResetCounter] = useState<number>(0);
  const [panelCollapsed, setPanelCollapsed] = useState<boolean>(false);

  const handleResetAll = () => {
    setGeometryType('torusKnot');
    setMaterialType('iridescent');
    setLightingPreset('acid');
    setRotationSpeed(0.8);
    setDeformation(0.45);
    setLightingIntensity(1.2);
    setParticleDensity(65);
    setResetCounter((prev) => prev + 1);
  };

  const keyLightColor =
    lightingPreset === 'acid'
      ? '#C5FF55'
      : lightingPreset === 'studio'
      ? '#9FD4FF'
      : '#F2F2EA';

  const fillLightColor =
    lightingPreset === 'studio' ? '#FFB86B' : '#F2F2EA';

  return (
    <div className={`relative h-full w-full select-none bg-ink ${className}`}>
      <Canvas
        frameloop={active ? 'always' : 'never'}
        dpr={quality === 'low' ? [1, 1.5] : [1, 2]}
        camera={{ position: [0, 0.4, 4.8], fov: 44, near: 0.1, far: 50 }}
        gl={{ antialias: quality !== 'low', powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#080A08']} />
        <fog attach="fog" args={['#080A08', 8, 20]} />
        <AdaptiveDpr pixelated />

        <ambientLight intensity={0.45 * lightingIntensity} />
        <directionalLight
          position={[5, 6, 4]}
          intensity={1.65 * lightingIntensity}
          color={fillLightColor}
        />
        <pointLight
          position={[-4, -3, 3]}
          intensity={1.55 * lightingIntensity}
          color={keyLightColor}
          distance={14}
        />
        {quality === 'high' && (
          <StudioEnvironment preset={lightingPreset} intensity={lightingIntensity} />
        )}

        <PlaygroundStage
          quality={quality}
          reducedMotion={reducedMotion}
          geometryType={geometryType}
          materialType={materialType}
          lightingPreset={lightingPreset}
          lightingIntensity={lightingIntensity}
          rotationSpeed={rotationSpeed}
          deformation={deformation}
          particleDensity={particleDensity}
          onPulseTrigger={() => setPulseCount((c) => c + 1)}
        />

        <PlaygroundCameraRig engaged={engaged} resetCounter={resetCounter} />
      </Canvas>

      {/* Overlay Laboratory UI Controls */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
        {/* Top Bar: Geometry & Material Selectors + Reset */}
        <div className="flex flex-col gap-2">
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
            <span className="ub-label mr-1 text-[9px] text-acid">GEOMETRY //</span>
            {GEOMETRY_OPTIONS.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setGeometryType(g.id)}
                aria-pressed={geometryType === g.id}
                className="ub-btn !min-h-[32px] !px-2.5 !py-1 !text-[10px]"
              >
                {g.label}
              </button>
            ))}

            <button
              type="button"
              onClick={handleResetAll}
              className="ub-btn ml-auto !min-h-[32px] !px-2.5 !py-1 !text-[10px]"
              aria-label="Reset playground configuration and camera"
            >
              <RotateCcw size={12} aria-hidden /> Reset Lab
            </button>
          </div>

          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
            <span className="ub-label mr-1 text-[9px] text-acid">MATERIAL //</span>
            {MATERIAL_OPTIONS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMaterialType(m.id)}
                aria-pressed={materialType === m.id}
                className="ub-btn !min-h-[30px] !px-2.5 !py-0.5 !text-[10px]"
              >
                {m.label}
              </button>
            ))}

            <span className="ub-label ml-2 mr-1 text-[9px] text-acid">LIGHTING //</span>
            {LIGHTING_PRESETS.map((lp) => (
              <button
                key={lp.id}
                type="button"
                onClick={() => setLightingPreset(lp.id)}
                aria-pressed={lightingPreset === lp.id}
                className="ub-btn !min-h-[30px] !px-2.5 !py-0.5 !text-[10px] flex items-center gap-1.5"
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: lp.color }}
                />
                {lp.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Dock: Parameter Sliders & Specimen Telemetry */}
        <div className="mt-auto flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-end">
          {/* Status Readout */}
          <div className="pointer-events-auto hidden border border-line bg-ink-2/90 px-3.5 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted md:block">
            <div className="flex items-center gap-2 text-bone">
              <Sparkles size={11} className="text-acid" aria-hidden />
              <span>
                SPECIMEN: {geometryType.toUpperCase()} · {materialType.toUpperCase()}
              </span>
            </div>
            <div className="mt-1">
              CLICK SPECIMEN TO PULSE WAVE ({pulseCount}) · DRAG TO ROTATE
            </div>
          </div>

          {/* Parameter Sliders Panel */}
          <div
            className="ub-panel pointer-events-auto ml-auto w-full max-w-sm border border-line p-4 shadow-2xl"
            role="region"
            aria-label="Procedural parameters"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="ub-label flex items-center gap-1.5 text-acid">
                <Sliders size={11} aria-hidden /> Procedural Parameters
              </span>
              <button
                type="button"
                onClick={() => setPanelCollapsed((c) => !c)}
                className="ub-btn !min-h-[24px] !px-2 !py-0.5 !text-[9px]"
              >
                {panelCollapsed ? 'Expand' : 'Minimize'}
              </button>
            </div>

            {!panelCollapsed && (
              <div className="space-y-2.5">
                {/* Rotation Speed */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] uppercase">
                    <label htmlFor="pg-rot-speed" className="text-muted">
                      Rotation Speed
                    </label>
                    <span className="text-bone tabular-nums">{rotationSpeed.toFixed(2)}</span>
                  </div>
                  <input
                    id="pg-rot-speed"
                    type="range"
                    min={0}
                    max={2.5}
                    step={0.05}
                    value={rotationSpeed}
                    onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
                    className="ub-range !h-6"
                  />
                </div>

                {/* Deformation Intensity */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] uppercase">
                    <label htmlFor="pg-deform" className="text-muted">
                      Deformation Intensity
                    </label>
                    <span className="text-bone tabular-nums">{deformation.toFixed(2)}</span>
                  </div>
                  <input
                    id="pg-deform"
                    type="range"
                    min={0}
                    max={1.5}
                    step={0.05}
                    value={deformation}
                    onChange={(e) => setDeformation(parseFloat(e.target.value))}
                    className="ub-range !h-6"
                  />
                </div>

                {/* Lighting Intensity */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] uppercase">
                    <label htmlFor="pg-light" className="text-muted">
                      Lighting Intensity
                    </label>
                    <span className="text-bone tabular-nums">{lightingIntensity.toFixed(2)}</span>
                  </div>
                  <input
                    id="pg-light"
                    type="range"
                    min={0.2}
                    max={2.5}
                    step={0.05}
                    value={lightingIntensity}
                    onChange={(e) => setLightingIntensity(parseFloat(e.target.value))}
                    className="ub-range !h-6"
                  />
                </div>

                {/* Particle Density */}
                <div>
                  <div className="flex justify-between font-mono text-[10px] uppercase">
                    <label htmlFor="pg-particles" className="text-muted">
                      Particle Density
                    </label>
                    <span className="text-bone tabular-nums">{particleDensity}%</span>
                  </div>
                  <input
                    id="pg-particles"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={particleDensity}
                    onChange={(e) => setParticleDensity(parseInt(e.target.value, 10))}
                    className="ub-range !h-6"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
