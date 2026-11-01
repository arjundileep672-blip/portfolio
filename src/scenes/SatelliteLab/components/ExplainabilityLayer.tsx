import { useState } from 'react';
import type { GeoRegionData } from '../data/satelliteLabData';
import type { SatelliteSensorMode } from '@/scenes/types';

interface ExplainabilityLayerProps {
  region: GeoRegionData;
  sensorMode: SatelliteSensorMode;
  showAttention: boolean;
  onToggleAttention: () => void;
  onChangeSensorMode: (mode: SatelliteSensorMode) => void;
}

/**
 * Interactive Multimodal Optical vs. SAR Patch Comparator + Explainable AI (XAI) Attribution Panel.
 * Clearly labels all imagery tiles and attention overlays as illustrative/simulated.
 */
export function ExplainabilityLayer({
  region,
  sensorMode,
  showAttention,
  onToggleAttention,
  onChangeSensorMode,
}: ExplainabilityLayerProps) {
  const [splitPercent, setSplitPercent] = useState<number>(52);
  const [activeEvidenceId, setActiveEvidenceId] = useState<string>(
    region.evidenceBoxes[0]?.id ?? ''
  );

  const selectedEvidence =
    region.evidenceBoxes.find((b) => b.id === activeEvidenceId) ??
    region.evidenceBoxes[0];

  return (
    <div className="space-y-3 border-t border-line pt-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="ub-label text-acid">
          MULTIMODAL SENSOR PATCH &amp; XAI EVIDENCE (ILLUSTRATIVE)
        </span>
        <button
          type="button"
          onClick={onToggleAttention}
          aria-pressed={showAttention}
          className="ub-btn !min-h-[28px] !px-2 !py-1 !text-[10px]"
        >
          {showAttention ? 'XAI Overlays: ON' : 'XAI Overlays: OFF'}
        </button>
      </div>

      {/* Natural Language Query Prompt Box */}
      <div className="border border-line bg-ink px-3 py-2">
        <span className="ub-label block text-[9px] text-muted">
          EXAMPLE NATURAL-LANGUAGE VQA QUERY
        </span>
        <p className="mt-1 font-mono text-[11px] text-bone">
          {region.naturalQuery}
        </p>
      </div>

      {/* Simulated Optical / SAR / Split Patch Viewport */}
      <div className="relative h-40 w-full overflow-hidden border border-line bg-ink select-none">
        {/* Base Layer: Simulated Optical Multispectral SVG */}
        <svg
          viewBox="0 0 200 120"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <rect width="200" height="120" fill="#132619" />
          {/* Simulated vegetation & land parcels */}
          <path
            d="M0,20 Q60,10 110,45 T200,30 L200,120 L0,120 Z"
            fill="#1E3F24"
          />
          <path
            d="M0,70 Q80,55 140,85 T200,75 L200,120 L0,120 Z"
            fill="#28522E"
          />
          {/* Simulated water channel / reservoir */}
          <path
            d="M15,0 C45,35 35,70 75,120 L105,120 C70,65 80,35 45,0 Z"
            fill="#0D2838"
          />
          {/* Simulated urban / built-up grid */}
          <g fill="#6E7368" opacity="0.75">
            <rect x="118" y="24" width="16" height="12" />
            <rect x="138" y="22" width="22" height="15" />
            <rect x="122" y="40" width="28" height="14" />
            <rect x="154" y="42" width="18" height="18" />
          </g>
        </svg>

        {/* Overlay Layer: Simulated SAR Backscatter SVG (clipped by mode or splitPercent) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            clipPath:
              sensorMode === 'optical'
                ? 'inset(0 0 0 100%)'
                : sensorMode === 'sar'
                ? 'inset(0 0 0 0)'
                : `inset(0 0 0 ${splitPercent}%)`,
          }}
        >
          <svg
            viewBox="0 0 200 120"
            preserveAspectRatio="none"
            className="h-full w-full"
            aria-hidden
          >
            <rect width="200" height="120" fill="#2A2E2B" />
            {/* Rough backscatter terrain */}
            <path
              d="M0,20 Q60,10 110,45 T200,30 L200,120 L0,120 Z"
              fill="#464C48"
            />
            <path
              d="M0,70 Q80,55 140,85 T200,75 L200,120 L0,120 Z"
              fill="#5C635E"
            />
            {/* Specular dark radar water return */}
            <path
              d="M15,0 C45,35 35,70 75,120 L105,120 C70,65 80,35 45,0 Z"
              fill="#070908"
            />
            {/* High-return SAR double-bounce urban corner scatterers */}
            <g fill="#E8F0E8">
              <rect x="118" y="24" width="16" height="12" />
              <rect x="138" y="22" width="22" height="15" />
              <rect x="122" y="40" width="28" height="14" />
              <rect x="154" y="42" width="18" height="18" />
            </g>
            {/* Radar scanlines */}
            <g stroke="#9FD4FF" strokeOpacity="0.18" strokeWidth="0.6">
              <line x1="0" y1="24" x2="200" y2="24" />
              <line x1="0" y1="48" x2="200" y2="48" />
              <line x1="0" y1="72" x2="200" y2="72" />
              <line x1="0" y1="96" x2="200" y2="96" />
            </g>
          </svg>
        </div>

        {/* Split Curtain Divider Line */}
        {sensorMode === 'split' && (
          <div
            className="pointer-events-none absolute inset-y-0 w-0.5 bg-acid"
            style={{ left: `${splitPercent}%` }}
          />
        )}

        {/* Illustrative XAI Attention Heatmap & Evidence Bounding Boxes */}
        {showAttention &&
          region.evidenceBoxes.map((box) => {
            const isSelected = selectedEvidence?.id === box.id;
            return (
              <button
                key={box.id}
                type="button"
                onClick={() => setActiveEvidenceId(box.id)}
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.w}%`,
                  height: `${box.h}%`,
                }}
                className={`absolute border text-left transition-all ${
                  isSelected
                    ? 'border-acid bg-acid/20 shadow-[0_0_12px_rgba(197,255,85,0.35)]'
                    : 'border-bone/60 bg-ink/30 hover:border-acid'
                }`}
                aria-label={`Inspect illustrative evidence region ${box.label}`}
              >
                <span className="inline-block bg-ink/90 px-1 py-0.5 font-mono text-[8px] uppercase text-acid">
                  {box.modality}
                </span>
              </button>
            );
          })}

        {/* Corner Modality Badges */}
        <div className="pointer-events-none absolute left-2 top-2 bg-ink/85 px-1.5 py-0.5 font-mono text-[9px] uppercase text-bone">
          {sensorMode === 'sar' ? 'SAR BACKSCATTER (SIMULATED)' : 'OPTICAL RGB/NIR (SIMULATED)'}
        </div>
        {sensorMode === 'split' && (
          <div className="pointer-events-none absolute right-2 top-2 bg-ink/85 px-1.5 py-0.5 font-mono text-[9px] uppercase text-[#9FD4FF]">
            SAR BACKSCATTER (SIMULATED)
          </div>
        )}
      </div>

      {/* Mode Switcher + Split Slider */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1" role="group" aria-label="Patch sensor mode">
          {(['optical', 'sar', 'split'] as SatelliteSensorMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChangeSensorMode(m)}
              aria-pressed={sensorMode === m}
              className="ub-btn !min-h-[28px] !px-2.5 !py-1 !text-[10px]"
            >
              {m === 'optical' ? 'Optical' : m === 'sar' ? 'SAR' : 'Optical / SAR Split'}
            </button>
          ))}
        </div>

        {sensorMode === 'split' && (
          <div className="flex items-center gap-2 flex-1 min-w-[120px]">
            <span className="font-mono text-[9px] text-muted">SWEEP</span>
            <input
              type="range"
              min={10}
              max={90}
              value={splitPercent}
              onChange={(e) => setSplitPercent(Number(e.target.value))}
              aria-label="Optical versus SAR split comparison slider"
              className="ub-range !h-6"
            />
          </div>
        )}
      </div>

      {/* Selected Evidence Attribution Callout */}
      {selectedEvidence && (
        <div className="border border-line bg-ink/90 p-2.5 text-[11px]">
          <div className="flex items-center justify-between gap-2 font-mono text-[10px] text-acid">
            <span>EVIDENCE // {selectedEvidence.label.toUpperCase()}</span>
            <span>[{selectedEvidence.modality}]</span>
          </div>
          <p className="mt-1 text-bone/80 leading-relaxed">
            {selectedEvidence.rationale}
          </p>
        </div>
      )}
    </div>
  );
}
