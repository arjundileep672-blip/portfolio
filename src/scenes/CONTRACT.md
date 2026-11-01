# UNBOUND — 3D Integration Contract

Lead architect (Agent 1) ↔ Three.js specialist (Gemini Argon).

## Ownership
| Area | Owner |
|---|---|
| `src/scenes/**` (except `types.ts`) | 3D agent |
| `src/scenes/types.ts` (prop contract) | Lead — change only after messaging lead |
| `package.json`, `src/App.tsx`, `src/styles/**`, `tailwind.config.js`, `src/data/**`, `src/components/**`, `index.html` | Lead |

The 3D agent must NOT edit lead-owned files. Need a dependency? Message the lead.
Already installed: `three@0.170`, `@react-three/fiber@8.17`, `@react-three/drei@9.117`, `react@18.3`, `framer-motion`, `gsap`, `lucide-react`.

## Module shape
Each scene lives in `src/scenes/<Name>/` with `index.ts` doing:
```ts
export { default } from './<Name>';
```
The lead imports with `React.lazy(() => import('@/scenes/<Name>'))` so each scene is its own chunk.

## Who does what at the boundary
`<SceneFrame>` (lead, `src/components/SceneFrame`) wraps every scene and handles:
- lazy loading + Suspense loading state, WebGL detection and static fallback, error boundary;
- visibility (IntersectionObserver) → `active` prop;
- device tier → `quality` prop (`'low'` on touch / small screens / low cores);
- `prefers-reduced-motion` → `reducedMotion` prop;
- **engagement**: user clicks/taps into the frame → `engaged=true`; Esc or pointer leaving → `false`. The frame toggles `data-lenis-prevent` so Lenis doesn't fight OrbitControls.

The scene component handles:
- its own `<Canvas>` filling its parent (`absolute inset-0` / `h-full w-full`); parent is `position: relative` with fixed height;
- `frameloop={active ? 'always' : 'never'}` (or 'demand' when idle);
- `dpr={quality === 'low' ? [1, 1.5] : [1, 2]}`, plus drei `<AdaptiveDpr>` / `PerformanceMonitor` where useful;
- **OrbitControls**: rotate always enabled (mouse drag + one-finger touch); `enableZoom={engaged}`; `enablePan={false}`; sensible min/max distance;
- its own control UI as HTML overlays (absolutely positioned inside the scene root, NOT inside drei `<Html>` unless it's an in-world label) and its own inspector/info panel;
- R3F pointer events (`onPointerOver/Out/onClick`) for raycast selection; set `document.body.style.cursor` or better add `data-cursor="Label"` attribute on the overlay container is not possible for canvas meshes — instead call the optional global helper `window.dispatchEvent(new CustomEvent('unbound:cursor', { detail: 'Inspect' | null }))` on hover in/out. The lead's custom cursor listens for it.
- no hover-only functionality: everything reachable by click/tap too.

## Design tokens (Tailwind classes, already configured)
- Colours: `bg-ink` #080A08, `bg-ink-2` #111411, `bg-ink-3` #181C17, `text-bone` #F2F2EA, `text-acid`/`bg-acid` #C5FF55, `text-muted` #858B80, `border-line` #282D27.
- Fonts: `font-display` (Unbounded), `font-sans` (Inter Tight), `font-mono` (JetBrains Mono).
- Utility classes provided in global CSS: `.ub-btn` (thin-bordered mono uppercase control button, add `aria-pressed` for toggles — pressed state renders acid), `.ub-panel` (bg-ink-2/90, 1px line border, no big radius), `.ub-label` (mono 10–11px uppercase tracking-widest muted), `.ub-range` (styled range input).
- Style: sharp corners (max `rounded-sm`), 1px borders, mono uppercase micro-labels, acid accent used sparingly. No glassmorphism blobs, no gradients.
- 3D palette: background #080A08 (set `<color attach="background">` or transparent canvas – scenes sit on ink), accent light #C5FF55, rim/fill neutral. Fog to #080A08 is welcome.

## Per-scene props (see `src/scenes/types.ts`)
1. **HeroScene** `HeroSceneProps` — full-bleed behind hero typography. Canvas transparent background preferred (hero has its own bg + grain). Lead renders the visible "Reset camera" button and passes `resetSignal`; double-click on object also resets. Click → transform animation; mouse position → deformation (shader / vertex noise); idle → auto animation; `secretSignal` → special animation (e.g. explode into particles and reform). Call `onInteract`. Keep text-side (left ~45% on desktop) visually calm; sculpture weighted to the right on desktop, centred on mobile.
2. **SkillsUniverse** `SkillsUniverseProps` — clusters per category (colour from data), sphere nodes, line connections (category + `related`), hover highlight, click → info panel (name, category, description, related skills — clickable), category filter buttons + "All"/reset button, camera reset. Labels via drei `<Html>` or `<Text>` (Text needs a font fetch — prefer `<Html>` or Text with default font only if it works offline; default drei Text font loads from CDN → avoid). Instancing where possible.
3. **ProjectLab** `ProjectLabProps` — procedural warehouse (building shell, racks, instanced boxes, connected warehouse nodes on a ground "map", moving shipment markers along curves, animated route lines). Click rack/box/shipment/node → inspector panel with `ProjectLabItem` info (descriptive, illustrative — NOT fake real metrics; label them as "simulation"). Panel includes a "Project details" button that shows the project info (title, description, features, stack) and a real link to `project.links.demo.href` (target _blank, rel noopener). Camera reset.
4. **NeuralNetwork** `NeuralNetworkProps` — ResNet-inspired educational net: layers of sphere neurons (instanced), synapse lines, **residual/skip connections drawn as arcs**, signal particles propagating. Controls: Play, Pause, Reset, speed slider, layer selector (focus camera/zoom on a layer), camera reset, "Fire signal" trigger. Hover highlight, click neuron → inspector (layer, index, simulated activation). Visible disclaimer: "Educational visualization — not a trained model running inference."
5. **Playground** `PlaygroundProps` — geometry: torus knot / icosahedron / deformed sphere (noise shader) / particle system; material: standard metal / wireframe / custom shader (e.g. iridescent fresnel) / normal; sliders: rotation speed, deformation; lighting presets (acid / studio / mono); reset. Every control must visibly change the scene.

## Performance budget
- `quality='low'`: ≤ ~30% particle/instance counts, 1–2 lights, no shadows, DPR ≤1.5.
- Dispose of nothing manually unless created imperatively; prefer `useMemo` geometry.
- No external network fetches (HDRIs, fonts). Use drei `<Environment>` with `<Lightformer>` children (procedural, offline) instead of presets that download.
- No console errors/warnings in normal operation.

## Communication
When a scene is done, message the lead with: file paths, final props, any contract deviations, how to test it.
