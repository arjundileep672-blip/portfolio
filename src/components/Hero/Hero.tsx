import { lazy, useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import gsap from 'gsap';
import { ArrowDown, ArrowUpRight, RotateCcw } from 'lucide-react';
import { SceneFrame } from '@/components/SceneFrame/SceneFrame';
import { Magnetic } from '@/components/ui/Motion';
import { useUnbound } from '@/context/UnboundContext';
import { site } from '@/data/site';
import type { HeroInteraction, HeroSceneProps } from '@/scenes/types';

const HeroScene = lazy(() => import('@/scenes/HeroScene'));

function HeroFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center lg:justify-end lg:pr-[10vw]" aria-hidden>
      <div className="relative h-[52vmin] w-[52vmin] rounded-full border border-line">
        <div className="absolute inset-[12%] rounded-full border border-acid/40" />
        <div className="absolute inset-[30%] rounded-full bg-acid/10" />
      </div>
    </div>
  );
}

/** Live pointer readout — minimal technical telemetry detail. */
function PointerReadout() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const on = (e: PointerEvent) => {
      if (!ref.current) return;
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = -((e.clientY / innerHeight) * 2 - 1);
      ref.current.textContent = `${x >= 0 ? '+' : ''}${x.toFixed(2)} / ${y >= 0 ? '+' : ''}${y.toFixed(2)}`;
    };
    window.addEventListener('pointermove', on, { passive: true });
    return () => window.removeEventListener('pointermove', on);
  }, []);
  return <span ref={ref} className="tabular-nums">+0.00 / +0.00</span>;
}

