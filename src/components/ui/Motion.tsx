import { motion, useReducedMotion } from 'framer-motion';
import { useRef, type ReactNode, type MouseEvent, type ElementType } from 'react';

/** Fade/slide in once when scrolled into view. */
export function Reveal({ children, delay = 0, y = 28, className = '', as = 'div' }: { children: ReactNode; delay?: number; y?: number; className?: string; as?: 'div' | 'li' | 'span' | 'p' }) {
  const reduce = useReducedMotion();
  const M = motion[as] as typeof motion.div;
  return (
    <M
      className={className}
      initial={reduce ? false : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.9, delay, ease: [0.2, 0.7, 0.2, 1] }}
    >
      {children}
    </M>
  );
}

/** Word-by-word masked reveal for headings. */
export function SplitReveal({ text, className = '', as: Tag = 'h2', delay = 0, id }: { text: string; className?: string; as?: ElementType; delay?: number; id?: string }) {
  const reduce = useReducedMotion();
  const words = text.split(' ');
  return (
    <Tag id={id} className={className} aria-label={text}>
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.08em] align-top" aria-hidden>
          <motion.span
            className="inline-block"
            initial={reduce ? false : { y: '110%' }}
            whileInView={{ y: '0%' }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.9, delay: delay + i * 0.06, ease: [0.2, 0.7, 0.2, 1] }}
          >
            {w}
            {i < words.length - 1 ? '\u00A0' : ''}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}

export function SectionTag({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-[11px] text-acid">{index}</span>
      <span className="h-px w-10 bg-line" />
      <span className="ub-label">{label}</span>
    </div>
  );
}

type MagneticProps = {
  children: ReactNode;
  className?: string;
  href?: string;
  onClick?: () => void;
  cursor?: string;
  ariaLabel?: string;
  external?: boolean;
  disabled?: boolean;
};

/** Button/link that leans toward the pointer. */
export function Magnetic({ children, className = '', href, onClick, cursor, ariaLabel, external, disabled }: MagneticProps) {
  const ref = useRef<HTMLElement>(null);
  const move = (e: MouseEvent) => {
    const el = ref.current;
    if (!el || disabled) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width / 2) * 0.25;
    const y = (e.clientY - r.top - r.height / 2) * 0.35;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };
  const leave = () => {
    if (ref.current) ref.current.style.transform = '';
  };
  const common = {
    className: `inline-flex items-center transition-transform duration-300 ease-out ${className}`,
    onMouseMove: move,
    onMouseLeave: leave,
    'data-cursor': cursor,
    'aria-label': ariaLabel,
  };
  if (href && !disabled) {
    return (
      <a ref={ref as React.RefObject<HTMLAnchorElement>} href={href} {...common} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
        {children}
      </a>
    );
  }
  return (
    <button ref={ref as React.RefObject<HTMLButtonElement>} type="button" onClick={onClick} disabled={disabled} {...common}>
      {children}
    </button>
  );
}
