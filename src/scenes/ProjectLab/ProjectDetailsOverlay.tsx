import { useState } from 'react';
import type { Project } from '@/data/projects';
import type { ProjectLabItem } from '../types';
import type { WarehouseLayers } from './components/WarehouseScene';

interface ProjectDetailsOverlayProps {
  project: Project;
  selectedItem: ProjectLabItem | null;
  layers: WarehouseLayers;
  onToggleLayer: (layer: keyof WarehouseLayers) => void;
  onSelectItem: (item: ProjectLabItem | null) => void;
  onResetCamera: () => void;
}

export default function ProjectDetailsOverlay({
  project,
  selectedItem,
  layers,
  onToggleLayer,
  onSelectItem,
  onResetCamera,
}: ProjectDetailsOverlayProps) {
  const [showProjectDetails, setShowProjectDetails] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar: Layer Toggles & Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pointer-events-auto">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="ub-label text-[10px] px-2 py-1 bg-ink/80 border border-line">
            CHAINHANDLER SIMULATION
          </span>

          <button
            type="button"
            onClick={() => onToggleLayer('racks')}
            aria-pressed={layers.racks}
            className="ub-btn text-[11px] px-3 py-1.5 min-h-[36px] sm:min-h-[32px]"
          >
            Racks & Stock
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('routes')}
            aria-pressed={layers.routes}
            className="ub-btn text-[11px] px-3 py-1.5 min-h-[36px] sm:min-h-[32px]"
          >
            Supply Network
          </button>

          <button
            type="button"
            onClick={() => onToggleLayer('recoveryHighlight')}
            aria-pressed={layers.recoveryHighlight}
            className="ub-btn text-[11px] px-3 py-1.5 min-h-[36px] sm:min-h-[32px]"
          >
            Recovery Mode
          </button>

          <button
            type="button"
            onClick={() => setShowProjectDetails((prev) => !prev)}
            aria-pressed={showProjectDetails}
            className="ub-btn text-[11px] px-3 py-1.5 min-h-[36px] sm:min-h-[32px]"
          >
            {showProjectDetails ? 'Hide Project' : 'Project Brief'}
          </button>
        </div>

        <button
          type="button"
          onClick={onResetCamera}
          className="ub-btn text-[11px] px-3 py-1.5 min-h-[36px] sm:min-h-[32px] border-line text-muted hover:text-bone hover:border-bone"
        >
          Reset View
        </button>
      </div>

      {/* Side Inspector & Project Card (Bottom-Right / Top-Right, keeping bottom-center clear) */}
      <div className="flex flex-col sm:flex-row items-end justify-end gap-3 pointer-events-none self-end max-w-md w-full mt-auto">
        {/* Clicked Item Inspector */}
        {selectedItem && (
          <div className="pointer-events-auto w-full ub-panel p-4 sm:p-5 border border-line shadow-2xl transition-all duration-200">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <span className="ub-label block text-[10px] mb-1 text-acid">
                  {selectedItem.type.toUpperCase()} // SIMULATED
                </span>
                <h3 className="font-display text-base sm:text-lg text-bone font-medium tracking-tight">
                  {selectedItem.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onSelectItem(null)}
                className="ub-btn px-2 py-1 text-[11px] text-muted hover:text-acid"
                aria-label="Close inspector"
              >
                ESC ✕
              </button>
            </div>

            <p className="text-xs text-muted leading-relaxed font-sans mb-3">
              {selectedItem.detail}
            </p>

            <div className="pt-2 border-t border-line/60 flex items-center justify-between text-[10px] font-mono text-muted">
              <span>MODEL: DYNAMIC AGENTIC</span>
              <span className="text-acid">STATUS: LIVE RESILIENT</span>
            </div>
          </div>
        )}

        {/* Project Details Modal / Card */}
        {showProjectDetails && (
          <div className="pointer-events-auto w-full ub-panel p-4 sm:p-5 border border-line shadow-2xl transition-all duration-200 space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="ub-label block text-[10px] mb-1">
                  PROJECT {project.index} // {project.category}
                </span>
                <h3 className="font-display text-xl text-bone font-medium tracking-tight">
                  {project.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowProjectDetails(false)}
                className="ub-btn px-2 py-1 text-[11px] text-muted hover:text-acid"
                aria-label="Close project info"
              >
                ESC ✕
              </button>
            </div>

            <p className="text-xs text-bone leading-relaxed font-sans">
              {project.description}
            </p>

            {/* Features list */}
            <div>
              <span className="ub-label block text-[10px] mb-1.5">
                Core Capabilities
              </span>
              <ul className="text-xs text-muted space-y-1 font-sans">
                {project.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-1.5">
                    <span className="text-acid text-[10px]">■</span>
                    {feat}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tech stack */}
            <div>
              <span className="ub-label block text-[10px] mb-1.5">
                Architecture & Stack
              </span>
              <div className="flex flex-wrap gap-1">
                {project.stack.map((item) => (
                  <span
                    key={item}
                    className="px-1.5 py-0.5 text-[9px] font-mono border border-line bg-ink text-muted uppercase"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Live Demo Link */}
            {project.links.demo.href && (
              <div className="pt-2">
                <a
                  href={project.links.demo.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ub-btn w-full py-2 px-3 text-center text-xs font-semibold bg-acid text-ink hover:bg-bone hover:text-ink flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Launch Live Platform</span>
                  <span className="text-sm">↗</span>
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
