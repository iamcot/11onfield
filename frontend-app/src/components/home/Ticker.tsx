'use client';

import { useT } from '@/i18n/I18nProvider';

export const PLAYER_TICKER = [
  'Từ Đường Phố ra Sân Vận Động',
  '30.000 hồ sơ',
  'Tuyển trạch 3 miền',
  'Huấn luyện cùng chuyên gia La Liga',
  'Top 11 đi World Cup Tour',
  'Ra sân quốc gia, hàng triệu khán giả',
  'Đăng ký miễn phí',
];

function Row({ items: base, reverse = false }: { items: string[]; reverse?: boolean }) {
  const t = useT();
  const items = reverse ? [...base].reverse() : base;
  return (
    <div className={`of-ticker ${reverse ? 'of-ticker--rev' : ''}`}>
      <div className="of-ticker-track py-2.5 lg:py-3">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex" aria-hidden={copy === 1}>
            {items.map((text, i) => (
              <span key={text} className="of-ticker-item">
                <span
                  className={`of-display text-[22px] lg:text-[28px] ${i % 3 === 0 ? 'of-neon' : i % 3 === 1 ? 'text-white' : 'of-gold'}`}
                >
                  {t(text)}
                </span>
                <svg width="14" height="14" viewBox="0 0 10 10" aria-hidden="true">
                  <path d="M5 0l5 5-5 5-5-5z" fill="#A6E35A" />
                </svg>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stadium LED board crossing the page at a slight angle. */
export default function Ticker({ items = PLAYER_TICKER }: { items?: string[] }) {
  const t = useT();
  return (
    <div className="relative z-[2] my-4 overflow-hidden py-6 lg:my-8" aria-label={t('Điểm nổi bật chương trình')}>
      <div className="-mx-6 -rotate-2">
        <Row items={items} />
      </div>
      <div className="-mx-6 mt-1 rotate-1 opacity-80">
        <Row items={items} reverse />
      </div>
    </div>
  );
}
