import { ArrowUp } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { navItems, site } from '@/data/site';
import { useUnbound } from '@/context/UnboundContext';

export function Footer() {
  const { scrollTo } = useUnbound();
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line section-pad pb-8 pt-14">
      <div className="grid gap-10 md:grid-cols-12">
        <div className="md:col-span-5">
          <p className="font-display text-4xl font-black tracking-tightest sm:text-6xl">UN<span className="text-acid">B</span>OUND</p>
          <p className="ub-label mt-4">{site.tagline}</p>
        </div>
        <nav aria-label="Footer" className="md:col-span-4">
          <ul className="grid grid-cols-2 gap-y-2">
            {navItems.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} onClick={(e) => { e.preventDefault(); scrollTo(n.id); }} className="link-underline font-mono text-xs uppercase tracking-[0.16em] text-muted hover:text-bone">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex md:col-span-3 md:justify-end">
          <button type="button" onClick={() => scrollTo('top')} className="ub-btn group h-12" aria-label="Back to top" data-cursor="Top">
            Back to top <ArrowUp size={14} className="transition-transform group-hover:-translate-y-0.5" aria-hidden />
          </button>
        </div>
      </div>
      <div className="mt-14 flex flex-col justify-between gap-3 border-t border-line pt-6 sm:flex-row">
        <p className="font-mono text-[11px] text-muted">© {year} UNBOUND — designed &amp; engineered by {site.creator}.</p>
        <p className="font-mono text-[11px] text-muted">
          <span className="hidden sm:inline">Psst — ↑↑↓↓←→←→BA · </span>Ctrl K for commands
        </p>
      </div>
    </footer>
  );
}

export function Toast() {
  const { toastMsg } = useUnbound();
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[120] -translate-x-1/2" role="status" aria-live="polite">
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
            className="border border-acid/60 bg-ink px-4 py-3 font-mono text-xs uppercase tracking-[0.14em] text-acid"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
