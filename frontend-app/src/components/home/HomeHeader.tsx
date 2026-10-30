'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { cssVars } from './ui';
import { useT } from '@/i18n/I18nProvider';
import LanguageSwitcher from '@/components/i18n/LanguageSwitcher';

type NavLink = { id: string; label: string };

export const NAV_LINKS: NavLink[] = [
  { id: 'quyen-loi', label: 'Quyền lợi' },
  { id: 'hanh-trinh', label: 'Hành trình' },
  { id: 'lich', label: 'Lịch tuyển trạch' },
  { id: 'huan-luyen', label: 'Huấn luyện' },
  { id: 'hoi-dap', label: 'Hỏi đáp' },
];

export default function HomeHeader({
  links = NAV_LINKS,
  variant = 'player',
}: {
  links?: NavLink[];
  variant?: 'player' | 'partner';
}) {
  const { user, isAuthenticated } = useAuth();
  const t = useT();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const isPartner = variant === 'partner';

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const sections = links.map((l) => document.getElementById(l.id)).filter(Boolean) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [links]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const profileHref = isAuthenticated && user ? `/profile/${user.userid}` : null;
  const primary = isPartner
    ? { href: '#lien-he', label: t('Hợp tác'), long: t('Nhận hồ sơ hợp tác') }
    : profileHref
      ? { href: profileHref, label: t('Hồ sơ'), long: t('Hồ sơ của tôi') }
      : { href: '/auth/register', label: t('Đăng ký'), long: t('Đăng ký miễn phí') };
  // the partner page is password-protected and not linked from the public site
  const cross = isPartner ? { href: '/', label: t('Cầu thủ') } : null;
  const extra = [...(cross ? [cross] : []), { href: '/competitions', label: t('Chương trình') }];
  const showLogin = !isPartner && !isAuthenticated;

  return (
    <>
      <header className={`of-header ${solid ? 'is-solid' : ''}`}>
        <div className="mx-auto flex h-full max-w-[1240px] items-center gap-3 px-4 lg:gap-8 lg:px-6">
          <Link href="/" className="flex shrink-0 items-center" aria-label={`11 On Field – ${t('Trang chủ')}`}>
            <Image
              src="/images/logo-white-full.png"
              alt="11 On Field"
              width={182}
              height={36}
              priority
              className="h-[28px] w-auto lg:h-[36px]"
            />
          </Link>

          <nav aria-label={t('Điều hướng chính')} className="hidden flex-1 items-center gap-6 lg:flex xl:gap-7">
            {links.map((l) => (
              <a key={l.id} href={`#${l.id}`} className={`of-navlink ${active === l.id ? 'is-active' : ''}`}>
                {t(l.label)}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:gap-4">
            {cross && (
              <Link href={cross.href} className="of-navlink hidden lg:inline-block" style={{ color: 'var(--gold-2)' }}>
                {cross.label} ›
              </Link>
            )}
            <LanguageSwitcher className="hidden sm:inline-flex" />
            {showLogin && (
              <Link href="/auth/login" className="of-navlink hidden xl:inline-block">
                {t('Đăng nhập')}
              </Link>
            )}
            <Link href={primary.href} className="of-btn of-btn--sm lg:!min-h-[44px] lg:!px-6 lg:!text-lg">
              {primary.label}
            </Link>
            <button
              type="button"
              className="of-iconbtn of-iconbtn--mobile of-cut of-cut--sm"
              style={cssVars({ '--c': '8px' })}
              aria-label={open ? t('Đóng menu') : t('Mở menu')}
              aria-expanded={open}
              onClick={() => setOpen((v) => !v)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h11M4 17h16" />}
              </svg>
            </button>
          </div>
        </div>
        <div className="of-header-progress" />
      </header>

      <div className={`of-menu ${open ? 'is-open' : ''}`} role="dialog" aria-modal="true" aria-label={t('Menu')} aria-hidden={!open}>
        <div className="flex items-center justify-between px-4" style={{ height: 'var(--header-h)' }}>
          <Image src="/images/logo-white-full.png" alt="11 On Field" width={142} height={28} className="h-[28px] w-auto" />
          <button type="button" className="of-iconbtn of-cut" style={cssVars({ '--c': '8px' })} aria-label={t('Đóng menu')} onClick={() => setOpen(false)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-6 pt-6" aria-label={t('Menu di động')}>
          {links.map((l, i) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              onClick={() => setOpen(false)}
              className="of-menu-item of-display flex items-baseline gap-4 border-b border-white/10 py-3 text-[40px] text-white"
              style={cssVars({ '--i': i })}
            >
              <span className="of-num text-sm text-[color:var(--lime)]">0{i + 1}</span>
              {t(l.label)}
            </a>
          ))}
          {extra.map((l, j) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="of-menu-item of-display flex items-baseline gap-4 py-3 text-[40px] text-[color:var(--gold-2)]"
              style={cssVars({ '--i': links.length + j })}
            >
              <span className="of-num text-sm">0{links.length + j + 1}</span>
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="of-menu-item flex flex-wrap items-center gap-3 p-6" style={cssVars({ '--i': links.length + extra.length })}>
          <LanguageSwitcher className="sm:hidden" />
          {showLogin && (
            <Link href="/auth/login" className="of-btn-ghost of-cut flex-1 whitespace-nowrap" onClick={() => setOpen(false)}>
              {t('Đăng nhập')}
            </Link>
          )}
          <Link href={primary.href} className="of-btn flex-1 whitespace-nowrap" onClick={() => setOpen(false)}>
            {primary.long}
          </Link>
        </div>
      </div>
    </>
  );
}
