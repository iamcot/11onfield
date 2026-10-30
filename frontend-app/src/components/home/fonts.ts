import { Barlow_Condensed, Chakra_Petch } from 'next/font/google';

export const barlowCondensed = Barlow_Condensed({
  subsets: ['latin', 'vietnamese'],
  weight: ['600', '700', '800', '900'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});

export const chakraPetch = Chakra_Petch({
  subsets: ['latin', 'vietnamese'],
  weight: ['500', '600', '700'],
  variable: '--font-hud',
  display: 'swap',
});
