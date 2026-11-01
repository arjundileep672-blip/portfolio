import { useEffect, useState, type RefObject } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAdaptiveQuality, useInputMode } from './useDevice';

export interface SceneContainerMetrics {
  width: number;
  height: number;
  aspect: number;
  isPortrait: boolean;
  isSmallMobile: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isCompactLandscape: boolean;
}

/**
 * Observes a scene container element via ResizeObserver + IntersectionObserver + Page Visibility API
 * so off-screen or background-tab 3D scenes pause cleanly and container aspect changes update immediately.
 */
export function useSceneVisibility<T extends HTMLElement>(
  rootMargin = '150px 0px'
): [RefObject<T>, boolean, SceneContainerMetrics] {
  const [el, setEl] = useState<T | null>(null);
  const [inView, setInView] = useState(false);
  const [tabVisible, setTabVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden
  );
  const [metrics, setMetrics] = useState<SceneContainerMetrics>(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    const aspect = w / Math.max(h, 1);
    return {
      width: w,
      height: h,
      aspect,
      isPortrait: aspect < 0.95,
      isSmallMobile: w < 380,
      isMobile: w < 768,
      isTablet: w >= 768 && w < 1024,
      isDesktop: w >= 1024,
      isCompactLandscape: w < 960 && h < 540 && aspect > 1.2,
    };
  });

  const refCallback = useState(() => {
    const refObj = { current: null as T | null };
    return new Proxy(refObj, {
      set(target, prop, value) {
        target[prop as 'current'] = value;
        if (prop === 'current') setEl(value);
        return true;
      },
    });
  })[0];

  useEffect(() => {
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  useEffect(() => {
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    );
    io.observe(el);

    const updateSize = (w: number, h: number) => {
      if (w <= 0 || h <= 0) return;
      const aspect = w / Math.max(h, 1);
      setMetrics({
        width: w,
        height: h,
        aspect,
        isPortrait: aspect < 0.95,
        isSmallMobile: w < 380,
        isMobile: w < 768,
        isTablet: w >= 768 && w < 1024,
        isDesktop: w >= 1024,
        isCompactLandscape: w < 960 && h < 540 && aspect > 1.2,
      });
    };

    updateSize(el.clientWidth, el.clientHeight);

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        updateSize(width, height);
      }
    });
    ro.observe(el);

    return () => {
      io.disconnect();
      ro.disconnect();
    };
  }, [el, rootMargin]);

  return [refCallback, inView && tabVisible, metrics];
}

/**
 * Combined hook for responsive UI & 3D scene orchestration outside/inside Canvas.
 */
export function useResponsiveScene() {
  const quality = useAdaptiveQuality();
  const { inputMode, isTouch, isFinePointer } = useInputMode();
  const [viewport, setViewport] = useState(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      width: w,
      height: h,
      aspect: w / Math.max(h, 1),
      isPortrait: w < h,
      isSmallMobile: w < 380,
      isMobile: w < 768,
      isTablet: w >= 768 && w < 1024,
      isDesktop: w >= 1024,
      isCompactLandscape: w < 960 && h < 540 && w > h,
      dpr:
        quality === 'high'
          ? ([1, 2] as [number, number])
          : quality === 'balanced'
          ? ([1, 1.5] as [number, number])
          : ([1, 1.2] as [number, number]),
    };
  });

  useEffect(() => {
    const onResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setViewport({
        width: w,
        height: h,
        aspect: w / Math.max(h, 1),
        isPortrait: w < h,
        isSmallMobile: w < 380,
        isMobile: w < 768,
        isTablet: w >= 768 && w < 1024,
        isDesktop: w >= 1024,
        isCompactLandscape: w < 960 && h < 540 && w > h,
        dpr:
          quality === 'high'
            ? [1, 2]
            : quality === 'balanced'
            ? [1, 1.5]
            : [1, 1.2],
      });
    };
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [quality]);

  return {
    quality,
    inputMode,
    isTouch,
    isFinePointer,
    ...viewport,
  };
}

