import type { SatelliteLabInspectItem } from '@/scenes/types';

export interface SatelliteModelData {
  id: string;
  code: string;
  name: string;
  sensorType: 'Optical Multispectral' | 'C-Band / L-Band SAR' | 'Dual-Band Multimodal';
  orbitRadius: number;
  inclinationDeg: number;
  ascNodeDeg: number;
  speed: number;
  initialPhase: number;
  altitudeKm: string;
  swathKm: string;
  color: string;
  summary: string;
  capabilities: string[];
}

export interface GeoRegionData {
  id: string;
  code: string;
  name: string;
  lat: number;
  lon: number;
  coordsLabel: string;
  biome: string;
  naturalQuery: string;
  opticalAnalysis: string;
  sarAnalysis: string;
  explainabilityNote: string;
  /** Simulated procedural tile pattern seed & parameters for the Optical/SAR comparison view */
  tileSeed: number;
  landCoverBreakdown: { label: string; category: string }[];
  evidenceBoxes: {
    id: string;
    label: string;
    x: number; // percentage 0..100
    y: number;
    w: number;
    h: number;
    modality: 'Optical' | 'SAR' | 'Fused';
    rationale: string;
  }[];
}

export interface AgentNodeData {
  id: string;
  step: number;
  label: string;
  shortLabel: string;
  role: string;
  inputs: string;
  outputs: string;
  description: string;
  position: [number, number, number];
}

export const SATELLITES_DATA: SatelliteModelData[] = [
  {
    id: 'sat-opt-01',
    code: 'EOS-OPT // 01',
    name: 'Multispectral Optical Orbiter (Simulated)',
    sensorType: 'Optical Multispectral',
    orbitRadius: 2.35,
    inclinationDeg: 52,
    ascNodeDeg: 25,
    speed: 0.24,
    initialPhase: 0.2,
    altitudeKm: '~620 km Sun-Synchronous (Illustrative)',
    swathKm: '140 km Swath',
    color: '#C5FF55',
    summary:
      'Simulated optical Earth-observation platform capturing visible and near-infrared (VNIR) bands for land-use, vegetation vigor, and urban footprint analysis.',
    capabilities: [
      'True-color & false-color composite rendering (Simulated)',
      'Vegetation canopy vs. built-up surface separation',
      'Surface water boundary delineation under cloud-free conditions',
    ],
  },
  {
    id: 'sat-sar-02',
    code: 'EOS-SAR // 02',
    name: 'Synthetic Aperture Radar Orbiter (Simulated)',
    sensorType: 'C-Band / L-Band SAR',
    orbitRadius: 2.52,
    inclinationDeg: -64,
    ascNodeDeg: 115,
    speed: 0.19,
    initialPhase: 2.1,
    altitudeKm: '~690 km Polar Orbit (Illustrative)',
    swathKm: '250 km Interferometric Swath',
    color: '#9FD4FF',
    summary:
      'Simulated active microwave radar platform capable of day-and-night, all-weather surface imaging through cloud cover using backscatter intensity and roughness.',
    capabilities: [
      'All-weather cloud-penetrating backscatter imagery (Simulated)',
      'Specular water surface vs. high-return urban corner reflection detection',
      'Terrain roughness and moisture structural contrast',
    ],
  },
  {
    id: 'sat-fuz-03',
    code: 'SATQUERY-LINK // 03',
    name: 'Tasking & Downlink Relay Node (Simulated)',
    sensorType: 'Dual-Band Multimodal',
    orbitRadius: 2.68,
    inclinationDeg: 28,
    ascNodeDeg: 210,
    speed: 0.15,
    initialPhase: 4.0,
    altitudeKm: '~780 km Low-Inclination (Illustrative)',
    swathKm: 'Regional Co-Registration Link',
    color: '#F2F2EA',
    summary:
      'Simulated orbital relay aligning optical spectral frames with SAR backscatter scenes for multimodal VQA query co-registration.',
    capabilities: [
      'Spatiotemporal alignment of Optical + SAR passes',
      'Region-of-interest (ROI) patch extraction for VLM adapters',
      'Geospatial metadata & solar/incidence angle tagging',
    ],
  },
];

