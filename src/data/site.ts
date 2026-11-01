/**
 * Site-wide configuration. EDIT THIS FILE to update personal details.
 * Any link left as null renders as "not configured" and is not clickable.
 */
export interface SocialLink {
  id: 'email' | 'github' | 'linkedin';
  label: string;
  /** For email: the address itself (e.g. "you@example.com"). For others: full URL. */
  value: string | null;
}

export const site = {
  brand: 'UNBOUND',
  creator: 'Arjun Dileep',
  role: 'Aspiring AI/ML Engineer · Software Engineer',
  tagline: 'THINK BEYOND. BUILD WITHOUT LIMITS.',
  headline: 'Engineering ideas into intelligent systems.',
  intro: 'An independent digital space exploring software engineering, artificial intelligence, and experimental technology.',
  status: 'Open to learning, building & collaborating',
  socials: [
    { id: 'email', label: 'Email', value: 'arjundileep672@gmail.com' },
    { id: 'github', label: 'GitHub', value: 'https://github.com/arjundileep672-blip' },
    { id: 'linkedin', label: 'LinkedIn', value: null },
  ] as SocialLink[],
};

export const navItems = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'skills', label: 'Skills' },
  { id: 'projects', label: 'Projects' },
  { id: 'research', label: 'Research' },
  { id: 'experiments', label: 'Experiments' },
  { id: 'contact', label: 'Contact' },
] as const;

export type SectionId = (typeof navItems)[number]['id'] | 'journey' | 'terminal';

export const socialHref = (l: SocialLink): string | null => {
  if (!l.value) return null;
  return l.id === 'email' ? `mailto:${l.value}` : l.value;
};
