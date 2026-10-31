'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApi } from '@/lib/admin/client';

interface StageRow { stageNumber: number; title: string; status: string | null }

/**
 * The three moments of a round and the screen for each job, shown on top of every round screen so an admin always
 * knows what is set up beforehand, what runs on the tablets on the day, and what is done afterwards.
 */
export default function RoundFlow({ id, n }: { id: string; n: string }) {
  const pathname = usePathname();
  const stages = useApi<{ stages: StageRow[] }>(`competitions/${id}/stages`);
  const stage = stages.data?.stages.find((s) => String(s.stageNumber) === n);
  const round = `/quan-tri/giai-dau/${id}/vong/${n}`;
  const now = stage?.status === 'LIVE' ? 1 : stage?.status === 'COMPLETED' ? 2 : 0;

  const phases: { title: string; when: string; items: { href: string; label: string; note?: string }[] }[] = [
    {
      title: 'Chuẩn bị',
      when: 'Trước ngày thi',
      items: [
        { href: round, label: 'Cấu hình bài thi và thang điểm' },
        { href: `/quan-tri/giai-dau/${id}/hoi-dong`, label: 'Hội đồng tuyển trạch (HLV, TTV)' },
        { href: `/quan-tri/giai-dau/${id}/thi-sinh/phieu-sbd`, label: 'In phiếu SBD' },
        { href: `/quan-tri/giai-dau/${id}/vong`, label: 'Kích hoạt vòng', note: 'để tablet nhận vòng này' },
      ],
    },
    {
      title: 'Ngày thi',
      when: 'Dùng trên tablet tại sân',
      items: [
        { href: '/quan-tri/check-in', label: 'Check-in thí sinh' },
        { href: '/quan-tri/cham-diem', label: 'Chấm điểm tại trạm' },
        { href: '/quan-tri/ghi-nhan', label: 'Ghi nhận thí sinh' },
        { href: `${round}/doi-soat`, label: 'Theo dõi số cần xem' },
      ],
    },
    {
      title: 'Sau khi thi',
      when: 'Chốt điểm và chọn người',
      items: [
        { href: `${round}/doi-soat`, label: 'Đối soát và khoá sổ' },
        { href: `${round}/diem-cham-tay`, label: 'Điểm chấm tay: BHL, 7v7, tư duy, GPS' },
        { href: `${round}/ket-qua`, label: 'Kết quả vòng' },
        { href: `/quan-tri/giai-dau/${id}/xep-hang`, label: 'Xếp hạng chung 3 khu vực' },
        { href: `/quan-tri/giai-dau/${id}/tuyen-chon`, label: 'Chọn Top 30, Green Card' },
        { href: `/quan-tri/giai-dau/${id}/hien-thi`, label: 'Phát hành kết quả' },
      ],
    },
  ];

  return (
    <nav aria-label="Các bước của vòng thi" className="mb-5 grid gap-3 md:grid-cols-3">
      {phases.map((p, i) => (
        <div key={p.title} className={`rounded-lg border p-3 ${i === now ? 'border-[#1F7A3A] bg-[#F1F8F3]' : 'border-[#DCE5DF] bg-white'}`}>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-[14px] font-semibold">
              <span className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] ${i === now ? 'bg-[#1F7A3A] text-white' : 'bg-[#E6ECE8] text-[#46564D]'}`}>{i + 1}</span>
              {p.title}
            </span>
            <span className="text-[12px] text-[#66766D]">{i === now ? 'Đang ở bước này' : p.when}</span>
          </div>
          <ul className="mt-2 space-y-0.5 text-[13px]">
            {p.items.map((it) => {
              const here = pathname === it.href;
              return (
                <li key={it.label}>
                  <Link href={it.href} aria-current={here ? 'page' : undefined} className={`block rounded px-2 py-1 ${here ? 'bg-[#E4F1E8] font-semibold text-[#14482E]' : 'text-[#1F4D33] hover:bg-[#F1F5F2]'}`}>
                    {it.label}
                    {it.note && <span className="font-normal text-[#66766D]"> · {it.note}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
