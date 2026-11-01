import { useState } from 'react';
import { ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import type { Skill, SkillCategory, SkillCategoryId } from '@/data/skills';

interface ControlsOverlayProps {
  categories: SkillCategory[];
  allSkills: Skill[];
  activeCategory: SkillCategoryId | 'all';
  selectedSkill: Skill | null;
  hoveredSkill: Skill | null;
  onSelectCategory: (cat: SkillCategoryId | 'all') => void;
  onSelectSkill: (skill: Skill | null) => void;
  onResetCamera: () => void;
}

export default function ControlsOverlay({
  categories,
  allSkills,
  activeCategory,
  selectedSkill,
  hoveredSkill,
  onSelectCategory,
  onSelectSkill,
  onResetCamera,
}: ControlsOverlayProps) {
  const [mobileNodesExpanded, setMobileNodesExpanded] = useState(false);
  const activeInspectSkill = selectedSkill ?? hoveredSkill;
  const inspectCategory = categories.find((c) => c.id === activeInspectSkill?.category);

  // Map related skill IDs to full Skill objects
  const relatedSkills = (activeInspectSkill?.related ?? [])
    .map((id) => allSkills.find((s) => s.id === id))
    .filter((s): s is Skill => Boolean(s));

  const visibleSkills =
    activeCategory === 'all'
      ? allSkills
      : allSkills.filter((s) => s.category === activeCategory);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-3 pb-14 sm:p-6 sm:pb-12">
      {/* Top Bar: Category Filter Chips & Camera Reset */}
      <div className="flex flex-col gap-2">
        <div className="no-scrollbar pointer-events-auto flex max-w-full flex-nowrap items-center gap-1.5 overflow-x-auto pb-1 sm:flex-wrap sm:gap-2 sm:overflow-visible sm:pb-0">
          <button
            type="button"
            onClick={() => onSelectCategory('all')}
            aria-pressed={activeCategory === 'all'}
            className="ub-btn min-h-[40px] shrink-0 px-3 py-1.5 text-[10px] sm:min-h-[34px] sm:text-[11px]"
          >
            All Clusters ({allSkills.length})
          </button>

          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(isActive ? 'all' : cat.id)}
                aria-pressed={isActive}
                className="ub-btn flex min-h-[40px] shrink-0 items-center gap-1.5 px-3 py-1.5 text-[10px] sm:min-h-[34px] sm:text-[11px]"
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                <span>{cat.label}</span>
                <span className="text-[10px] opacity-60">{cat.skills.length}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onResetCamera}
            className="ub-btn ml-auto min-h-[40px] shrink-0 border-line px-3 py-1.5 text-[10px] text-muted hover:border-bone hover:text-bone sm:min-h-[34px] sm:text-[11px]"
            aria-label="Reset universe camera"
          >
            <RotateCcw size={12} aria-hidden /> Reset View
          </button>
        </div>

        {/* Mobile/Tablet Quick Node Selector Strip (collapsible so it never blocks the 3D network) */}
        <div className="pointer-events-auto lg:hidden">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setMobileNodesExpanded((v) => !v)}
              aria-expanded={mobileNodesExpanded}
              className="ub-btn !min-h-[36px] bg-ink/90 !px-2.5 !py-1 !text-[10px]"
            >
              {mobileNodesExpanded ? (
                <>
                  <ChevronUp size={12} className="text-acid" aria-hidden /> Hide node selector
                </>
              ) : (
                <>
                  <ChevronDown size={12} className="text-acid" aria-hidden /> Select skill node ({visibleSkills.length})
                </>
              )}
            </button>
          </div>
          {mobileNodesExpanded && (
            <div className="no-scrollbar mt-1.5 flex max-w-full flex-nowrap gap-1.5 overflow-x-auto rounded-sm border border-line bg-ink/90 p-2 backdrop-blur-sm">
              {visibleSkills.map((sk) => {
                const isSel = selectedSkill?.id === sk.id;
                return (
                  <button
                    key={sk.id}
                    type="button"
                    onClick={() => onSelectSkill(isSel ? null : sk)}
                    aria-pressed={isSel}
                    className="ub-btn !min-h-[36px] shrink-0 !px-2.5 !py-1 !text-[10px]"
                  >
                    {sk.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Desktop Quick Node Selector + Responsive Skill Inspector (Bottom Sheet on Mobile) */}
      <div className="mt-auto flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-end">
        {/* Desktop quick node jumper for keyboard & mouse accessibility */}
        <div className="pointer-events-auto hidden max-w-md flex-wrap gap-1 lg:flex">
          {visibleSkills.map((sk) => {
            const isSel = selectedSkill?.id === sk.id;
            return (
              <button
                key={sk.id}
                type="button"
                onClick={() => onSelectSkill(isSel ? null : sk)}
                aria-pressed={isSel}
                className="ub-btn !min-h-[26px] !px-2 !py-0.5 !text-[10px]"
              >
                {sk.name}
              </button>
            );
          })}
        </div>

        {/* Selected or Hovered Skill Inspector Panel (Bottom Sheet on Mobile, Floating Panel on Desktop) */}
        {activeInspectSkill && (
          <div
            data-lenis-prevent
            className="ub-panel pointer-events-auto ml-auto max-h-[42vh] w-full max-w-sm overflow-y-auto border border-line p-3.5 shadow-2xl transition-all duration-200 sm:max-h-none sm:p-5"
            role="region"
            aria-label="Skill inspector"
          >
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <span className="ub-label mb-1 flex items-center gap-1.5 text-[10px]">
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: inspectCategory?.color ?? '#C5FF55' }}
                  />
                  Cluster // {inspectCategory?.label ?? activeInspectSkill.category}
                  {!selectedSkill && (
                    <span className="ml-1 text-acid">[HOVER PREVIEW]</span>
                  )}
                </span>
                <h3 className="font-display text-lg font-medium tracking-tight text-bone sm:text-xl">
                  {activeInspectSkill.name}
                </h3>
              </div>
              {selectedSkill && (
                <button
                  type="button"
                  onClick={() => onSelectSkill(null)}
                  className="ub-btn !min-h-[36px] px-2.5 py-1 text-[10px] text-muted hover:text-acid sm:!min-h-[28px] sm:px-2"
                  aria-label="Close skill inspector"
                >
                  ESC ✕
                </button>
              )}
            </div>

            <p className="mb-3 font-sans text-xs leading-relaxed text-bone/80 sm:mb-4">
              {activeInspectSkill.description}
            </p>

            {relatedSkills.length > 0 && (
              <div>
                <span className="ub-label mb-2 block text-[10px]">
                  Connected Nodes ({relatedSkills.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {relatedSkills.map((rel) => (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => onSelectSkill(rel)}
                      className="ub-btn flex min-h-[34px] items-center gap-1.5 border-line px-2.5 py-1 text-[10px] hover:border-acid hover:text-acid sm:min-h-[28px] sm:px-2"
                    >
                      <span className="text-acid">↳</span>
                      {rel.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
