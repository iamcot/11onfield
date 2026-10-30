import { SectionHead, revealDelay } from './ui';

const PILLARS = [
  { title: 'Thể lực', text: 'Sức bền, tốc độ, sức mạnh đo bằng Bio-metrics' },
  { title: 'Kỹ thuật', text: 'Kiểm soát, xử lý bóng, kỹ năng theo vị trí' },
  { title: 'Chiến thuật', text: 'Đọc trận đấu, phối hợp đội hình' },
  { title: 'Tâm lý, tư duy', text: 'Bản lĩnh thi đấu, chịu áp lực' },
  { title: 'Kỹ năng mềm', text: 'Truyền thông, thương hiệu cá nhân, hợp đồng' },
];

// names are not signed yet: one mystery silhouette per open slot
const SLOTS = [
  { name: 'Biểu tượng di sản', slots: 1, gold: true },
  { name: 'Chuyên gia quốc tế', slots: 2, role: 'Đến từ La Liga' },
  { name: 'Siêu sao bóng đá', slots: 2 },
  { name: 'Chủ tịch quyền lực', slots: 1 },
];
const COACHES = SLOTS.flatMap((s) => Array.from({ length: s.slots }, (_, i) => ({ ...s, key: `${s.name}-${i}`, role: 'Sắp công bố', ...s })));

function Silhouette({ gold }: { gold?: boolean }) {
  const c = gold ? '#E3C27E' : '#A6E35A';
  return (
    <svg className="of-coach-mono" viewBox="0 0 120 150" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={gold ? 'of-sil-g' : 'of-sil-l'} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity=".5" />
          <stop offset="1" stopColor={c} stopOpacity=".04" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="48" r="26" fill={`url(#${gold ? 'of-sil-g' : 'of-sil-l'})`} stroke={c} strokeOpacity=".8" strokeWidth="1.6" />
      <path d="M8 150c0-38 22-58 52-58s52 20 52 58z" fill={`url(#${gold ? 'of-sil-g' : 'of-sil-l'})`} stroke={c} strokeOpacity=".8" strokeWidth="1.6" strokeLinejoin="round" />
      <text x="60" y="60" textAnchor="middle" fontSize="34" fontWeight="800" fill={c} fillOpacity=".95" fontFamily="inherit">
        ?
      </text>
    </svg>
  );
}

export default function Training() {
  return (
    <section id="huan-luyen" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid items-center gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-14">
          <div className="relative mx-auto w-full max-w-[420px]" data-reveal="left">
            <div className="of-cut of-cut--lg of-cut--b2 of-run bg-[rgba(6,20,14,.4)] p-2">
              <div className="of-cut overflow-hidden" style={{ ['--ring' as string]: 'transparent' }}>
                <img
                  src="/images/home/street.jpg"
                  alt="Đôi giày cũ và quả bóng trên đường phố"
                  className="block h-[380px] w-full object-cover transition-transform duration-700 hover:scale-105 lg:h-[520px]"
                  loading="lazy"
                />
              </div>
              <div className="of-brackets" />
            </div>
            <div className="of-float of-glass of-cut of-cut--sm absolute -right-2 bottom-8 max-w-[230px] px-4 py-3 lg:-right-8">
              <div className="of-hud text-[10px] text-[color:var(--lime)]">Insight</div>
              <div className="mt-1 text-[13.5px]">Gần 100 triệu người cuồng nhiệt, hàng vạn tài năng đường phố.</div>
            </div>
          </div>

          <div className="min-w-0">
            <SectionHead
              align="left"
              eyebrow="Biến bản năng thành chuyên nghiệp"
              title={
                <>
                  5 trụ cột
                  <br />
                  huấn luyện
                </>
              }
              lede="Mỗi tập là một thử thách. Bạn được đo, được chấm, được dẫn dắt."
            />
            <div className="of-pillars mt-8 flex flex-col gap-2.5">
              {PILLARS.map((p, i) => (
                <div
                  key={p.title}
                  data-reveal="right"
                  style={revealDelay(i)}
                  className="of-pillar of-glass of-cut of-cut--sm of-spot of-run-hover flex items-center gap-4 px-4 py-3.5 lg:gap-5 lg:px-5"
                >
                  <span className="of-display of-neon w-11 text-[34px]">0{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="of-display text-[23px] lg:text-[25px]">{p.title}</div>
                    <div className="text-[13.5px] text-[#CBD6CF]">{p.text}</div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#A6E35A" strokeWidth={2} aria-hidden="true" className="shrink-0 opacity-60">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-24 lg:mt-32">
          <SectionHead eyebrow="Người dẫn đường" title="Ban huấn luyện & khách mời" />
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6 lg:gap-4">
            {COACHES.map((c, i) => (
              <div key={c.key} className="of-coach text-center" data-reveal="" style={revealDelay(i)}>
                <div
                  className={`${c.gold ? 'of-glass-gold of-cut--gold of-run' : 'of-glass of-run-hover'} of-cut of-spot flex aspect-[3/4] items-center justify-center overflow-hidden`}
                >
                  <Silhouette gold={c.gold} />
                </div>
                <div className={`of-display mt-3 text-[22px] lg:text-[24px] ${c.gold ? 'of-gold' : ''}`}>{c.name}</div>
                <div className={`text-[13px] ${c.gold ? 'text-[color:var(--gold-2)]' : 'text-[#BFCCC4]'}`}>{c.role}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
