import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
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
  // On desktop (>= 1024px), keep the XAI Patch & ROI dock expanded; on mobile/portrait, collapse into a bottom sheet bar by default so the 3D Earth is unobstructed
  const [sheetExpanded, setSheetExpanded] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );

  // Automatically expand the sheet when the user selects a specific 3D object
  useEffect(() => {
    if (selectedItem) {
      setSheetExpanded(true);
    }
  }, [selectedItem]);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-2.5 pb-14 sm:p-5 sm:pb-12">
      {/* Top Bar: Sensor Modality Switcher + Layer Toggles + Camera Reset */}
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <div className="no-scrollbar pointer-events-auto flex max-w-full flex-nowrap items-center justify-between gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
          {/* Sensor Mode Selector */}
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="ub-label hidden border border-line bg-ink/90 px-2.5 py-1.5 text-[10px] text-acid md:inline-block">
              SATQUERY AI // LAB
            </span>

            <div className="flex shrink-0 gap-1" role="group" aria-label="Sensor imaging mode">
              <button
                type="button"
                onClick={() => onChangeSensorMode('optical')}
                aria-pressed={sensorMode === 'optical'}
                className="ub-btn !min-h-[38px] shrink-0 !px-2.5 !py-1 !text-[10px] sm:!min-h-[34px]"
              >
                Optical Mode
              </button>
              <button
                type="button"
                onClick={() => onChangeSensorMode('sar')}
                aria-pressed={sensorMode === 'sar'}
                className="ub-btn !min-h-[38px] shrink-0 !px-2.5 !py-1 !text-[10px] sm:!min-h-[34px]"
              >
                SAR Radar Mode
              </button>
              <button
                type="button"
                onClick={() => onChangeSensorMode('split')}
                aria-pressed={sensorMode === 'split'}
                className="ub-btn !min-h-[38px] shrink-0 !px-2.5 !py-1 !text-[10px] sm:!min-h-[34px]"
              >
                Optical vs SAR
              </button>
            </div>
          </div>

          {/* Right Quick Actions */}
          <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setShowPipelineDrawer((v) => !v)}
              aria-pressed={showPipelineDrawer}
              className="ub-btn !min-h-[38px] shrink-0 !px-2.5 !py-1 !text-[10px] sm:!min-h-[34px]"
            >
              Agent Pipeline (10)
            </button>
            <button
              type="button"
              onClick={() => setShowBrief((v) => !v)}
              aria-pressed={showBrief}
              className="ub-btn !min-h-[38px] shrink-0 !px-2.5 !py-1 !text-[10px] sm:!min-h-[34px]"
            >
              {showBrief ? 'Hide Brief' : 'Architecture Brief'}
            </button>
            <button
              type="button"
              onClick={onResetCamera}
              className="ub-btn !min-h-[38px] shrink-0 !px-2.5 !py-1 !text-[10px] text-muted hover:text-bone sm:!min-h-[34px]"
            >
              Reset Camera
            </button>
          </div>
        </div>

        {/* Second Row: Granular 3D Layer Toggles & Quick ROI / Satellite Selectors */}
        <div className="no-scrollbar pointer-events-auto flex max-w-full flex-nowrap items-center justify-between gap-2 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <div className="flex shrink-0 items-center gap-1" role="group" aria-label="3D visualization layers">
            <button
              type="button"
              onClick={() => onToggleLayer('satellites')}
              aria-pressed={layers.satellites}
              className="ub-btn !min-h-[34px] shrink-0 !px-2 !py-0.5 !text-[10px] sm:!min-h-[30px]"
            >
              Satellites
            </button>
            <button
              type="button"
              onClick={() => onToggleLayer('orbits')}
              aria-pressed={layers.orbits}
              className="ub-btn !min-h-[34px] shrink-0 !px-2 !py-0.5 !text-[10px] sm:!min-h-[30px]"
            >
              Orbits
            </button>
            <button
              type="button"
              onClick={() => onToggleLayer('markers')}
              aria-pressed={layers.markers}
              className="ub-btn !min-h-[34px] shrink-0 !px-2 !py-0.5 !text-[10px] sm:!min-h-[30px]"
            >
              ROI Markers
            </button>
            <button
              type="button"
              onClick={() => onToggleLayer('pipeline')}
              aria-pressed={layers.pipeline}
              className="ub-btn !min-h-[34px] shrink-0 !px-2 !py-0.5 !text-[10px] sm:!min-h-[30px]"
            >
              3D Agent Graph
            </button>
            <button
              type="button"
              onClick={() => onToggleLayer('explainability')}
              aria-pressed={layers.explainability}
              className="ub-btn !min-h-[34px] shrink-0 !px-2 !py-0.5 !text-[10px] sm:!min-h-[30px]"
            >
              XAI Reticles
            </button>
            <button
              type="button"
              onClick={() => onToggleLayer('grid')}
              aria-pressed={layers.grid}
              className="ub-btn !min-h-[34px] shrink-0 !px-2 !py-0.5 !text-[10px] sm:!min-h-[30px]"
            >
              Lat/Lon Grid
            </button>
          </div>

          {/* Quick Region & Satellite Jump Pills */}
          <div className="flex shrink-0 items-center gap-1">
            {GEO_REGIONS_DATA.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelectRegion(regionToInspectItem(r), r)}
                aria-pressed={selectedItem?.id === r.id}
                className="ub-btn !min-h-[32px] shrink-0 !px-2 !py-0.5 !text-[9px] sm:!min-h-[28px]"
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
                className="ub-btn !min-h-[32px] shrink-0 !px-2 !py-0.5 !text-[9px] sm:!min-h-[28px]"
              >
                {s.code.split(' // ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Content Area: Left Drawers + Right Collapsible Bottom Sheet / Floating Dock */}
      <div className="mt-auto flex flex-col items-end justify-between gap-2.5 lg:flex-row lg:gap-3">
        {/* Left Dock: Interactive Multi-Agent Pipeline Explorer or Architecture Brief */}
        <div className="w-full max-w-md space-y-2">
          {showPipelineDrawer && (
            <div
              data-lenis-prevent
              className="pointer-events-auto ub-panel max-h-[42vh] overflow-y-auto p-3.5 shadow-2xl sm:max-h-[52vh] sm:p-4"
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
                  className="ub-btn !min-h-[34px] !px-2.5 !py-0.5 !text-[10px] sm:!min-h-[28px]"
                  aria-label="Close pipeline drawer"
                >
                  ✕
                </button>
              </div>
              <p className="mt-2 text-[11px] text-muted">
                Tap any stage to focus its 3D node and inspect its role in SATQUERY AI:
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
                        className={`min-h-[42px] w-full border px-2.5 py-1.5 text-left font-mono text-[10px] transition-colors ${
                          active
                            ? 'border-acid bg-acid font-semibold text-ink'
                            : 'border-line bg-ink/80 text-bone/85 hover:border-bone/50'
                        }`}
                      >
                        <span className="block text-[9px] opacity-75">
                          STEP {String(a.step).padStart(2, '0')}
                        </span>
                        <span className="block truncate">{a.label}</span>
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
              className="pointer-events-auto ub-panel max-h-[42vh] space-y-3 overflow-y-auto p-3.5 shadow-2xl sm:max-h-[52vh] sm:p-4"
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
                  className="ub-btn !min-h-[34px] !px-2.5 !py-0.5 !text-[10px] sm:!min-h-[28px]"
                  aria-label="Close architecture brief"
                >
                  ✕
                </button>
              </div>
              {project.problemStatement && (
                <div>
                  <span className="ub-label block text-[9px]">Problem Statement</span>
                  <p className="mt-1 text-xs leading-relaxed text-bone/80">
                    {project.problemStatement}
                  </p>
                </div>
              )}
              {project.proposedSolution && (
                <div>
                  <span className="ub-label block text-[9px]">Proposed Solution</span>
                  <p className="mt-1 text-xs leading-relaxed text-bone/80">
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

        {/* Right Dock / Mobile Bottom Sheet: Active Inspector + Multimodal Optical/SAR & XAI Comparator */}
        <div
          data-lenis-prevent
          className="pointer-events-auto ub-panel max-h-[46vh] w-full max-w-md space-y-3 overflow-y-auto p-3 shadow-2xl sm:max-h-[62vh] sm:p-4"
        >
          {/* Sheet Header: Active Selection or Active ROI + Mobile Expand/Collapse Toggle */}
          {selectedItem ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="ub-label block text-[9px] text-acid">
                    {selectedItem.subtitle}
                  </span>
                  <h3 className="font-display text-base font-medium text-bone sm:text-lg">
                    {selectedItem.title}
                  </h3>
                  {selectedItem.coords && (
                    <span className="font-mono text-[10px] text-muted">
                      {selectedItem.coords}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setSheetExpanded((v) => !v)}
                    className="ub-btn !min-h-[34px] !px-2 !py-0.5 !text-[10px] lg:hidden"
                    aria-expanded={sheetExpanded}
                  >
                    {sheetExpanded ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
                  </button>
                  <button
                    type="button"
                    onClick={onClearSelection}
                    className="ub-btn !min-h-[34px] !px-2.5 !py-0.5 !text-[10px] sm:!min-h-[28px]"
                    aria-label="Close inspector"
                  >
                    ESC ✕
                  </button>
                </div>
              </div>

              {sheetExpanded && (
                <>
                  <p className="text-xs leading-relaxed text-bone/80">
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
              )}
            </>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="ub-label block text-[9px] text-acid">
                  ACTIVE ROI // {selectedRegion.code}
                </span>
                <h3 className="truncate font-display text-sm font-medium text-bone sm:text-base">
                  {selectedRegion.name} ({selectedRegion.coordsLabel})
                </h3>
              </div>
              <div className="flex items-center gap-1">
                {GEO_REGIONS_DATA.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onSelectRegion(regionToInspectItem(r), r)}
                    aria-pressed={selectedRegion.id === r.id}
                    className="ub-btn !min-h-[32px] !px-2 !py-0.5 !text-[9px] sm:!min-h-[26px]"
                    title={r.name}
                  >
                    R0{i + 1}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSheetExpanded((v) => !v)}
                  aria-expanded={sheetExpanded}
                  className="ub-btn !min-h-[32px] border-acid/50 !px-2 !py-0.5 !text-[9px] text-acid sm:!min-h-[26px]"
                >
                  {sheetExpanded ? 'Minimize' : 'XAI Patch'}
                </button>
              </div>
            </div>
          )}

          {/* Multimodal Optical/SAR & Explainability Comparator (Expanded on desktop or when toggled on mobile) */}
          {sheetExpanded && (
            <ExplainabilityLayer
              region={selectedRegion}
              sensorMode={sensorMode}
              showAttention={layers.explainability}
              onToggleAttention={() => onToggleLayer('explainability')}
              onChangeSensorMode={onChangeSensorMode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
