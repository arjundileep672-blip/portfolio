import { useEffect } from 'react';
import { UnboundProvider, useUnbound } from '@/context/UnboundContext';
import { useKonami } from '@/hooks/useKonami';
import { Loader } from '@/components/Loader/Loader';
import { Navigation } from '@/components/Navigation/Navigation';
import { Cursor } from '@/components/Cursor/Cursor';
import { CommandPalette } from '@/components/CommandPalette/CommandPalette';
import { Hero } from '@/components/Hero/Hero';
import { About } from '@/components/About/About';
import { Skills } from '@/components/Skills/Skills';
import { Projects } from '@/components/Projects/Projects';
import { Research } from '@/components/Research/Research';
import { Experiments } from '@/components/Experiments/Experiments';
import { Journey } from '@/components/Timeline/Journey';
import { Terminal } from '@/components/Terminal/Terminal';
import { Contact } from '@/components/Contact/Contact';
import { Footer, Toast } from '@/components/Footer/Footer';

function Shell() {
  const { unleash, scrollTo } = useUnbound();
  useKonami(unleash);

  useEffect(() => {
    console.log(
      '%cARJUN%c\nThink beyond. Build without limits.\nHello, fellow engineer — this site is built with React, Three.js, R3F, GSAP & Framer Motion.\nTry the Konami code, or `arjun --unleash` in the terminal.',
      'color:#C5FF55;font:900 28px sans-serif;letter-spacing:-2px',
      'color:#858B80;font:12px monospace',
    );
    // Honour deep links (#projects) after load.
    const hash = window.location.hash.slice(1);
    if (hash) setTimeout(() => scrollTo(hash), 1200);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="grain relative">
      <a href="#main" className="sr-only fixed left-4 top-4 z-[300] bg-acid px-4 py-2 font-mono text-xs uppercase text-ink focus:not-sr-only">
        Skip to content
      </a>
      <Loader />
      <Cursor />
      <Navigation />
      <CommandPalette />
      <main id="main">
        <Hero />
        <About />
        <Skills />
        <Projects />
        <Research />
        <Experiments />
        <Journey />
        <Terminal />
        <Contact />
      </main>
      <Footer />
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <UnboundProvider>
      <Shell />
    </UnboundProvider>
  );
}
