import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Lenis from 'lenis';
import { usePrefersReducedMotion } from '@/hooks/useDevice';

interface UnboundState {
  /** Smoothly scroll to a section id (or 'top'). */
  scrollTo: (id: string) => void;
  heroResetSignal: number;
  resetHero: () => void;
  secretSignal: number;
  unleash: () => void;
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
  loaded: boolean;
  setLoaded: (v: boolean) => void;
  lenis: Lenis | null;
}

const Ctx = createContext<UnboundState | null>(null);

export function UnboundProvider({ children }: { children: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const [heroResetSignal, setHeroReset] = useState(0);
  const [secretSignal, setSecret] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const toastTimer = useRef<number>();

  useEffect(() => {
    if (reduced) return;
    const l = new Lenis({ duration: 1.15, smoothWheel: true, prevent: (node) => !!node.closest?.('[data-lenis-prevent]') });
    let raf = 0;
    const loop = (t: number) => {
      l.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    setLenis(l);
    return () => {
      cancelAnimationFrame(raf);
      l.destroy();
      setLenis(null);
    };
  }, [reduced]);

  // Lock scroll while loading / palette is open.
  useEffect(() => {
    const lock = !loaded || paletteOpen;
    if (lenis) (lock ? lenis.stop() : lenis.start());
    document.documentElement.style.overflow = lock ? 'hidden' : '';
  }, [loaded, paletteOpen, lenis]);

  const scrollTo = useCallback(
    (id: string) => {
      const target = id === 'top' || id === 'home' ? 0 : document.getElementById(id);
      if (target === null) return;
      if (lenis) lenis.scrollTo(target as number | HTMLElement, { offset: 0, duration: 1.4 });
      else if (target === 0) window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
      else (target as HTMLElement).scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
      // Move focus for keyboard / screen-reader users.
      const el = target === 0 ? document.getElementById('home') : (target as HTMLElement);
      el?.setAttribute('tabindex', '-1');
      el?.focus({ preventScroll: true });
    },
    [lenis, reduced],
  );

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2800);
  }, []);

  const resetHero = useCallback(() => setHeroReset((n) => n + 1), []);
  const unleash = useCallback(() => {
    setSecret((n) => n + 1);
    toast('ARJUN // UNLEASHED — limits removed.');
    console.log('%cARJUN // UNLEASHED', 'color:#C5FF55;font:700 14px monospace');
  }, [toast]);

  const value = useMemo(
    () => ({ scrollTo, heroResetSignal, resetHero, secretSignal, unleash, paletteOpen, setPaletteOpen, toast, toastMsg, loaded, setLoaded, lenis }),
    [scrollTo, heroResetSignal, resetHero, secretSignal, unleash, paletteOpen, toast, toastMsg, loaded, lenis],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useUnbound() {
  const c = useContext(Ctx);
  if (!c) throw new Error('useUnbound must be used within UnboundProvider');
  return c;
}
