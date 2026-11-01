import { ArrowUpRight, Lock, Plus } from 'lucide-react';
import { Magnetic, Reveal, SectionTag, SplitReveal } from '@/components/ui/Motion';
import { experimentalProjects, projects, type Project, type ProjectStatus } from '@/data/projects';
import { useUnbound } from '@/context/UnboundContext';

const statusLabel: Record<ProjectStatus, string> = { live: 'Live', 'in-progress': 'In progress', planned: 'Planned', idea: 'Idea' };

export function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex items-center gap-2 border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${status === 'live' ? 'border-acid/60 text-acid' : 'border-line text-bone/70'}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${status === 'live' ? 'animate-pulseDot bg-acid' : 'bg-muted'}`} aria-hidden />
      {statusLabel[status]}
    </span>
  );
}

function ProjectLinks({ p }: { p: Project }) {
  return (
    <div className="flex flex-wrap gap-3">
      {p.links.demo.href ? (
        <Magnetic href={p.links.demo.href} external cursor="Visit" ariaLabel={`Open ${p.title} live demo (opens in new tab)`} className="group h-12 gap-3 bg-acid px-5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink">
          {p.links.demo.label} <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </Magnetic>
      ) : null}
      {p.links.source.href ? (
        <Magnetic href={p.links.source.href} external cursor="Code" className="h-12 gap-3 border border-bone/30 px-5 font-mono text-xs uppercase tracking-[0.14em]">
          {p.links.source.label} <ArrowUpRight size={14} aria-hidden />
        </Magnetic>
      ) : (
        <span className="inline-flex h-12 items-center gap-2 border border-dashed border-line px-5 font-mono text-xs uppercase tracking-[0.14em] text-muted" title="Repository link not yet published">
          <Lock size={13} aria-hidden /> Source · not yet published
        </span>
      )}
    </div>
  );
}

function FeaturedProject({ p }: { p: Project }) {
  return (
    <article aria-labelledby={`p-${p.id}`} className="relative">
      <div className="section-pad grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-mono text-sm text-acid">P/{p.index}</span>
            <StatusPill status={p.status} />
            <span className="ub-label">{p.category}</span>
          </div>
          <h3 id={`p-${p.id}`} className="mt-6 font-display font-black uppercase leading-[0.85] tracking-tightest" style={{ fontSize: 'clamp(3rem, 11vw, 10rem)' }}>
            {p.title}
          </h3>
        </div>
        <div className="flex flex-col justify-end gap-8 lg:col-span-5">
          <Reveal>
            <p className="text-lg leading-relaxed text-bone sm:text-xl">{p.summary}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-bone/70">{p.description}</p>
          </Reveal>
          <ProjectLinks p={p} />
        </div>
      </div>

      <div className="section-pad mt-14 grid gap-px border-y border-line bg-line md:grid-cols-2">
        <div className="bg-ink py-6 md:pr-8">
          <p className="ub-label">Capabilities</p>
          <ol className="mt-4 space-y-2">
            {p.features.map((f, i) => (
              <li key={f} className="flex gap-4 text-[15px]"><span className="font-mono text-xs text-muted">{String(i + 1).padStart(2, '0')}</span>{f}</li>
            ))}
          </ol>
        </div>
        <div className="bg-ink py-6 md:pl-8">
          <p className="ub-label">Stack</p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {p.stack.map((t) => <li key={t} className="chip">{t}</li>)}
          </ul>
        </div>
      </div>
    </article>
  );
}

export function Projects() {
  const { scrollTo } = useUnbound();
  return (
    <section id="projects" aria-labelledby="projects-title" className="relative border-t border-line py-24 outline-none sm:py-32">
      <div className="section-pad">
        <SectionTag index="03" label="Selected work" />
        <SplitReveal id="projects-title" text="Things I'm building." className="display-lg mt-10" />
      </div>

      {projects.length > 0 && (
        <div className="mt-16 space-y-24">
          {projects.map((p) => <FeaturedProject key={p.id} p={p} />)}
        </div>
      )}

      {/* Research reproductions & Experiments queue */}
      <div className="section-pad mt-16 grid gap-px border-y border-line bg-line lg:grid-cols-2">
        <button
          type="button"
          onClick={() => scrollTo('research')}
          className="group bg-ink py-10 text-left lg:pr-10"
          data-cursor="Research"
        >
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-acid">P/01</span>
            <span className="ub-label">AI / Machine Learning / Research</span>
          </div>
          <h3 className="mt-6 font-display text-3xl font-bold tracking-[-0.03em] sm:text-5xl">Research paper reproductions</h3>
          <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-bone/70">
            Recreating implementations of published research papers to understand the mathematics, architectures and engineering
            behind modern AI systems. Starting with ResNet.
          </p>
          <span className="mt-6 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.14em] text-acid">
            Open research lab <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
          </span>
        </button>

        <div className="bg-ink py-10 lg:pl-10">
          <div className="flex items-center gap-4">
            <span className="font-mono text-sm text-acid">P/02</span>
            <span className="ub-label">Experimental projects</span>
          </div>
          <h3 className="mt-6 font-display text-3xl font-bold tracking-[-0.03em] sm:text-5xl">Experiments queue</h3>
          {experimentalProjects.length === 0 ? (
            <div className="mt-6 flex items-start gap-4 border border-dashed border-line p-5">
              <Plus size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
              <p className="text-[15px] leading-relaxed text-muted">
                Reserved for what comes next. Add projects in <code className="font-mono text-bone">src/data/projects.ts</code> as they are built — nothing is listed until it's real.
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
