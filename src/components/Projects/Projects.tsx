import { lazy, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown, Lock, Plus } from 'lucide-react';
import { Magnetic, Reveal, SectionTag, SplitReveal } from '@/components/ui/Motion';
import { SceneFrame } from '@/components/SceneFrame/SceneFrame';
import { experimentalProjects, projects, type Project, type ProjectStatus } from '@/data/projects';
import { useUnbound } from '@/context/UnboundContext';
import type { SatelliteLabInspectItem, SatelliteLabProps } from '@/scenes/types';

const SatelliteLab = lazy(() => import('@/scenes/SatelliteLab'));

const statusLabel: Record<ProjectStatus, string> = {
  live: 'Live',
  'in-progress': 'In progress',
  planned: 'Planned',
  idea: 'Idea',
};

export function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${
        status === 'live'
          ? 'border-acid/60 text-acid'
          : status === 'in-progress'
          ? 'border-acid/50 text-acid'
          : 'border-line text-bone/70'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === 'live' || status === 'in-progress' ? 'animate-pulseDot bg-acid' : 'bg-muted'
        }`}
        aria-hidden
      />
      {statusLabel[status]}
    </span>
  );
}

function ProjectLinks({ p }: { p: Project }) {
  return (
    <div className="flex flex-wrap gap-3">
      {p.links.demo.href ? (
        <Magnetic
          href={p.links.demo.href}
          external
          cursor="Visit"
          ariaLabel={`Open ${p.title} live demo (opens in new tab)`}
          className="group h-12 gap-3 bg-acid px-5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink"
        >
          {p.links.demo.label}{' '}
          <ArrowUpRight
            size={14}
            className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Magnetic>
      ) : (
        <span
          className="inline-flex h-12 items-center gap-2 border border-dashed border-line px-5 font-mono text-xs uppercase tracking-[0.14em] text-muted"
          title="Deployment link not yet published"
        >
          <Lock size={13} aria-hidden /> Live deployment · in development
        </span>
      )}
      {p.links.source.href ? (
        <Magnetic
          href={p.links.source.href}
          external
          cursor="Code"
          className="h-12 gap-3 border border-bone/30 px-5 font-mono text-xs uppercase tracking-[0.14em]"
        >
          {p.links.source.label} <ArrowUpRight size={14} aria-hidden />
        </Magnetic>
      ) : (
        <span
          className="inline-flex h-12 items-center gap-2 border border-dashed border-line px-5 font-mono text-xs uppercase tracking-[0.14em] text-muted"
          title="Repository link not yet published"
        >
          <Lock size={13} aria-hidden /> Source · not yet published
        </span>
      )}
    </div>
  );
}

function FeaturedProject({ p }: { p: Project }) {
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [inspectedItem, setInspectedItem] = useState<SatelliteLabInspectItem | null>(null);

  return (
    <article aria-labelledby={`p-${p.id}`} className="relative">
      <div className="section-pad grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="font-mono text-sm text-acid">P/{p.index}</span>
            <StatusPill status={p.status} />
            {p.context && (
              <span className="border border-line bg-ink-2 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-bone/85">
                {p.context}
              </span>
            )}
            <span className="ub-label">{p.category}</span>
          </div>

          <h3
            id={`p-${p.id}`}
            className="mt-6 font-display font-black uppercase leading-[0.86] tracking-tightest"
            style={{ fontSize: 'clamp(2.8rem, 9.5vw, 8.8rem)' }}
          >
            {p.title}
          </h3>

          {p.headline && (
            <p className="mt-5 max-w-2xl font-display text-lg font-medium uppercase tracking-[-0.02em] text-acid sm:text-2xl">
              {p.headline}
            </p>
          )}
          {p.supportingText && (
            <p className="mt-2 max-w-xl font-mono text-xs uppercase tracking-[0.14em] text-muted">
              {p.supportingText}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-end gap-8 lg:col-span-5">
          <Reveal>
            <p className="text-lg leading-relaxed text-bone sm:text-xl">{p.summary}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-bone/70">{p.description}</p>
          </Reveal>
          <ProjectLinks p={p} />
        </div>
      </div>

      {/* Expandable Deep-Dive Specification: Problem Statement, Proposed Solution & Multi-Agent Architecture */}
      <div className="section-pad mt-14">
        <div className="border-y border-line">
          <button
            type="button"
            onClick={() => setDetailsOpen((v) => !v)}
            aria-expanded={detailsOpen}
            aria-controls={`spec-${p.id}`}
            className="flex w-full items-center justify-between py-5 text-left"
            data-cursor={detailsOpen ? 'Collapse' : 'Expand'}
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs text-acid">// ARCHITECTURE &amp; SPECIFICATION</span>
              <span className="ub-label hidden sm:inline">
                Problem Statement · Proposed Solution · Capabilities · 10-Stage Agent Pipeline
              </span>
            </div>
            <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
              {detailsOpen ? 'Hide details' : 'Expand details'}
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${detailsOpen ? 'rotate-180 text-acid' : ''}`}
                aria-hidden
              />
            </span>
          </button>

          <AnimatePresence initial={false}>
            {detailsOpen && (
              <motion.div
                id={`spec-${p.id}`}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="grid gap-px border-t border-line bg-line pb-px md:grid-cols-2">
                  {p.problemStatement && (
                    <div className="bg-ink p-6 sm:p-8">
                      <p className="ub-label text-acid">01 // Problem Statement</p>
                      <p className="mt-3 text-[15px] leading-relaxed text-bone/80">
                        {p.problemStatement}
                      </p>
                    </div>
                  )}
                  {p.proposedSolution && (
                    <div className="bg-ink p-6 sm:p-8">
                      <p className="ub-label text-acid">02 // Proposed Solution</p>
                      <p className="mt-3 text-[15px] leading-relaxed text-bone/80">
                        {p.proposedSolution}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid gap-px bg-line md:grid-cols-2">
                  <div className="bg-ink p-6 sm:p-8">
                    <p className="ub-label">03 // Core Capabilities</p>
                    <ol className="mt-4 space-y-2.5">
                      {p.features.map((f, i) => (
                        <li key={f} className="flex gap-3.5 text-[14.5px] leading-snug text-bone/85">
                          <span className="font-mono text-xs text-acid">
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  <div className="bg-ink p-6 sm:p-8 flex flex-col justify-between gap-6">
                    {p.architecturePipeline && (
                      <div>
                        <p className="ub-label">04 // Multi-Agent Processing Pipeline</p>
                        <div className="mt-4 flex flex-wrap items-center gap-1.5">
                          {p.architecturePipeline.map((stage, idx) => (
                            <span key={stage} className="inline-flex items-center gap-1.5">
                              <span className="border border-line bg-ink-2 px-2.5 py-1 font-mono text-[11px] text-bone">
                                <span className="text-acid mr-1">{idx + 1}.</span>
                                {stage}
                              </span>
                              {idx < p.architecturePipeline!.length - 1 && (
                                <span className="font-mono text-xs text-acid" aria-hidden>
                                  →
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="ub-label">05 // Technology Stack</p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {p.stack.map((t) => (
                          <li key={t} className="chip">
                            {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Interactive 3D Satellite Intelligence Lab */}
      {p.scene === 'satellite' && (
        <div className="section-pad mt-12">
          <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="ub-label text-acid">
                Scene three — interactive 3D satellite intelligence lab
              </p>
              <h4 className="display-md mt-2">
                Orbital observation, SAR vs. Optical &amp; multi-agent VQA.
              </h4>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-muted">
              Rotate the procedural Earth, click orbiting satellites or geographic ROI pins, switch
              between simulated Optical and SAR radar modes, and inspect the 10-stage multi-agent
              processing pipeline.
            </p>
          </div>

          <p className="sr-only" aria-live="polite">
            {inspectedItem
              ? `Selected ${inspectedItem.title}: ${inspectedItem.detail}`
              : ''}
          </p>

          <SceneFrame<SatelliteLabProps>
            scene={SatelliteLab}
            sceneProps={{ project: p, onSelectItem: setInspectedItem }}
            label="SATQUERY AI Satellite Intelligence Lab"
            description="An interactive 3D Earth with orbiting optical and SAR satellites, selectable geographic regions, Optical versus SAR comparison modes, explainable AI overlays, and a 10-node multi-agent processing pipeline."
            fallback={
              <div className="absolute inset-0 flex items-center justify-center p-8 text-center">
                <p className="max-w-md text-bone/70">
                  3D Satellite Intelligence Lab requires WebGL. SATQUERY AI combines Optical and SAR
                  satellite imagery with a 10-stage multi-agent VQA pipeline (React WebGIS → FastAPI
                  → Planner → Tool Registry → VQA / Image Processing → VLM Adapter → Evidence
                  Normalization → Structured Result → Trace → UI).
                </p>
              </div>
            }
            className="h-[84svh] min-h-[620px] border border-line bg-ink"
          />
        </div>
      )}
    </article>
  );
}

export function Projects() {
  const { scrollTo } = useUnbound();
  return (
    <section
      id="projects"
      aria-labelledby="projects-title"
      className="relative border-t border-line py-24 outline-none sm:py-32"
    >
      <div className="section-pad">
        <SectionTag index="03" label="Selected work" />
        <SplitReveal id="projects-title" text="Things I'm building." className="display-lg mt-10" />
      </div>

      <div className="mt-16 space-y-24">
        {projects.map((p) => (
          <FeaturedProject key={p.id} p={p} />
        ))}
      </div>

      {/* P/02 — Research reproductions & P/03 — Experiments queue */}
      <div className="section-pad mt-24 grid gap-px border-y border-line bg-line lg:grid-cols-2">
        <button
          type="button"
          onClick={() => scrollTo('research')}
          className="group bg-ink py-10 text-left lg:pr-10"
          data-cursor="Research"
        >
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-acid">P/02</span>
            <span className="ub-label">AI / Machine Learning / Research</span>
          </div>
          <h3 className="mt-6 font-display text-3xl font-bold tracking-[-0.03em] sm:text-5xl">
            Research paper reproductions
          </h3>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-bone/70">
            Recreating implementations of published research papers to understand the mathematics,
            architectures and engineering behind modern AI systems. Starting with ResNet.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-acid">
            Open research lab{' '}
            <ArrowUpRight
              size={14}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        </button>

        <div className="bg-ink py-10 lg:pl-10">
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-acid">P/03</span>
            <span className="ub-label">Experimental projects</span>
          </div>
          <h3 className="mt-6 font-display text-3xl font-bold tracking-[-0.03em] sm:text-5xl">
            Experiments queue
          </h3>
          {experimentalProjects.length === 0 ? (
            <div className="mt-6 flex items-start gap-4 border border-dashed border-line p-5">
              <Plus size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
              <p className="text-[15px] leading-relaxed text-muted">
                Reserved for what comes next. Add projects in{' '}
                <code className="font-mono text-bone">src/data/projects.ts</code> as they are built
                — nothing is listed until it's real.
              </p>
            </div>
          ) : (
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {experimentalProjects.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-4 py-4">
                  <div>
                    <p className="font-display text-lg">{p.title}</p>
                    <p className="text-sm text-muted">{p.summary}</p>
                  </div>
                  <StatusPill status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
