import { lazy, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight, ChevronDown } from 'lucide-react';
import { Reveal, SectionTag, SplitReveal } from '@/components/ui/Motion';
import { SceneFrame } from '@/components/SceneFrame/SceneFrame';
import { notebook, research, statusMeta, type ResearchEntry, type ResearchStatus } from '@/data/research';
import type { NeuralNetworkProps, NeuronInfo } from '@/scenes/types';

const NeuralNetwork = lazy(() => import('@/scenes/NeuralNetwork'));

export function StatusBadge({ status }: { status: ResearchStatus }) {
  const m = statusMeta[status];
  return <span className={`inline-flex items-center border px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${m.tone}`}>{m.label}</span>;
}

/** SVG diagram of a residual block: y = F(x) + x. */
function ResidualBlockDiagram() {
  return (
    <figure className="border border-line bg-ink-2 p-5">
      <svg viewBox="0 0 360 250" className="h-auto w-full" role="img" aria-labelledby="rb-title rb-desc">
        <title id="rb-title">Residual block diagram</title>
        <desc id="rb-desc">Input x passes through two weight layers with a ReLU between them to produce F of x. An identity shortcut carries x around the layers and is added to F of x, followed by a ReLU.</desc>
        <defs>
          <marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#858B80" /></marker>
          <marker id="arA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" fill="#C5FF55" /></marker>
        </defs>
        <g fontFamily="JetBrains Mono, monospace" fontSize="11" fill="#F2F2EA">
          <text x="130" y="16">x</text>
          <line x1="134" y1="22" x2="134" y2="44" stroke="#858B80" markerEnd="url(#ar)" />
          <rect x="74" y="46" width="120" height="30" fill="#080A08" stroke="#282D27" /><text x="96" y="65">weight layer</text>
          <line x1="134" y1="76" x2="134" y2="98" stroke="#858B80" markerEnd="url(#ar)" />
          <text x="142" y="92" fill="#858B80">relu</text>
          <rect x="74" y="100" width="120" height="30" fill="#080A08" stroke="#282D27" /><text x="96" y="119">weight layer</text>
          <line x1="134" y1="130" x2="134" y2="168" stroke="#858B80" markerEnd="url(#ar)" />
          <text x="20" y="152" fill="#858B80">F(x)</text>
          <circle cx="134" cy="182" r="13" fill="#080A08" stroke="#C5FF55" /><text x="129" y="186" fill="#C5FF55">+</text>
          <path d="M134 30 H290 V182 H150" fill="none" stroke="#C5FF55" strokeDasharray="4 4" markerEnd="url(#arA)" />
          <text x="226" y="110" fill="#C5FF55">identity</text>
          <text x="226" y="124" fill="#C5FF55">x</text>
          <line x1="134" y1="195" x2="134" y2="222" stroke="#858B80" markerEnd="url(#ar)" />
          <text x="142" y="214" fill="#858B80">relu</text>
          <text x="100" y="242">F(x) + x</text>
        </g>
      </svg>
      <figcaption className="ub-label mt-3">Fig. — residual building block (after He et al., 2015)</figcaption>
    </figure>
  );
}

function ResearchPanel({ r, open, onToggle }: { r: ResearchEntry; open: boolean; onToggle: () => void }) {
  return (
    <article className="border-t border-line" aria-labelledby={`r-${r.id}`}>
      <h3 id={`r-${r.id}`}>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`rp-${r.id}`}
          className="group grid w-full grid-cols-12 items-baseline gap-4 py-8 text-left"
          data-cursor={open ? 'Close' : 'Open'}
        >
          <span className="col-span-12 font-mono text-[11px] text-acid sm:col-span-1">R/01</span>
          <span className="col-span-12 sm:col-span-8">
            <span className="block font-display text-3xl font-bold tracking-[-0.03em] sm:text-5xl">{r.shortTitle}</span>
            <span className="mt-2 block text-lg text-bone/70">{r.title}</span>
          </span>
          <span className="col-span-12 flex items-center justify-between gap-4 sm:col-span-3 sm:justify-end">
            <StatusBadge status={r.status} />
            <ChevronDown size={18} className={`transition-transform duration-500 ${open ? 'rotate-180 text-acid' : 'text-muted'}`} aria-hidden />
          </span>
        </button>
      </h3>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={`rp-${r.id}`}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.2, 0.7, 0.2, 1] }}
            className="overflow-hidden"
          >
            <div className="grid gap-10 pb-12 lg:grid-cols-12">
              <div className="space-y-8 lg:col-span-7">
                <dl className="grid gap-x-8 gap-y-4 border border-line p-5 sm:grid-cols-[auto_1fr]">
                  <dt className="ub-label">Authors</dt><dd className="text-[15px]">{r.authors}</dd>
                  <dt className="ub-label">Published</dt><dd className="text-[15px]">{r.publication}</dd>
                  <dt className="ub-label">Status</dt><dd className="text-[15px]">{statusMeta[r.status].description}</dd>
                  {r.reference && (<><dt className="ub-label">Paper</dt><dd><a href={r.reference.href} target="_blank" rel="noopener noreferrer" className="link-underline inline-flex items-center gap-1 text-acid">{r.reference.label} <ArrowUpRight size={13} aria-hidden /></a></dd></>)}
                </dl>
                <Block title="Objective" body={r.objective} />
                <Block title="Problem" body={r.problem} />
                <Block title="Core idea — residual learning" body={r.coreIdea} />
                {r.formula && <p className="border-l-2 border-acid bg-ink-2 px-5 py-4 font-mono text-xl text-acid sm:text-2xl">{r.formula}</p>}
              </div>
              <div className="space-y-8 lg:col-span-5">
                <ResidualBlockDiagram />
                <List title="Methodology" items={r.methodology} />
                <List title="Architecture" items={r.architecture} />
                <List title="Personal observations" items={r.observations} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </article>
  );
}

