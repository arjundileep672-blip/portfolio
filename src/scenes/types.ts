/**
 * UNBOUND — Scene integration contract (shared, owned by the lead architect).
 * Changes to this file must be coordinated between the lead and the 3D agent.
 */

export type SceneQuality = 'high' | 'balanced' | 'low';

/** Props every scene receives from <SceneFrame>. */
export interface SceneBaseProps {
  /** true while the scene is on-screen. When false, stop rendering (frameloop="never"). */
  active: boolean;
  /** Adaptive quality tier ('high' | 'balanced' | 'low') based on GPU, DPR, cores, and FPS. */
  quality: SceneQuality;
  /** prefers-reduced-motion: disable idle auto-animation, keep interactions. */
  reducedMotion: boolean;
  /**
   * true after the user clicks/taps into the scene. Wheel/pinch zoom must ONLY be
   * enabled while engaged so the page scroll is never hijacked.
   */
  engaged: boolean;
  className?: string;
}

export type HeroInteraction = 'transform' | 'reset' | 'secret';

export interface HeroSceneProps extends SceneBaseProps {
  /** Increments when the external "Reset camera" button is pressed. React to changes. */
  resetSignal: number;
  /** Increments when an easter egg (Konami code / `unbound --unleash`) fires. */
  secretSignal: number;
  onInteract?: (type: HeroInteraction) => void;
}

export interface SkillsUniverseProps extends SceneBaseProps {
  skills: import('@/data/skills').SkillCategory[];
  onSelectSkill?: (skill: import('@/data/skills').Skill | null) => void;
}

export type SatelliteSensorMode = 'optical' | 'sar' | 'split';

export interface SatelliteLabInspectItem {
  kind: 'region' | 'satellite' | 'agent' | 'evidence';
  id: string;
  title: string;
  subtitle: string;
  coords?: string;
  detail: string;
  metrics?: { label: string; value: string }[];
}

export interface SatelliteLabProps extends SceneBaseProps {
  project: import('@/data/projects').Project;
  onSelectItem?: (item: SatelliteLabInspectItem | null) => void;
}

export interface NeuronInfo {
  layerIndex: number;
  layerName: string;
  neuronIndex: number;
  activation: number;
}

export interface NeuralNetworkProps extends SceneBaseProps {
  onNeuronSelect?: (info: NeuronInfo | null) => void;
}

export type PlaygroundProps = SceneBaseProps;
