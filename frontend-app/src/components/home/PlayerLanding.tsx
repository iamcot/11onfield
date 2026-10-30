'use client';

import { useEffect, useRef, useState } from 'react';
import { usePageEffects } from './effects';
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
