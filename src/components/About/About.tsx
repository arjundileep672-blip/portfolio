import { useState } from 'react';
import { Reveal, SectionTag, SplitReveal } from '@/components/ui/Motion';
import { site } from '@/data/site';

const interests = [
  { k: 'Artificial Intelligence', note: 'Perception, reasoning & autonomous action.' },
  { k: 'Machine Learning', note: 'Statistical structure beneath high-dimensional data.' },
  { k: 'Deep Learning', note: 'Residual architectures & representation depth.' },
  { k: 'Agentic Systems', note: 'Multi-step planning, tool orchestration & VQA.' },
  { k: 'Systems Engineering', note: 'Resilient, high-throughput software architecture.' },
  { k: 'Spatial WebGL', note: 'Real-time shaders, physics & procedural geometry.' },
];

const principles = [
  ['First Principles', 'Deconstruct before building.'],
  ['Reproduce', 'Read the paper. Write the math.'],
  ['Prototype', 'Test hypotheses in code.'],
  ['Ship', 'Precision in production.'],
];

export function About() {
  const [active, setActive] = useState(0);
  return (
    <section id="about" aria-labelledby="about-title" className="relative border-t border-line section-pad py-24 outline-none sm:py-32 lg:py-40">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <SectionTag index="01" label="Identity" />
          <Reveal delay={0.1} className="mt-10 hidden lg:block">
            <div className="font-display text-[9rem] font-black leading-none text-outline" aria-hidden>AD</div>
            <p className="ub-label mt-4">{site.creator}<br />{site.role}</p>
          </Reveal>
        </div>

        <div className="lg:col-span-9">
          <SplitReveal id="about-title" text="Curiosity, engineered." as="h2" className="display-lg max-w-[14ch]" />

          <div className="mt-12 grid gap-10 md:grid-cols-2 lg:mt-16">
            <Reveal>
              <p className="text-xl leading-relaxed text-bone sm:text-2xl">
                I'm <span className="text-acid">Arjun Dileep</span> — building at the intersection of machine intelligence,
                systems architecture, and interactive computation.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="space-y-4 text-[15px] leading-relaxed text-bone/65">
              <p>
                From reproducing foundational deep-learning papers to architecting multi-agent geospatial pipelines,
                I focus on work where mathematics meets tangible software.
              </p>
            </Reveal>
          </div>

          {/* Interactive interest index */}
          <div className="mt-20 grid gap-8 border-t border-line pt-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="ub-label">Domains</p>
              <p className="mt-4 min-h-[3.5em] max-w-xs font-mono text-sm leading-relaxed text-acid" aria-live="polite">
                → {interests[active].note}
              </p>
            </div>
            <ul className="md:col-span-8">
              {interests.map((it, i) => (
                <li key={it.k} className="border-b border-line">
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-pressed={active === i}
                    className="group flex w-full items-baseline justify-between gap-4 py-4 text-left"
                    data-cursor="Read"
                  >
                    <span className={`font-display text-2xl font-medium tracking-[-0.03em] transition-all duration-500 sm:text-4xl ${active === i ? 'translate-x-3 text-bone' : 'text-bone/35 group-hover:text-bone/70'}`}>
                      {it.k}
                    </span>
                    <span className={`font-mono text-[11px] ${active === i ? 'text-acid' : 'text-muted'}`}>0{i + 1}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-20 grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
            {principles.map(([t, d], i) => (
              <Reveal key={t} delay={i * 0.08} className="bg-ink p-5 sm:p-7">
                <p className="font-mono text-[11px] text-acid">/{String(i + 1).padStart(2, '0')}</p>
                <p className="mt-6 font-display text-lg font-medium sm:text-xl">{t}</p>
                <p className="mt-2 text-sm text-muted">{d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