export const GEO_REGIONS_DATA: GeoRegionData[] = [
  {
    id: 'roi-delta',
    code: 'ROI-01 // DELTA',
    name: 'Coastal Estuarine & River Delta',
    lat: 21.95,
    lon: 88.85,
    coordsLabel: '21.95° N, 88.85° E',
    biome: 'Estuarine Wetland / Mangrove & Tidal Channels',
    naturalQuery:
      '"Compare the tidal channel boundaries and surrounding mangrove cover across optical and SAR observations."',
    opticalAnalysis:
      'Simulated Optical View: Highlights chlorophyll-rich mangrove canopy in spectral green/NIR and suspended sediment plumes along estuarine channels, though partial cloud haze can obscure fine bank edges.',
    sarAnalysis:
      'Simulated SAR View: Calm water channels act as specular reflectors (appearing dark with low backscatter), while dense mangrove structure produces volume scattering, cleanly separating land-water boundaries through cloud cover.',
    explainabilityNote:
      'Illustrative XAI Attribution: VLM attention concentrates on the high-contrast SAR land-water boundary and optical vegetation patches to ground the natural-language answer.',
    tileSeed: 101,
    landCoverBreakdown: [
      { label: 'Tidal Channels & Estuarine Water', category: 'Specular / Low Backscatter' },
      { label: 'Mangrove & Riparian Vegetation', category: 'High NIR / Volume Scatter' },
      { label: 'Alluvial Sediment Banks', category: 'Moderate Surface Return' },
    ],
    evidenceBoxes: [
      {
        id: 'ev-delta-1',
        label: 'Channel Bifurcation Zone',
        x: 18,
        y: 24,
        w: 34,
        h: 42,
        modality: 'SAR',
        rationale: 'Illustrative SAR evidence: Specular dark return delineates water channel geometry beneath atmospheric haze.',
      },
      {
        id: 'ev-delta-2',
        label: 'Dense Mangrove Canopy',
        x: 56,
        y: 30,
        w: 30,
        h: 46,
        modality: 'Optical',
        rationale: 'Illustrative Optical evidence: Spectral vegetation response confirms intact canopy along the eastern bank.',
      },
    ],
  },
  {
    id: 'roi-urban',
    code: 'ROI-02 // METRO',
    name: 'Metropolitan Urban & Industrial Corridor',
    lat: 12.97,
    lon: 77.59,
    coordsLabel: '12.97° N, 77.59° E',
    biome: 'High-Density Built-Up / Infrastructure Grid',
    naturalQuery:
      '"Identify dense built-up infrastructure clusters and adjacent water reservoirs in this corridor."',
    opticalAnalysis:
      'Simulated Optical View: Resolves roof material variations, road networks, vegetated urban parks, and reservoir surface color.',
    sarAnalysis:
      'Simulated SAR View: Orthogonal building facades and metallic structures create strong double-bounce corner reflections (bright high-backscatter clusters), contrasting sharply with flat highway corridors and reservoir surfaces.',
    explainabilityNote:
      'Illustrative XAI Attribution: Multi-agent pipeline fuses SAR double-bounce clusters with optical road/park polygons to verify built-up density.',
    tileSeed: 204,
    landCoverBreakdown: [
      { label: 'Built-Up & Industrial Grid', category: 'Double-Bounce Bright SAR' },
      { label: 'Urban Green Belts', category: 'Optical Vegetation Signature' },
      { label: 'Retention Reservoirs', category: 'Low-Return Smooth Surface' },
    ],
    evidenceBoxes: [
      {
        id: 'ev-urban-1',
        label: 'High-Density Structural Core',
        x: 28,
        y: 20,
        w: 42,
        h: 45,
        modality: 'Fused',
        rationale: 'Illustrative Fused evidence: High SAR corner-reflector intensity aligned with optical impervious surface mask.',
      },
      {
        id: 'ev-urban-2',
        label: 'Western Reservoir Basin',
        x: 12,
        y: 55,
        w: 24,
        h: 30,
        modality: 'SAR',
        rationale: 'Illustrative SAR evidence: Smooth water surface boundary verified via low radar backscatter.',
      },
    ],
  },
  {
    id: 'roi-alpine',
    code: 'ROI-03 // HIGHLAND',
    name: 'High-Altitude Glacial & Ridge Basin',
    lat: 32.24,
    lon: 77.18,
    coordsLabel: '32.24° N, 77.18° E',
    biome: 'Alpine Ridge / Glacial Valley & Moraine',
    naturalQuery:
      '"Analyze valley ridge topography and surface roughness along the high-altitude drainage basin."',
    opticalAnalysis:
      'Simulated Optical View: Captures high-albedo snow/ice cover and sunlit vs. shadowed valley slopes.',
    sarAnalysis:
      'Simulated SAR View: Side-looking radar geometry highlights ridge foreshortening, slope orientation, and surface roughness variations across moraine deposits independent of solar illumination.',
    explainabilityNote:
      'Illustrative XAI Attribution: Evidence normalizer cross-checks optical albedo with SAR backscatter texture to distinguish cloud tops from surface snow.',
    tileSeed: 309,
    landCoverBreakdown: [
      { label: 'High-Albedo Ridge Crest', category: 'Optical Bright / Steep Slope' },
      { label: 'Glacial Moraine & Talus', category: 'High Roughness Backscatter' },
      { label: 'Valley Meltwater Conduit', category: 'Incised Linear Feature' },
    ],
    evidenceBoxes: [
      {
        id: 'ev-alpine-1',
        label: 'Ridge Foreshortening Crest',
        x: 22,
        y: 18,
        w: 48,
        h: 34,
        modality: 'SAR',
        rationale: 'Illustrative SAR evidence: Radar incidence gradient captures structural ridge orientation.',
      },
      {
        id: 'ev-alpine-2',
        label: 'Valley Floor Moraine Zone',
        x: 35,
        y: 56,
        w: 38,
        h: 28,
        modality: 'Optical',
        rationale: 'Illustrative Optical evidence: Spectral contrast separates rock debris from snowpack.',
      },
    ],
  },
  {
    id: 'roi-agri',
    code: 'ROI-04 // AGRI-PLAINS',
    name: 'Irrigated Agricultural & Canal Plains',
    lat: 30.9,
    lon: 75.85,
    coordsLabel: '30.90° N, 75.85° E',
    biome: 'Parcel-Grid Cropland & Canal Network',
    naturalQuery:
      '"Assess parcel-level vegetation patterns and irrigation canal distribution across the agricultural plains."',
    opticalAnalysis:
      'Simulated Optical View: Clearly distinguishes crop phenology stages across rectilinear field parcels and tree-lined canal embankments.',
    sarAnalysis:
      'Simulated SAR View: Sensitive to dielectric soil moisture variations and crop canopy structure across tilled vs. vegetated parcels.',
    explainabilityNote:
      'Illustrative XAI Attribution: Planner chains Optical VQA parcel segmentation with SAR surface roughness cues for explainable land-use reporting.',
    tileSeed: 418,
    landCoverBreakdown: [
      { label: 'Vegetated Crop Parcels', category: 'Structured Grid / High NIR' },
      { label: 'Fallow / Tilled Soil Fields', category: 'Dielectric Moisture Return' },
      { label: 'Irrigation Canal Corridor', category: 'Linear Hydrological Feature' },
    ],
    evidenceBoxes: [
      {
        id: 'ev-agri-1',
        label: 'Irrigated Parcel Matrix',
        x: 16,
        y: 22,
        w: 44,
        h: 52,
        modality: 'Optical',
        rationale: 'Illustrative Optical evidence: Rectilinear field boundaries with strong chlorophyll reflectance.',
      },
      {
        id: 'ev-agri-2',
        label: 'Primary Canal Alignment',
        x: 62,
        y: 16,
        w: 24,
        h: 64,
        modality: 'Fused',
        rationale: 'Illustrative Fused evidence: Co-registered linear water channel and embankment corridor.',
      },
    ],
  },
];

