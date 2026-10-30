'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, cssVars } from './ui';

function useCountdown(target: Date | null) {
  const [now, setNow] = useState<number | null>(null);
  const targetMs = target ? target.getTime() : null;
  useEffect(() => {
    if (targetMs === null) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [targetMs]);
  if (!target || now === null) return null;
  const diff = target.getTime() - now;
  if (diff <= 0) return null;
  const s = Math.floor(diff / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

function Cell({ v, label }: { v: number; label: string }) {
  const txt = String(v).padStart(2, '0');
  return (
    <div className="of-cd-cell">
      <b key={txt} className="of-tick">
        {txt}
      </b>
      <span>{label}</span>
    </div>
  );
}

export default function Hero({
  registrationOpen,
  registrationEnd,
  season,
  ctaHref,
}: {
  registrationOpen: boolean;
  registrationEnd: Date | null;
  season: number | null;
  ctaHref: string;
}) {
  const cd = useCountdown(registrationEnd);
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tiltRef.current;
    if (!el || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--tx', String(((e.clientX - r.left) / r.width - 0.5) * 2));
      el.style.setProperty('--ty', String(((e.clientY - r.top) / r.height - 0.5) * 2));
    };
    const onLeave = () => {
      el.style.setProperty('--tx', '0');
      el.style.setProperty('--ty', '0');
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <section id="top" className="relative px-4 pb-14 lg:px-6 lg:pb-24" style={{ paddingTop: 'calc(var(--header-h) + 28px)' }}>
      <div className="of-hero-giant of-display hidden md:block" aria-hidden="true">
        <span>11</span>
        <span>11</span>
      </div>

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[1.1fr_1fr] lg:gap-14 lg:pt-6">
        <div className="min-w-0">
          <div className="of-in flex flex-wrap gap-2" style={cssVars({ '--i': -3 })}>
            <span className="of-chip">
              <span className="of-dot" />
              {registrationOpen ? 'Đang nhận hồ sơ' : 'Sắp mở đăng ký'}
            </span>
            <span className="of-chip of-chip--gold">Mùa {season ?? 1} · 2027</span>
          </div>

          <h1 className="of-display mt-5 text-[64px] text-white sm:text-[84px] lg:text-[112px]" style={{ textShadow: '0 0 40px rgba(166,227,90,.4), 0 4px 0 rgba(0,0,0,.35)' }}>
            <span className="of-line">
              <span style={cssVars({ '--i': 0 })}>Tìm kiếm</span>
            </span>
            <span className="of-line">
              <span style={cssVars({ '--i': 1 })}>
                <em className="of-shine-gold pr-[0.06em] not-italic" style={{ fontStyle: 'italic' }}>
                  11
                </em>{' '}
                người
              </span>
            </span>
            <span className="of-line">
              <span style={cssVars({ '--i': 2 })}>ra sân</span>
            </span>
          </h1>

          <div className="of-in of-display mt-4 text-[17px] font-bold !leading-[1.25] tracking-[0.3em] sm:text-[22px]" style={cssVars({ '--i': 0 })}>
            <span className="of-shine-gold">From the street to the stadium</span>
          </div>

          <p className="of-in mt-5 max-w-[560px] text-[16px] text-[#E2EAE4] sm:text-[18px]" style={cssVars({ '--i': 1 })}>
            Cơ hội cho tài năng <strong className="text-white">16–21 tuổi</strong> theo đuổi giấc mơ sân cỏ. Huấn luyện cùng{' '}
            <strong className="text-white">Park Hang-seo</strong> và chuyên gia La Liga, tập huấn tại Tây Ban Nha, ra sân ở sân vận động quốc gia.
          </p>

          <div className="of-in mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap" style={cssVars({ '--i': 2 })}>
            <Link href={ctaHref} className="of-btn">
              Đăng ký miễn phí <ArrowRight />
            </Link>
            <a href="#hanh-trinh" className="of-btn-ghost of-cut">
              Xem hành trình
            </a>
          </div>

          {cd && (
            <div className="of-in mt-7 flex flex-wrap items-center gap-3" style={cssVars({ '--i': 3 })}>
              <div className="of-hud text-[11px] text-[color:var(--lime)]">
                Hạn đăng ký
                <br />
                còn
              </div>
              <div className="flex gap-1.5" aria-live="off">
                <Cell v={cd.d} label="Ngày" />
                <Cell v={cd.h} label="Giờ" />
                <Cell v={cd.m} label="Phút" />
                <Cell v={cd.s} label="Giây" />
              </div>
            </div>
          )}
        </div>

        <div className="of-hero-media min-w-0">
          <div ref={tiltRef} className="of-tilt relative mx-auto max-w-[560px] lg:mr-0">
            <div className="of-cut of-cut--lg of-run of-cut--b2 bg-[rgba(6,20,14,.45)] p-2 sm:p-2.5">
              <div className="of-hero-photo of-cut" style={cssVars({ '--c': '20px', '--ring': 'rgba(0,0,0,0)' })}>
                <img src="/images/home/player.jpg" alt="Cầu thủ áo xanh số 10 đi bóng dưới ánh đèn sân vận động" width={662} height={706} />
                <div className="of-reticle" style={{ left: '20%', top: '66%', width: '32%' }} aria-hidden="true">
                  <svg viewBox="0 0 100 100" fill="none">
                    <g className="of-rot">
                      <circle cx="50" cy="50" r="44" stroke="#B8F26A" strokeWidth="1.2" strokeDasharray="18 10" opacity=".9" />
                    </g>
                    <g className="of-rot of-rot--rev">
                      <circle cx="50" cy="50" r="34" stroke="#E3C27E" strokeWidth="1" strokeDasharray="4 6" opacity=".8" />
                    </g>
                    <path d="M50 0v14M50 86v14M0 50h14M86 50h14" stroke="#D6FA9E" strokeWidth="1.5" />
                  </svg>
                </div>
              </div>
              <div className="of-brackets" />
              <div className="of-hud absolute left-6 top-6 z-[5] flex items-center gap-2 text-[11px] text-[color:var(--lime-2)]">
                <span className="of-dot of-dot--red" /> REC · CAM 01
              </div>
            </div>

            <div className="of-float of-glass of-cut of-cut--sm absolute -bottom-6 -left-2 z-[6] px-4 py-3 sm:-left-6">
              <div className="of-hud text-[10px] text-[color:var(--lime)]">Chấm điểm bằng</div>
              <div className="of-display mt-1 text-[22px] sm:text-[24px]">
                Dữ liệu · Chuyên môn
                <br />· Khán giả
              </div>
            </div>
            <div className="of-float of-float--b of-glass of-cut of-cut--sm absolute -right-1 top-[38%] z-[6] hidden px-4 py-3 sm:block lg:-right-6">
              <div className="of-hud text-[10px] text-[color:var(--lime)]">Live data</div>
              <div className="of-bars mt-2 flex h-6 items-end">
                <i style={{ height: '40%' }} />
                <i style={{ height: '70%' }} />
                <i style={{ height: '55%' }} />
                <i style={{ height: '100%' }} />
                <i style={{ height: '80%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="of-in mt-14 hidden flex-col items-center gap-2 lg:flex" style={cssVars({ '--i': 5 })} aria-hidden="true">
        <div className="of-scroll-cue" />
        <div className="of-hud text-[10px] text-[color:var(--mute)]">Cuộn xuống</div>
      </div>
    </section>
  );
}