export interface ResponsiveCameraConfig {
  /** Base camera position on desktop landscape */
  desktopPos: [number, number, number];
  /** Base lookAt target on desktop */
  desktopTarget?: [number, number, number];
  /** Target offset on portrait mobile (e.g. shifting scene upward above bottom sheets) */
  portraitTarget?: [number, number, number];
  /** Base vertical FOV on desktop */
  baseFov?: number;
  /** Minimum horizontal world span that must fit inside the camera frustum */
  minHorizontalSpan?: number;
}

/**
 * Inside an R3F <Canvas>, dynamically adapts perspective camera FOV, distance, and aspect
 * so that horizontal world span is never cropped on narrow portrait screens or short landscape viewports.
 */
export function useResponsiveCamera({
  desktopPos,
  desktopTarget = [0, 0, 0],
  portraitTarget,
  baseFov = 45,
  minHorizontalSpan = 6.0,
}: ResponsiveCameraConfig) {
  const { size, camera } = useThree();
  const aspect = size.width / Math.max(size.height, 1);
  const isPortrait = aspect < 0.92;
  const isCompactLandscape = size.width < 960 && size.height < 520 && aspect > 1.2;

  const baseVec = new THREE.Vector3(...desktopPos);
  const baseTarget = new THREE.Vector3(...(isPortrait && portraitTarget ? portraitTarget : desktopTarget));
  const baseDist = baseVec.distanceTo(new THREE.Vector3(...desktopTarget));

  // Increase FOV slightly on portrait to reduce excessive pull-back distortion
  const adaptedFov = isPortrait
    ? Math.min(baseFov + 7, 56)
    : isCompactLandscape
    ? Math.min(baseFov + 4, 52)
    : baseFov;

  // Compute required distance so `minHorizontalSpan` fits within the horizontal FOV
  const vFovRad = THREE.MathUtils.degToRad(adaptedFov);
  const hFovTan = Math.tan(vFovRad / 2) * aspect;
  const requiredDistForSpan = (minHorizontalSpan * 0.5) / Math.max(hFovTan, 0.22);

  const effectiveDist = Math.max(baseDist, requiredDistForSpan);
  const distRatio = effectiveDist / Math.max(baseDist, 0.001);

  const adaptedPos = new THREE.Vector3(
    desktopPos[0] * (isPortrait ? 0.75 : 1),
    desktopPos[1] * (isPortrait ? 0.95 : 1) + (isPortrait && portraitTarget ? portraitTarget[1] * 0.5 : 0),
    desktopPos[2] * distRatio
  );

  useEffect(() => {
    if ((camera as THREE.PerspectiveCamera).isPerspectiveCamera) {
      const pCam = camera as THREE.PerspectiveCamera;
      pCam.fov = adaptedFov;
      pCam.aspect = aspect;
      pCam.updateProjectionMatrix();
    }
  }, [camera, adaptedFov, aspect, size.width, size.height]);

  return {
    cameraPos: adaptedPos,
    targetPos: baseTarget,
    fov: adaptedFov,
    aspect,
    isPortrait,
    isMobile: size.width < 768,
    isSmallMobile: size.width < 380,
    isCompactLandscape,
    distRatio,
  };
}

/**
 * Lightweight frame-time monitor inside R3F Canvas that notifies parent if sustained FPS drops.
 */
export function FramePerformanceGuard({
  active,
  onDegrade,
}: {
  active: boolean;
  onDegrade?: () => void;
}) {
  const stateRef = useState(() => ({ slowFrames: 0, degraded: false }))[0];

  useFrame((_, delta) => {
    if (!active || stateRef.degraded || !onDegrade) return;
    // Ignore tab-switch spikes (> 250ms)
    if (delta > 0.25) return;
    if (delta > 0.042) {
      // < ~24 FPS
      stateRef.slowFrames += 1;
      if (stateRef.slowFrames > 45) {
        stateRef.degraded = true;
        onDegrade();
      }
    } else {
      stateRef.slowFrames = Math.max(0, stateRef.slowFrames - 1);
    }
  });

  return null;
}