/**
 * 10-Stage Multi-Agent Processing Pipeline for SATQUERY AI:
 * React WebGIS → FastAPI → Planner → Tool Registry → VQA / Image Processing
 * → VLM Adapter → Evidence Normalization → Structured Result → Trace → UI
 */
export const AGENT_PIPELINE_DATA: AgentNodeData[] = [
  {
    id: 'agent-01-webgis',
    step: 1,
    label: 'React WebGIS',
    shortLabel: '01 · WebGIS',
    role: 'Geospatial Query & ROI Selection Interface',
    inputs: 'User natural-language prompt + bounding box / coordinates + sensor layer selection',
    outputs: 'GeoJSON ROI payload + query context to FastAPI gateway',
    description:
      'Interactive map and globe workspace where the user selects a geographic region, toggles Optical/SAR layers, and submits a natural-language question.',
    position: [-4.5, 1.35, 0.4],
  },
  {
    id: 'agent-02-fastapi',
    step: 2,
    label: 'FastAPI',
    shortLabel: '02 · FastAPI',
    role: 'Asynchronous API Gateway & Session Orchestrator',
    inputs: 'GeoJSON ROI + natural-language prompt + sensor modality flags',
    outputs: 'Validated task envelope dispatched to the Agentic Planner',
    description:
      'Backend service layer handling request validation, scene tile metadata lookup, and streaming execution trace updates back to the client.',
    position: [-3.5, 1.85, -0.35],
  },
  {
    id: 'agent-03-planner',
    step: 3,
    label: 'Planner',
    shortLabel: '03 · Planner',
    role: 'Multi-Step Geospatial Reasoning & Task Decomposition',
    inputs: 'Validated query envelope + available sensor modalities (Optical / SAR)',
    outputs: 'Directed acyclic execution plan of vision and geospatial tool calls',
    description:
      'Decomposes complex Earth-observation questions into ordered sub-tasks (e.g., fetch optical patch, compute SAR backscatter mask, run VQA comparison).',
    position: [-2.5, 1.4, -0.9],
  },
  {
    id: 'agent-04-registry',
    step: 4,
    label: 'Tool Registry',
    shortLabel: '04 · Tool Registry',
    role: 'Typed Remote-Sensing & Vision Tool Catalog',
    inputs: 'Symbolic tool invocation requests from Planner',
    outputs: 'Bound tool executors with schema-checked parameters',
    description:
      'Maintains deterministic interfaces for image cropping, coordinate projection, spectral index helpers, SAR despeckling filters, and VQA adapters.',
    position: [-1.5, 1.95, -1.2],
  },
  {
    id: 'agent-05-vqa',
    step: 5,
    label: 'VQA / Image Processing',
    shortLabel: '05 · VQA / ImgProc',
    role: 'Optical & SAR Patch Extraction and Feature Pre-Processing',
    inputs: 'Co-registered Optical & SAR scene patches for the selected ROI',
    outputs: 'Normalized image tensors, spatial masks, and region proposals',
    description:
      'Executes band normalization, SAR speckle suppression concepts, and candidate region extraction to ground visual question answering in pixel coordinates.',
    position: [-0.5, 1.45, -1.3],
  },
  {
    id: 'agent-06-vlm',
    step: 6,
    label: 'VLM Adapter',
    shortLabel: '06 · VLM Adapter',
    role: 'Multimodal Vision-Language Model Inference Bridge',
    inputs: 'Processed Optical/SAR patches + structured prompt + spatial anchors',
    outputs: 'Grounded multimodal reasoning tokens + candidate bounding regions',
    description:
      'Adapts general and remote-sensing Vision-Language Models to reason jointly over optical semantics and radar backscatter characteristics.',
    position: [0.5, 1.95, -1.3],
  },
  {
    id: 'agent-07-evidence',
    step: 7,
    label: 'Evidence Normalization',
    shortLabel: '07 · Evidence Norm',
    role: 'Cross-Sensor Attribution & Coordinate Grounding',
    inputs: 'Raw VLM outputs + VQA region masks + sensor metadata',
    outputs: 'Calibrated spatial evidence boxes linked to image coordinates',
    description:
      'Aligns model explanations with concrete spatial footprints so every claim in the response maps to an inspectable Optical or SAR region.',
    position: [1.5, 1.45, -1.2],
  },
  {
    id: 'agent-08-result',
    step: 8,
    label: 'Structured Result',
    shortLabel: '08 · Struct Result',
    role: 'Schema-Validated Geospatial Intelligence Payload',
    inputs: 'Normalized evidence items + synthesized natural-language answer',
    outputs: 'Typed JSON response (summary, modality comparison, ROI overlays)',
    description:
      'Packages the final answer into a deterministic schema containing textual synthesis, modality-specific observations, and GeoJSON overlay regions.',
    position: [2.5, 1.9, -0.9],
  },
  {
    id: 'agent-09-trace',
    step: 9,
    label: 'Trace',
    shortLabel: '09 · Trace',
    role: 'Explainable Execution Audit & Provenance Log',
    inputs: 'Planner steps, tool inputs/outputs, and evidence attribution links',
    outputs: 'Step-by-step inspectable reasoning graph for transparency',
    description:
      'Records every intermediate decision and tool call so engineers and analysts can audit how the system arrived at its geospatial conclusion.',
    position: [3.5, 1.4, -0.35],
  },
  {
    id: 'agent-10-ui',
    step: 10,
    label: 'UI',
    shortLabel: '10 · Analyst UI',
    role: 'Explainable Geospatial Presentation Layer',
    inputs: 'Structured Result + Execution Trace + Attention Overlays',
    outputs: 'Interactive visual comparison, evidence highlights, and trace inspector',
    description:
      'Renders the natural-language answer alongside synchronized Optical/SAR comparison views, bounding-box evidence overlays, and the full agent trace.',
    position: [4.5, 1.8, 0.4],
  },
];

