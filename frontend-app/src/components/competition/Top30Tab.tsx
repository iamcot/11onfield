'use client';

import Link from 'next/link';
import { useT } from '@/i18n/I18nProvider';
import { initials, POS_INFO, posGroup } from '@/lib/players/stats';
import type { Top30 } from '@/services/competition.service';

const ORDER = ['GK', 'DF', 'MF', 'FW'] as const;

/**
 * The Top 30 picked by the jury. Sorted by position then name; no rank, no score, because the hand-picked list
 * does not follow the score order and a number would suggest it does.
 */
export default function Top30Tab({ top30 }: { top30: Top30 }) {
  const t = useT();
  const groups = ORDER.map((g) => ({
    g,
    players: top30.players.filter((p) => (posGroup(p.position ? [p.position] : undefined) ?? 'MF') === g),
  })).filter((x) => x.players.length > 0);

  return (
    <div>
      <p className="pp-note" style={{ textAlign: 'left', margin: '14px 0' }}>
        {t('Danh sách do Ban giám khảo chọn, sắp theo vị trí rồi theo tên.')}
      </p>
      {groups.map(({ g, players }) => (
        <section key={g} className="pp-t30">
          <h3 className="pp-hud">
            {t(POS_INFO[g].label)} <sup>{players.length}</sup>
          </h3>
          <ul>
            {players.map((p) => (
              <li key={p.userid}>
                <Link href={`/profile/${encodeURIComponent(p.userid)}?from=competition`} className="pp-panel of-cut">
                  <span className="clip">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.avatar ? <img src={p.avatar} alt="" loading="lazy" /> : <span className="in">{initials(p.fullName)}</span>}
                  </span>
                  <b>{p.fullName}</b>
                  <span className={`pp-pos ${g === 'GK' ? 'gk' : ''}`}>{t(POS_INFO[g].code)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
