'use client';

import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { NAV } from '@/lib/admin/nav';
import { ROLE_LABEL, type AdminRole } from '@/lib/admin/session';
import { MeContext } from './me';

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

  const menu = (
    <nav className="flex flex-col gap-1 p-3" aria-label="Menu quản trị">
      {items.map((item) => {
        const active = !!item.href && (item.href === '/quan-tri' ? pathname === item.href : pathname.startsWith(item.href));
        const cls = `flex items-center justify-between px-3 py-2.5 text-[14px] transition-colors ${
          active
            ? 'bg-[rgba(166,227,90,0.14)] text-[#D6FA9E] shadow-[inset_3px_0_0_#A6E35A]'
            : 'text-[#C4D0C8] hover:bg-white/5 hover:text-white'
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
    <div className="min-h-screen bg-[#0B2419] text-[#E8F0EA]">
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-white/10 bg-[#0F3324]/95 px-4 backdrop-blur lg:left-60">
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
        <span className="font-semibold tracking-wide text-[#A6E35A] lg:hidden">11 ON FIELD</span>
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
        className={`fixed inset-y-0 left-0 z-40 w-60 overflow-y-auto border-r border-white/10 bg-[#0F3324] transition-transform lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-14 items-center border-b border-white/10 px-5">
          <span className="font-semibold tracking-wide text-[#A6E35A]">11 ON FIELD</span>
          <span className="ml-2 text-[11px] uppercase tracking-widest text-[#8FA597]">Quản trị</span>
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
