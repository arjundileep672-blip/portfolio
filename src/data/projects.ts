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
  category: string;
  status: ProjectStatus;
  summary: string;
  description: string;
  features: string[];
  stack: string[];
  links: { demo: ProjectLink; source: ProjectLink };
  /** Which 3D scene represents the project, if any. */
  scene?: 'warehouse';
}

export const projects: Project[] = [
  {
    id: 'chainhandler',
    index: '01',
    title: 'ChainHandler',
    category: 'Agentic AI / Supply Chain Resilience',
    status: 'live',
    summary: 'An agentic AI-powered resilient supply chain management platform.',
    description:
      'ChainHandler is designed to improve inventory visibility, identify stock-related issues, detect disruptions and support recovery decisions — helping businesses stay operational when the chain breaks.',
    features: [
      'Inventory management',
      'Stock monitoring',
      'Disruption alerts',
      'Recovery decision support',
      'Supply chain visibility on a live map',
    ],
    stack: ['HTML', 'CSS', 'JavaScript', 'Node.js', 'Express.js', 'PostgreSQL', 'Neon', 'Leaflet', 'OpenStreetMap', 'OSRM'],
    links: {
      demo: { label: 'Live demo', href: 'https://chainhandler-5b292.web.app' },
      // EDIT: add the repository URL when it is public.
      source: { label: 'Source code', href: null },
    },
    scene: 'warehouse',
  },
];

/**
 * Experimental / future projects. Add entries here — they appear in the
 * "Experiments queue" automatically. Do not mark anything as live until it is.
 */
export const experimentalProjects: Project[] = [];
