'use client';

import { useI18n } from '@/i18n/I18nProvider';

/** Current rank, its stars and the ladder of the 8 ranks. `popStar` animates the star just won. The top rank
 * has no cap and shows "{stars} × ★" instead of a bar. */
export default function RankCard({
  rank, rankLabel, stars, starsPerRank, guard, ranks, popStar, extra,
}: {
  rank: number; rankLabel: string; stars: number; starsPerRank: number; guard: boolean; ranks: string[];
  popStar?: boolean; extra?: React.ReactNode;
}) {
  const { t } = useI18n();
  const last = rank >= ranks.length - 1;
  return (
    <div className="qz-card qz-rank of-cut">
      <div className={`qz-crest of-cut ${rank >= 5 ? 'gold' : ''}`} aria-hidden="true">{rank + 1}</div>
      <div style={{ minWidth: 0 }}>
        <span className="pp-hud pp-mute">{t('Hạng hiện tại')}</span>
        <h2 className={rank >= 5 ? 'pp-gold' : ''}>{t(rankLabel)}</h2>
        {last ? (
          // The top rank has no star cap: a count and one star instead of a bar.
          <div className="qz-stars qz-stars-count" aria-label={t('{n} sao', { n: stars })}>
            <b>{stars}</b>
            <span aria-hidden="true">×</span>
            <i key={popStar ? `pop-${stars}` : 'star'} className={`on ${popStar ? 'pop' : ''}`} />
            {guard && stars === 0 && <span className="qz-guard">🛡 {t('Còn 1 lượt giữ hạng')}</span>}
          </div>
        ) : (
          <div className="qz-stars" aria-label={t('{n} trên {m} sao', { n: stars, m: starsPerRank })}>
            {Array.from({ length: starsPerRank }, (_, i) => (
              <i key={i} className={`${i < stars ? 'on' : ''} ${popStar && i === stars - 1 ? 'pop' : ''}`} />
            ))}
            {guard && rank > 0 && stars === 0 && <span className="qz-guard">🛡 {t('Còn 1 lượt giữ hạng')}</span>}
          </div>
        )}
        {extra}
      </div>
      <div className="qz-ladder" style={{ gridColumn: '1 / -1' }} aria-label={t('Các hạng')}>
        {ranks.map((r, i) => (
          <span key={r} className={i < rank ? 'done' : i === rank ? 'now' : ''}>{t(r)}</span>
        ))}
      </div>
    </div>
  );
}
