'use client';

import { useT } from '@/i18n/I18nProvider';

interface Props {
  id: number | string;
  title: string;
  eventType?: string;
  partnerName?: string | null;
  startDate?: string;
  className?: string;
  /** larger type for the event page */
  large?: boolean;
}

// a few brand-safe backdrops; an event always gets the same one
const PALETTES = [
  ['#0f3d22', '#1f6b32', '#b6e35a'],
  ['#0d2b3e', '#1b5e7a', '#7fd6e8'],
  ['#2a1a3e', '#4b2a6b', '#d3a6ff'],
  ['#3a1f12', '#7a3b1b', '#ffb36b'],
  ['#102a2a', '#1e5c52', '#8ef0c8'],
  ['#2b2b12', '#5c5a1b', '#f2e26b'],
];
const RECRUIT = ['#3b2507', '#8a5a12', '#ffc94d'];

function pick(id: number | string, eventType?: string) {
  if (eventType === 'RECRUITMENT') return RECRUIT;
  const n = Number(id);
  const h = Number.isFinite(n) ? n : String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return PALETTES[Math.abs(h) % PALETTES.length];
}

/**
 * The cover of an event without a picture: a gradient picked from the event id (amber for recruitment) over faint
 * field lines, the event kind, the title (or the recruiting club) in big type, the date and the brand.
 */
export default function EventCover({ id, title, eventType, partnerName, startDate, className = '', large }: Props) {
  const t = useT();
  const [from, to, accent] = pick(id, eventType);
  const recruit = eventType === 'RECRUITMENT';
  const headline = recruit && partnerName ? partnerName : title;
  const date = startDate ? new Date(startDate).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

  return (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{ background: `radial-gradient(120% 90% at 85% 15%, ${to} 0%, ${from} 70%)` }}
      aria-label={title}
      role="img"
    >
      {/* field lines */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <g fill="none" stroke={accent} strokeOpacity="0.16" strokeWidth="1.5">
          <rect x="10" y="10" width="380" height="180" />
          <line x1="200" y1="10" x2="200" y2="190" />
          <circle cx="200" cy="100" r="34" />
          <rect x="10" y="55" width="50" height="90" />
          <rect x="340" y="55" width="50" height="90" />
        </g>
      </svg>
      <div className="relative flex h-full flex-col justify-between p-5">
        <div className="flex items-center justify-between gap-3">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em]"
            style={{ background: `${accent}26`, color: accent }}
          >
            {recruit ? t('Tuyển sinh') : t('Sự kiện')}
          </span>
          {date && <span className="text-[12px] font-semibold text-white/75">{date}</span>}
        </div>
        <div>
          <div
            className={`line-clamp-2 font-extrabold uppercase leading-[1.05] text-white ${large ? 'text-[30px] md:text-[44px]' : 'text-[24px]'}`}
          >
            {headline}
          </div>
          <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>
            11 On Field
          </div>
        </div>
      </div>
    </div>
  );
}
