'use client';

import { useEffect, useMemo, useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import { initials, POS_INFO, posGroup } from '@/lib/players/stats';
import { toPlayerView, type PlayerView } from '@/lib/players/view';
import { playerService } from '@/services/player.service';
import type { Top30 } from '@/services/competition.service';
import PlayerDrawer from './PlayerDrawer';

const ORDER = ['GK', 'DF', 'MF', 'FW'] as const;

/**
 * The Top 30 picked by the jury. Sorted by position then name; no rank, no score, because the hand-picked list
 * does not follow the score order and a number would suggest it does. A card opens the same drawer as the
 * player list.
 */
export default function Top30Tab({ top30, competitionId }: { top30: Top30; competitionId: number }) {
  const t = useT();
  const groups = ORDER.map((g) => ({
    g,
    players: top30.players.filter((p) => (posGroup(p.position ? [p.position] : undefined) ?? 'MF') === g),
  })).filter((x) => x.players.length > 0);

  // The drawer needs the full player view: load the competition's players once and match them by userid.
  const [views, setViews] = useState<Map<string, PlayerView>>(new Map());
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    (async () => {
      const out = new Map<string, PlayerView>();
      for (let page = 0, pages = 1; page < pages && page < 20; page++) {
        const r = await playerService.getPlayers(page, 100, { competitionId });
        r.data.map(toPlayerView).forEach((v) => out.set(v.userid, v));
        pages = r.totalPages;
      }
      if (live) setViews(out);
    })().catch(() => {});
    return () => { live = false; };
  }, [competitionId]);
  const order = useMemo(
    () => groups.flatMap((x) => x.players).map((p) => views.get(p.userid)).filter((v): v is PlayerView => !!v),
    [groups, views],
  );
  const openFor = (userid: string) => {
    const i = order.findIndex((v) => v.userid === userid);
    if (i >= 0) setOpen(i);
  };

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
            {players.map((p, i) => (
              <li key={p.userid} style={{ ['--i' as string]: i }}>
                {/* Card: the cut-out photo is twice the height of the name bar and stands up out of it. */}
                <button type="button" onClick={() => openFor(p.userid)} disabled={!views.has(p.userid)} aria-label={p.fullName}
                  className={`pp-t30c ${g === 'GK' ? 'gk' : ''}`}>
                  <span className={`ph ${p.avatar ? '' : 'none'}`} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {p.avatar ? <img src={p.avatar} alt="" loading="lazy" /> : <span className="in">{initials(p.fullName)}</span>}
                  </span>
                  <span className="bar of-cut">
                    <b>{p.fullName}</b>
                    <span className={`pp-pos ${g === 'GK' ? 'gk' : ''}`}>{t(POS_INFO[g].code)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {open !== null && order[open] && <PlayerDrawer players={order} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </div>
  );
}
