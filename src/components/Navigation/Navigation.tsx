import { AnimatePresence, motion } from 'framer-motion';
import { Command, Menu, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { navItems } from '@/data/site';
import { useActiveSection } from '@/hooks/useInView';
import { useUnbound } from '@/context/UnboundContext';

const ids = navItems.map((n) => n.id);

export function Navigation() {
  const { scrollTo, setPaletteOpen, loaded } = useUnbound();
  const active = useActiveSection(ids);
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  useEffect(() => {
    if (!open) return;
    const on = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    scrollTo(id);
  };

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-ink/95 via-ink/70 to-transparent pb-4 pt-3 section-pad sm:pt-4"
      initial={{ y: -80, opacity: 0 }}
      animate={loaded ? { y: 0, opacity: 1 } : {}}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.2, 0.7, 0.2, 1] }}
    >
      <nav
        aria-label="Primary"
        className={`mx-auto flex h-12 items-center justify-between gap-4 border px-3 transition-all duration-500 sm:px-4 ${
          scrolled ? 'border-line bg-ink/90 shadow-[0_8px_32px_rgba(0,0,0,0.65)] backdrop-blur-xl' : 'border-line/60 bg-ink/80 shadow-[0_8px_28px_rgba(0,0,0,0.5)] backdrop-blur-xl'
        }`}
      >
        <a
          href="#home"
          onClick={(e) => { e.preventDefault(); go('home'); }}
          className="group flex items-center gap-2 font-display text-sm font-bold tracking-[-0.02em]"
          data-cursor="Home"
        >
          <span className="inline-block h-2 w-2 bg-acid transition-transform duration-500 group-hover:rotate-45" aria-hidden />
          ARJUN
        </a>

        <ul className="hidden items-center gap-1 lg:flex">
          {navItems.slice(1).map((n) => (
            <li key={n.id} className="relative">
              <a
                href={`#${n.id}`}
                onClick={(e) => { e.preventDefault(); go(n.id); }}
                aria-current={active === n.id ? 'location' : undefined}
                className={`relative block px-3 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                  active === n.id ? 'text-bone' : 'text-muted hover:text-bone'
                }`}
              >
                {active === n.id && (
                  <motion.span layoutId="nav-active" className="absolute inset-x-3 -bottom-px h-px bg-acid" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />
                )}
                {n.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="ub-btn !min-h-[36px] !px-2.5"
            aria-label="Open command palette (Ctrl+K)"
            data-cursor="⌘K"
          >
            <Command size={13} aria-hidden />
            <span className="hidden sm:inline">Ctrl K</span>
          </button>
          <button
            type="button"
            className="ub-btn !min-h-[40px] !px-2.5 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            data-lenis-prevent
            className="fixed inset-0 top-0 -z-10 flex flex-col justify-between overflow-y-auto bg-ink px-5 pb-8 pt-20 sm:px-6 sm:pb-10 sm:pt-24 lg:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
          >
            <ul className="my-auto flex flex-col">
              {navItems.map((n, i) => (
                <motion.li
                  key={n.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 + i * 0.05 }}
                  className="border-b border-line"
                >
                  <a
                    href={`#${n.id}`}
                    onClick={(e) => { e.preventDefault(); go(n.id); }}
                    className={`flex items-baseline justify-between py-2.5 font-display text-2xl font-bold tracking-[-0.03em] sm:py-3 sm:text-4xl ${active === n.id ? 'text-acid' : 'text-bone'}`}
                  >
                    {n.label}
                    <span className="font-mono text-xs text-muted">0{i}</span>
                  </a>
                </motion.li>
              ))}
            </ul>
            <p className="ub-label mt-6 shrink-0">Think beyond. Build without limits.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
