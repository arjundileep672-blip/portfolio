export type SkillCategoryId = 'programming' | 'frontend' | 'backend' | 'database' | 'ai' | 'tools';

export interface Skill {
  id: string;
  name: string;
  category: SkillCategoryId;
  /** Short, factual description of what the skill is used for. No proficiency claims. */
  description: string;
  /** ids of related skills — used to draw connections in the skills universe. */
  related?: string[];
}

export interface SkillCategory {
  id: SkillCategoryId;
  label: string;
  /** Hex colour used for the cluster in 3D. Keep within the brand palette. */
  color: string;
  skills: Skill[];
}

const s = (id: string, name: string, category: SkillCategoryId, description: string, related: string[] = []): Skill => ({
  id, name, category, description, related,
});

export const skillCategories: SkillCategory[] = [
  {
    id: 'programming', label: 'Programming', color: '#C5FF55',
    skills: [
      s('c', 'C', 'programming', 'Low-level programming, memory, pointers and the fundamentals underneath everything else.', ['cpp']),
      s('cpp', 'C++', 'programming', 'Data structures, algorithms and performance-minded problem solving.', ['c', 'python']),
      s('python', 'Python', 'programming', 'The primary language for machine learning experiments and research paper implementations.', ['ml', 'dl', 'research']),
      s('javascript', 'JavaScript', 'programming', 'The language of the web — used across frontend interfaces and Node.js backends.', ['react', 'node', 'html']),
    ],
  },
  {
    id: 'frontend', label: 'Frontend', color: '#F2F2EA',
    skills: [
      s('html', 'HTML', 'frontend', 'Semantic, accessible document structure.', ['css', 'javascript']),
      s('css', 'CSS', 'frontend', 'Layout, typography and motion for the web.', ['html', 'tailwind']),
      s('react', 'React', 'frontend', 'Component-driven interfaces — this website is built with it.', ['javascript', 'tailwind']),
      s('tailwind', 'Tailwind CSS', 'frontend', 'Utility-first styling for fast, consistent design systems.', ['css', 'react']),
    ],
  },
  {
    id: 'backend', label: 'Backend', color: '#9FD4FF',
    skills: [
      s('node', 'Node.js', 'backend', 'Server-side JavaScript runtime used to build APIs and services.', ['express', 'javascript']),
      s('express', 'Express.js', 'backend', 'Minimal web framework for REST APIs — used in ChainHandler.', ['node', 'postgres']),
    ],
  },
  {
    id: 'database', label: 'Database', color: '#FFB86B',
    skills: [
      s('postgres', 'PostgreSQL', 'database', 'Relational data modelling and SQL — used with Neon in ChainHandler.', ['express']),
    ],
  },
  {
    id: 'ai', label: 'AI / ML', color: '#B79CFF',
    skills: [
      s('ml', 'Machine Learning', 'ai', 'Learning from data: models, training, evaluation and the maths behind them.', ['python', 'dl']),
      s('dl', 'Deep Learning', 'ai', 'Neural network architectures — currently studying residual networks (ResNet).', ['ml', 'research']),
      s('llm', 'Large Language Models', 'ai', 'How transformer-based language models work and how to build with them.', ['dl', 'agentic']),
      s('agentic', 'Agentic AI', 'ai', 'Systems where models plan and act with tools — the idea behind ChainHandler.', ['llm']),
      s('research', 'Research Paper Implementation', 'ai', 'Reading published papers and reproducing their ideas in code.', ['dl', 'python']),
    ],
  },
  {
    id: 'tools', label: 'Tools', color: '#858B80',
    skills: [
      s('git', 'Git', 'tools', 'Version control for every project.', ['github']),
      s('github', 'GitHub', 'tools', 'Hosting, collaboration and open-source work.', ['git']),
      s('vscode', 'VS Code', 'tools', 'Primary code editor.', ['git']),
      s('antigravity', 'Antigravity', 'tools', 'Agentic development environment used for AI-assisted engineering.', ['opencode', 'agentic']),
      s('opencode', 'OpenCode', 'tools', 'Terminal-based AI coding agent.', ['antigravity']),
    ],
  },
];

export const allSkills: Skill[] = skillCategories.flatMap((c) => c.skills);
