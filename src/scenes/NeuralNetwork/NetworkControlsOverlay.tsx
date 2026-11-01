import type { NeuronInfo } from '../types';
import type { LayerSpec } from './utils/networkTopology';

interface NetworkControlsOverlayProps {
  layers: LayerSpec[];
  focusedLayer: number | null;
  selectedNeuron: NeuronInfo | null;
  neuronRole: string | null;
  isPlaying: boolean;
  speed: number;
  skipEnabled: boolean;
  onTogglePlay: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onSelectLayer: (layerIdx: number | null) => void;
  onFireSignal: () => void;
  onToggleSkip: () => void;
  onCloseNeuron: () => void;
}

export default function NetworkControlsOverlay({
  layers,
  focusedLayer,
  selectedNeuron,
  neuronRole,
  isPlaying,
  speed,
  skipEnabled,
  onTogglePlay,
  onReset,
  onSpeedChange,
  onSelectLayer,
  onFireSignal,
  onToggleSkip,
  onCloseNeuron,
}: NetworkControlsOverlayProps) {
  const currentLayerSpec = selectedNeuron
    ? layers.find((l) => l.index === selectedNeuron.layerIndex)
    : focusedLayer !== null
    ? layers.find((l) => l.index === focusedLayer)
    : null;

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 pb-14 sm:p-6 sm:pb-12">
      {/* Top Header & Layer Filter Chips */}
      <div className="pointer-events-auto flex flex-col gap-2">
        <div className="no-scrollbar flex max-w-full flex-nowrap items-center justify-between gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
          {/* Top Left: Playback controls, Fire signal, Skip arcs toggle */}
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              aria-pressed={isPlaying}
              className="ub-btn min-h-[38px] shrink-0 px-2.5 py-1.5 text-[10px] sm:min-h-[32px] sm:px-3 sm:text-[11px]"
            >
              {isPlaying ? 'Pause ⏸' : 'Play ▶'}
            </button>

            <button
              type="button"
              onClick={onFireSignal}
              className="ub-btn min-h-[38px] shrink-0 border-acid px-2.5 py-1.5 text-[10px] font-semibold text-acid hover:bg-acid hover:text-ink sm:min-h-[32px] sm:px-3 sm:text-[11px]"
            >
              ⚡ Fire Signal
            </button>

            <button
              type="button"
              onClick={onToggleSkip}
              aria-pressed={skipEnabled}
              className="ub-btn min-h-[38px] shrink-0 px-2.5 py-1.5 text-[10px] sm:min-h-[32px] sm:px-3 sm:text-[11px]"
            >
              {skipEnabled ? 'Residual Skips: ON' : 'Residual Skips: OFF'}
            </button>

            {/* Speed slider */}
            <div className="ub-panel flex shrink-0 items-center gap-2 border border-line px-2.5 py-1 font-mono text-[10px] sm:text-[11px]">
              <span className="text-[10px] uppercase text-muted">Speed</span>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={speed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="ub-range !h-7 w-16 sm:w-20"
                aria-label="Simulation speed"
              />
              <span className="w-7 text-right text-bone">{speed.toFixed(1)}x</span>
            </div>
          </div>

          {/* Top Right: Reset view */}
          <button
            type="button"
            onClick={onReset}
            className="ub-btn min-h-[38px] shrink-0 border-line px-2.5 py-1.5 text-[10px] text-muted hover:border-bone hover:text-bone sm:min-h-[32px] sm:px-3 sm:text-[11px]"
          >
            Reset View
          </button>
        </div>

        {/* Layer Selector Bar */}
        <div className="no-scrollbar flex max-w-full flex-nowrap items-center gap-1 overflow-x-auto pb-0.5 sm:flex-wrap sm:gap-1.5 sm:overflow-visible sm:pb-0">
          <button
            type="button"
            onClick={() => onSelectLayer(null)}
            aria-pressed={focusedLayer === null}
            className="ub-btn min-h-[36px] shrink-0 px-2.5 py-1 text-[10px] sm:min-h-[32px]"
          >
            All Layers
          </button>

          {layers.map((l) => {
            const isFocused = focusedLayer === l.index;
            return (
              <button
                key={l.index}
                type="button"
                onClick={() => onSelectLayer(isFocused ? null : l.index)}
                aria-pressed={isFocused}
                className="ub-btn flex min-h-[36px] shrink-0 items-center gap-1.5 px-2.5 py-1 text-[10px] sm:min-h-[32px] sm:px-2"
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: l.color }}
                />
                {l.shortCode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Area: Disclaimer on Left (Desktop) + Layer/Neuron Inspector Bottom Sheet on Right */}
      <div className="pointer-events-none mt-auto flex flex-col items-end justify-between gap-3 sm:flex-row">
        {/* Educational Disclaimer Banner (Desktop Left) */}
        <div className="ub-panel pointer-events-auto hidden max-w-xs border border-line/80 p-2.5 font-mono text-[10px] text-muted md:block">
          <span className="mb-0.5 block font-semibold uppercase text-acid">
            // EDUCATIONAL VISUALIZATION
          </span>
          Educational visualization — not a trained model running inference. ResNet residual skip architecture (F(x)+x).
        </div>

        {/* Neuron or Layer Inspector Panel (Bottom Sheet on Mobile, Floating Right Panel on Desktop) */}
        {(selectedNeuron || currentLayerSpec) && (
          <div className="ub-panel pointer-events-auto ml-auto w-full max-w-sm border border-line p-3.5 shadow-2xl transition-all duration-200 sm:p-5">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <span className="ub-label mb-1 block text-[10px] text-acid">
                  LAYER {selectedNeuron ? selectedNeuron.layerIndex : currentLayerSpec?.index} //{' '}
                  {currentLayerSpec?.shortCode}
                </span>
                <h3 className="font-display text-base font-medium tracking-tight text-bone sm:text-lg">
                  {selectedNeuron ? selectedNeuron.layerName : currentLayerSpec?.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  onCloseNeuron();
                  if (!selectedNeuron) onSelectLayer(null);
                }}
                className="ub-btn !min-h-[34px] px-2.5 py-1 text-[10px] text-muted hover:text-acid sm:!min-h-[28px]"
                aria-label="Close inspector"
              >
                ESC ✕
              </button>
            </div>

            <p className="mb-2.5 font-sans text-xs leading-relaxed text-bone/80">
              {neuronRole ?? currentLayerSpec?.role}
            </p>

            {selectedNeuron && (
              <div className="flex items-center justify-between border-t border-line/60 pt-2 font-mono text-[11px]">
                <span className="text-muted">Unit #{selectedNeuron.neuronIndex}</span>
                <span className="font-semibold text-acid">
                  Simulated Activation: {selectedNeuron.activation.toFixed(3)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
