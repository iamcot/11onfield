'use client';

import { useI18n } from '@/i18n/I18nProvider';
import { initial } from '@/lib/quiz/play';
import type { BoardRow } from '@/services/quiz.service';

/** Ranked rows; the caller's own row is highlighted and pinned under the list when it is outside the top. */
export default function BoardList({ rows, me, limit, mode }: { rows: BoardRow[]; me: BoardRow | null; limit?: number; mode: 'week' | 'month' | 'all' }) {
  const { t } = useI18n();
  const shown = limit ? rows.slice(0, limit) : rows;
  const row = (r: BoardRow, pinned = false) => (
    <div key={`${r.userid}-${pinned}`} className={`qz-row of-cut p${r.place} ${me && me.userid === r.userid ? 'me' : ''}`}>
      <span className="pl">{r.place}</span>
      <span className="av">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {r.avatar ? <img src={r.avatar} alt="" loading="lazy" /> : initial(r.name)}
      </span>
      <span style={{ minWidth: 0 }}>
        <b>{r.name}</b>
        <small>{t(r.rankLabel)} · {t('đúng {n}/{m}', { n: r.correct, m: r.answered })}</small>
      </span>
      <span className="st">
        {r.stars}
        <small>{mode === 'all' ? t('sao') : t('sao kiếm được')}</small>
      </span>
    </div>
  );
  if (!rows.length) return <div className="pp-empty">{t('Chưa ai lên bảng. Chơi ngay để đứng đầu!')}</div>;
  return (
    <div className="qz-board">
      {shown.map((r) => row(r))}
      {me && !shown.some((r) => r.userid === me.userid) && (
        <>
          <div className="pp-hud pp-mute" style={{ textAlign: 'center', padding: 4 }}>···</div>
          {row(me, true)}
        </>
      )}
    </div>
  );
}
