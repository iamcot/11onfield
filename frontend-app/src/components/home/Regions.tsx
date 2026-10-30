'use client';

import Link from 'next/link';
import type { Stage } from '@/services/competition.service';
import { revealDelay } from './ui';
import { useT } from '@/i18n/I18nProvider';

const REGIONS = [
  { key: 'HANOI_NORTH', city: 'Hà Nội &', area: 'Miền Bắc', mark: 'BẮC' },
  { key: 'DANANG_CENTRAL', city: 'Đà Nẵng &', area: 'Miền Trung', mark: 'TRUNG' },
  { key: 'HCMC_SOUTH', city: 'TP HCM &', area: 'Miền Nam', mark: 'NAM' },
];

const STATUS: Record<string, string> = {
  UPCOMING: 'Sắp diễn ra',
  ACTIVE: 'Đang diễn ra',
  COMPLETED: 'Đã kết thúc',
};

function formatDate(d: string) {
  const [y, m, day] = d.split('T')[0].split('-');
  return day && m && y ? `${day}/${m}/${y}` : d;
}

// The new audition dates are not final yet. Flip to true to show the dates from the backend stages again.
const SHOW_DATES = false;

export default function Regions({ stages, ctaHref }: { stages: Stage[]; ctaHref: string }) {
  const t = useT();
  const byRegion = (key: string) =>
    !SHOW_DATES
      ? undefined
      : stages.filter((s) => s.region === key && s.stageType === 'REGIONAL_AUDITION').sort((a, b) => a.stageDate.localeCompare(b.stageDate))[0];

  return (
    <section id="lich" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <div className="flex flex-wrap items-end justify-between gap-5" data-reveal="">
          <div>
            <div className="of-eyebrow of-eyebrow--left">{t('Vòng khu vực')}</div>
            <h2 className="of-h2 mt-3">{t('Lịch tuyển trạch')}</h2>
          </div>
          <Link href="/competitions" className="of-hud text-[13px] text-[color:var(--lime-2)] hover:text-white">
            {t('Toàn bộ lịch chương trình')} ›
          </Link>
        </div>

        <div className="mt-8 grid gap-2.5 lg:mt-10 lg:grid-cols-3 lg:gap-3">
          {REGIONS.map((r, i) => {
            const stage = byRegion(r.key);
            const active = stage?.status === 'ACTIVE';
            return (
              <article
                key={r.key}
                data-reveal="zoom"
                style={revealDelay(i)}
                className={`of-glass of-cut of-cut--lg of-spot of-lift flex flex-col gap-2.5 overflow-hidden p-6 lg:p-7 ${active ? 'of-run' : 'of-run-hover'}`}
              >
                <div className="of-display of-outline pointer-events-none absolute -right-2 top-1 text-[110px] !leading-[1.2] opacity-70 lg:text-[130px]" aria-hidden="true">
                  {t(r.mark)}
                </div>
                <span className={`of-chip self-start ${active ? '' : '!border-white/40 !bg-transparent !text-[#E2EAE4]'}`}>
                  {active && <span className="of-dot" />}
                  {t(stage ? STATUS[stage.status] ?? 'Sắp diễn ra' : 'Sắp công bố')}
                </span>
                <h3 className="of-display text-[34px] lg:text-[38px]">
                  {t(r.city)}
                  <br />
                  {t(r.area)}
                </h3>
                <div className="of-num text-[14px] text-[#CBD6CF]">
                  {stage ? (
                    <>
                      {formatDate(stage.stageDate)}
                      {stage.stageTime ? ` · ${stage.stageTime.slice(0, 5)}` : ''}
                      {stage.title ? <span className="block font-medium normal-case">{stage.title}</span> : null}
                    </>
                  ) : (
                    t('Lịch thi đấu sẽ được thông báo tới thí sinh đã đăng ký')
                  )}
                </div>
                <Link href={ctaHref} className={`${active ? 'of-btn' : 'of-btn-ghost of-cut'} mt-auto !min-h-[48px] !text-[18px]`}>
                  {t('Đăng ký khu vực này')}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
