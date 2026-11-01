import { Component, Suspense, useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { Hand, MousePointerClick, X } from 'lucide-react';
import { hasWebGL, useAdaptiveQuality, useInputMode, usePrefersReducedMotion } from '@/hooks/useDevice';
import { useSceneVisibility } from '@/hooks/useResponsiveScene';
import type { SceneBaseProps, SceneQuality } from '@/scenes/types';

class SceneErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn('[ARJUN] scene failed, showing fallback', err);
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export function SceneLoading({ label }: { label: string }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center" role="status" aria-live="polite">
      <div className="flex flex-col items-center gap-3">
        <div className="relative h-px w-28 overflow-hidden bg-line">
          <span className="absolute inset-y-0 left-0 w-1/3 animate-[marquee_1.2s_linear_infinite] bg-acid" />
        </div>
        <span className="ub-label">Initialising {label}</span>
      </div>
    </div>
  );
}

type SceneProps<P> = Omit<P, keyof SceneBaseProps>;

interface SceneFrameProps<P extends SceneBaseProps> {
  scene: ComponentType<P>;
  sceneProps: SceneProps<P>;
  label: string;
  /** Accessible description of what the 3D scene shows. */
  description: string;
  /** Rendered when WebGL is unavailable or the scene crashes. */
  fallback: ReactNode;
  className?: string;
  /** Hero is always engaged-able without the hint chrome. */
  hint?: boolean;
  /** Keep mounted even when off-screen (only pause). Default true. */
  keepMounted?: boolean;
}

/**
 * Wraps a lazily-loaded 3D scene: visibility (IntersectionObserver + ResizeObserver + Page Visibility),
 * 3-tier adaptive quality ('high' | 'balanced' | 'low'), reduced motion, input mode (mouse vs touch),
 * engagement (wheel/pinch zoom & touch rotation lock), WebGL fallback and errors.
 */
export function SceneFrame<P extends SceneBaseProps>({
  scene: Scene,
  sceneProps,
  label,
  description,
  fallback,
  className = '',
  hint = true,
  keepMounted = true,
}: SceneFrameProps<P>) {
  const [ref, inView] = useSceneVisibility<HTMLDivElement>('150px 0px');
  const [mounted, setMounted] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const baseQuality = useAdaptiveQuality();
  const [degradedQuality, setDegradedQuality] = useState<SceneQuality | null>(null);
  const { isFinePointer } = useInputMode();
  const reducedMotion = usePrefersReducedMotion();
  const [webgl] = useState(hasWebGL);

  const quality: SceneQuality = degradedQuality ?? baseQuality;

  useEffect(() => {
    setDegradedQuality(null);
  }, [baseQuality]);

  useEffect(() => {
    if (inView) setMounted(true);
    else if (!keepMounted) setMounted(false);
    if (!inView) setEngaged(false);
  }, [inView, keepMounted]);

  useEffect(() => {
    if (!engaged) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setEngaged(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [engaged]);

  const engageOnMouse = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') setEngaged(true);
  }, []);

  const touchLocked = !isFinePointer && !engaged;
  const props = { ...sceneProps, active: inView, quality, reducedMotion, engaged } as unknown as P;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onPointerDown={engageOnMouse}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setEngaged(false)}
      data-lenis-prevent={engaged ? '' : undefined}
      data-engaged={engaged}
      data-touch-locked={touchLocked ? 'true' : 'false'}
      data-quality={quality}
      role="group"
      aria-label={`${label} — interactive 3D scene`}
      aria-describedby={`${label.replace(/\W+/g, '-')}-desc`}
    >
      <p id={`${label.replace(/\W+/g, '-')}-desc`} className="sr-only">{description}</p>
      {!webgl ? (
        fallback
      ) : (
        <SceneErrorBoundary fallback={fallback}>
          {mounted ? (
            <Suspense fallback={<SceneLoading label={label} />}>
              <Scene {...props} />
            </Suspense>
          ) : (
            <SceneLoading label={label} />
          )}
        </SceneErrorBoundary>
      )}
      {webgl && hint && (
        <div className="pointer-events-none absolute bottom-2.5 left-1/2 z-30 -translate-x-1/2 sm:bottom-3">
          {engaged ? (
            <button
              type="button"
              className="ub-btn pointer-events-auto min-h-[44px] border-acid bg-ink/95 px-3.5 py-1.5 text-[10px] text-acid shadow-lg sm:min-h-[34px] sm:px-3 sm:py-1"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setEngaged(false)}
            >
              <X size={13} aria-hidden />{' '}
              {isFinePointer ? 'Zoom active · Esc to release' : 'Done 3D · Resume page scroll'}
            </button>
          ) : isFinePointer ? (
            <span className="ub-label flex items-center gap-2 border border-line/60 bg-ink/80 px-2.5 py-1 backdrop-blur-sm">
              <MousePointerClick size={12} className="text-acid" aria-hidden /> Drag to rotate · click to enable zoom
            </span>
          ) : (
            <button
              type="button"
              className="ub-btn pointer-events-auto min-h-[44px] border-acid/60 bg-ink/90 px-3.5 py-1.5 text-[10px] text-bone shadow-lg backdrop-blur-sm"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setEngaged(true)}
            >
              <Hand size={13} className="text-acid" aria-hidden /> Tap to interact 3D (drag · pinch · select)
            </button>
          )}
        </div>
      )}
    </div>
  );
}
