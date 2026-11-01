import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CornerDownLeft, ExternalLink, Search, Sparkles, RotateCcw, TerminalSquare, Hash } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useUnbound } from '@/context/UnboundContext';
import { navItems, site, socialHref } from '@/data/site';
import { projects } from '@/data/projects';

interface Action {
  id: string;
  label: string;
  group: string;
  icon: ReactNode;
  keywords?: string;
  run: () => void;
}

export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, scrollTo, resetHero, unleash } = useUnbound();
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [paletteOpen, setPaletteOpen]);

  useEffect(() => {
    if (paletteOpen) {
      lastFocus.current = document.activeElement as HTMLElement;
      setQ('');
      setSel(0);
      setTimeout(() => input.current?.focus(), 30);
    } else lastFocus.current?.focus?.();
  }, [paletteOpen]);

  const actions = useMemo<Action[]>(() => {
    const close = (fn: () => void) => () => { setPaletteOpen(false); setTimeout(fn, 60); };
    const a: Action[] = [
      ...navItems.map((n) => ({ id: `go-${n.id}`, label: `Go to ${n.label}`, group: 'Navigate', icon: <Hash size={14} />, run: close(() => scrollTo(n.id)) })),
      { id: 'go-journey', label: 'Go to Engineering Journey', group: 'Navigate', icon: <Hash size={14} />, keywords: 'timeline', run: close(() => scrollTo('journey')) },
      {
        id: 'terminal', label: 'Open System Terminal', group: 'Actions', icon: <TerminalSquare size={14} />, keywords: 'shell cli',
        run: close(() => { scrollTo('terminal'); setTimeout(() => document.getElementById('terminal-input')?.focus({ preventScroll: true }), 900); }),
      },
      { id: 'reset', label: 'Reset hero sculpture', group: 'Actions', icon: <RotateCcw size={14} />, keywords: '3d camera', run: close(() => { scrollTo('home'); resetHero(); }) },
      { id: 'unleash', label: 'Unleash (secret)', group: 'Actions', icon: <Sparkles size={14} />, keywords: 'easter egg konami', run: close(() => { scrollTo('home'); setTimeout(unleash, 600); }) },
      ...projects.filter((p) => p.links.demo.href).map((p) => ({
        id: `demo-${p.id}`, label: `Open ${p.title} live demo`, group: 'Links', icon: <ExternalLink size={14} />,
        run: close(() => window.open(p.links.demo.href!, '_blank', 'noopener,noreferrer')),
      })),
      ...site.socials.filter((s) => socialHref(s)).map((s) => ({
        id: `social-${s.id}`, label: `Open ${s.label}`, group: 'Links', icon: <ExternalLink size={14} />,
        run: close(() => window.open(socialHref(s)!, '_blank', 'noopener,noreferrer')),
      })),
    ];
    return a;
  }, [scrollTo, resetHero, unleash, setPaletteOpen]);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? actions.filter((a) => `${a.label} ${a.group} ${a.keywords ?? ''}`.toLowerCase().includes(t)) : actions;
  }, [q, actions]);

  useEffect(() => setSel(0), [q]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setPaletteOpen(false);
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(filtered.length - 1, s + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); filtered[sel]?.run(); }
    else if (e.key === 'Tab') e.preventDefault();
  };

  useEffect(() => {
    document.getElementById(`cmd-${filtered[sel]?.id}`)?.scrollIntoView({ block: 'nearest' });
  }, [sel, filtered]);

  let lastGroup = '';
  return (
    <AnimatePresence>
      {paletteOpen && (
        <motion.div
          className="fixed inset-0 z-[150] flex items-start justify-center bg-ink/70 px-4 pt-[14vh] backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onMouseDown={(e) => e.target === e.currentTarget && setPaletteOpen(false)}
        >
          <motion.div
            role="dialog" aria-modal="true" aria-label="Command palette"
            className="ub-panel w-full max-w-xl overflow-hidden shadow-2xl shadow-black/60"
            initial={{ y: 16, scale: 0.98 }} animate={{ y: 0, scale: 1 }} exit={{ y: 10, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
            onKeyDown={onKey}
            data-lenis-prevent
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={15} className="text-muted" aria-hidden />
              <input
                ref={input}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Type a command or search…"
                className="h-14 flex-1 bg-transparent font-mono text-sm text-bone placeholder:text-muted focus:outline-none"
                role="combobox"
                aria-expanded="true"
                aria-controls="cmd-list"
                aria-activedescendant={filtered[sel] ? `cmd-${filtered[sel].id}` : undefined}
                aria-label="Search commands"
              />
              <kbd className="ub-label border border-line px-1.5 py-0.5">Esc</kbd>
            </div>
            <ul id="cmd-list" role="listbox" className="max-h-[50vh] overflow-y-auto py-2">
              {filtered.length === 0 && <li className="px-4 py-6 text-center font-mono text-xs text-muted">No matching command. Try "terminal".</li>}
              {filtered.map((a, i) => {
                const header = a.group !== lastGroup ? (lastGroup = a.group) : null;
                return (
                  <li key={a.id} role="presentation">
                    {header && <div className="ub-label px-4 pb-1 pt-3">{header}</div>}
                    <div
                      id={`cmd-${a.id}`}
                      role="option"
                      aria-selected={i === sel}
                      onMouseMove={() => setSel(i)}
                      onClick={a.run}
                      className={`mx-2 flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm ${i === sel ? 'bg-acid text-ink' : 'text-bone/85'}`}
                    >
                      <span className={i === sel ? 'text-ink' : 'text-muted'}>{a.icon}</span>
                      <span className="flex-1">{a.label}</span>
                      {i === sel ? <CornerDownLeft size={13} /> : <ArrowRight size={13} className="opacity-0" />}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex justify-between border-t border-line px-4 py-2.5">
              <span className="ub-label">↑↓ navigate · ↵ run</span>
              <span className="ub-label">UNBOUND/CMD</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
