'use client';

import { useRef } from 'react';
import CountUp from '../home/CountUp';
import { useScrollProgress } from '../home/effects';
import { ArrowRight, SectionHead, cssVars, revealDelay } from '../home/ui';
import { PIcons } from './icons';

const glow = (gold = false) => ({ filter: `drop-shadow(0 0 8px ${gold ? 'rgba(227,194,126,.7)' : 'rgba(166,227,90,.75)'})` });

/* ------------------------------------------------------------------ hero */

const FUNNEL = [
  { label: 'Hồ sơ', value: '30.000', sub: 'đăng ký trên 11onfield.com', w: '100%' },
  { label: 'Scouting', value: 'Top 100', sub: 'mỗi khu vực, rồi toàn quốc', w: '74%' },
  { label: 'Lên tuyển', value: 'Top 30', sub: '4 tháng huấn luyện', w: '50%' },
  { label: 'Phát sóng', value: '12 × 90′', sub: 'tập phim truyền hình', w: '34%' },
  { label: 'Ra sân', value: 'Top 11', sub: 'Final Match SVĐ quốc gia', w: '20%', gold: true },
];

export function PartnerHero() {
  return (
    <section id="top" className="relative px-4 pb-16 lg:px-6 lg:pb-24" style={{ paddingTop: 'calc(var(--header-h) + 28px)' }}>
      <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14 lg:pt-6">
        <div className="min-w-0">
          <div className="of-in flex flex-wrap gap-2" style={cssVars({ '--i': -3 })}>
            <span className="of-chip">
              <span className="of-dot" />
              Sportainment reality show
            </span>
            <span className="of-chip of-chip--gold">Mùa 1 · 2027</span>
          </div>
          <h1 className="of-display mt-5 text-[60px] text-white sm:text-[84px] lg:text-[104px]" style={{ textShadow: '0 0 40px rgba(166,227,90,.4), 0 4px 0 rgba(0,0,0,.35)' }}>
            <span className="of-line">
              <span style={cssVars({ '--i': 0 })}>
                <em className="of-shine-gold pr-[0.06em]" style={{ fontStyle: 'italic' }}>
                  11
                </em>{' '}
                người
              </span>
            </span>
            <span className="of-line">
              <span style={cssVars({ '--i': 1 })}>ra sân</span>
            </span>
          </h1>
          <div className="of-in of-display mt-4 text-[17px] font-bold !leading-[1.25] tracking-[0.3em] sm:text-[22px]" style={cssVars({ '--i': 0 })}>
            <span className="of-shine-gold">From the street to the stadium</span>
          </div>
          <p className="of-in mt-5 max-w-[560px] text-[17px] text-[#E2EAE4] sm:text-[19px]" style={cssVars({ '--i': 1 })}>
            Format truyền hình thực tế bóng đá <strong className="text-white">tiêu chuẩn quốc tế đầu tiên</strong> tại Việt Nam: tìm kiếm, đào tạo và đưa 11 tài năng
            trẻ ra sân vận động quốc gia.
          </p>
          <div className="of-in mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={cssVars({ '--i': 2 })}>
            <a href="#lien-he" className="of-btn">
              Nhận hồ sơ hợp tác <ArrowRight />
            </a>
            <a href="#format" className="of-btn-ghost of-cut">
              Xem format 12 tập
            </a>
          </div>
        </div>

        <div className="of-hero-media min-w-0">
          <div data-reveal="" className="of-glass of-cut of-cut--lg of-cut--b2 of-run relative mx-auto max-w-[520px] p-5 lg:mr-0 lg:p-7">
            <div className="of-brackets" />
            <div className="flex items-center justify-between">
              <div className="of-hud text-[11px] text-[color:var(--lime)]">Phễu tuyển chọn</div>
              <div className="of-hud flex items-center gap-2 text-[10px] text-[color:var(--mute)]">
                <span className="of-dot of-dot--red" /> Live
              </div>
            </div>
            <ol className="mt-4 flex flex-col gap-3.5">
              {FUNNEL.map((f, i) => (
                <li key={f.label} className="of-in" style={cssVars({ '--i': 2 + i })}>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="of-hud text-[10px] text-[color:var(--mute)]">{f.label}</span>
                    <span className="truncate text-[12px] text-[#AFC0B6]">{f.sub}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <span className={`of-display w-[112px] shrink-0 text-[30px] ${f.gold ? 'of-gold' : 'text-white'}`}>{f.value}</span>
                    <div className="of-meter flex-1 !h-[6px]" style={cssVars({ '--w': f.w })}>
                      <i style={f.gold ? { background: 'linear-gradient(90deg,#C9A25A,#F3DFAF)', boxShadow: '0 0 10px rgba(227,194,126,.8)' } : undefined} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- mission */

const USP = [
  { title: 'Lần đầu tuyển chọn cầu thủ lên sóng truyền hình', text: 'Scouting trở thành một hành trình thử thách công khai.' },
  { title: 'Không cảm tính, chấm điểm bằng dữ liệu', text: 'Hội đồng chuyên môn, dữ liệu công nghệ, bình chọn khán giả.' },
  { title: 'Câu chuyện thật, cảm xúc thật, vinh quang thật', text: 'Hy sinh, drama phòng thay đồ và niềm tự hào màu cờ sắc áo.' },
];

export function Mission() {
  return (
    <section id="su-menh" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-14">
          <div data-reveal="left">
            <div className="of-eyebrow of-eyebrow--left">Insight</div>
            <p className="of-display mt-4 text-[38px] text-white lg:text-[54px]">
              Sự cuồng nhiệt của gần <span className="of-neon">100 triệu</span> người và hàng vạn tài năng đường phố.
            </p>
          </div>
          <div data-reveal="right" className="of-glass of-cut of-cut--lg of-run-hover of-spot p-6 lg:p-8">
            <div className="of-hud text-[11px] text-[color:var(--lime)]">Sứ mệnh</div>
            <h2 className="of-display mt-2 text-[34px] lg:text-[42px]">
              Biến bản năng thành <span className="of-gold">chuyên nghiệp</span>
            </h2>
            <p className="mt-3 text-[#CBD6CF]">
              Chương trình mô phỏng giai đoạn <strong className="text-white">after academy – before pro</strong>: sau khi được tuyển chọn và đào tạo, làm sao để cầu thủ hoàn
              thiện mình và vụt sáng thành sao.
            </p>
            <div className="of-rule my-5" />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <div className="text-[13px] text-[#AFC0B6]">Không chỉ hào quang</div>
                <div className="of-display text-[22px]">chúng tôi tạo cơ hội thật</div>
              </div>
              <div>
                <div className="text-[13px] text-[#AFC0B6]">Không chỉ tặng cúp</div>
                <div className="of-display text-[22px]">chúng tôi trao hợp đồng sự nghiệp</div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-10 grid gap-3 lg:mt-14 lg:grid-cols-3 lg:gap-5">
          {USP.map((u, i) => (
            <article key={u.title} data-reveal="" style={revealDelay(i)} className="of-glass of-cut of-spot of-lift of-run-hover overflow-hidden p-6 lg:p-7">
              <div className="of-display of-outline pointer-events-none absolute right-3 top-1 text-[84px]" aria-hidden="true">
                0{i + 1}
              </div>
              <h3 className="of-display max-w-[85%] text-[26px] lg:text-[28px]">{u.title}</h3>
              <p className="mt-2 text-[14.5px] text-[#CBD6CF]">{u.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- market */

export function Market() {
  return (
    <section id="thi-truong" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead eyebrow="Cơ hội thị trường" title="Khai phá đại dương xanh" />
        <div className="mt-12 grid items-center gap-4 lg:grid-cols-[1fr_auto_1.2fr_auto_1fr] lg:gap-6">
          <div data-reveal="left" className="of-glass of-cut p-6 text-center">
            <div className="of-hud text-[11px] text-[color:var(--mute)]">Bóng đá phong trào</div>
            <div className="of-display mt-2 text-[28px]">Đông đảo nhưng rời rạc</div>
            <div className="mt-1 text-[14px] text-[#CBD6CF]">Đam mê nhưng thiếu định hướng</div>
          </div>
          <div className="of-flow mx-auto" aria-hidden="true" />
          <div data-reveal="zoom" className="of-gate of-glass-gold of-cut of-cut--lg of-cut--gold of-cut--b2 of-run p-8 text-center">
            <div className="of-hud text-[11px] text-[color:var(--gold-2)]">11 On Field</div>
            <div className="of-display of-gold mt-2 text-[40px] lg:text-[46px]">Cánh cửa chuyển hóa</div>
            <p className="mt-2 text-[14.5px] text-[#E3DCC8]">Cơ hội cuối cùng cho những tài năng bóng đá thực sự muốn chinh phục giấc mơ sân cỏ.</p>
          </div>
          <div className="of-flow mx-auto" aria-hidden="true" />
          <div data-reveal="right" className="of-glass of-cut p-6 text-center">
            <div className="of-hud text-[11px] text-[color:var(--mute)]">Bóng đá chuyên nghiệp</div>
            <div className="of-display mt-2 text-[28px]">Khắt khe</div>
            <div className="mt-1 text-[14px] text-[#CBD6CF]">Khó tiếp cận</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------------------------------------- format */

const EPISODES = [
  { ep: '01', title: 'Scouting', text: 'Từ 30.000 chọn 30. Thiết lập cảm xúc.' },
  { ep: '03', title: 'Standard', text: 'Tiêu chuẩn chuyên nghiệp.' },
  { ep: '07', title: 'Contract', text: 'Cơ hội nghề nghiệp.' },
  { ep: '09', title: 'Branding', text: 'Lan tỏa thương hiệu.' },
  { ep: '11', title: 'Intern', text: 'World Cup Tour, tập huấn La Liga.' },
  { ep: '12', title: 'Final Match', text: 'Chính thức ra sân SVĐ quốc gia.', gold: true },
];

export function Format() {
  const ref = useRef<HTMLDivElement>(null);
  const p = useScrollProgress(ref);
  return (
    <section id="format" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead eyebrow="Format · 4 tháng · 12 tập × 90 phút" title="Lộ trình 12 tập" lede="Hành trình chuyển hóa từ đường phố đến sân vận động." />
        <div ref={ref} className="relative mt-12 lg:mt-16" style={cssVars({ '--p': p })}>
          <div className="of-rail left-[31px] top-[32px] bottom-[32px] w-[2px] lg:left-[8%] lg:right-[8%] lg:top-[41px] lg:bottom-auto lg:h-[3px] lg:w-auto" aria-hidden="true">
            <i />
          </div>
          <ol className="relative flex flex-col gap-7 lg:grid lg:grid-cols-6 lg:gap-4">
            {EPISODES.map((e, i) => {
              const lit = p >= (i / (EPISODES.length - 1)) * 0.96;
              return (
                <li key={e.ep} className={`of-step flex items-center gap-5 lg:flex-col lg:text-center ${e.gold ? 'of-step--gold' : ''} ${lit ? 'is-lit' : ''}`}>
                  <div className="of-node">{e.ep}</div>
                  <div className="of-step-body min-w-0">
                    <div className="of-hud text-[10px] text-[color:var(--lime)] lg:mt-2">Tập {Number(e.ep)}</div>
                    <h3 className={`of-display text-[26px] ${e.gold ? 'of-gold' : ''}`}>{e.title}</h3>
                    <p className="text-[14px] text-[#CBD6CF]">{e.text}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
        <div className="mt-12 flex flex-wrap justify-center gap-2" data-reveal="">
          {['Thể lực', 'Kỹ thuật', 'Chiến thuật', 'Tâm lý tư duy', 'Kỹ năng mềm'].map((t) => (
            <span key={t} className="of-chip !px-4 !py-1.5 !text-[12px]">
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------ production */

const PRODUCTION = [
  { icon: PIcons.film, tag: 'Cinematic 4K', title: 'Hình ảnh như phim thể thao', text: 'Kể câu chuyện cầu thủ bằng ngôn ngữ điện ảnh.' },
  { icon: PIcons.pulse, tag: 'Bio-Metrics', title: 'Dữ liệu chuẩn quốc tế', text: 'Đánh giá năng lực bằng dữ liệu chính xác.' },
  { icon: PIcons.app, tag: 'Real-time App', title: 'Tương tác trực tiếp', text: 'Khán giả tham gia vào hành trình cầu thủ.' },
];

export function Production() {
  return (
    <section id="san-xuat" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead
          eyebrow="Tiêu chuẩn sản xuất quốc tế"
          title="Không chỉ là gameshow"
          lede="11 ON FIELD được định vị như một premium football entertainment experience."
        />
        <div className="mt-10 grid gap-3 lg:mt-14 lg:grid-cols-3 lg:gap-5">
          {PRODUCTION.map((x, i) => (
            <article key={x.tag} data-reveal="zoom" style={revealDelay(i)} className="of-glass of-cut of-cut--lg of-spot of-lift of-run-hover p-6 lg:p-8">
              <div className="text-[color:var(--lime-2)]" style={glow()}>
                {x.icon}
              </div>
              <div className="of-hud mt-4 text-[11px] text-[color:var(--lime)]">{x.tag}</div>
              <h3 className="of-display mt-1 text-[28px] lg:text-[32px]">{x.title}</h3>
              <p className="mt-2 text-[14.5px] text-[#CBD6CF]">{x.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ cast */

const COACHES = [
  { name: 'Park Hang-seo', role: 'Biểu tượng di sản', mono: 'PH', gold: true },
  { name: 'Chuyên gia La Liga', role: 'Sắp công bố', mono: 'LL' },
  { name: 'Chuyên gia Việt Nam', role: 'Sắp công bố', mono: 'VN' },
];
const GUESTS = [
  { name: 'Quang Hải', mono: 'QH' },
  { name: 'Đình Bắc', mono: 'ĐB' },
  { name: 'Xuân Son', mono: 'XS' },
  { name: 'Đặng Văn Lâm', mono: 'VL' },
];

function Person({ name, role, mono, gold, d }: { name: string; role?: string; mono: string; gold?: boolean; d: number }) {
  return (
    <div className="of-coach text-center" data-reveal="" style={revealDelay(d)}>
      <div className={`${gold ? 'of-glass-gold of-cut--gold of-run' : 'of-glass of-run-hover'} of-cut of-spot flex aspect-[3/4] items-center justify-center overflow-hidden`}>
        <span
          className="of-display of-coach-mono !text-[84px] lg:!text-[96px]"
          style={{ color: 'transparent', WebkitTextStroke: gold ? '1.5px rgba(227,194,126,.75)' : '1.5px rgba(166,227,90,.5)' }}
          aria-hidden="true"
        >
          {mono}
        </span>
      </div>
      <div className={`of-display mt-3 text-[20px] lg:text-[22px] ${gold ? 'of-gold' : ''}`}>{name}</div>
      {role && <div className={`text-[12.5px] ${gold ? 'text-[color:var(--gold-2)]' : 'text-[#BFCCC4]'}`}>{role}</div>}
    </div>
  );
}

export function Cast() {
  return (
    <section id="nhan-vat" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead eyebrow="Nhân vật trung tâm" title="Thí sinh · Ban huấn luyện · Ngôi sao" />
        <div className="mt-10 grid gap-6 lg:mt-14 lg:grid-cols-[0.9fr_1.1fr_1.4fr] lg:gap-8">
          <div data-reveal="left" className="of-glass of-cut of-cut--lg of-run-hover of-spot flex flex-col justify-end overflow-hidden p-6 lg:p-8">
            <div className="of-display pointer-events-none absolute -right-2 -top-4 text-[150px] lg:text-[170px]" style={{ color: 'transparent', WebkitTextStroke: '1.5px rgba(227,194,126,.45)' }} aria-hidden="true">
              16
            </div>
            <div className="of-hud text-[11px] text-[color:var(--lime)]">Thí sinh</div>
            <div className="of-display mt-1 text-[44px]">
              <span className="of-neon">16 – 21</span> tuổi
            </div>
            <p className="mt-2 text-[14.5px] text-[#CBD6CF]">
              Người Việt trong nước và toàn cầu: học sinh, sinh viên, cầu thủ phong trào, lò đào tạo chuyên nghiệp.
            </p>
          </div>
          <div>
            <div className="of-hud mb-3 text-[11px] text-[color:var(--lime)]">Ban huấn luyện</div>
            <div className="grid grid-cols-3 gap-3">
              {COACHES.map((c, i) => (
                <Person key={c.name} {...c} d={i} />
              ))}
            </div>
          </div>
          <div>
            <div className="of-hud mb-3 text-[11px] text-[color:var(--lime)]">Khách mời ngôi sao</div>
            <div className="grid grid-cols-4 gap-3">
              {GUESTS.map((g, i) => (
                <Person key={g.name} {...g} d={i + 1} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- ecosystem */

const BACKERS = [
  { icon: PIcons.shield, title: 'VFF', text: 'Bảo chứng chuyên môn' },
  { icon: PIcons.ball, title: 'Chuyên gia La Liga', text: 'Huấn luyện & đánh giá' },
  { icon: PIcons.academy, title: 'Học viện hàng đầu', text: 'Các học viện trong nước' },
  { icon: PIcons.pitch, title: 'Sân & sản xuất', text: 'Sân tập, thi đấu, ekip' },
];
const IP_ASSETS = [
  'Format Bible & kịch bản sản xuất',
  'Tiêu chuẩn kỹ thuật sản xuất',
  'Quy trình tuyển chọn',
  'Tiêu chuẩn chuyên môn huấn luyện',
  'Bộ nhận diện, logo, cúp',
  'Website & nền tảng đăng ký',
  'Cấu trúc & bảng quyền lợi tài trợ',
];

export function Ecosystem() {
  return (
    <section id="he-sinh-thai" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
        <div>
          <SectionHead align="left" eyebrow="Bảo chứng" title="Hệ sinh thái bóng đá sẵn sàng" />
          <div className="mt-8 grid grid-cols-2 gap-3 lg:gap-4">
            {BACKERS.map((b, i) => (
              <div key={b.title} data-reveal="" style={revealDelay(i)} className="of-glass of-cut of-spot of-lift of-run-hover p-5 lg:p-6">
                <div className="text-[color:var(--lime-2)]" style={glow()}>
                  {b.icon}
                </div>
                <div className="of-display mt-3 text-[24px] lg:text-[28px]">{b.title}</div>
                <div className="text-[13.5px] text-[#CBD6CF]">{b.text}</div>
              </div>
            ))}
          </div>
          <div className="of-glass of-cut of-cut--sm mt-3 flex items-center gap-4 px-5 py-4 lg:mt-4" data-reveal="">
            <span className="of-display of-neon text-[44px] leading-none">
              <CountUp to={30} />+
            </span>
            <span className="text-[14px] text-[#CBD6CF]">thành viên ban cố vấn chuyên môn: bóng đá, sản xuất, truyền thông, công nghệ</span>
          </div>
        </div>
        <div data-reveal="right" className="of-glass-gold of-cut of-cut--lg of-cut--gold of-run self-start p-6 lg:p-8">
          <div className="of-brackets" />
          <div className="of-hud text-[11px] text-[color:var(--gold-2)]">Tài sản IP</div>
          <div className="of-display of-gold mt-1 text-[36px]">Sẵn sàng triển khai</div>
          <ul className="mt-5 flex flex-col gap-3">
            {IP_ASSETS.map((a) => (
              <li key={a} className="flex items-center gap-3 text-[15px]">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-[rgba(227,194,126,.6)] text-[color:var(--gold-2)]">{PIcons.check}</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- audience */

const AUDIENCE = [
  { label: 'Gia đình Việt', n: 28, prefix: '', text: 'khán giả đại chúng trên toàn quốc' },
  { label: 'Thanh thiếu niên', n: 22, prefix: '', text: 'Gen Z & young adults 16–30 tuổi' },
  { label: 'Cộng đồng bóng đá', n: 100, prefix: '~', text: 'người dân cuồng nhiệt bóng đá', gold: true },
];
const CHANNELS = [
  { icon: PIcons.tv, title: 'TV prime time', text: 'Phủ sóng quốc gia khung giờ vàng' },
  { icon: PIcons.social, title: 'Social multi-platform', text: 'TikTok, YouTube, Facebook: hậu trường, thử thách, viral clip' },
  { icon: PIcons.heart, title: 'Fanbase long-term', text: 'Theo dõi, bình chọn, văn hóa fan bóng đá trẻ' },
];

export function Audience() {
  return (
    <section id="khan-gia" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead eyebrow="Giải trí đại chúng × Cộng đồng bóng đá × Giá trị dài hạn" title="Khán giả mục tiêu & sức lan tỏa" />
        <div className="mt-10 grid gap-3 lg:mt-14 lg:grid-cols-3 lg:gap-5">
          {AUDIENCE.map((a, i) => (
            <div key={a.label} data-reveal="zoom" style={revealDelay(i)} className={`${a.gold ? 'of-glass-gold of-cut--gold of-run' : 'of-glass of-run-hover'} of-cut of-cut--lg of-spot p-6 text-center lg:p-8`}>
              <div className={`of-hud text-[11px] ${a.gold ? 'text-[color:var(--gold-2)]' : 'text-[color:var(--lime)]'}`}>{a.label}</div>
              <div className={`of-display mt-2 text-[64px] lg:text-[80px] ${a.gold ? 'of-gold' : 'of-neon'}`}>
                {a.prefix}
                <CountUp to={a.n} /> <span className="text-[0.5em]">triệu</span>
              </div>
              <div className="text-[14px] text-[#CBD6CF]">{a.text}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-5 lg:mt-10 lg:grid-cols-3">
          {CHANNELS.map((c, i) => (
            <div key={c.title} data-reveal="" style={revealDelay(i)} className="flex items-start gap-4">
              <div className="shrink-0 text-[color:var(--lime-2)]" style={glow()}>
                {c.icon}
              </div>
              <div>
                <div className="font-bold">{c.title}</div>
                <div className="text-[14px] text-[#CBD6CF]">{c.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------- revenue */

const REVENUE = [
  { title: 'Truyền hình', from: 'Sản xuất & phát sóng', to: 'doanh thu tài trợ' },
  { title: 'Digital', from: 'Phát sóng nền tảng số', to: 'nền tảng & quảng cáo' },
  { title: 'Vé & sự kiện', from: 'Final Match, trận đấu, sự kiện', to: 'vé & tài trợ' },
  { title: 'Merchandise', from: 'Sản phẩm hệ sinh thái', to: 'doanh số bán hàng' },
  { title: 'Chuyển nhượng cầu thủ', from: 'Cầu thủ từ chương trình', to: 'phí chuyển nhượng' },
  { title: 'Khai thác thương mại cầu thủ', from: 'Gương mặt cầu thủ', to: 'quảng cáo nhãn hàng' },
];

export function Revenue() {
  return (
    <section id="doanh-thu" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead eyebrow="Mô hình kinh doanh" title="6 nguồn doanh thu từ một IP" />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-5">
          {REVENUE.map((r, i) => (
            <article key={r.title} data-reveal={i % 2 ? 'right' : 'left'} style={revealDelay(i % 3)} className="of-glass of-cut of-spot of-lift of-run-hover overflow-hidden p-6">
              <div className="of-display of-outline pointer-events-none absolute right-3 top-1 text-[76px]" aria-hidden="true">
                0{i + 1}
              </div>
              <h3 className="of-display max-w-[80%] text-[26px]">{r.title}</h3>
              <div className="mt-3 text-[14px] text-[#CBD6CF]">{r.from}</div>
              <div className="mt-1 flex items-center gap-2 text-[14px] font-semibold text-[color:var(--lime-2)]">
                <ArrowRight size={16} /> {r.to}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------- packages */

const TIERS = [
  { kind: 'Nhà tài trợ', name: 'Kim cương', price: 60, perk: 'Định danh chương trình, hiện diện xuyên suốt 12 tập', gold: true },
  { kind: 'Nhà tài trợ', name: 'Vàng', perk: 'Quyền lợi chi tiết trong bảng quyền lợi tài trợ' },
  { kind: 'Nhà tài trợ', name: 'Bạc', perk: 'Quyền lợi chi tiết trong bảng quyền lợi tài trợ' },
  { kind: 'Đối tác', name: 'Đồng hành', perk: 'Truyền thông, chuyên môn, hiện vật' },
];

export function Packages() {
  return (
    <section id="hop-tac" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead eyebrow="Cơ hội hợp tác" title="Cùng khai phá đại dương xanh" />
        <div className="mt-6 flex justify-center" data-reveal="">
          <span className="of-chip of-chip--gold !px-4 !py-1.5 !text-[12px]">
            <span className="of-dot" /> ~20 nhãn hàng đang chờ ký kết, gồm nhà tài trợ kim cương
          </span>
        </div>

        <div data-reveal="zoom" className="of-glass of-cut of-cut--lg of-run of-sweep mt-10 grid items-center gap-5 p-6 lg:grid-cols-[1fr_auto] lg:p-8">
          <div>
            <div className="of-hud text-[11px] text-[color:var(--lime)]">Mùa 1 · Thị trường Việt Nam</div>
            <div className="of-display mt-1 text-[34px] lg:text-[42px]">Bán quyền khai thác thương mại IP</div>
            <p className="mt-1 text-[#CBD6CF]">Sản xuất, truyền thông, tổ chức sự kiện, quảng cáo và thương mại.</p>
          </div>
          <a href="#lien-he" className="of-btn">
            Yêu cầu term sheet <ArrowRight />
          </a>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:mt-5 lg:grid-cols-4 lg:gap-5">
          {TIERS.map((t, i) => (
            <article
              key={t.name}
              data-reveal=""
              style={revealDelay(i)}
              className={`${t.gold ? 'of-glass-gold of-cut--gold of-cut--b2 of-run' : 'of-glass of-run-hover'} of-cut of-cut--lg of-spot of-lift flex flex-col p-6`}
            >
              <div className={`of-hud text-[11px] ${t.gold ? 'text-[color:var(--gold-2)]' : 'text-[color:var(--lime)]'}`}>{t.kind}</div>
              <div className={`of-display mt-1 text-[34px] ${t.gold ? 'of-gold' : ''}`}>{t.name}</div>
              <div className={`of-display mt-3 ${t.price ? 'of-gold text-[56px]' : 'text-[26px] text-[#E2EAE4]'}`}>
                {t.price ? (
                  <>
                    <CountUp to={t.price} /> <span className="text-[0.5em]">tỷ</span>
                  </>
                ) : (
                  'Liên hệ'
                )}
              </div>
              <p className="mt-2 flex-1 text-[14px] text-[#CBD6CF]">{t.perk}</p>
              <a href="#lien-he" className={`${t.gold ? 'of-btn' : 'of-btn-ghost of-cut'} mt-5 !min-h-[46px] !text-[17px]`}>
                Nhận bảng quyền lợi
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------- quote */

export function Quote() {
  return (
    <section className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1040px]" data-reveal="zoom">
        <div className="of-eyebrow mx-auto flex w-fit">Kiến tạo di sản thể thao Việt Nam</div>
        <div className="of-glass-gold of-cut of-cut--lg of-cut--gold of-sweep mt-6 p-7 lg:p-12">
          <div className="of-display of-gold pointer-events-none absolute left-4 top-0 text-[140px] leading-none opacity-40" aria-hidden="true">
            “
          </div>
          <blockquote className="relative text-[17px] leading-[1.7] text-[#F1EEE4] lg:text-[21px]">
            11 ON FIELD không chỉ là một chương trình truyền hình, đó là <strong className="text-[color:var(--gold-3)]">Sứ mệnh</strong>: tìm kiếm và kiến tạo thế hệ ngôi sao
            bóng đá mới của Việt Nam đạt chuẩn trên đấu trường thể thao toàn cầu. Để chinh phục 28 triệu gia đình Việt Nam và thúc đẩy 22 triệu thanh thiếu niên phát triển
            toàn diện, chúng tôi trân trọng kính mời Quý vị trở thành <strong className="text-[color:var(--gold-3)]">Đối tác chiến lược</strong>.
          </blockquote>
          <div className="relative mt-7 flex items-center gap-4">
            <div className="of-cut of-cut--sm of-cut--gold flex h-14 w-14 items-center justify-center bg-[rgba(227,194,126,.12)]">
              <span className="of-display of-gold text-[24px]">HT</span>
            </div>
            <div>
              <div className="of-display text-[24px] text-white">Đặng Thị Hoài Trinh</div>
              <div className="text-[14px] text-[color:var(--gold-2)]">Giám đốc Dự án 11 On Field</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
