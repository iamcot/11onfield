'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NAV } from '@/lib/admin/nav';
import { ROLE_LABEL, type AdminRole } from '@/lib/admin/session';
import { MeContext } from './me';
import { barlowCondensed, chakraPetch } from '@/components/home/fonts';

/** Sidebar + top bar for the staff area. Menu items follow the role; unbuilt pages open the old admin. */
export default function AdminShell({
  me,
  children,
}: {
  me: { fullName: string | null; role: AdminRole };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((i) => i.roles.includes(me.role));

  async function logout() {
    await fetch('/quan-tri/api/logout', { method: 'POST' });
    router.replace('/quan-tri/dang-nhap');
    router.refresh();
  }

  // Field scoring runs full screen on a tablet: no sidebar, the page draws its own bar.
  if (pathname.startsWith('/quan-tri/cham-diem')) {
    return (
      <div className={`${barlowCondensed.variable} ${chakraPetch.variable}`}>
        <MeContext.Provider value={me}>{children}</MeContext.Provider>
      </div>
    );
  }

  const menu = (
    <nav className="flex flex-col gap-1 p-3" aria-label="Menu quản trị">
      {items.map((item) => {
        const active = !!item.href && (item.href === '/quan-tri' ? pathname === item.href : pathname.startsWith(item.href));
        const cls = `group relative flex items-center justify-between px-3 py-2.5 font-[family-name:var(--font-hud)] text-[13px] font-semibold uppercase tracking-[0.08em] transition-colors ${
          active
            ? 'bg-gradient-to-r from-[rgba(166,227,90,0.2)] to-transparent text-[#D6FA9E] shadow-[inset_3px_0_0_#A6E35A]'
            : 'text-[#B9C7BE] hover:bg-white/5 hover:text-white'
        }`;
        return item.href ? (
          <Link key={item.label} href={item.href} className={cls} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ) : (
          <a key={item.label} href={item.legacy} className={cls} title="Mở bằng trang quản trị cũ">
            {item.label}
            <span className="text-[10px] uppercase tracking-wider text-[#8FA597]">Bản cũ</span>
          </a>
        );
      })}
    </nav>
  );

  return (
    <div className={`${barlowCondensed.variable} ${chakraPetch.variable} min-h-screen bg-[#F2F6F3] text-[#10231A]`}>
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-[#A6E35A]/25 bg-[#0B2419] px-4 text-[#E8F0EA] shadow-[0_2px_12px_rgba(6,20,13,0.25)] lg:left-60">
        <button
          type="button"
          className="-ml-1 p-2 text-[#D6FA9E] lg:hidden"
          aria-label="Mở menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
        <Image src="/images/logo-white-full.png" alt="11 On Field" width={120} height={24} className="h-6 w-auto lg:hidden" />
        <span className="hidden font-[family-name:var(--font-hud)] text-[12px] uppercase tracking-[0.18em] text-[#8FA597] lg:block">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-[#A6E35A] align-middle shadow-[0_0_8px_#A6E35A]" />
          Hệ thống quản trị
        </span>
        <div className="ml-auto flex items-center gap-3 text-[13px]">
          <span className="hidden text-right leading-tight sm:block">
            <span className="block text-[#E8F0EA]">{me.fullName || 'Quản trị viên'}</span>
            <span className="block text-[11px] text-[#8FA597]">{ROLE_LABEL[me.role]}</span>
          </span>
          <button
            type="button"
            onClick={logout}
            className="border border-white/20 px-3 py-1.5 text-[#E8F0EA] transition-colors hover:border-[#A6E35A] hover:text-[#D6FA9E]"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 overflow-y-auto border-r border-[#A6E35A]/15 bg-gradient-to-b from-[#0F3324] via-[#0C2A1D] to-[#081C13] text-[#E8F0EA] transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center gap-2 border-b border-white/10 px-5">
          <Image src="/images/logo-white-full.png" alt="11 On Field" width={120} height={24} priority className="h-6 w-auto" />
          <span className="font-[family-name:var(--font-hud)] text-[10px] font-semibold uppercase tracking-[0.2em] text-[#A6E35A]">Admin</span>
        </div>
        {menu}
      </aside>
      {open && <button type="button" aria-label="Đóng menu" className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setOpen(false)} />}

      <MeContext.Provider value={me}>
        <main className="px-4 pb-10 pt-20 lg:ml-60 lg:px-8">{children}</main>
      </MeContext.Provider>
    </div>
  );
}