const Block = ({ title, body }: { title: string; body: string }) => (
  <div><p className="ub-label">{title}</p><p className="mt-3 text-[15px] leading-relaxed text-bone/80">{body}</p></div>
);
const List = ({ title, items }: { title: string; items: string[] }) => (
  <div>
    <p className="ub-label">{title}</p>
    <ul className="mt-3 space-y-2">
      {items.map((i) => <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-bone/80"><span className="text-acid" aria-hidden>—</span>{i}</li>)}
    </ul>
  </div>
);

export function Research() {
  const [open, setOpen] = useState<string | null>(research[0]?.id ?? null);
  const [neuron, setNeuron] = useState<NeuronInfo | null>(null);
  const [noteKind, setNoteKind] = useState<string>('all');
  const kinds = ['all', ...Array.from(new Set(notebook.map((n) => n.kind)))];

  return (
    <section id="research" aria-labelledby="research-title" className="relative border-t border-line py-24 outline-none sm:py-32">
      <div className="section-pad">
        <SectionTag index="04" label="Research lab — digital notebook" />
        <div className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <SplitReveal id="research-title" text="Beyond the code." className="display-lg" />
          <div className="flex flex-wrap gap-3" aria-label="Status legend">
            {(Object.keys(statusMeta) as ResearchStatus[]).map((s) => (
              <div key={s} className="flex items-center gap-2"><StatusBadge status={s} /><span className="hidden text-xs text-muted xl:inline">{statusMeta[s].description}</span></div>
            ))}
          </div>
        </div>

        <div className="mt-16 border-b border-line">
          {research.map((r) => (
            <ResearchPanel key={r.id} r={r} open={open === r.id} onToggle={() => setOpen(open === r.id ? null : r.id)} />
          ))}
        </div>
      </div>

      {/* Scene four */}
      <div className="section-pad mt-20">
        <div className="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="ub-label text-acid">04 // Residual Network Topology</p>
            <h3 className="display-md mt-2 max-w-[20ch]">Forward pass &amp; skip connections.</h3>
          </div>
          <p className="max-w-xs font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            Interactive ResNet-inspired signal propagation
          </p>
        </div>
        <SceneFrame<NeuralNetworkProps>
          scene={NeuralNetwork}
          sceneProps={{ onNeuronSelect: setNeuron }}
          label="Neural network"
          description="A 3D neural network with layers of neurons, synapse lines and residual skip connections. Signals propagate through the layers. Controls allow play, pause, reset, speed and layer selection."
          fallback={<div className="absolute inset-0 flex items-center justify-center p-8"><div className="w-full max-w-md"><ResidualBlockDiagram /></div></div>}
          className="h-[72svh] min-h-[500px] border border-line bg-ink sm:h-[80svh] sm:min-h-[560px]"
        />
        <p className="sr-only" aria-live="polite">{neuron ? `Selected neuron ${neuron.neuronIndex} in ${neuron.layerName}` : ''}</p>
      </div>

      {/* Notebook */}
      <div className="section-pad mt-24">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <h3 className="display-md">Engineering notebook</h3>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter notes">
            {kinds.map((k) => <button key={k} type="button" className="ub-btn" aria-pressed={noteKind === k} onClick={() => setNoteKind(k)}>{k}</button>)}
          </div>
        </div>
        <motion.ul layout className="mt-10 grid gap-px border border-line bg-line md:grid-cols-2">
          <AnimatePresence mode="popLayout">
            {notebook.filter((n) => noteKind === 'all' || n.kind === noteKind).map((n) => (
              <motion.li key={n.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-ink p-6 sm:p-8">
                <p className="ub-label text-acid">{n.kind}</p>
                <h4 className="mt-4 font-display text-xl font-medium tracking-[-0.02em]">{n.title}</h4>
                <p className="mt-3 text-[14px] leading-relaxed text-bone/70">{n.body}</p>
                {n.snippet && <pre className="mt-5 overflow-x-auto border border-line bg-ink-2 p-3 font-mono text-[12px] text-bone/90">{n.snippet}</pre>}
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
        <Reveal className="mt-6"><p className="ub-label">Notes are learning records — no unverified results are reported here.</p></Reveal>
      </div>
    </section>
  );
}
