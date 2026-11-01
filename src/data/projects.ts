export type ProjectStatus = 'live' | 'in-progress' | 'planned' | 'idea';

export interface ProjectLink {
  label: string;
  /** Leave as null until a real URL exists — the UI renders it as "not yet published". */
  href: string | null;
}

export interface Project {
  id: string;
  index: string;
  title: string;
  context?: string;
  headline?: string;
  supportingText?: string;
  category: string;
  status: ProjectStatus;
  summary: string;
  description: string;
  problemStatement?: string;
  proposedSolution?: string;
  features: string[];
  architecturePipeline?: string[];
  stack: string[];
  links: { demo: ProjectLink; source: ProjectLink };
  scene?: 'satellite';
}

/**
 * Primary projects.
 */
export const projects: Project[] = [
  {
    id: 'satquery-ai',
    index: '01',
    title: 'SATQUERY AI',
    context: 'SIH26167 — ISRO Problem Statement',
    headline: 'UNDERSTANDING EARTH THROUGH INTELLIGENT SATELLITE IMAGERY.',
    supportingText: 'An exploration of multimodal AI that transforms satellite imagery into explainable geospatial intelligence.',
    category: 'Multimodal AI / Remote Sensing / Geospatial Intelligence',
    status: 'in-progress',
    summary:
      'A multimodal remote-sensing assistant designed to help users investigate satellite imagery through natural-language questions.',
    description:
      'SATQUERY AI combines optical and SAR (Synthetic Aperture Radar) satellite imagery with visual question answering, geospatial analysis, explainability, and multi-agent processing to transform Earth observation data into structured, traceable insights.',
    problemStatement:
      'Interpreting multi-sensor Earth observation data requires domain expertise across optical spectral bands and radar backscatter. Analysts need a natural-language interface that can reason over both optical and all-weather SAR imagery while providing verifiable spatial evidence rather than opaque black-box answers.',
    proposedSolution:
      'A multi-agent geospatial VQA architecture that routes natural-language queries through a central Planner and Tool Registry to specialized VQA/image processing tools and Vision-Language Model (VLM) adapters, normalizing multimodal evidence into structured answers with full execution traces and visual attention overlays.',
    features: [
      'Optical satellite imagery interpretation (land-use, vegetation, water, built-up areas)',
      'SAR (Synthetic Aperture Radar) all-weather backscatter analysis',
      'Optical vs. SAR multimodal comparison & sensor fusion concepts',
      'Natural-language Visual Question Answering (VQA) over geospatial regions',
      'Geospatial coordinate & region-of-interest querying',
      'Explainable AI (XAI) attention & spatial evidence attribution',
      'Multi-agent tool planning, evidence normalization, and execution trace logging',
    ],
    architecturePipeline: [
      'React WebGIS',
      'FastAPI',
      'Planner',
      'Tool Registry',
      'VQA / Image Processing',
      'VLM Adapter',
      'Evidence Normalization',
      'Structured Result',
      'Trace',
      'UI',
    ],
    stack: [
      'Python',
      'FastAPI',
      'React',
      'TypeScript',
      'Tailwind CSS',
      'Vision-Language Models (VLM)',
      'Multimodal VQA',
      'Agentic AI',
      'WebGIS',
      'Remote Sensing (Optical & SAR)',
    ],
    links: {
      demo: { label: 'Live demo', href: null },
      source: { label: 'Source code', href: null },
    },
    scene: 'satellite',
  },
];

/**
 * Experimental / future projects. Add entries here — they appear in the
 * "Experiments queue" automatically. Do not mark anything as live until it is.
 */
export const experimentalProjects: Project[] = [];
