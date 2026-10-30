'use client';

import Link from 'next/link';
import { ArrowRight } from './ui';
import { useT } from '@/i18n/I18nProvider';

export default function FinalCta({ ctaHref }: { ctaHref: string }) {
  const t = useT();
  return (
    <section className="relative z-[2] px-4 pb-20 pt-6 lg:px-6 lg:pb-28">
      <div className="of-glass-gold of-cut of-cut--lg of-cut--gold of-cut--b2 of-run of-sweep mx-auto grid max-w-[1240px] overflow-hidden lg:grid-cols-2" data-reveal="zoom">
        <div className="relative min-h-[240px] lg:min-h-[380px]">
          <img src="/images/home/badge.jpg" alt={t('Bàn tay nắm chặt huy hiệu 11 On Field trên ngực áo')} className="absolute inset-0 h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-[rgba(14,20,12,.9)] to-transparent lg:bg-gradient-to-l" />
        </div>
        <div className="relative flex flex-col justify-center gap-4 p-6 lg:p-12">
          <div className="of-eyebrow of-eyebrow--left">{t('Bạn có đủ khát khao?')}</div>
          <div className="of-display text-[48px] text-white lg:text-[68px]" style={{ textShadow: '0 0 30px rgba(166,227,90,.35)' }}>
            {t('Đừng chỉ mơ ước.')}
            <br />
            <span className="of-neon">{t('Hãy ra sân.')}</span>
          </div>
          <p className="text-[#E3DCC8]">{t('Đăng ký miễn phí trong 5 phút. Hồ sơ của bạn sẽ đến tay Ban huấn luyện.')}</p>
          <Link href={ctaHref} className="of-btn self-start">
            {t('Đăng ký ngay hôm nay')} <ArrowRight />
          </Link>
        </div>
      </div>
    </section>
  );
}
