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

/** Rough device tier: low on coarse pointers, small screens or few cores. */
export function useDeviceQuality(): SceneQuality {
  const small = useMediaQuery('(max-width: 820px)');
  const coarse = useMediaQuery('(pointer: coarse)');
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  return small || coarse || cores <= 4 ? 'low' : 'high';
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
