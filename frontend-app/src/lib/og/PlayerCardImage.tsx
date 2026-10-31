import type { CSSProperties } from 'react';
import { FOOT_LABEL, initials, POS_INFO } from '@/lib/players/stats';
import type { PlayerView } from '@/lib/players/view';
import type { TFunction } from '@/i18n/translate';

// The gold player card of the players list (.pp-cc in pp.css), redrawn for the image renderer (next/og):
// flexbox only, inline styles, fonts "Display" and "Hud" loaded by lib/og/server.ts.

const GOLD = '#f3dfaf';
const MUTE = '#b4c4ba';
const RING = '#a08b5c';

/** Card is 3:4; every size below is in units of a 240px wide card. */
export const CARD_RATIO = 4 / 3;

/** Link preview size (Facebook, Zalo, X): 1.91:1. */
export const OG_SIZE = { width: 1200, height: 630 };

// chamfered top left and bottom right corners, as .of-cut (the renderer has no calc())
const cut = (w: number, h: number, c: number): CSSProperties['clipPath'] =>
  `polygon(${c}px 0, ${w}px 0, ${w}px ${h - c}px, ${w - c}px ${h}px, 0 ${h}px, 0 ${c}px)`;

export function PlayerCardImage({ p, photo, logo, width, t }: { p: PlayerView; photo: string | null; logo: string; width: number; t: TFunction }) {
  const u = width / 240;
  const height = width * CARD_RATIO;
  const c = 28 * u;
  const b = Math.max(2, 2 * u);
  const pad = 15 * u;
  const name = p.name.toUpperCase();
  // the in-app card cuts a long name with an ellipsis; an image has room to shrink it instead
  const nameSize = Math.min(26, 205 / Math.max(1, name.length * 0.5)) * u;
  const stats: [string, string][] = [
    [p.age != null ? String(p.age) : '--', t('Tuổi')],
    [p.foot ? t(FOOT_LABEL[p.foot] ?? p.foot) : '--', t('Chân')],
    [p.height != null ? String(p.height) : '--', t('Cao')],
    [p.weight != null ? String(p.weight) : '--', t('Nặng')],
  ];

  return (
    <div style={{ position: 'relative', display: 'flex', width, height, background: RING, clipPath: cut(width, height, c) }}>
      <div
        style={{
          position: 'absolute',
          left: b,
          top: b,
          width: width - 2 * b,
          height: height - 2 * b,
          display: 'flex',
          clipPath: cut(width - 2 * b, height - 2 * b, c - 0.586 * b),
          backgroundImage: 'linear-gradient(160deg, #46381a 0%, #2a2512 45%, #0f170e 100%)',
        }}
      >
        {/* light sweep across the card */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            backgroundImage: 'linear-gradient(112deg, rgba(255,255,255,0) 38%, rgba(255,240,200,0.09) 38%, rgba(255,240,200,0.05) 58%, rgba(255,255,255,0) 58%)',
          }}
        />
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt=""
            style={{ position: 'absolute', left: 0, top: 18 * u, width: width - 2 * b, height: 172 * u, objectFit: 'contain', objectPosition: 'bottom' }}
          />
        ) : (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 44 * u,
              display: 'flex',
              justifyContent: 'center',
              fontFamily: 'Display',
              fontSize: 120 * u,
              lineHeight: 1,
              color: 'rgba(227,194,126,0.28)',
            }}
          >
            {initials(p.name)}
          </div>
        )}

        <div style={{ position: 'absolute', left: pad, right: pad, top: pad, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontFamily: 'Display', fontSize: 40 * u, lineHeight: 1, color: GOLD, textShadow: `0 0 ${18 * u}px rgba(227,194,126,0.35)` }}>
              {p.group ? t(POS_INFO[p.group].code) : '--'}
            </div>
            <div style={{ fontFamily: 'Hud', fontWeight: 600, fontSize: 10 * u, letterSpacing: 1.4 * u, color: GOLD, marginTop: 2 * u, textTransform: 'uppercase' }}>
              {p.group ? t(POS_INFO[p.group].label) : t('Vị trí')}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', marginTop: 8 * u }}>
              <span style={{ fontFamily: 'Display', fontSize: 26 * u, lineHeight: 1, color: '#fff' }}>{String(p.ovr)}</span>
              <span style={{ fontFamily: 'Hud', fontWeight: 600, fontSize: 10 * u, color: MUTE, marginLeft: 4 * u }}>{p.pro ? t('Điểm') : t('Hồ sơ')}</span>
            </div>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logo} alt="" style={{ width: 25 * u, height: 40 * u, objectFit: 'contain', opacity: 0.92 }} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: pad,
            right: pad,
            bottom: pad,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'Display',
              fontSize: nameSize,
              lineHeight: 1.05,
              color: '#fff',
              textAlign: 'center',
              textShadow: `0 ${2 * u}px ${8 * u}px rgba(0,0,0,0.85)`,
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </div>
          <div style={{ display: 'flex', width: '100%', height: Math.max(1, u), margin: `${6 * u}px 0 ${7 * u}px`, backgroundImage: 'linear-gradient(90deg, rgba(243,223,175,0), rgba(243,223,175,0.6), rgba(243,223,175,0))' }} />
          <div style={{ display: 'flex', width: '100%' }}>
            {stats.map(([v, l]) => (
              <div key={l} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ fontFamily: 'Hud', fontWeight: 700, fontSize: 15 * u, lineHeight: 1.1, color: '#fff' }}>{v}</div>
                <div style={{ fontFamily: 'Hud', fontWeight: 600, fontSize: 9 * u, letterSpacing: 0.9 * u, color: GOLD, textTransform: 'uppercase', marginTop: 2 * u }}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: 'Hud', fontWeight: 600, fontSize: 10 * u, letterSpacing: 1.2 * u, color: '#cfc6ae', textTransform: 'uppercase', marginTop: 7 * u, whiteSpace: 'nowrap' }}>
            {p.province ?? t('Chỉ số sẽ có sau vòng tuyển trạch')}
          </div>
        </div>
      </div>
    </div>
  );
}
