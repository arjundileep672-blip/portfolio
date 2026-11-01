import { site, socialHref } from '@/data/site';
import { skillCategories } from '@/data/skills';
import { projects } from '@/data/projects';
import { research, statusMeta } from '@/data/research';

export type LineTone = 'out' | 'muted' | 'accent' | 'error' | 'cmd';
export interface Line { text: string; tone?: LineTone; href?: string }

export interface TerminalContext {
  goto: (id: string) => void;
  unleash: () => void;
  history: string[];
}

export type CommandResult = Line[] | 'clear';

interface CommandDef {
  description: string;
  hidden?: boolean;
  run: (args: string[], ctx: TerminalContext) => CommandResult;
}

const L = (text: string, tone: LineTone = 'out', href?: string): Line => ({ text, tone, href });

const NEOFETCH_ART = [
  '  ██    ██ ',
  '  ██    ██ ',
  '  ██    ██ ',
  '  ██    ██ ',
  '   ██████  ',
];

export const commands: Record<string, CommandDef> = {
  help: {
    description: 'List available commands',
    run: () => [
      L('Available commands:', 'accent'),
      ...Object.entries(commands)
        .filter(([, c]) => !c.hidden)
        .map(([k, c]) => L(`  ${k.padEnd(10)} ${c.description}`)),
      L(''),
      L('Tip: ↑/↓ browse history · Tab autocompletes · there may be a hidden command.', 'muted'),
    ],
  },
  about: {
    description: 'Who is behind UNBOUND',
    run: () => [
      L(`${site.creator} — ${site.role}`, 'accent'),
      L('Engineering student passionate about software engineering, AI, machine learning'),
      L('and solving real-world problems through technology. Reads research papers,'),
      L('experiments with new tools, and turns ideas into practical applications.'),
    ],
  },
  skills: {
    description: 'List skills by category',
    run: () => skillCategories.flatMap((c) => [L(`[${c.label.toUpperCase()}]`, 'accent'), L(`  ${c.skills.map((s) => s.name).join(' · ')}`)]),
  },
  projects: {
    description: 'Show projects',
    run: () =>
      projects.length
        ? projects.flatMap((p) => [
            L(`${p.index}  ${p.title}  [${p.status}]`, 'accent'),
            L(`    ${p.summary}`),
            L(`    stack: ${p.stack.join(', ')}`, 'muted'),
            ...(p.links.demo.href ? [L(`    demo:  ${p.links.demo.href}`, 'out', p.links.demo.href)] : []),
          ])
        : [
            L('01  Research Paper Reproductions  [studying]', 'accent'),
            L('    Recreating implementations of published AI/ML papers (starting with ResNet).'),
            L('02  Experiments Queue  [in-progress]', 'accent'),
            L('    New projects appear here as they are built. Edit src/data/projects.ts to add entries.', 'muted'),
          ],
  },
  research: {
    description: 'Show research entries',
    run: () =>
      research.flatMap((r) => [
        L(`${r.shortTitle} — ${r.title}`, 'accent'),
        L(`    ${r.authors}`, 'muted'),
        L(`    status: ${statusMeta[r.status].label.toLowerCase()} — ${statusMeta[r.status].description}`),
        ...(r.reference ? [L(`    paper:  ${r.reference.href}`, 'out', r.reference.href)] : []),
      ]),
  },
  contact: {
    description: 'How to reach me',
    run: () =>
      site.socials.map((s) => {
        const href = socialHref(s);
        return href ? L(`  ${s.label.padEnd(9)} ${s.value}`, 'out', href) : L(`  ${s.label.padEnd(9)} not configured yet`, 'muted');
      }),
  },
  whoami: {
    description: 'Identify the operator',
    run: () => [L('Arjun Dileep', 'accent'), L('Aspiring AI/ML Engineer'), L('Software Engineer in the making.'), L('Creator of UNBOUND.')],
  },
  neofetch: {
    description: 'System information',
    run: () => {
      const info = [
        ['', 'arjun@unbound'],
        ['', '-------------'],
        ['OS', 'UNBOUND v1.0 (web)'],
        ['Host', site.creator],
        ['Role', 'AI/ML · Software Engineering'],
        ['Shell', 'unbound-sh'],
        ['Stack', 'React · Three.js · R3F · GSAP'],
        ['Focus', 'Agentic AI · Deep Learning'],
        ['Reading', research[0]?.shortTitle ?? '—'],
        ['Motto', 'Think beyond. Build without limits.'],
      ];
      return info.map(([k, v], i) => L(`${(NEOFETCH_ART[i] ?? '           ')}   ${k ? `${k}: ` : ''}${v}`, i < 2 ? 'accent' : 'out'));
    },
  },
  history: {
    description: 'Show command history',
    run: (_a, ctx) => (ctx.history.length ? ctx.history.map((h, i) => L(`  ${String(i + 1).padStart(3)}  ${h}`)) : [L('No history yet.', 'muted')]),
  },
  goto: {
    description: 'Scroll to a section: goto <section>',
    run: (args, ctx) => {
      const id = (args[0] || '').toLowerCase();
      const valid = ['home', 'about', 'skills', 'projects', 'research', 'experiments', 'journey', 'contact'];
      if (!valid.includes(id)) return [L(`usage: goto <${valid.join('|')}>`, 'error')];
      ctx.goto(id);
      return [L(`→ navigating to #${id}`, 'muted')];
    },
  },
  clear: { description: 'Clear the terminal', run: () => 'clear' },
  // ——— hidden ———
  unbound: {
    description: 'Secret',
    hidden: true,
    run: (args, ctx) => {
      if (args[0] === '--unleash') {
        ctx.unleash();
        return [L('>> removing limits…', 'accent'), L('>> scroll to the top. something changed.', 'accent')];
      }
      return [L('unbound: missing flag. Try a bolder one.', 'muted')];
    },
  },
  sudo: { description: 'Secret', hidden: true, run: () => [L('Nice try. In UNBOUND there are no limits — and no root either.', 'muted')] },
  hello: { description: 'Secret', hidden: true, run: () => [L('Hello, curious one. Try `unbound --unleash`.', 'accent')] },
};

export function execute(input: string, ctx: TerminalContext): CommandResult {
  const [name, ...args] = input.trim().split(/\s+/);
  if (!name) return [];
  const cmd = commands[name.toLowerCase()];
  if (!cmd) {
    const close = Object.keys(commands).filter((k) => !commands[k].hidden && (k.startsWith(name[0]?.toLowerCase() ?? '') || k.includes(name.toLowerCase())));
    return [
      L(`command not found: ${name}`, 'error'),
      L(close.length ? `Did you mean: ${close.slice(0, 3).join(', ')}? Type \`help\` for all commands.` : 'Type `help` to see available commands.', 'muted'),
    ];
  }
  return cmd.run(args, ctx);
}

export const completions = (prefix: string) => Object.keys(commands).filter((k) => !commands[k].hidden && k.startsWith(prefix.toLowerCase()));
