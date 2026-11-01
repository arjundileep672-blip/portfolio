import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useUnbound } from '@/context/UnboundContext';
import { usePrefersReducedMotion } from '@/hooks/useDevice';

const LETTERS = 'ARJUN'.split('');

/** Tiny 2D particle field — cheap, no WebGL needed during load. */
function Particles() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      c.width = window.innerWidth * dpr;
      c.height = window.innerHeight * dpr;
    };
    resize();
    const pts = Array.from({ length: window.innerWidth < 700 ? 40 : 90 }, () => ({
      x: Math.random(), y: Math.random(), v: 0.0004 + Math.random() * 0.0012, r: Math.random() * 1.4 + 0.3, a: Math.random(),
    }));
    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of pts) {
        p.y -= p.v;
        if (p.y < 0) p.y = 1;
        ctx.fillStyle = `rgba(197,255,85,${0.15 + p.a * 0.45})`;
        ctx.fillRect(p.x * c.width, p.y * c.height, p.r * dpr, p.r * dpr);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);
  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden />;
}

export function Loader() {
  const { loaded, setLoaded } = useUnbound();
  const reduced = usePrefersReducedMotion();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let done = 0;
    const tasks: Promise<unknown>[] = [
      document.fonts?.ready ?? Promise.resolve(),
      import('@/scenes/HeroScene').catch(() => null),
      new Promise((r) => setTimeout(r, reduced ? 200 : 900)),
    ];
    tasks.forEach((t) => t.then(() => setProgress(Math.round((++done / tasks.length) * 100))));
    const finish = () => setTimeout(() => setLoaded(true), reduced ? 50 : 450);
    const cap = setTimeout(() => { setProgress(100); finish(); }, 4500);
    Promise.all(tasks).then(() => { clearTimeout(cap); finish(); });
    return () => clearTimeout(cap);
  }, [setLoaded, reduced]);

  return (
    <AnimatePresence>
      {!loaded && (
        <motion.div
          key="loader"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-ink"
          exit={{ clipPath: 'inset(0 0 100% 0)' }}
          transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
          role="status"
          aria-live="polite"
          aria-label={`Loading ARJUN, ${progress} percent`}
        >
          <Particles />
          <div className="relative flex overflow-hidden font-display text-[16vw] font-black leading-none tracking-tightest sm:text-[10vw]" aria-hidden>
            {LETTERS.map((l, i) => (
              <motion.span
                key={i}
                className={i === 2 ? 'text-acid' : 'text-bone'}
                initial={{ y: '105%' }}
                animate={{ y: '0%' }}
                transition={{ delay: 0.05 * i, duration: 0.8, ease: [0.2, 0.7, 0.2, 1] }}
              >
                {l}
              </motion.span>
            ))}
          </div>
          <div className="relative mt-8 flex w-[min(320px,70vw)] items-center gap-4">
            <div className="h-px flex-1 bg-line">
              <motion.div className="h-px bg-acid" animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
            </div>
            <span className="w-10 text-right font-mono text-[11px] tabular-nums text-muted">{String(progress).padStart(3, '0')}</span>
          </div>
          <p className="ub-label relative mt-4">Think beyond. Build without limits.</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
