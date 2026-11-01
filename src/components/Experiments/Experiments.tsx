import { lazy } from 'react';
import { SectionTag, SplitReveal } from '@/components/ui/Motion';
import { SceneFrame } from '@/components/SceneFrame/SceneFrame';
import type { PlaygroundProps } from '@/scenes/types';

const Playground = lazy(() => import('@/scenes/Playground'));

export function Experiments() {
  return (
    <section id="experiments" aria-labelledby="experiments-title" className="relative border-t border-line py-24 outline-none sm:py-32">
      <div className="section-pad">
        <SectionTag index="05" label="Experiments — scene five" />
        <div className="mt-10 grid gap-8 lg:grid-cols-12 lg:items-end">
          <SplitReveal id="experiments-title" text="A playground for procedural things." className="display-lg lg:col-span-8" />
          <p className="text-[15px] leading-relaxed text-bone/70 lg:col-span-4">
            A creative-coding sandbox. Swap geometry, materials and lighting, bend the surface with noise, and spin it up.
            Every control talks directly to the GPU.
          </p>
        </div>
      </div>
      <div className="section-pad mt-12">
        <SceneFrame<PlaygroundProps>
          scene={Playground}
          sceneProps={{}}
          label="Playground"
          description="A procedural 3D playground: choose between torus knot, icosahedron, deformed sphere and particle geometry, change material and lighting, and adjust rotation speed and deformation."
          fallback={<div className="absolute inset-0 flex items-center justify-center p-8 text-center text-bone/70">The playground needs WebGL, which isn't available in this browser.</div>}
          className="h-[82svh] min-h-[600px] border border-line bg-ink"
        />
      </div>
    </section>
  );
}
