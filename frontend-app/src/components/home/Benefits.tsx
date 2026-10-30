import { Icons, SectionHead, revealDelay } from './ui';

const BENEFITS = [
  { icon: Icons.coach, title: 'Huấn luyện chuẩn chuyên nghiệp', text: '4 tháng cùng Park Hang-seo, chuyên gia La Liga và chuyên gia hàng đầu Việt Nam.' },
  { icon: Icons.globe, title: 'Tập huấn tại Tây Ban Nha', text: 'Top 11 đi World Cup Tour, học hỏi trực tiếp nền bóng đá La Liga.' },
  { icon: Icons.stadium, title: 'Ra sân vận động quốc gia', text: 'Final Match phát sóng truyền hình toàn quốc, trước hàng vạn khán giả.' },
  { icon: Icons.contract, title: 'Hợp đồng CLB chuyên nghiệp', text: 'Cơ hội ký với CLB trong nước, quốc tế và được chọn vào Đội tuyển quốc gia.' },
  { icon: Icons.scholarship, title: 'Học bổng', text: 'Học bổng tú tài, cử nhân và đào tạo bóng đá chuyên nghiệp.' },
  { icon: Icons.trophy, title: 'Giải thưởng & thương hiệu', text: 'Hiện kim, hiện vật, cúp vàng và hàng triệu khán giả biết đến bạn.', gold: true },
];

export default function Benefits() {
  return (
    <section id="quyen-loi" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead eyebrow="Không chỉ hào quang" title="Bạn nhận được gì?" lede="Không chỉ trao cúp, chúng tôi trao cơ hội sự nghiệp." />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-5">
          {BENEFITS.map((b, i) => (
            <article
              key={b.title}
              data-reveal={i % 2 ? 'right' : 'left'}
              style={revealDelay(i % 3)}
              className={`${b.gold ? 'of-glass-gold of-cut--gold' : 'of-glass'} of-cut of-spot of-lift of-run-hover overflow-hidden p-5 lg:p-7`}
            >
              <div
                className={`of-display pointer-events-none absolute right-3 top-1 text-[76px] lg:text-[96px] ${b.gold ? '' : 'of-outline'}`}
                style={b.gold ? { color: 'transparent', WebkitTextStroke: '1.5px rgba(227,194,126,.5)' } : undefined}
                aria-hidden="true"
              >
                0{i + 1}
              </div>
              <div className={b.gold ? 'text-[color:var(--gold-2)]' : 'text-[color:var(--lime-2)]'} style={{ filter: `drop-shadow(0 0 8px ${b.gold ? 'rgba(227,194,126,.7)' : 'rgba(166,227,90,.75)'})` }}>
                {b.icon}
              </div>
              <h3 className={`of-display mt-4 text-[26px] lg:text-[30px] ${b.gold ? 'of-gold' : ''}`}>{b.title}</h3>
              <p className="mt-1.5 text-[14.5px] text-[#CBD6CF] lg:text-[15px]">{b.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