/** Convert lat/lon in degrees to 3D Cartesian coordinates on a sphere of radius R */
export function latLonToVector3(lat: number, lon: number, radius: number): [number, number, number] {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

export function regionToInspectItem(region: GeoRegionData): SatelliteLabInspectItem {
  return {
    kind: 'region',
    id: region.id,
    title: region.name,
    subtitle: `${region.code} · SIMULATED OBSERVATION`,
    coords: region.coordsLabel,
    detail: `${region.opticalAnalysis} ${region.sarAnalysis}`,
    metrics: [
      { label: 'BIOME', value: region.biome },
      { label: 'COORDINATES', value: region.coordsLabel },
      { label: 'MODALITIES', value: 'Optical + SAR (Simulated)' },
    ],
  };
}

export function satelliteToInspectItem(sat: SatelliteModelData): SatelliteLabInspectItem {
  return {
    kind: 'satellite',
    id: sat.id,
    title: sat.name,
    subtitle: `${sat.code} · ${sat.sensorType.toUpperCase()}`,
    coords: `${sat.inclinationDeg}° INC · ${sat.altitudeKm}`,
    detail: sat.summary,
    metrics: [
      { label: 'SENSOR', value: sat.sensorType },
      { label: 'ORBIT', value: sat.altitudeKm },
      { label: 'SWATH', value: sat.swathKm },
    ],
  };
}

export function agentToInspectItem(agent: AgentNodeData): SatelliteLabInspectItem {
  return {
    kind: 'agent',
    id: agent.id,
    title: `Step ${String(agent.step).padStart(2, '0')} — ${agent.label}`,
    subtitle: `MULTI-AGENT ARCHITECTURE // ${agent.role.toUpperCase()}`,
    detail: agent.description,
    metrics: [
      { label: 'INPUTS', value: agent.inputs },
      { label: 'OUTPUTS', value: agent.outputs },
    ],
  };
}
