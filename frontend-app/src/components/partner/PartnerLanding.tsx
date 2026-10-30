'use client';

import { useRef } from 'react';
import { barlowCondensed, chakraPetch } from '../home/fonts';
import { usePageEffects } from '../home/effects';
import StadiumBackdrop from '../home/StadiumBackdrop';
import HomeHeader from '../home/HomeHeader';
import HomeFooter from '../home/HomeFooter';
import Ticker from '../home/Ticker';
import { Audience, Cast, Ecosystem, Format, Market, Mission, PartnerHero, Packages, Production, Quote, Revenue } from './PartnerSections';
import PartnerContact from './PartnerContact';
import '../home/home.css';

const LINKS = [
  // labels and ticker items are translated where they render
  { id: 'format', label: 'Format' },
  { id: 'he-sinh-thai', label: 'Hệ sinh thái' },
  { id: 'khan-gia', label: 'Khán giả' },
  { id: 'doanh-thu', label: 'Doanh thu' },
  { id: 'hop-tac', label: 'Hợp tác' },
];

const TICKER = [
  'Sportainment reality show',
  '12 tập × 90 phút',
  'Park Hang-seo',
  'Chuẩn La Liga',
  '28 triệu gia đình Việt',
  '6 nguồn doanh thu',
  'Final Match SVĐ quốc gia',
];

export default function PartnerLanding() {
  const rootRef = useRef<HTMLDivElement>(null);
  usePageEffects(rootRef);

  return (
    <div ref={rootRef} className={`of-root ${barlowCondensed.variable} ${chakraPetch.variable}`}>
      <StadiumBackdrop />
      <HomeHeader links={LINKS} variant="partner" />
      <main className="relative z-[1]">
        <PartnerHero />
        <Ticker items={TICKER} />
        <Mission />
        <Market />
        <Format />
        <Production />
        <Cast />
        <Ecosystem />
        <Audience />
        <Revenue />
        <Packages />
        <Quote />
        <PartnerContact />
      </main>
      <HomeFooter />
    </div>
  );
}
