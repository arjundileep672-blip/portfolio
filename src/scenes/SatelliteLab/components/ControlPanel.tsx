import { useState } from 'react';
import type { Project } from '@/data/projects';
import type { SatelliteLabInspectItem, SatelliteSensorMode } from '@/scenes/types';
import {
  AGENT_PIPELINE_DATA,
  GEO_REGIONS_DATA,
  SATELLITES_DATA,
  agentToInspectItem,
  regionToInspectItem,
  satelliteToInspectItem,
  type AgentNodeData,
  type GeoRegionData,
  type SatelliteModelData,
} from '../data/satelliteLabData';
import { ExplainabilityLayer } from './ExplainabilityLayer';

export interface SatelliteLabLayers {
  grid: boolean;
  atmosphere: boolean;
  orbits: boolean;
  satellites: boolean;
  markers: boolean;
  swath: boolean;
  pipeline: boolean;
  explainability: boolean;
}

interface ControlPanelProps {
  project: Project;
  sensorMode: SatelliteSensorMode;
  onChangeSensorMode: (mode: SatelliteSensorMode) => void;
  layers: SatelliteLabLayers;
  onToggleLayer: (layer: keyof SatelliteLabLayers) => void;
  selectedItem: SatelliteLabInspectItem | null;
  selectedRegion: GeoRegionData;
  onSelectRegion: (item: SatelliteLabInspectItem, region: GeoRegionData) => void;
  onSelectSatellite: (item: SatelliteLabInspectItem, sat: SatelliteModelData) => void;
  onSelectAgent: (item: SatelliteLabInspectItem, agent: AgentNodeData) => void;
  onClearSelection: () => void;
  onResetCamera: () => void;
}

