export type JourneyCategory =
  | 'Programming'
  | 'Data Structures & Algorithms'
  | 'Software Engineering'
  | 'AI & Machine Learning'
  | 'Research Implementations'
  | 'Agentic AI'
  | 'Product Development';

export interface Milestone {
  id: string;
  category: JourneyCategory;
  title: string;
  description: string;
  /** EDIT: add a real date/period (e.g. "2024") or leave null — never invent one. */
  period: string | null;
  state: 'done' | 'now' | 'next';
}

/**
 * Engineering journey. Ordered as a learning progression, not a dated history.
 * Edit freely — the timeline renders whatever is here.
 */
export const milestones: Milestone[] = [
  { id: 'prog', category: 'Programming', title: 'Learning to program', description: 'C and C++ fundamentals, then Python and JavaScript.', period: null, state: 'done' },
  { id: 'dsa', category: 'Data Structures & Algorithms', title: 'Problem solving', description: 'Studying data structures and algorithms to think in terms of complexity and trade-offs.', period: null, state: 'now' },
  { id: 'swe', category: 'Software Engineering', title: 'Building for the web', description: 'Frontend with HTML, CSS, React and Tailwind; backends with Node.js, Express, FastAPI and PostgreSQL.', period: null, state: 'done' },
  { id: 'satquery', category: 'Agentic AI', title: 'SATQUERY AI (SIH26167 — ISRO)', description: 'Designing a multimodal remote-sensing assistant combining Optical & SAR satellite imagery with VQA, explainability and a multi-agent pipeline.', period: null, state: 'now' },
  { id: 'agentic', category: 'Agentic AI', title: 'Agentic systems', description: 'Exploring LLM and VLM-driven agents that plan, invoke tools, and produce traceable reasoning.', period: null, state: 'now' },
  { id: 'ml', category: 'AI & Machine Learning', title: 'Machine & deep learning', description: 'Building intuition for models, training and the mathematics behind them.', period: null, state: 'now' },
  { id: 'research', category: 'Research Implementations', title: 'Reproducing ResNet', description: 'Studying Deep Residual Learning with the goal of implementing it from scratch.', period: null, state: 'now' },
  { id: 'next', category: 'Product Development', title: 'Building my own products', description: 'The long-term goal: create meaningful technology and products of my own.', period: null, state: 'next' },
];
