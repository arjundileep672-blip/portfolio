import { useState } from 'react';
import { Reveal, SectionTag, SplitReveal } from '@/components/ui/Motion';
import { site } from '@/data/site';

const interests = [
  { k: 'Artificial Intelligence', note: 'Systems that perceive, reason and act.' },
  { k: 'Machine Learning', note: 'Learning patterns from data — and the maths underneath.' },
  { k: 'Deep Learning', note: 'Architectures like ResNet; why depth works.' },
  { k: 'Agentic AI', note: 'Models that plan and use tools to get things done.' },
  { k: 'Software Engineering', note: 'Turning ideas into reliable, usable products.' },
  { k: 'Experimental Technology', note: 'Building things just to see if they can exist — like this site.' },
];

const principles = [
  ['Understand', 'How things work, from first principles.'],
  ['Read', 'Research papers — then rebuild them.'],
  ['Experiment', 'With new tools, models and ideas.'],
  ['Ship', 'Ideas into practical applications.'],
];

export function About() {
  const [active, setActive] = useState(0);
  return (
    <section id="about" aria-labelledby="about-title" className="relative border-t border-line section-pad py-24 outline-none sm:py-32 lg:py-40">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-3">
          <SectionTag index="01" label="About — the person behind ARJUN" />
          <Reveal delay={0.1} className="mt-10 hidden lg:block">
            <div className="font-display text-[9rem] font-black leading-none text-outline" aria-hidden>AD</div>
            <p className="ub-label mt-4">{site.creator}<br />{site.role}</p>
          </Reveal>
        </div>

        <div className="lg:col-span-9">
          <SplitReveal id="about-title" text="Curiosity drives everything I build." as="h2" className="display-lg max-w-[16ch]" />

          <div className="mt-14 grid gap-10 md:grid-cols-2 lg:mt-20">
            <Reveal>
              <p className="text-xl leading-relaxed text-bone sm:text-2xl">
                I'm <span className="text-acid">Arjun Dileep</span>, an engineering student passionate about software engineering,
                artificial intelligence, machine learning, and solving real-world problems through technology.
              </p>
            </Reveal>
            <Reveal delay={0.1} className="space-y-5 text-[15px] leading-relaxed text-bone/70">
              <p>
                I enjoy understanding how things work, exploring research papers, experimenting with new technologies,
                and transforming ideas into practical applications.
              </p>
              <p>
                My goal is to become an engineer who builds meaningful technology — and eventually creates products of my own.
              </p>
            </Reveal>
          </div>

          {/* Interactive interest index */}
          <div className="mt-20 grid gap-8 border-t border-line pt-10 md:grid-cols-12">
            <div className="md:col-span-4">
              <p className="ub-label">Fields of interest</p>
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
