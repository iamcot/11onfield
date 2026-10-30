'use client';

import { revealDelay } from './ui';
import { useT } from '@/i18n/I18nProvider';
import { rich } from '@/i18n/rich';

export default function Eligibility() {
  const t = useT();
  const neon = { n: (c: string) => <span className="of-neon">{c}</span> };
  const ITEMS = [
    { label: t('Đối tượng'), title: rich(t('Nam <n>16–21</n>'), neon), sub: t('Sinh từ 2006 đến 2011') },
    { label: t('Ai cũng có thể'), title: t('HS · SV · Phong trào'), sub: t('và cầu thủ học viện') },
    { label: t('Phạm vi'), title: rich(t('Người Việt <n>toàn cầu</n>'), neon), sub: t('Tuyển trạch 3 miền') },
    { label: t('Chi phí'), title: <span className="of-gold">{t('Miễn phí')}</span>, sub: t('Đăng ký online trong 5 phút') },
  ];
  return (
    <section aria-label={t('Điều kiện tham gia')} className="relative z-[2] px-4 lg:px-6">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-3 lg:gap-4 xl:grid-cols-4">
        {ITEMS.map((it, i) => (
          <div
            key={it.label}
            data-reveal=""
            style={revealDelay(i)}
            className={`of-glass of-cut of-cut--sm of-spot of-run-hover px-4 py-4 lg:px-6 lg:py-6 ${
              i === 3 ? 'of-cut--gold' : ''
            }`}
          >
            <div className="of-hud text-[10px] text-[color:var(--lime)] lg:text-[11px]">{it.label}</div>
            <div className="of-display mt-1.5 text-[24px] lg:whitespace-nowrap lg:text-[32px] xl:text-[30px]">{it.title}</div>
            <div className="mt-1 text-[12.5px] text-[#BFCCC4] lg:text-sm">{it.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
