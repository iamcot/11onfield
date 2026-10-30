'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApi } from '@/lib/admin/client';
import { PageTitle } from './ui';

const TABS = [
  { slug: '', label: 'Thông tin' },
  { slug: '/vong', label: 'Vòng thi' },
  { slug: '/thi-sinh', label: 'Thí sinh' },
  { slug: '/tuyen-chon', label: 'Top 30 / Top 11' },
  { slug: '/tin-tuc', label: 'Tin tức' },
  { slug: '/nha-tai-tro', label: 'Nhà tài trợ' },
];

/** Page title + tab bar shared by every screen of one competition. */
export default function CompetitionTabs({ id, title, children }: { id: string; title?: string; children?: React.ReactNode }) {
  const pathname = usePathname();
  const base = `/quan-tri/giai-dau/${id}`;
  const list = useApi<{ id: number; title: string; season: number }[]>('competitions');
  const comp = list.data?.find((c) => String(c.id) === id);

  return (
    <>
      <PageTitle title={title || comp?.title || 'Giải đấu'} back={{ href: '/quan-tri/giai-dau', label: 'Danh sách giải đấu' }}>
        {children}
      </PageTitle>
      <nav className="-mt-2 mb-5 flex gap-1 overflow-x-auto border-b border-[#DCE5DF]" aria-label="Mục của giải đấu">
        {TABS.map((t) => {
          const href = base + t.slug;
          const active = t.slug ? pathname.startsWith(href) : pathname === base;
          return (
            <Link
              key={t.slug}
              href={href}
              className={`whitespace-nowrap px-4 py-2.5 text-[14px] ${active ? 'border-b-2 border-[#1F7A3A] text-[#1F6B32]' : 'text-[#46564D] hover:text-[#10231A]'}`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