export function ControlPanel({
  project,
  sensorMode,
  onChangeSensorMode,
  layers,
  onToggleLayer,
  selectedItem,
  selectedRegion,
  onSelectRegion,
  onSelectSatellite,
  onSelectAgent,
  onClearSelection,
  onResetCamera,
}: ControlPanelProps) {
  const [showBrief, setShowBrief] = useState(false);
  const [showPipelineDrawer, setShowPipelineDrawer] = useState(false);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 sm:p-5">
      {/* Top Bar: Sensor Modality Switcher + Layer Toggles + Camera Reset */}
      <div className="flex flex-col gap-2">
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2">
          {/* Sensor Mode Selector */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="ub-label border border-line bg-ink/90 px-2.5 py-1.5 text-[10px] text-acid">
              SATQUERY AI // LAB
            </span>

            <div className="flex gap-1" role="group" aria-label="Sensor imaging mode">
              <button
                type="button"
                onClick={() => onChangeSensorMode('optical')}
                aria-pressed={sensorMode === 'optical'}
                className="ub-btn !min-h-[34px] !px-2.5 !py-1 !text-[10px]"
              >
                Optical Mode
              </button>
              <button
                type="button"
                onClick={() => onChangeSensorMode('sar')}
                aria-pressed={sensorMode === 'sar'}
                className="ub-btn !min-h-[34px] !px-2.5 !py-1 !text-[10px]"
              >
                SAR Radar Mode
              </button>
              <button
                type="button"
                onClick={() => onChangeSensorMode('split')}
                aria-pressed={sensorMode === 'split'}
                className="ub-btn !min-h-[34px] !px-2.5 !py-1 !text-[10px]"
              >
                Optical vs SAR
              </button>
            </div>
          </div>

          {/* Right Quick Actions */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowPipelineDrawer((v) => !v)}
              aria-pressed={showPipelineDrawer}
              className="ub-btn !min-h-[34px] !px-2.5 !py-1 !text-[10px]"
            >
              Agent Pipeline (10)
            </button>
            <button
              type="button"
              onClick={() => setShowBrief((v) => !v)}
              aria-pressed={showBrief}
              className="ub-btn !min-h-[34px] !px-2.5 !py-1 !text-[10px]"
            >
              {showBrief ? 'Hide Brief' : 'Architecture Brief'}
            </button>
            <button
              type="button"
              onClick={onResetCamera}
              className="ub-btn !min-h-[34px] !px-2.5 !py-1 !text-[10px] text-muted hover:text-bone"
            >
              Reset Camera
            </button>
          </div>
        </div>

        {/* Second Row: Granular 3D Layer Toggles & Quick ROI / Satellite Selectors */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1" role="group" aria-label="3D visualization layers">
            <button
              type="button"
              onClick={() => onToggleLayer('satellites')}
              aria-pressed={layers.satellites}
              className="ub-btn !min-h-[30px] !px-2 !py-0.5 !text-[10px]"
            >
              Satellites
            </button>
            <button
              type="button"
              onClick={() => onToggleLayer('orbits')}
              aria-pressed={layers.orbits}
              className="ub-btn !min-h-[30px] !px-2 !py-0.5 !text-[10px]"
            >
              Orbits
            </button>
            <button
              type="button"
              onClick={() => onToggleLayer('markers')}
              aria-pressed={layers.markers}
              className="ub-btn !min-h-[30px] !px-2 !py-0.5 !text-[10px]"
            >
              ROI Markers
            </button>
            <button
              type="button"
              onClick={() => onToggleLayer('pipeline')}
              aria-pressed={layers.pipeline}
              className="ub-btn !min-h-[30px] !px-2 !py-0.5 !text-[10px]"
            >
              3D Agent Graph
            </button>
            <button
              type="button"
              onClick={() => onToggleLayer('explainability')}
              aria-pressed={layers.explainability}
              className="ub-btn !min-h-[30px] !px-2 !py-0.5 !text-[10px]"
            >
              XAI Reticles
            </button>
            <button
              type="button"
              onClick={() => onToggleLayer('grid')}
              aria-pressed={layers.grid}
              className="ub-btn !min-h-[30px] !px-2 !py-0.5 !text-[10px]"
            >
              Lat/Lon Grid
            </button>
          </div>

          {/* Quick Region & Satellite Jump Pills */}
          <div className="hidden xl:flex items-center gap-1">
            {GEO_REGIONS_DATA.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectRegion(regionToInspectItem(r), r)}
                aria-pressed={selectedItem?.id === r.id}
                className="ub-btn !min-h-[28px] !px-2 !py-0.5 !text-[9px]"
              >
                {r.code.split(' // ')[1]}
              </button>
            ))}
            {SATELLITES_DATA.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelectSatellite(satelliteToInspectItem(s), s)}
                aria-pressed={selectedItem?.id === s.id}
                className="ub-btn !min-h-[28px] !px-2 !py-0.5 !text-[9px]"
              >
                {s.code.split(' // ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Middle / Bottom Content Area (Keeps bottom-center clear for SceneFrame zoom pill) */}
      <div className="mt-auto flex flex-col lg:flex-row items-end justify-between gap-3">
        {/* Left Dock: Interactive Multi-Agent Pipeline Explorer or Architecture Brief */}
        <div className="w-full max-w-md space-y-2">
          {showPipelineDrawer && (
            <div
              data-lenis-prevent
              className="pointer-events-auto ub-panel max-h-[52vh] overflow-y-auto p-3.5 sm:p-4 shadow-2xl"
            >
              <div className="flex items-center justify-between gap-2 border-b border-line pb-2">
                <div>
                  <span className="ub-label block text-[9px] text-acid">
                    EDUCATIONAL ARCHITECTURE VISUALIZATION
                  </span>
                  <h4 className="font-display text-sm font-medium text-bone">
                    Multi-Agent Geospatial Processing Flow
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPipelineDrawer(false)}
                  className="ub-btn !min-h-[28px] !px-2 !py-0.5 !text-[10px]"
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Click any stage to focus its 3D node and inspect its role in SATQUERY AI:
              </p>
              <ol className="mt-2.5 grid grid-cols-2 gap-1.5">
                {AGENT_PIPELINE_DATA.map((a) => {
                  const active = selectedItem?.id === a.id;
                  return (
                    <li key={a.id}>
                      <button
                        type="button"
                        onClick={() => onSelectAgent(agentToInspectItem(a), a)}
                        aria-pressed={active}
                        className={`w-full border px-2.5 py-1.5 text-left font-mono text-[10px] transition-colors ${
                          active
                            ? 'border-acid bg-acid text-ink font-semibold'
                            : 'border-line bg-ink/80 text-bone/85 hover:border-bone/50'
                        }`}
                      >
                        <span className="block text-[9px] opacity-75">
                          STEP {String(a.step).padStart(2, '0')}
                        </span>
                        <span className="truncate block">{a.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {showBrief && (
            <div
              data-lenis-prevent
              className="pointer-events-auto ub-panel max-h-[52vh] overflow-y-auto p-4 shadow-2xl space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="ub-label block text-[9px] text-acid">
                    {project.context ?? 'SIH26167 — ISRO PROBLEM STATEMENT'}
                  </span>
                  <h4 className="font-display text-base font-medium text-bone">
                    {project.title} — System Overview
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBrief(false)}
                  className="ub-btn !min-h-[28px] !px-2 !py-0.5 !text-[10px]"
                >
                  ✕
                </button>
              </div>
              {project.problemStatement && (
                <div>
                  <span className="ub-label block text-[9px]">Problem Statement</span>
                  <p className="mt-1 text-xs text-bone/80 leading-relaxed">
                    {project.problemStatement}
                  </p>
                </div>
              )}
              {project.proposedSolution && (
                <div>
                  <span className="ub-label block text-[9px]">Proposed Solution</span>
                  <p className="mt-1 text-xs text-bone/80 leading-relaxed">
                    {project.proposedSolution}
                  </p>
                </div>
              )}
              <div className="border-t border-line pt-2 font-mono text-[10px] text-muted">
                NOTE: All orbital imagery, SAR backscatter textures, and XAI overlays in this 3D lab are simulated/illustrative representations of the architecture.
              </div>
            </div>
          )}
        </div>

        {/* Right Dock: Active Inspector + Multimodal Optical/SAR & XAI Comparator */}
        <div
          data-lenis-prevent
          className="pointer-events-auto ub-panel w-full max-w-md max-h-[64vh] overflow-y-auto p-4 shadow-2xl space-y-3"
        >
          {selectedItem ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="ub-label block text-[9px] text-acid">
                    {selectedItem.subtitle}
                  </span>
                  <h3 className="font-display text-base sm:text-lg font-medium text-bone">
                    {selectedItem.title}
                  </h3>
                  {selectedItem.coords && (
                    <span className="font-mono text-[10px] text-muted">
                      {selectedItem.coords}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClearSelection}
                  className="ub-btn !min-h-[28px] !px-2 !py-0.5 !text-[10px]"
                  aria-label="Close inspector"
                >
                  ESC ✕
                </button>
              </div>

              <p className="text-xs text-bone/80 leading-relaxed">
                {selectedItem.detail}
              </p>

              {selectedItem.metrics && (
                <div className="grid grid-cols-2 gap-1.5 border-t border-line pt-2.5">
                  {selectedItem.metrics.map((m) => (
                    <div key={m.label} className="border border-line bg-ink px-2.5 py-1.5">
                      <span className="ub-label block text-[8px]">{m.label}</span>
                      <span className="font-mono text-[10px] text-bone">{m.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="ub-label block text-[9px] text-acid">
                  ACTIVE ROI // {selectedRegion.code}
                </span>
                <h3 className="font-display text-sm sm:text-base font-medium text-bone">
                  {selectedRegion.name} ({selectedRegion.coordsLabel})
                </h3>
              </div>
              <div className="flex gap-1">
                {GEO_REGIONS_DATA.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelectRegion(regionToInspectItem(r), r)}
                    aria-pressed={selectedRegion.id === r.id}
                    className="ub-btn !min-h-[26px] !px-2 !py-0.5 !text-[9px]"
                    title={r.name}
                  >
                    R0{i + 1}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Multimodal Optical/SAR & Explainability Comparator */}
          <ExplainabilityLayer
            region={selectedRegion}
            sensorMode={sensorMode}
            showAttention={layers.explainability}
            onToggleAttention={() => onToggleLayer('explainability')}
            onChangeSensorMode={onChangeSensorMode}
          />
        </div>
      </div>
    </div>
  );
}
