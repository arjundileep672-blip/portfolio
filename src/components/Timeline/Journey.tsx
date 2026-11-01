import { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionTag, SplitReveal } from '@/components/ui/Motion';
import { milestones, type JourneyCategory } from '@/data/timeline';

const stateLabel = { done: 'Done', now: 'Now', next: 'Next' } as const;

export function Journey() {
  const cats = ['All', ...Array.from(new Set(milestones.map((m) => m.category)))] as ('All' | JourneyCategory)[];
  const [cat, setCat] = useState<'All' | JourneyCategory>('All');
  const [openId, setOpenId] = useState<string | null>(null);
  const list = milestones.filter((m) => cat === 'All' || m.category === cat);

  return (
    <section id="journey" aria-labelledby="journey-title" className="relative border-t border-line section-pad py-24 outline-none sm:py-32">
      <SectionTag index="06" label="Engineering journey" />
      <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end">
        <SplitReveal id="journey-title" text="The path so far — and next." className="display-lg lg:col-span-7" />
        <p className="text-[15px] leading-relaxed text-bone/70 lg:col-span-5">
          A learning progression rather than a dated résumé. Milestones without verified dates stay undated.
        </p>
      </div>

      <div className="no-scrollbar -mx-5 mt-12 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:px-0" role="group" aria-label="Filter journey by category">
        {cats.map((c) => (
          <button key={c} type="button" className="ub-btn shrink-0" aria-pressed={cat === c} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <ol className="relative mt-12">
        <span className="absolute bottom-0 left-[7px] top-0 w-px bg-line md:left-1/2" aria-hidden />
        {list.map((m, i) => {
          const left = i % 2 === 0;
          const open = openId === m.id;
          return (
            <motion.li
              key={m.id}
              layout
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.7, delay: 0.04 * i }}
              className={`relative pb-10 pl-10 md:w-1/2 md:pl-0 ${left ? 'md:pr-14 md:text-right' : 'md:ml-auto md:pl-14'}`}
            >
              <span
                className={`absolute left-0 top-2 h-[15px] w-[15px] border ${m.state === 'now' ? 'border-acid bg-acid' : m.state === 'done' ? 'border-bone bg-ink' : 'border-dashed border-muted bg-ink'} ${left ? 'md:left-auto md:-right-[7px]' : 'md:-left-[8px]'}`}
                aria-hidden
              />
              <button
                type="button"
                onClick={() => setOpenId(open ? null : m.id)}
                aria-expanded={open}
                className="group w-full text-left md:text-inherit"
                style={{ textAlign: 'inherit' }}
              >
                <span className={`flex flex-wrap items-center gap-3 ${left ? 'md:justify-end' : ''}`}>
                  <span className="ub-label">{m.category}</span>
                  <span className={`font-mono text-[10px] uppercase tracking-widest ${m.state === 'now' ? 'text-acid' : 'text-muted'}`}>· {stateLabel[m.state]}</span>
                  {m.period && <span className="font-mono text-[10px] text-muted">· {m.period}</span>}
                </span>
                <span className="mt-2 block font-display text-2xl font-medium tracking-[-0.03em] transition-colors group-hover:text-acid sm:text-3xl">{m.title}</span>
              </button>
              <motion.p
                initial={false}
                animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
                className="overflow-hidden text-[15px] leading-relaxed text-bone/70"
              >
                <span className="block pt-3">{m.description}</span>
              </motion.p>
            </motion.li>
          );
        })}
      </ol>
    </section>
  );
}
