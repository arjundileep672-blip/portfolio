import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useUnbound } from '@/context/UnboundContext';
import { usePrefersReducedMotion } from '@/hooks/useDevice';
import { SectionTag, SplitReveal } from '@/components/ui/Motion';
import { completions, execute, type Line } from './commands';

interface Entry { id: number; cmd?: string; lines: Line[]; }

const toneClass: Record<string, string> = {
  out: 'text-bone/85', muted: 'text-muted', accent: 'text-acid', error: 'text-[#FF6B6B]', cmd: 'text-bone',
};

const WELCOME: Line[] = [
  { text: 'ARJUN / SYSTEM TERMINAL — v1.0', tone: 'accent' },
  { text: 'Type `help` to list commands. Try `whoami` or `neofetch`.', tone: 'muted' },
];

/** Prints lines one by one for a typing feel. */
function TypedLines({ lines, animate, onDone }: { lines: Line[]; animate: boolean; onDone: () => void }) {
  const [count, setCount] = useState(animate ? 0 : lines.length);
  useEffect(() => {
    if (!animate) { onDone(); return; }
    if (count >= lines.length) { onDone(); return; }
    const t = setTimeout(() => setCount((c) => c + 1), 28);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, animate, lines.length]);
  return (
    <>
      {lines.slice(0, count).map((l, i) => (
        <div key={i} className={`whitespace-pre-wrap break-words ${toneClass[l.tone ?? 'out']}`}>
          {l.href ? <a href={l.href} target={l.href.startsWith('mailto:') ? undefined : '_blank'} rel="noopener noreferrer" className="underline decoration-line underline-offset-4 hover:text-acid hover:decoration-acid">{l.text}</a> : l.text || '\u00A0'}
        </div>
      ))}
    </>
  );
}

export function Terminal() {
  const { scrollTo, unleash } = useUnbound();
  const reduced = usePrefersReducedMotion();
  const [entries, setEntries] = useState<Entry[]>([{ id: 0, lines: WELCOME }]);
  const [value, setValue] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [hIndex, setHIndex] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  });

  const run = (raw: string) => {
    const cmd = raw.trim();
    const newHistory = cmd ? [...history, cmd] : history;
    if (cmd) setHistory(newHistory);
    setHIndex(null);
    setValue('');
    const res = execute(cmd, { goto: scrollTo, unleash, history: newHistory });
    if (res === 'clear') { setEntries([]); setBusy(false); return; }
    setBusy(res.length > 0 && !reduced);
    setEntries((e) => [...e, { id: nextId.current++, cmd: raw, lines: res }]);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); if (!busy) run(value); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!history.length) return;
      const i = hIndex === null ? history.length - 1 : Math.max(0, hIndex - 1);
      setHIndex(i); setValue(history[i]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIndex === null) return;
      const i = hIndex + 1;
      if (i >= history.length) { setHIndex(null); setValue(''); } else { setHIndex(i); setValue(history[i]); }
    } else if (e.key === 'Tab') {
      const c = completions(value.trim());
      if (value.trim() && c.length === 1) { e.preventDefault(); setValue(c[0] + ' '); }
      else if (value.trim() && c.length > 1) { e.preventDefault(); setEntries((en) => [...en, { id: nextId.current++, cmd: value, lines: [{ text: c.join('  '), tone: 'muted' }] }]); }
    } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); setEntries([]); }
  };

  const quick = ['help', 'whoami', 'neofetch', 'projects', 'skills', 'clear'];

  return (
    <section id="terminal" aria-labelledby="terminal-title" className="relative border-t border-line section-pad py-24 outline-none sm:py-32">
      <div className="grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <SectionTag index="07" label="System terminal" />
          <SplitReveal id="terminal-title" text="Talk to the machine." className="display-md mt-10 max-w-[12ch]" />
          <p className="mt-6 max-w-sm text-[15px] leading-relaxed text-bone/70">
            A real command parser — not an illustration. Type a command, press Enter. History lives on ↑ / ↓.
          </p>
          <div className="mt-8 flex flex-wrap gap-2" aria-label="Quick commands">
            {quick.map((q) => (
              <button key={q} type="button" className="ub-btn" onClick={() => { run(q); input.current?.focus({ preventScroll: true }); }}>{q}</button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8">
          <div className="overflow-hidden border border-line bg-[#060806] shadow-[0_0_0_1px_rgba(197,255,85,0.03)]" onClick={() => input.current?.focus({ preventScroll: true })}>
            <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
              <div className="flex gap-1.5" aria-hidden>
                <span className="h-2.5 w-2.5 bg-line" /><span className="h-2.5 w-2.5 bg-line" /><span className="h-2.5 w-2.5 bg-acid" />
              </div>
              <span className="ub-label">ARJUN / SYSTEM TERMINAL</span>
              <span className="ub-label hidden sm:inline">tty1</span>
            </div>
            <div
              ref={scroller}
              data-lenis-prevent
              className="h-[420px] overflow-y-auto px-4 py-4 font-mono text-[12.5px] leading-[1.7] sm:h-[480px] sm:px-5 sm:text-[13px]"
              role="log"
              aria-live="polite"
              aria-label="Terminal output"
            >
              {entries.map((en, idx) => (
                <div key={en.id} className="mb-2">
                  {en.cmd !== undefined && (
                    <div><span className="text-acid">arjun@system</span><span className="text-muted">:~$</span> <span className="text-bone">{en.cmd}</span></div>
                  )}
                  <TypedLines lines={en.lines} animate={!reduced && idx === entries.length - 1 && en.id !== 0} onDone={() => idx === entries.length - 1 && setBusy(false)} />
                </div>
              ))}
              <div className="flex items-center">
                <label htmlFor="terminal-input" className="shrink-0"><span className="text-acid">arjun@system</span><span className="text-muted">:~$</span>&nbsp;</label>
                <div className="relative flex-1">
                  <input
                    id="terminal-input"
                    ref={input}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={onKey}
                    autoComplete="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    aria-label="Terminal command input"
                    className="peer w-full bg-transparent text-base text-bone caret-transparent outline-none disabled:opacity-100 sm:text-[13px]"
                    style={{ cursor: 'text' }}
                  />
                  <span aria-hidden className="pointer-events-none absolute top-0 whitespace-pre text-transparent">
                    {value}<span className="ml-px inline-block h-[1.1em] w-[0.6em] translate-y-[0.2em] animate-blink bg-acid" />
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
