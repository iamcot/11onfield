'use client';

import { useRef, type ReactNode } from 'react';
import { barlowCondensed, chakraPetch } from '../home/fonts';
import { usePageEffects } from '../home/effects';
import StadiumBackdrop from '../home/StadiumBackdrop';
import HomeHeader from '../home/HomeHeader';
import HomeFooter from '../home/HomeFooter';
import '../home/home.css';

/** Night-stadium page frame for secondary pages: backdrop, header, footer and page effects. */
export default function ThemeShell({ children, footer = true }: { children: ReactNode; footer?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageEffects(rootRef);
  return (
    <div ref={rootRef} className={`of-root ${barlowCondensed.variable} ${chakraPetch.variable}`}>
      <StadiumBackdrop />
      <HomeHeader links={[]} />
      <main className="relative z-[1]" style={{ paddingTop: 'var(--header-h)' }}>
        {children}
      </main>
      {footer && <HomeFooter />}
    </div>
  );
}
