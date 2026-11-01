import { useEffect, useState } from 'react';
import type { SceneQuality } from '@/scenes/types';

const query = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches;

export function useMediaQuery(q: string) {
  const [match, setMatch] = useState(() => query(q));
  useEffect(() => {
    const m = window.matchMedia(q);
    const on = () => setMatch(m.matches);
    on();
    m.addEventListener('change', on);
    return () => m.removeEventListener('change', on);
  }, [q]);
  return match;
}

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
export const useFinePointer = () => useMediaQuery('(hover: hover) and (pointer: fine)');

export type InputMode = 'mouse' | 'touch' | 'hybrid';

/**
 * Detects whether the user is interacting via mouse/trackpad, touch, or a hybrid device.
 */
export function useInputMode(): {
  inputMode: InputMode;
  isTouch: boolean;
  isFinePointer: boolean;
} {
  const fine = useFinePointer();
  const coarse = useMediaQuery('(pointer: coarse)');
  const anyCoarse = useMediaQuery('(any-pointer: coarse)');
  const [lastPointer, setLastPointer] = useState<'mouse' | 'touch' | null>(null);

  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType === 'touch') setLastPointer('touch');
      else if (e.pointerType === 'mouse') setLastPointer('mouse');
    };
    window.addEventListener('pointerdown', onPointer, { passive: true });
    return () => window.removeEventListener('pointerdown', onPointer);
  }, []);

  const inputMode: InputMode =
    fine && anyCoarse
      ? lastPointer ?? 'hybrid'
      : coarse && !fine
      ? 'touch'
      : 'mouse';

  const isTouch = inputMode === 'touch' || (coarse && !fine) || lastPointer === 'touch';

  return {
    inputMode,
    isTouch,
    isFinePointer: fine && lastPointer !== 'touch',
  };
}

let gpuTierCache: 'high' | 'balanced' | 'low' | null = null;

function detectHardwareTier(): SceneQuality {
  if (gpuTierCache !== null) return gpuTierCache;
  if (typeof window === 'undefined') return 'high';

  try {
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const dpr = window.devicePixelRatio || 1;

    const canvas = document.createElement('canvas');
    const gl =
      (canvas.getContext('webgl2') as WebGLRenderingContext | null) ||
      (canvas.getContext('webgl') as WebGLRenderingContext | null);

    let isLowEndGpu = false;
    let isHighEndGpu = false;

    if (gl) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info');
      const renderer = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)).toLowerCase() : '';
      if (/mali-4|mali-t|adreno 3|adreno 4|adreno 50|powervr|intel.*hd graphics [345]/i.test(renderer)) {
        isLowEndGpu = true;
      } else if (/rtx|radeon rx|apple m[1-9]|apple gpu|adreno [678]|mali-g7/i.test(renderer)) {
        isHighEndGpu = true;
      }
    }

    if (isLowEndGpu || cores <= 2 || memory <= 2) {
      gpuTierCache = 'low';
    } else if (isHighEndGpu && cores >= 6 && memory >= 4) {
      // Capable mobile flagships or tablets get 'balanced', desktops get 'high'
      const isSmallScreen = window.innerWidth < 900;
      gpuTierCache = isSmallScreen ? 'balanced' : 'high';
    } else if (cores >= 8 && memory >= 8 && window.innerWidth >= 1024 && dpr <= 2.5) {
      gpuTierCache = 'high';
    } else if (cores >= 4 && memory >= 4) {
      gpuTierCache = 'balanced';
    } else {
      gpuTierCache = 'low';
    }
  } catch {
    gpuTierCache = 'balanced';
  }
  return gpuTierCache;
}

/**
 * Dynamic 3-tier quality hook ('high' | 'balanced' | 'low').
 * Considers GPU capabilities, CPU cores, deviceMemory, DPR, and screen class without
 * unnecessarily degrading capable modern smartphones or tablets.
 */
export function useAdaptiveQuality(): SceneQuality {
  const smallMobile = useMediaQuery('(max-width: 480px)');
  const tabletOrMobile = useMediaQuery('(max-width: 1024px)');
  const reducedMotion = usePrefersReducedMotion();
  const [hwTier, setHwTier] = useState<SceneQuality>(() => detectHardwareTier());

  useEffect(() => {
    setHwTier(detectHardwareTier());
  }, [smallMobile, tabletOrMobile]);

  if (reducedMotion && hwTier === 'low') return 'low';
  if (hwTier === 'low') return 'low';
  if (smallMobile) return hwTier === 'high' ? 'balanced' : hwTier;
  if (tabletOrMobile && hwTier === 'high') return 'balanced';
  return hwTier;
}

/** Backward-compatible alias used across components. */
export function useDeviceQuality(): SceneQuality {
  return useAdaptiveQuality();
}

let webglCache: boolean | null = null;
export function hasWebGL(): boolean {
  if (webglCache !== null) return webglCache;
  try {
    if (new URLSearchParams(window.location.search).has('nowebgl')) return (webglCache = false);
    const c = document.createElement('canvas');
    webglCache = !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    webglCache = false;
  }
  return webglCache;
}
