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
}

/**
 * Primary projects. Add entries here as projects are completed and ready to showcase.
 */
export const projects: Project[] = [];

/**
 * Experimental / future projects. Add entries here — they appear in the
 * "Experiments queue" automatically. Do not mark anything as live until it is.
 */
export const experimentalProjects: Project[] = [];
