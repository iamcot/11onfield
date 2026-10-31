import { ImageResponse } from 'next/og';
import { getT } from '@/i18n/server';
import { createT, getDictionary } from '@/i18n/translate';
import { CARD_RATIO, OG_SIZE, PlayerCardImage } from '@/lib/og/PlayerCardImage';
import { cardFonts, fetchProfile, publicImage, remoteImage, siteOrigin } from '@/lib/og/server';
import { profileToView } from '@/lib/players/view';

export const dynamic = 'force-dynamic';

const SHARE = { width: 1080, height: 1350, card: 840 };

/**
 * GET /profile/{userid}/card            the player card on a 4:5 picture, to download and post
 * GET /profile/{userid}/card?v=og       link preview: the top of the card, cut from the top left corner, so a
 *                                       wide or square crop by the app showing the link still keeps the face
 */
export async function GET(req: Request, { params }: { params: { userid: string } }) {
  const profile = await fetchProfile(params.userid);
  if (!profile) return new Response('Not found', { status: 404 });

  const og = new URL(req.url).searchParams.get('v') === 'og';
  // the card fonts have no Hangul: Korean readers get the English labels
  const { locale } = getT();
  const t = createT(getDictionary(og ? 'vi' : locale === 'ko' ? 'en' : locale));
  const origin = siteOrigin();
  const p = profileToView(profile);
  const [fonts, photo, logo] = await Promise.all([cardFonts(), remoteImage(p.avatar, origin), publicImage('images/logo-white-small.png')]);
  const headers = { 'Cache-Control': 'public, max-age=300, s-maxage=300' };

  if (og) {
    return new ImageResponse(
      (
        <div style={{ display: 'flex', width: OG_SIZE.width, height: OG_SIZE.height, background: '#0b170f', overflow: 'hidden' }}>
          <PlayerCardImage p={p} photo={photo} logo={logo} width={OG_SIZE.width} t={t} />
        </div>
      ),
      { ...OG_SIZE, fonts, headers },
    );
  }

  const stadium = await publicImage('images/home/stadium-bg.jpg');
  const cardTop = 70;
  return new ImageResponse(
    (
      <div style={{ position: 'relative', display: 'flex', width: SHARE.width, height: SHARE.height, background: '#07130c' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={stadium} alt="" style={{ position: 'absolute', inset: 0, width: SHARE.width, height: SHARE.height, objectFit: 'cover', opacity: 0.45 }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', backgroundImage: 'linear-gradient(180deg, rgba(7,19,12,0.2), rgba(7,19,12,0.85))' }} />
        <div style={{ position: 'absolute', left: (SHARE.width - SHARE.card) / 2, top: cardTop, display: 'flex' }}>
          <PlayerCardImage p={p} photo={photo} logo={logo} width={SHARE.card} t={t} />
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: cardTop + SHARE.card * CARD_RATIO + 40,
            display: 'flex',
            justifyContent: 'center',
            fontFamily: 'Hud',
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: 4,
            color: '#f3dfaf',
          }}
        >
          {new URL(origin).host.replace(/^www\./, '').toUpperCase()}
        </div>
      </div>
    ),
    { width: SHARE.width, height: SHARE.height, fonts, headers },
  );
}
