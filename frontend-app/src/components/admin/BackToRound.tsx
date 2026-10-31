'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

/** Key of the query parameter the round screen adds to the links of its steps. */
export const FROM = 'tu';

/** Adds the round screen as the page to come back to. */
export function withFrom(href: string, from: string) {
  return href === from ? href : `${href}${href.includes('?') ? '&' : '?'}${FROM}=${encodeURIComponent(from)}`;
}

/**
 * "Back to round N" on any page opened from a round's step list. Only paths inside the admin site are accepted, so
 * the parameter cannot send the admin elsewhere.
 */
export default function BackToRound() {
  const params = useSearchParams();
  const pathname = usePathname();
  // A round's own sub-pages (đối soát, điểm chấm tay, kết quả…) always lead back to the round.
  const parent = pathname.match(/^(\/quan-tri\/giai-dau\/\d+\/vong\/\d+)\/[^/]+/)?.[1];
  const from = params.get(FROM) || parent;
  if (!from || !/^\/quan-tri\/giai-dau\/\d+\/vong\/\d+$/.test(from) || from === pathname) return null;
  const n = from.split('/').pop();
  return (
    <Link href={from} className="mb-3 inline-flex items-center gap-1 rounded-md border border-[#C9D6CE] bg-white px-3 py-1.5 text-[13px] font-medium text-[#1F4D33] hover:bg-[#F1F5F2] print:hidden">
      ← Quay lại Vòng {n}
    </Link>
  );
}
