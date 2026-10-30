'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IconNext, IconPrev } from '@/components/pp/icons';
import { useI18n } from '@/i18n/I18nProvider';
import { finalRoundIndex, railScroll, roundState } from '@/lib/players/rounds';
import type { Stage } from '@/services/competition.service';

const REGION_LABELS: Record<string, string> = {
  HANOI_NORTH: 'Hà Nội & Miền Bắc',
  DANANG_CENTRAL: 'Đà Nẵng & Miền Trung',
  HCMC_SOUTH: 'TP HCM & Miền Nam',
};

function Countdown({ to }: { to: number }) {
  const { t } = useI18n();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.max(0, Math.floor((to - now) / 1000));
  const f = (n: number) => String(n).padStart(2, '0');
  const parts: [number, string][] = [
    [Math.floor(s / 86400), t('Ngày')],
    [Math.floor((s % 86400) / 3600), t('Giờ')],
    [Math.floor((s % 3600) / 60), t('Phút')],
    [s % 60, t('Giây')],
  ];
  return (
    <div className="pp-mini" role="timer" aria-label={t('Đếm ngược')}>
      {parts.map(([v, l]) => (
        <span key={l}>
          {f(v)}
          <small>{l}</small>
        </span>
      ))}
    </div>
  );
}

/**
 * Horizontal rail of the rounds with buttons at both ends. The open round sits in the 2nd slot so the previous one
 * stays in view (1st slot when it is round 1); on a phone the previous one peeks in as much as fits.
 */
export default function RoundRail({ rounds, active }: { rounds: Stage[]; active: number }) {
  const { t, intlLocale } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const [nav, setNav] = useState({ prev: false, next: false });
  const finalIdx = finalRoundIndex(rounds);

  const updateNav = () => {
    const el = track.current;
    if (!el) return;
    setNav({ prev: el.scrollLeft > 4, next: el.scrollLeft + el.clientWidth < el.scrollWidth - 4 });
  };

  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    el.scrollLeft = railScroll(cards.map((c) => ({ left: c.offsetLeft, width: c.offsetWidth })), active, el.clientWidth, 10);
    updateNav();
  }, [active, rounds.length]);

  const step = (d: number) => {
    const el = track.current;
    const first = el?.children[0] as HTMLElement | undefined;
    if (el && first) el.scrollBy({ left: d * (first.offsetWidth + 10), behavior: 'smooth' });
  };

  const date = (s: Stage) => {
    if (!s.stageDate) return t('Đang cập nhật');
    const d = new Date(s.stageDate);
    if (Number.isNaN(d.getTime())) return '';
    const day = d.toLocaleDateString(intlLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });
    return s.stageTime ? `${day} · ${s.stageTime.slice(0, 5)}` : day;
  };

  return (
    <div>
      <div className="pp-rhead">
        <span className="pp-hud">{t('Lịch trình các vòng')}</span>
        <div className="pp-rnav">
          <button className="of-cut" onClick={() => step(-1)} disabled={!nav.prev} aria-label={t('Vòng trước')}>
            <IconPrev />
          </button>
          <button className="of-cut" onClick={() => step(1)} disabled={!nav.next} aria-label={t('Vòng sau')}>
            <IconNext />
          </button>
        </div>
      </div>
      <div className="pp-rtrack" ref={track} onScroll={() => requestAnimationFrame(updateNav)}>
        {rounds.map((r, i) => {
          const st = roundState(i, active, r);
          const isFinal = i === finalIdx;
          const start = r.stageDate ? new Date(r.stageDate).getTime() : NaN;
          return (
            <article key={r.id} className={`pp-rcard of-cut ${st} ${isFinal ? 'final' : ''} ${st === 'now' ? 'of-run' : ''}`}>
              <div className="top">
                <span className="no">{String(i + 1).padStart(2, '0')}</span>
                <span className="pp-st">{st === 'done' ? `✓ ${t('Đã xong')}` : st === 'now' ? (r.status === 'LIVE' || r.status === 'ACTIVE' ? t('Đang diễn ra') : t('Sắp diễn ra')) : t('Sắp tới')}</span>
              </div>
              <h3>{r.title}</h3>
              <span className="when">
                {[date(r), r.region ? t(REGION_LABELS[r.region] ?? r.region) : null].filter(Boolean).join(' · ')}
              </span>
              {st === 'now' && start > Date.now() && <Countdown to={start} />}
            </article>
          );
        })}
      </div>
    </div>
  );
}
