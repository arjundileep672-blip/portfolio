import { useEffect, useRef, useState } from 'react';
import { useFinePointer, usePrefersReducedMotion } from '@/hooks/useDevice';

/**
 * Desktop-only cursor: dot + lagging ring with contextual labels.
 * Label sources: [data-cursor] attributes, links/buttons, and the
 * `unbound:cursor` CustomEvent dispatched by 3D scenes.
 */
export function Cursor() {
  const fine = useFinePointer();
  const reduced = usePrefersReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [hover, setHover] = useState(false);
  const [sceneLabel, setSceneLabel] = useState<string | null>(null);
  const [down, setDown] = useState(false);

  useEffect(() => {
    if (!fine) return;
    document.documentElement.classList.add('has-cursor');
    const pos = { x: innerWidth / 2, y: innerHeight / 2 };
    const ringPos = { ...pos };
    let raf = 0;
    let visible = false;

    const move = (e: PointerEvent) => {
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!visible) {
        visible = true;
        ringPos.x = pos.x;
        ringPos.y = pos.y;
        dot.current?.style.setProperty('opacity', '1');
        ring.current?.style.setProperty('opacity', '1');
      }
      const t = e.target as HTMLElement | null;
      const el = t?.closest?.('[data-cursor], a, button, input, select, textarea, [role="button"]') as HTMLElement | null;
      setHover(!!el);
      setLabel(el?.dataset.cursor ?? null);
    };
    const loop = () => {
      const k = reduced ? 1 : 0.18;
      ringPos.x += (pos.x - ringPos.x) * k;
      ringPos.y += (pos.y - ringPos.y) * k;
      if (dot.current) dot.current.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
      raf = requestAnimationFrame(loop);
    };
    const leave = () => {
      visible = false;
      dot.current?.style.setProperty('opacity', '0');
      ring.current?.style.setProperty('opacity', '0');
    };
    const onScene = (e: Event) => setSceneLabel((e as CustomEvent<string | null>).detail ?? null);
    const pd = () => setDown(true);
    const pu = () => setDown(false);

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', pd);
    window.addEventListener('pointerup', pu);
    document.addEventListener('mouseleave', leave);
    window.addEventListener('unbound:cursor', onScene);
    raf = requestAnimationFrame(loop);
    return () => {
      document.documentElement.classList.remove('has-cursor');
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', pd);
      window.removeEventListener('pointerup', pu);
      document.removeEventListener('mouseleave', leave);
      window.removeEventListener('unbound:cursor', onScene);
    };
  }, [fine, reduced]);

  if (!fine) return null;
  const text = sceneLabel ?? label;
  const big = !!text || hover;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[200]">
      <div ref={dot} className="absolute left-0 top-0 opacity-0">
        <div className="-ml-[3px] -mt-[3px] h-[6px] w-[6px] bg-acid" />
      </div>
      <div ref={ring} className="absolute left-0 top-0 opacity-0">
        <div
          className={`flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-[width,height,background-color,border-color] duration-300 ease-out ${
            text ? 'h-16 w-16 border-acid bg-acid' : big ? 'h-12 w-12 border-bone/70' : 'h-8 w-8 border-bone/30'
          } ${down ? 'scale-90' : ''}`}
        >
          {text && <span className="px-1 text-center font-mono text-[9px] font-medium uppercase leading-tight tracking-wider text-ink">{text}</span>}
        </div>
      </div>
    </div>
  );
}
