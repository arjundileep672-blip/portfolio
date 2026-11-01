import { Component, Suspense, useCallback, useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { MousePointerClick, X } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { hasWebGL, useDeviceQuality, usePrefersReducedMotion } from '@/hooks/useDevice';
import type { SceneBaseProps } from '@/scenes/types';

class SceneErrorBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(err: unknown) {
    console.warn('[UNBOUND] scene failed, showing fallback', err);
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
 * Wraps a lazily-loaded 3D scene: visibility, quality tier, reduced motion,
 * engagement (wheel zoom only after click), WebGL fallback and errors.
 */
export function SceneFrame<P extends SceneBaseProps>({
  scene: Scene, sceneProps, label, description, fallback, className = '', hint = true, keepMounted = true,
}: SceneFrameProps<P>) {
  const [ref, inView] = useInView<HTMLDivElement>('150px 0px');
  const [mounted, setMounted] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const quality = useDeviceQuality();
  const reducedMotion = usePrefersReducedMotion();
  const [webgl] = useState(hasWebGL);

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

  const engage = useCallback(() => setEngaged(true), []);

  const props = { ...sceneProps, active: inView, quality, reducedMotion, engaged } as unknown as P;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      onPointerDown={engage}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setEngaged(false)}
      data-lenis-prevent={engaged ? '' : undefined}
      data-engaged={engaged}
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
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-20 -translate-x-1/2">
          {engaged ? (
            <button
              type="button"
              className="ub-btn pointer-events-auto !min-h-[32px] !py-1 text-acid"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setEngaged(false)}
            >
              <X size={12} aria-hidden /> Zoom on · Esc to release
            </button>
          ) : (
            <span className="ub-label flex items-center gap-2 bg-ink/70 px-2 py-1">
              <MousePointerClick size={12} aria-hidden /> Drag to rotate · click to enable zoom
            </span>
          )}
        </div>
      )}
    </div>
  );
}
