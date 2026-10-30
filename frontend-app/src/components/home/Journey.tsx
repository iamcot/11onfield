'use client';

import { useEffect, useRef, useState } from 'react';
import CountUp from './CountUp';
import { Icons, SectionHead, cssVars, revealDelay } from './ui';

const STEPS = [
  { title: 'Đăng ký online', text: 'Hồ sơ, ảnh và video highlight', badge: <><CountUp to={30000} from={0} /> hồ sơ</> },
  { title: 'Scouting khu vực', text: 'Thi đấu trực tiếp tại 3 miền', badge: <>Top 100 / miền</> },
  { title: 'Vòng toàn quốc', text: 'Đánh giá chuyên sâu bằng dữ liệu', badge: <>Top 100</> },
  { title: 'Lên tuyển', text: '4 tháng huấn luyện, 10 tập thử thách', badge: <>Top 30</> },
  { title: 'Ra sân', text: 'Tập huấn La Liga, Final Match', badge: <>Top 11</>, gold: true },
];

const SCORING = [
  { icon: Icons.panel, title: 'Hội đồng chuyên môn', text: 'Kỹ thuật, chiến thuật, tư duy', w: '86%' },
  { icon: Icons.pulse, title: 'Bio-metrics', text: 'Tốc độ, quãng đường, thể lực', w: '72%' },
  { icon: Icons.vote, title: 'Khán giả bình chọn', text: 'Trực tiếp trên ứng dụng', w: '58%' },
];

export default function Journey() {
  const ref = useRef<HTMLDivElement>(null);
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const isDesktop = window.innerWidth >= 1024;
      // desktop: fill while the row crosses the middle; mobile: follow the list
      const start = vh * (isDesktop ? 0.85 : 0.7);
      const span = isDesktop ? vh * 0.45 : r.height;
      setP(Math.max(0, Math.min(1, (start - r.top) / span)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section id="hanh-trinh" className="relative z-[2] px-4 py-20 lg:px-6 lg:py-28">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead eyebrow="Từ 30.000 hồ sơ còn 11 người" title="Hành trình tuyển chọn" lede="Mỗi vòng là một trận đấu sinh tồn." />

        <div ref={ref} className="relative mt-12 lg:mt-16" style={cssVars({ '--p': p })}>
          <div className="of-rail left-[31px] top-[32px] bottom-[32px] w-[2px] lg:left-[10%] lg:right-[10%] lg:top-[41px] lg:bottom-auto lg:h-[3px] lg:w-auto" aria-hidden="true">
            <i />
          </div>
          <ol className="relative flex flex-col gap-7 lg:grid lg:grid-cols-5 lg:gap-5">
            {STEPS.map((s, i) => {
              const lit = p >= (i / (STEPS.length - 1)) * 0.96;
              return (
                <li
                  key={s.title}
                  className={`of-step flex items-center gap-5 lg:flex-col lg:text-center ${s.gold ? 'of-step--gold' : ''} ${lit ? 'is-lit' : ''}`}
                >
                  <div className="of-node">0{i + 1}</div>
                  <div className="of-step-body min-w-0">
                    <h3 className={`of-display text-[26px] lg:mt-2 lg:text-[28px] ${s.gold ? 'of-gold' : ''}`}>{s.title}</h3>
                    <p className="text-[14px] text-[#CBD6CF]">{s.text}</p>
                    <span className={`of-chip mt-2 ${s.gold ? 'of-chip--gold' : ''}`}>{s.badge}</span>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="of-glass of-cut of-cut--lg of-run mt-14 grid gap-6 p-6 lg:mt-20 lg:grid-cols-[1.1fr_1fr_1fr_1fr] lg:items-center lg:gap-8 lg:p-8" data-reveal="zoom">
          <div>
            <div className="of-hud text-[11px] text-[color:var(--lime)]">Không cảm tính</div>
            <div className="of-display mt-1 text-[36px] lg:text-[40px]">
              Chấm điểm
              <br />
              <span className="of-neon">bằng dữ liệu</span>
            </div>
          </div>
          {SCORING.map((s, i) => (
            <div key={s.title} className="flex items-start gap-4" style={revealDelay(i + 1)}>
              <div className="shrink-0 text-[color:var(--lime-2)]" style={{ filter: 'drop-shadow(0 0 8px rgba(166,227,90,.75))' }}>
                {s.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{s.title}</div>
                <div className="text-[13.5px] text-[#CBD6CF]">{s.text}</div>
                <div className="of-meter mt-2.5" style={cssVars({ '--w': s.w })}>
                  <i />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
