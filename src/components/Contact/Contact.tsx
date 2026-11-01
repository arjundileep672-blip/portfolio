import { ArrowUpRight, Check, Copy, Github, Linkedin, Mail } from 'lucide-react';
import { useState } from 'react';
import { Magnetic, SectionTag, SplitReveal } from '@/components/ui/Motion';
import { site, socialHref } from '@/data/site';
import { useUnbound } from '@/context/UnboundContext';

const icons = { email: Mail, github: Github, linkedin: Linkedin };

export function Contact() {
  const { toast } = useUnbound();
  const [copied, setCopied] = useState(false);
  const email = site.socials.find((s) => s.id === 'email');
  const emailHref = email ? socialHref(email) : null;

  const copy = async () => {
    if (!email?.value) return;
    try {
      await navigator.clipboard.writeText(email.value);
    } catch {
      const t = document.createElement('textarea');
      t.value = email.value;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setCopied(true);
    toast('Email copied to clipboard.');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="contact" aria-labelledby="contact-title" className="relative overflow-hidden border-t border-line section-pad py-24 outline-none sm:py-32 lg:py-40">
      <SectionTag index="08" label="Contact" />
      <SplitReveal id="contact-title" text="Have an interesting problem? Let's build something." className="display-lg mt-10 max-w-[18ch]" />

      <div className="mt-14 flex flex-wrap items-center gap-3">
        {emailHref ? (
          <>
            <Magnetic href={emailHref} cursor="Write" className="group h-14 gap-3 bg-acid px-6 font-mono text-sm font-medium uppercase tracking-[0.12em] text-ink">
              <Mail size={16} aria-hidden /> {email!.value}
              <ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </Magnetic>
            <button type="button" onClick={copy} className="ub-btn h-14 px-5" aria-label="Copy email address" data-cursor="Copy">
              {copied ? <Check size={14} className="text-acid" aria-hidden /> : <Copy size={14} aria-hidden />} {copied ? 'Copied' : 'Copy email'}
            </button>
          </>
        ) : (
          <p className="max-w-md border border-dashed border-line p-5 text-[15px] text-muted">
            Contact details are being set up. Add them in <code className="font-mono text-bone">src/data/site.ts</code> and they'll appear here — including one-click copy for email.
          </p>
        )}
      </div>

      <ul className="mt-16 grid border-t border-line md:grid-cols-3">
        {site.socials.map((s) => {
          const href = socialHref(s);
          const Icon = icons[s.id];
          const inner = (
            <>
              <span className="flex items-center gap-3">
                <Icon size={18} aria-hidden className={href ? 'text-acid' : 'text-muted'} />
                <span className="font-display text-2xl font-medium tracking-[-0.03em]">{s.label}</span>
              </span>
              {href ? (
                <ArrowUpRight size={18} className="transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" aria-hidden />
              ) : (
                <span className="ub-label">Not configured</span>
              )}
            </>
          );
          return (
            <li key={s.id} className="border-b border-line md:border-r md:last:border-r-0">
              {href ? (
                <a
                  href={href}
                  target={s.id === 'email' ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="group flex items-center justify-between px-1 py-8 transition-colors hover:bg-ink-2 md:px-6"
                  data-cursor="Open"
                  aria-label={`${s.label}${s.id === 'email' ? '' : ' (opens in new tab)'}`}
                >
                  {inner}
                </a>
              ) : (
                <div className="flex items-center justify-between px-1 py-8 opacity-60 md:px-6" aria-disabled="true">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>

      <div className="pointer-events-none mt-20 select-none overflow-hidden whitespace-nowrap" aria-hidden>
        <div className="inline-flex animate-marquee font-display text-[18vw] font-black uppercase leading-none tracking-tightest text-outline">
          <span className="pr-[4vw]">Build without limits —</span>
          <span className="pr-[4vw]">Build without limits —</span>
        </div>
      </div>
    </section>
  );
}
