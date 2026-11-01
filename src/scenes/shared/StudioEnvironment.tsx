import { Environment, Lightformer } from '@react-three/drei';

interface StudioEnvironmentProps {
  preset?: 'acid' | 'studio' | 'mono';
  intensity?: number;
}

/**
 * Offline procedural environment map using Lightformers.
 * Zero external HDRI network fetches, fast initialization, tailored to UNBOUND palette.
 */
export function StudioEnvironment({ preset = 'acid', intensity = 1 }: StudioEnvironmentProps) {
  const accentColor = preset === 'acid' ? '#C5FF55' : preset === 'studio' ? '#9FD4FF' : '#F2F2EA';
  const warmColor = preset === 'studio' ? '#FFB86B' : '#F2F2EA';

  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={['#080A08']} />
      {/* Key overhead softbox */}
      <Lightformer
        form="rect"
        intensity={2.4 * intensity}
        color="#F2F2EA"
        scale={[10, 4, 1]}
        position={[0, 6, 2]}
        rotation={[Math.PI / 2.2, 0, 0]}
      />
      {/* Acid rim strip right */}
      <Lightformer
        form="rect"
        intensity={3.2 * intensity}
        color={accentColor}
        scale={[2.5, 8, 1]}
        position={[6, 2, -3]}
        rotation={[0, -Math.PI / 3, 0]}
      />
      {/* Cool/neutral fill left */}
      <Lightformer
        form="rect"
        intensity={1.6 * intensity}
        color={warmColor}
        scale={[6, 3, 1]}
        position={[-6, -1, 3]}
        rotation={[0, Math.PI / 3, 0]}
      />
      {/* Bottom subtle bounce */}
      <Lightformer
        form="ring"
        intensity={1.1 * intensity}
        color={accentColor}
        scale={[8, 8, 1]}
        position={[0, -6, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      />
    </Environment>
  );
}
