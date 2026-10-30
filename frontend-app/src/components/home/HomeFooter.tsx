'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { competitionService } from '@/services/competition.service';
import { useT } from '@/i18n/I18nProvider';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';

const SOCIALS = [
  {
    label: 'YouTube',
    href: 'http://www.youtube.com/@11onfield.fs2s',
    path: 'M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 00.5 6.2 31 31 0 000 12a31 31 0 00.5 5.8 3 3 0 002.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 002.1-2.1A31 31 0 0024 12a31 31 0 00-.5-5.8zM9.6 15.6V8.4l6.2 3.6-6.2 3.6z',
  },
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/profile.php?id=61589283795263',
    path: 'M24 12a12 12 0 10-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0024 12z',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@11onfield.fs2s',
    path: 'M19.6 6.7a4.8 4.8 0 01-3.8-4.2V2h-3.4v13.7a2.9 2.9 0 11-2-2.7V9.5a6.3 6.3 0 105.4 6.2V8.8a8.2 8.2 0 004.8 1.5V6.9a4.8 4.8 0 01-1-.2z',
  },
];

export default function HomeFooter() {
  const [newsHref, setNewsHref] = useState('/competitions');
  const t = useT();

  useEffect(() => {
    competitionService.getCurrentCompetition().then((c) => {
      if (c) setNewsHref(`/competitions/${c.id}/news`);
    });
  }, []);

  const links = [
    { label: t('Dành cho cầu thủ'), href: '/' },
    { label: t('Chương trình'), href: '/competitions' },
    { label: t('Tin tức'), href: newsHref },
    { label: t('Điều khoản tham gia'), href: '/terms' },
    { label: t('Chính sách bảo mật thông tin'), href: '/privacy' },
    { label: t('Chính sách sử dụng hình ảnh/video'), href: '/media-policy' },
  ];

  return (
    <footer className="relative z-[2] border-t border-[rgba(166,227,90,.25)] bg-[rgba(4,12,9,.82)] px-4 py-12 backdrop-blur-md lg:px-6">
      <div className="mx-auto grid max-w-[1240px] gap-10 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <Image src="/images/logo-white-full.png" alt="11 On Field" width={182} height={36} className="h-9 w-auto" />
          <p className="of-display of-shine-gold mt-4 text-[20px] !leading-[1.25] tracking-[0.14em]">{t('Từ Đường Phố ra Sân Vận Động')}</p>
          <div className="mt-5 flex gap-2.5">
            {SOCIALS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                className="of-cut of-cut--sm flex h-10 w-10 items-center justify-center bg-white/5 text-[#D5DED8] transition-colors hover:bg-[rgba(166,227,90,.18)] hover:text-white"
                style={{ ['--c' as string]: '8px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>
        </div>

        <nav aria-label={t('Liên kết')} className="flex flex-col gap-2.5 text-[14px]">
          <div className="of-hud mb-1 text-[11px] text-[color:var(--lime)]">{t('Thông tin')}</div>
          {links.map((l) => (
            <Link key={l.label} href={l.href} className="text-[#D5DED8] transition-colors hover:text-[color:var(--lime-2)]">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col gap-2.5 text-[14px] text-[#D5DED8]">
          <div className="of-hud mb-1 text-[11px] text-[color:var(--lime)]">{t('Liên hệ')}</div>
          <a href="mailto:11nguoirasan@11onfield.com" className="hover:text-[color:var(--lime-2)]">11nguoirasan@11onfield.com</a>
          <a href="tel:+84902383511" className="hover:text-[color:var(--lime-2)]">090 2383 511</a>
          <div className="mt-2 text-[13px] text-[#9FB0A6]">
            <a href="http://anylearn.vn" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              {t('Đơn vị bản quyền')}: {t('Công ty CP ĐT&GD anyLEARN')}
            </a>
            <div>{t('MST')}: 0316363793</div>
            <a href="https://www.binhanmedia.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
              {t('Đơn vị sản xuất')}
            </a>
          </div>
        </div>
      </div>
      <div className="of-rule mx-auto mt-10 max-w-[1240px]" />
      <div className="mx-auto mt-5 flex max-w-[1240px] items-center justify-between gap-4">
        <div className="of-num text-[12px] text-[#8FA197]">© {new Date().getFullYear()} 11 ON FIELD</div>
        <LanguageSwitcher up />
      </div>
    </footer>
  );
}
