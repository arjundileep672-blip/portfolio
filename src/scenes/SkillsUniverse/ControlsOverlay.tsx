import { RotateCcw } from 'lucide-react';
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
  const activeInspectSkill = selectedSkill ?? hoveredSkill;
  const inspectCategory = categories.find((c) => c.id === activeInspectSkill?.category);

  // Map related skill IDs to full Skill objects
  const relatedSkills = (activeInspectSkill?.related ?? [])
    .map((id) => allSkills.find((s) => s.id === id))
    .filter((s): s is Skill => Boolean(s));

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between p-4 sm:p-6">
      {/* Top Bar: Category Filter Chips & Camera Reset */}
      <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          aria-pressed={activeCategory === 'all'}
          className="ub-btn min-h-[36px] px-3 py-1.5 text-[11px] sm:min-h-[34px]"
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
              className="ub-btn flex min-h-[36px] items-center gap-1.5 px-3 py-1.5 text-[11px] sm:min-h-[34px]"
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
          className="ub-btn ml-auto min-h-[36px] border-line px-3 py-1.5 text-[11px] text-muted hover:border-bone hover:text-bone sm:min-h-[34px]"
          aria-label="Reset universe camera"
        >
          <RotateCcw size={12} aria-hidden /> Reset View
        </button>
      </div>

      {/* Bottom Row: Quick Node Selector + Selected/Hovered Skill Inspector */}
      <div className="mt-auto flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-end">
        {/* Compact telemetry / quick node jumper for keyboard & touch accessibility */}
        <div className="pointer-events-auto hidden max-w-md flex-wrap gap-1 lg:flex">
          {(activeCategory === 'all'
            ? allSkills
            : allSkills.filter((s) => s.category === activeCategory)
          ).map((sk) => {
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

        {/* Selected or Hovered Skill Inspector Panel */}
        {activeInspectSkill && (
          <div
            className="ub-panel pointer-events-auto ml-auto w-full max-w-sm border border-line p-4 shadow-2xl transition-all duration-200 sm:p-5"
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
                <h3 className="font-display text-xl font-medium tracking-tight text-bone">
                  {activeInspectSkill.name}
                </h3>
              </div>
              {selectedSkill && (
                <button
                  type="button"
                  onClick={() => onSelectSkill(null)}
                  className="ub-btn !min-h-[28px] px-2 py-1 text-[10px] text-muted hover:text-acid"
                  aria-label="Close skill inspector"
                >
                  ESC ✕
                </button>
              )}
            </div>

            <p className="mb-4 font-sans text-xs leading-relaxed text-bone/80">
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
                      className="ub-btn flex min-h-[28px] items-center gap-1.5 border-line px-2 py-1 text-[10px] hover:border-acid hover:text-acid"
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
