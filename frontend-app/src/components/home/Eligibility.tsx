import { revealDelay } from './ui';

const ITEMS = [
  { label: 'Đối tượng', title: <>Nam <span className="of-neon">16–21</span></>, sub: 'Sinh từ 2006 đến 2011' },
  { label: 'Ai cũng có thể', title: <>HS · SV · Phong trào</>, sub: 'và cầu thủ học viện' },
  { label: 'Phạm vi', title: <>Người Việt <span className="of-neon">toàn cầu</span></>, sub: 'Tuyển trạch 3 miền' },
  { label: 'Chi phí', title: <span className="of-gold">Miễn phí</span>, sub: 'Đăng ký online trong 5 phút' },
];

export default function Eligibility() {
  return (
    <section aria-label="Điều kiện tham gia" className="relative z-[2] px-4 lg:px-6">
      <div className="mx-auto grid max-w-[1240px] grid-cols-2 gap-2.5 lg:grid-cols-4 lg:gap-0">
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
            <div className="of-display mt-1.5 text-[24px] lg:text-[34px]">{it.title}</div>
            <div className="mt-1 text-[12.5px] text-[#BFCCC4] lg:text-sm">{it.sub}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