export function Hero() {
  const { loaded, heroResetSignal, secretSignal, resetHero, scrollTo } = useUnbound();
  const root = useRef<HTMLElement>(null);
  const [lastAction, setLastAction] = useState<string>('IDLE');
  const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-35%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);

  useEffect(() => {
    if (!loaded || !root.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.from('[data-hero="char"]', { yPercent: 115, duration: 1.4, stagger: 0.045 })
        .from('[data-hero="line"]', { yPercent: 110, opacity: 0, duration: 1.1, stagger: 0.08 }, '-=1.0')
        .from('[data-hero="fade"]', { opacity: 0, y: 14, duration: 0.9, stagger: 0.06 }, '-=0.8')
        .from('[data-hero="rule"]', { scaleX: 0, transformOrigin: 'left', duration: 1.2 }, '-=1.1');
    }, root);
    return () => ctx.revert();
  }, [loaded]);

  const onInteract = (t: HeroInteraction) =>
    setLastAction(t === 'transform' ? 'MORPH' : t === 'reset' ? 'RESET' : 'OVERDRIVE');

  return (
    <section
      id="home"
      ref={root}
      aria-labelledby="hero-title"
      className="relative min-h-[100svh] overflow-hidden bg-ink outline-none lg:h-[100svh] lg:min-h-[640px]"
    >
      {/* Subtle architectural grid + atmospheric backlight glow behind sculpture */}
      <div
        className="grid-lines pointer-events-none absolute inset-0 opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_15%,transparent_70%)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-[4%] top-1/2 h-[54vmin] w-[54vmin] -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(197,255,85,0.11)_0%,rgba(159,212,255,0.05)_42%,transparent_72%)] blur-3xl"
        aria-hidden
      />

      {/* 3D Sculpture Canvas with explicit cross-browser top/bottom mask so rings never collide with navbar */}
      <motion.div
        className="absolute inset-0"
        style={{
          scale: sceneScale,
          maskImage:
            'linear-gradient(to bottom, transparent 0px, transparent 84px, black 175px, black 88%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, transparent 0px, transparent 84px, black 175px, black 88%, transparent 100%)',
        }}
      >
        <SceneFrame<HeroSceneProps>
          scene={HeroScene}
          sceneProps={{ resetSignal: heroResetSignal, secretSignal, onInteract }}
          label="Hero sculpture"
          description="A procedural liquid-chrome sculpture that deforms with your pointer. Drag to rotate, click it to transform, double-click to reset."
          fallback={<HeroFallback />}
          className="h-full w-full"
          hint={false}
        />
      </motion.div>

      {/* Depth-layering vignette behind left-side typography so "ARJUN" ("UN") stays razor-sharp against the 3D scene */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[5] w-full bg-[radial-gradient(ellipse_62%_55%_at_26%_62%,rgba(8,10,8,0.88)_0%,rgba(8,10,8,0.45)_55%,transparent_85%)]"
        aria-hidden
      />

      {/* Editorial Overlay Typography */}
      <motion.div
        style={{ y: textY, opacity: fade }}
        className="pointer-events-none relative z-10 flex min-h-[100svh] flex-col justify-between section-pad pb-6 pt-20 sm:pb-8 sm:pt-24 lg:h-full"
      >
        {/* Minimal Top Status & Telemetry Row */}
        <div className="flex items-center justify-between gap-4">
          <div
            data-hero="fade"
            className="inline-flex items-center gap-2.5 border border-line/70 bg-ink/60 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-bone/80 backdrop-blur-md"
          >
            <span className="h-1.5 w-1.5 shrink-0 animate-pulseDot rounded-full bg-acid" aria-hidden />
            <span>{site.status}</span>
          </div>
          <div
            data-hero="fade"
            className="hidden items-center gap-4 font-mono text-[10px] uppercase tracking-[0.18em] text-muted md:flex"
            aria-hidden
          >
            <PointerReadout />
            <span className="text-line">/</span>
            <span>
              SYS <span className="text-acid">{lastAction}</span>
            </span>
          </div>
        </div>

        {/* Center/Bottom Hero Composition */}
        <div className="mt-12 sm:mt-0">
          <p data-hero="fade" className="ub-label mb-3 tracking-[0.24em] text-bone/70 sm:mb-4">
            {site.creator} &nbsp;—&nbsp; AI/ML &amp; Software Engineering
          </p>

          <h1
            id="hero-title"
            className="display-xl relative select-none lg:text-[clamp(4.5rem,12.2vw,13.6rem)]"
            style={{
              textShadow: '0 6px 28px rgba(8, 10, 8, 0.95), 0 18px 60px rgba(8, 10, 8, 0.85)',
            }}
            aria-label="ARJUN"
          >
            <span className="flex overflow-hidden" aria-hidden>
              {'ARJUN'.split('').map((c, i) => (
                <span
                  key={i}
                  data-hero="char"
                  className={`inline-block ${i === 2 ? 'text-acid drop-shadow-[0_0_28px_rgba(197,255,85,0.28)]' : ''}`}
                >
                  {c}
                </span>
              ))}
            </span>
          </h1>

          <div data-hero="rule" className="my-4 h-px w-full bg-gradient-to-r from-bone/30 via-line to-transparent sm:my-6" aria-hidden />

          <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-6">
            <div className="lg:col-span-6">
              <p className="overflow-hidden font-display text-base font-medium uppercase leading-tight tracking-[-0.02em] text-bone sm:text-2xl">
                <span data-hero="line" className="block">
                  Think beyond. <span className="text-acid">Build without limits.</span>
                </span>
              </p>
              <p data-hero="fade" className="mt-2.5 max-w-md text-sm leading-relaxed text-bone/70 sm:text-[15px]">
                {site.headline}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 lg:col-span-6 lg:justify-end">
              <div data-hero="fade" className="pointer-events-auto w-full sm:w-auto">
                <Magnetic
                  onClick={() => scrollTo('projects')}
                  cursor="Explore"
                  className="group h-11 w-full justify-center gap-3 bg-acid px-5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink shadow-[0_0_25px_rgba(197,255,85,0.22)] transition-shadow hover:shadow-[0_0_35px_rgba(197,255,85,0.4)] sm:h-12 sm:w-auto"
                >
                  Selected Work{' '}
                  <ArrowDown size={14} className="transition-transform group-hover:translate-y-0.5" aria-hidden />
                </Magnetic>
              </div>
              <div data-hero="fade" className="pointer-events-auto flex-1 sm:flex-initial">
                <Magnetic
                  onClick={() => scrollTo('contact')}
                  cursor="Say hi"
                  className="group h-11 w-full justify-center gap-3 border border-bone/25 bg-ink/70 px-4 font-mono text-xs uppercase tracking-[0.14em] backdrop-blur-md hover:border-bone sm:h-12 sm:w-auto sm:px-5"
                >
                  Contact{' '}
                  <ArrowUpRight
                    size={14}
                    className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Magnetic>
              </div>
              <div data-hero="fade" className="pointer-events-auto">
                <button
                  type="button"
                  onClick={resetHero}
                  className="ub-btn h-11 bg-ink/70 px-3 backdrop-blur-md sm:h-12"
                  aria-label="Reset 3D camera"
                  data-cursor="Reset"
                >
                  <RotateCcw size={13} aria-hidden />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between sm:mt-7">
            <button
              type="button"
              data-hero="fade"
              onClick={() => scrollTo('about')}
              className="pointer-events-auto group flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted hover:text-bone"
              aria-label="Scroll to About section"
            >
              <span className="relative block h-7 w-[1px] overflow-hidden bg-line">
                <span className="absolute left-0 top-0 h-2.5 w-full animate-[scrollcue_1.8s_ease-in-out_infinite] bg-acid" />
              </span>
              Scroll
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
