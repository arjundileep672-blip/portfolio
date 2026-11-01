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

/** Live pointer readout — small cursor-responsive technical detail. */
function PointerReadout() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const on = (e: PointerEvent) => {
      if (!ref.current) return;
      const x = (e.clientX / innerWidth) * 2 - 1;
      const y = -((e.clientY / innerHeight) * 2 - 1);
      ref.current.textContent = `X ${x >= 0 ? '+' : ''}${x.toFixed(3)}  Y ${y >= 0 ? '+' : ''}${y.toFixed(3)}`;
    };
    window.addEventListener('pointermove', on, { passive: true });
    return () => window.removeEventListener('pointermove', on);
  }, []);
  return <span ref={ref} className="tabular-nums">X +0.000  Y +0.000</span>;
}

export function Hero() {
  const { loaded, heroResetSignal, secretSignal, resetHero, scrollTo } = useUnbound();
  const root = useRef<HTMLElement>(null);
  const [lastAction, setLastAction] = useState<string>('IDLE');
  const { scrollYProgress } = useScroll({ target: root, offset: ['start start', 'end start'] });
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '-35%']);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const sceneScale = useTransform(scrollYProgress, [0, 1], [1, 0.86]);

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

  const onInteract = (t: HeroInteraction) => setLastAction(t === 'transform' ? 'TRANSFORM' : t === 'reset' ? 'RESET' : 'UNLEASHED');

  return (
    <section id="home" ref={root} aria-labelledby="hero-title" className="relative min-h-[100svh] overflow-hidden bg-ink outline-none lg:h-[100svh] lg:min-h-[640px]">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" aria-hidden />

      <motion.div className="absolute inset-0" style={{ scale: sceneScale }}>
        <SceneFrame<HeroSceneProps>
          scene={HeroScene}
          sceneProps={{ resetSignal: heroResetSignal, secretSignal, onInteract }}
          label="Hero sculpture"
          description="A procedural metallic sculpture that deforms with your pointer. Drag to rotate, click it to transform, double-click to reset. Click once to enable scroll zoom."
          fallback={<HeroFallback />}
          className="h-full w-full"
          hint={false}
        />
      </motion.div>

      {/* Overlay typography — pointer-events pass through to the canvas except on controls */}
      <motion.div style={{ y: textY, opacity: fade }} className="pointer-events-none relative z-10 flex min-h-[100svh] flex-col justify-between section-pad pb-6 pt-20 sm:pb-8 sm:pt-28 lg:h-full">
        <div className="flex items-start justify-between gap-4">
          <div data-hero="fade" className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-muted sm:text-[11px] sm:tracking-[0.18em]">
            <span className="h-1.5 w-1.5 shrink-0 animate-pulseDot rounded-full bg-acid" aria-hidden />
            <span className="line-clamp-1">{site.status}</span>
          </div>
          <div data-hero="fade" className="hidden text-right font-mono text-[10px] uppercase leading-relaxed tracking-[0.18em] text-muted md:block" aria-hidden>
            <div>SYS/ARJUN v1.0</div>
            <PointerReadout />
            <div>STATE <span className="text-acid">{lastAction}</span></div>
          </div>
        </div>

        <div className="mt-12 sm:mt-0">
          <p data-hero="fade" className="ub-label mb-3 max-w-[36ch] sm:mb-6">
            AI/ML Engineering &nbsp;·&nbsp; Software Engineering &nbsp;·&nbsp; Research
          </p>
          <h1 id="hero-title" className="display-xl select-none" aria-label="ARJUN">
            <span className="flex overflow-hidden" aria-hidden>
              {'ARJUN'.split('').map((c, i) => (
                <span key={i} data-hero="char" className={`inline-block ${i === 2 ? 'text-acid' : ''}`}>{c}</span>
              ))}
            </span>
          </h1>
          <div data-hero="rule" className="my-4 h-px w-full bg-line sm:my-7" aria-hidden />

          <div className="grid gap-5 lg:grid-cols-12 lg:items-end lg:gap-6">
            <div className="lg:col-span-5">
              <p className="overflow-hidden font-display text-base font-medium uppercase leading-tight tracking-[-0.02em] sm:text-2xl">
                <span data-hero="line" className="block">Think beyond.</span>
              </p>
              <p className="overflow-hidden font-display text-base font-medium uppercase leading-tight tracking-[-0.02em] text-acid sm:text-2xl">
                <span data-hero="line" className="block">Build without limits.</span>
              </p>
              <p data-hero="fade" className="mt-3 max-w-md text-sm leading-relaxed text-bone/75 sm:mt-4 sm:text-[15px]">
                <span className="text-bone">{site.headline}</span> {site.intro}
              </p>
              <p data-hero="fade" className="ub-label mt-2.5 sm:mt-3">Created by {site.creator}.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 lg:col-span-7 lg:justify-end">
              <div data-hero="fade" className="pointer-events-auto w-full sm:w-auto">
                <Magnetic onClick={() => scrollTo('projects')} cursor="Explore" className="group h-11 w-full justify-center gap-3 bg-acid px-5 font-mono text-xs font-medium uppercase tracking-[0.14em] text-ink sm:h-12 sm:w-auto">
                  Explore my work <ArrowDown size={14} className="transition-transform group-hover:translate-y-0.5" aria-hidden />
                </Magnetic>
              </div>
              <div data-hero="fade" className="pointer-events-auto flex-1 sm:flex-initial">
                <Magnetic onClick={() => scrollTo('contact')} cursor="Say hi" className="group h-11 w-full justify-center gap-3 border border-bone/30 px-4 font-mono text-xs uppercase tracking-[0.14em] hover:border-bone sm:h-12 sm:w-auto sm:px-5">
                  Get in touch <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </Magnetic>
              </div>
              <div data-hero="fade" className="pointer-events-auto">
                <button type="button" onClick={resetHero} className="ub-btn h-11 px-3 sm:h-12" aria-label="Reset 3D camera" data-cursor="Reset">
                  <RotateCcw size={13} aria-hidden /> <span className="hidden xs:inline sm:inline">Reset camera</span>
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between sm:mt-8">
            <button
              type="button"
              data-hero="fade"
              onClick={() => scrollTo('about')}
              className="pointer-events-auto group flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted hover:text-bone"
              aria-label="Scroll to About section"
            >
              <span className="relative block h-9 w-[1px] overflow-hidden bg-line">
                <span className="absolute left-0 top-0 h-3 w-full animate-[scrollcue_1.8s_ease-in-out_infinite] bg-acid" />
              </span>
              Scroll
            </button>
            <p data-hero="fade" className="ub-label hidden text-right sm:block" aria-hidden>
              Drag · Click · Double-click · Move
            </p>
          </div>
        </div>
      </motion.div>
      <style>{`@keyframes scrollcue{0%{transform:translateY(-100%)}100%{transform:translateY(300%)}}`}</style>
    </section>
  );
}
