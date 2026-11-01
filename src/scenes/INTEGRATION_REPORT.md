# UNBOUND — 3D Scenes Architecture & Integration Documentation

**Owner:** Agent 2 (Three.js Architect, WebGL Specialist & Interaction Engineer)  
**Collaborating Lead:** Agent 1 (Claude Opus 5.5 — Main React Application Owner)  
**Contract Reference:** `src/scenes/CONTRACT.md` & `src/scenes/types.ts`

---

## 1. Scene Completion & File Ownership Matrix

All five 3D WebGL experiences are implemented inside `src/scenes/**` with zero modifications to Lead-owned files (`src/App.tsx`, `package.json`, `src/styles/**`, `src/components/**`, `src/data/**`, or `src/scenes/types.ts`).

| Experience | Entry Path | Sub-modules | Status |
|---|---|---|---|
| **1. HeroScene** | `src/scenes/HeroScene/index.ts` → `HeroScene.tsx` | `components/HeroSculpture.tsx`, `utils/heroShaders.ts` | Complete |
| **2. SkillsUniverse** | `src/scenes/SkillsUniverse/index.ts` → `SkillsUniverse.tsx` | `Nodes.tsx`, `Connections.tsx`, `ControlsOverlay.tsx`, `positions.ts` | Complete |
| **3. ProjectLab** | `src/scenes/ProjectLab/index.ts` → `ProjectLab.tsx` | `components/WarehouseScene.tsx`, `data/warehouseSimulation.ts` | Complete |
| **4. NeuralNetwork** | `src/scenes/NeuralNetwork/index.ts` → `NeuralNetwork.tsx` | `components/ResNetGraph.tsx`, `utils/networkTopology.ts` | Complete |
| **5. Playground** | `src/scenes/Playground/index.ts` → `Playground.tsx` | `components/PlaygroundStage.tsx`, `utils/playgroundGeometries.ts` | Complete |
| **Shared Utilities** | `src/scenes/shared/` | `cursor.ts`, `StudioEnvironment.tsx` | Complete |

---

## 2. Component Props & Callback Behavior

All five scenes inherit `SceneBaseProps` (`active`, `quality`, `reducedMotion`, `engaged`, `className`) injected automatically by `<SceneFrame>`.

### 2.1 `HeroScene` (`HeroSceneProps`)
- **Props:**
  - `resetSignal: number` — Increments when the external Hero "Reset camera" button is clicked; smoothly resets camera to `[0, 0, 5.2]` and returns sculpture morph state to `01 // HARMONIC GEODESIC`.
  - `secretSignal: number` — Increments when Konami code or `unbound --unleash` fires; toggles high-energy overdrive deformation (`OVERDRIVE // UNLEASHED`).
  - `onInteract?: (type: 'transform' | 'reset' | 'secret') => void` — Notifies the Hero telemetry readout (`STATE TRANSFORM`, `STATE RESET`, `STATE UNLEASHED`).

### 2.2 `SkillsUniverse` (`SkillsUniverseProps`)
- **Props:**
  - `skills: SkillCategory[]` — Data-driven array from `src/data/skills.ts` (no hardcoded proficiency percentages).
  - `onSelectSkill?: (skill: Skill | null) => void` — Invoked whenever a visitor selects or clears a skill node in 3D or via the HUD.

### 2.3 `ProjectLab` (`ProjectLabProps`)
- **Props:**
  - `project: Project` — Receives the `ChainHandler` project record from `src/data/projects.ts`.
  - `onSelectItem?: (item: ProjectLabItem | null) => void` — Invoked when clicking any storage rack (`rack`), supply-chain network hub (`node`), or moving shipment (`shipment`).

### 2.4 `NeuralNetwork` (`NeuralNetworkProps`)
- **Props:**
  - `onNeuronSelect?: (info: NeuronInfo | null) => void` — Invoked when clicking any 3D neuron sphere, passing `{ layerIndex, layerName, neuronIndex, activation }`.

### 2.5 `Playground` (`PlaygroundProps`)
- **Props:** `SceneBaseProps` (`active`, `quality`, `reducedMotion`, `engaged`, `className`).

---

## 3. Performance & Offline Reliability Guarantees

- **Zero External Network Dependencies:** Uses procedural `Lightformer` studio environments (`StudioEnvironment.tsx`) and `@react-three/drei` `<Html>` labels rather than external CDN HDRIs or font files.
- **Offscreen Frame Pausing:** Every `<Canvas>` binds `frameloop={active ? 'always' : 'never'}` so offscreen scenes consume 0% GPU/CPU frame budget.
- **Scroll-Safe Zoom Engagement:** Every `<OrbitControls>` binds `enableZoom={engaged}` so page scrolling with Lenis is never hijacked until the visitor clicks inside the `<SceneFrame>`.
- **Adaptive Quality Tier (`quality === 'low'`):** Automatically lowers DPR (`[1, 1.5]`), reduces subdivision density, disables expensive environment maps, and reduces particle/instance counts on mobile and low-core devices.
