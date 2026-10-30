'use client';

import { useRef, type ReactNode } from 'react';
import { barlowCondensed, chakraPetch } from '../home/fonts';
import { usePageEffects } from '../home/effects';
import StadiumBackdrop from '../home/StadiumBackdrop';
import '../home/home.css';

/**
 * Night-stadium skin for the signed-in app pages (profile, competitions, events, players).
 * Those pages keep their own markup; `.of-app` in home.css re-maps their light Tailwind palette.
 */
export default function AppTheme({ children, fireflies = true }: { children: ReactNode; fireflies?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageEffects(rootRef);
  return (
    <div ref={rootRef} className={`of-root of-app ${barlowCondensed.variable} ${chakraPetch.variable}`}>
      <StadiumBackdrop fireflies={fireflies} />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}
