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
    : null;

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Header & Layer Filter Chips */}
      <div className="flex flex-col gap-2.5 pointer-events-auto">
        <div className="flex flex-wrap items-center justify-between gap-2">
          {/* Top Left: Playback controls, Fire signal, Skip arcs toggle */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onTogglePlay}
              aria-pressed={isPlaying}
              className="ub-btn text-[11px] px-3 py-1.5 min-h-[36px] sm:min-h-[32px]"
            >
              {isPlaying ? 'Pause ⏸' : 'Play ▶'}
            </button>

            <button
              type="button"
              onClick={onFireSignal}
              className="ub-btn text-[11px] px-3 py-1.5 min-h-[36px] sm:min-h-[32px] border-acid text-acid hover:bg-acid hover:text-ink font-semibold"
            >
              ⚡ Fire Signal
            </button>

            <button
              type="button"
              onClick={onToggleSkip}
              aria-pressed={skipEnabled}
              className="ub-btn text-[11px] px-3 py-1.5 min-h-[36px] sm:min-h-[32px]"
            >
              {skipEnabled ? 'Residual Skips: ON' : 'Residual Skips: OFF'}
            </button>

            {/* Speed slider */}
            <div className="flex items-center gap-2 px-2.5 py-1 ub-panel border border-line text-[11px] font-mono">
              <span className="text-muted text-[10px] uppercase">Speed</span>
              <input
                type="range"
                min="0.2"
                max="3.0"
                step="0.1"
                value={speed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="ub-range w-16 sm:w-20"
                aria-label="Simulation speed"
              />
              <span className="text-bone w-7 text-right">{speed.toFixed(1)}x</span>
            </div>
          </div>

          {/* Top Right: Reset view */}
          <button
            type="button"
            onClick={onReset}
            className="ub-btn text-[11px] px-3 py-1.5 min-h-[36px] sm:min-h-[32px] border-line text-muted hover:text-bone hover:border-bone"
          >
            Reset View
          </button>
        </div>

        {/* Layer Selector Bar */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          <button
            type="button"
            onClick={() => onSelectLayer(null)}
            aria-pressed={focusedLayer === null}
            className="ub-btn text-[10px] px-2.5 py-1 min-h-[32px]"
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
                className="ub-btn text-[10px] px-2 py-1 min-h-[32px] flex items-center gap-1.5"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full inline-block"
                  style={{ backgroundColor: l.color }}
                />
                {l.shortCode}
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Area: Disclaimer on Left + Inspector on Right (leaving bottom-center clear) */}
      <div className="flex flex-col sm:flex-row items-end justify-between gap-3 pointer-events-none mt-auto">
        {/* Educational Disclaimer Banner (Left) */}
        <div className="pointer-events-auto max-w-xs ub-panel p-2.5 border border-line/80 text-[10px] font-mono text-muted">
          <span className="text-acid uppercase font-semibold block mb-0.5">
            // EDUCATIONAL VISUALIZATION
          </span>
          Educational visualization — not a trained model running inference. ResNet residual skip architecture (F(x)+x).
        </div>

        {/* Neuron Inspector Panel (Right) */}
        {selectedNeuron && (
          <div className="pointer-events-auto max-w-sm w-full ub-panel p-4 sm:p-5 border border-line shadow-2xl transition-all duration-200">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className="ub-label block text-[10px] mb-1">
                  LAYER {selectedNeuron.layerIndex} // {currentLayerSpec?.shortCode}
                </span>
                <h3 className="font-display text-lg text-bone font-medium tracking-tight">
                  {selectedNeuron.layerName}
                </h3>
              </div>
              <button
                type="button"
                onClick={onCloseNeuron}
                className="ub-btn px-2 py-1 text-[11px] text-muted hover:text-acid"
                aria-label="Close inspector"
              >
                ESC ✕
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed font-sans mb-3">
              {neuronRole ?? currentLayerSpec?.role}
            </p>

            <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[11px] font-mono">
              <span className="text-muted">Unit #{selectedNeuron.neuronIndex}</span>
              <span className="text-acid font-semibold">
                Simulated Activation: {selectedNeuron.activation.toFixed(3)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
