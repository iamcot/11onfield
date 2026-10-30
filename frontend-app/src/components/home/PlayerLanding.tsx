'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { competitionService, type CompetitionDetail } from '@/services/competition.service';
import { barlowCondensed, chakraPetch } from './fonts';
import StadiumBackdrop from './StadiumBackdrop';
import HomeHeader from './HomeHeader';
import Hero from './Hero';
import Ticker from './Ticker';
import Eligibility from './Eligibility';
import Benefits from './Benefits';
import Journey from './Journey';
import Regions from './Regions';
import Training from './Training';
import Faq from './Faq';
import FinalCta from './FinalCta';
import HomeFooter from './HomeFooter';
import './home.css';

/** Wires the page-wide effects: scroll reveal, pointer spotlight, background parallax, header progress. */
function usePageEffects(root: React.RefObject<HTMLDivElement>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    el.querySelectorAll('[data-reveal]').forEach((n) => io.observe(n));

    const onPointer = (e: PointerEvent) => {
      const spot = (e.target as HTMLElement).closest?.('.of-spot') as HTMLElement | null;
      if (spot) {
        const r = spot.getBoundingClientRect();
        spot.style.setProperty('--px', `${e.clientX - r.left}px`);
        spot.style.setProperty('--py', `${e.clientY - r.top}px`);
      }
      if (!reduced && e.pointerType === 'mouse') {
        el.style.setProperty('--of-mx', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        el.style.setProperty('--of-my', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      }
    };

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const y = window.scrollY;
        el.style.setProperty('--of-progress', max > 0 ? (y / max).toFixed(4) : '0');
        if (!reduced) el.style.setProperty('--of-sy', Math.min(1, y / (window.innerHeight * 2)).toFixed(4));
      });
    };

    onScroll();
    el.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      el.removeEventListener('pointermove', onPointer);
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [root]);
}

export default function PlayerLanding() {
  const rootRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();
  const [competition, setCompetition] = useState<CompetitionDetail | null>(null);
  usePageEffects(rootRef);

  useEffect(() => {
    competitionService
      .getCurrentCompetition()
      .then(setCompetition)
      .catch(() => setCompetition(null));
  }, []);

  const ctaHref = isAuthenticated && user ? `/profile/${user.userid}` : '/auth/register';
  const now = Date.now();
  const regStart = competition?.registrationStartDate ? new Date(competition.registrationStartDate) : null;
  const regEnd = competition?.registrationEndDate ? new Date(competition.registrationEndDate) : null;
  const registrationOpen = !competition || ((!regStart || regStart.getTime() <= now) && (!regEnd || regEnd.getTime() > now));

  return (
    <div ref={rootRef} className={`of-root ${barlowCondensed.variable} ${chakraPetch.variable}`}>
      <StadiumBackdrop />
      <HomeHeader />
      <main className="relative z-[1]">
        <Hero registrationOpen={registrationOpen} registrationEnd={regEnd} season={competition?.season ?? null} ctaHref={ctaHref} />
        <Eligibility />
        <Ticker />
        <Benefits />
        <Journey />
        <Regions stages={competition?.stages ?? []} ctaHref={ctaHref} />
        <Training />
        <Faq />
        <FinalCta ctaHref={ctaHref} />
      </main>
      <HomeFooter />
    </div>
  );
}
