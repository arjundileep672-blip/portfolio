import { lazy, useState } from 'react';
import { Reveal, SectionTag, SplitReveal } from '@/components/ui/Motion';
import { SceneFrame } from '@/components/SceneFrame/SceneFrame';
import { skillCategories, type Skill } from '@/data/skills';
import type { SkillsUniverseProps } from '@/scenes/types';

const SkillsUniverse = lazy(() => import('@/scenes/SkillsUniverse'));

function SkillIndex({ highlight }: { highlight: string | null }) {
  return (
    <div className="grid gap-px border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
      {skillCategories.map((c, ci) => (
        <Reveal key={c.id} delay={ci * 0.05} className="bg-ink p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.2em]" style={{ color: c.color }}>{c.label}</h3>
            <span className="font-mono text-[11px] text-muted">{String(c.skills.length).padStart(2, '0')}</span>
          </div>
          <ul className="mt-5 space-y-2">
            {c.skills.map((s) => (
              <li key={s.id} className="group">
                <p className={`font-display text-lg font-medium tracking-[-0.02em] transition-colors ${highlight === s.id ? 'text-acid' : 'text-bone'}`}>{s.name}</p>
                <p className="text-[13px] leading-snug text-muted">{s.description}</p>
              </li>
            ))}
          </ul>
        </Reveal>
      ))}
    </div>
  );
}

export function Skills() {
  const [selected, setSelected] = useState<Skill | null>(null);
  const [view, setView] = useState<'universe' | 'list'>('universe');

  return (
    <section id="skills" aria-labelledby="skills-title" className="relative border-t border-line py-24 outline-none sm:py-32">
      <div className="section-pad">
        <SectionTag index="02" label="Stack" />
        <div className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SplitReveal id="skills-title" text="Connected capabilities." className="display-lg max-w-[14ch]" />
          <div className="max-w-sm">
            <p className="text-[14px] leading-relaxed text-bone/65">
              Every node is a tool in active use; every edge maps a real dependency across AI, backend, and graphics.
            </p>
            <div className="mt-5 flex gap-2" role="group" aria-label="Skills view">
              <button type="button" className="ub-btn" aria-pressed={view === 'universe'} onClick={() => setView('universe')}>3D Constellation</button>
              <button type="button" className="ub-btn" aria-pressed={view === 'list'} onClick={() => setView('list')}>Index</button>
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{selected ? `Selected ${selected.name}: ${selected.description}` : ''}</p>

      <div className="mt-12 section-pad">
        {view === 'universe' ? (
          <SceneFrame<SkillsUniverseProps>
            scene={SkillsUniverse}
            sceneProps={{ skills: skillCategories, onSelectSkill: setSelected }}
            label="Skills universe"
            description="A 3D network of skill nodes grouped into clusters: programming, frontend, backend, database, AI and ML, and tools. A text list of the same skills is available with the Text list button."
            fallback={<div className="absolute inset-0 overflow-y-auto p-4" data-lenis-prevent><SkillIndex highlight={null} /></div>}
            className="h-[72svh] min-h-[500px] border border-line bg-ink sm:h-[78svh] sm:min-h-[560px]"
          />
        ) : (
          <SkillIndex highlight={selected?.id ?? null} />
        )}
      </div>
    </section>
  );
}
