const ITEMS = [
  'From the street to the stadium',
  '30.000 hồ sơ',
  'Tuyển trạch 3 miền',
  'Huấn luyện cùng Park Hang-seo',
  'Tập huấn La Liga',
  'Top 11 ra sân quốc gia',
  'Đăng ký miễn phí',
];

function Row({ reverse = false }: { reverse?: boolean }) {
  const items = reverse ? [...ITEMS].reverse() : ITEMS;
  return (
    <div className={`of-ticker ${reverse ? 'of-ticker--rev' : ''}`}>
      <div className="of-ticker-track py-2.5 lg:py-3">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex" aria-hidden={copy === 1}>
            {items.map((t, i) => (
              <span key={t} className="of-ticker-item">
                <span
                  className={`of-display text-[22px] lg:text-[28px] ${i % 3 === 0 ? 'of-neon' : i % 3 === 1 ? 'text-white' : 'of-gold'}`}
                >
                  {t}
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
export default function Ticker() {
  return (
    <div className="relative z-[2] my-4 overflow-hidden py-6 lg:my-8" aria-label="Điểm nổi bật chương trình">
      <div className="-mx-6 -rotate-2">
        <Row />
      </div>
      <div className="-mx-6 mt-1 rotate-1 opacity-80">
        <Row reverse />
      </div>
    </div>
  );
}
