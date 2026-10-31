'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { Badge, Loading, Td } from '@/components/admin/ui';
import { REGIONS } from '@/lib/admin/labels';
import { ComponentCell, FlagBadges, RankCell, RankFilters, TotalCell, inGroup, positionLabel, useColumns, useRanking, type Group } from '@/components/admin/ranking';

export default function RankingPage() {
  const { id } = useParams<{ id: string }>();
  const [group, setGroup] = useState<Group>('OUTFIELD');
  const [region, setRegion] = useState('');
  const ranking = useRanking(id, region);
  const rows = (ranking.data || []).filter((r) => inGroup(r, group));
  const cols = useColumns(ranking.data);
  const head = ['Hạng', 'SBD', 'Họ tên', 'Khu vực', 'Vị trí', ...cols.map((c) => c.label), 'Tổng', 'Xếp loại', 'Phiếu', 'Cờ'];

  return (
    <>
      <CompetitionTabs id={id} />
      <p className="mb-4 text-[13px] text-[#46564D]">
        Xếp hạng chung 3 khu vực theo điểm vòng. Thủ môn xếp riêng. Hàng tô vàng là đồng điểm sau mọi tiêu chí phụ, BGK quyết. Trang này chỉ dành cho BTC và BGK, thí sinh không thấy thứ hạng.
      </p>
      <RankFilters group={group} onGroup={setGroup} region={region} onRegion={setRegion} />
      <Loading error={ranking.error} loading={ranking.loading && !ranking.data} />
      {ranking.data && (
        <div className="overflow-x-auto rounded-lg border border-[#DCE5DF] bg-white shadow-[0_1px_2px_rgba(16,35,26,0.06)]">
          <table className="w-full min-w-[960px] text-left text-[14px] whitespace-nowrap">
            <thead className="bg-[#F3F6F4] text-[11px] uppercase tracking-wider text-[#56665D]">
              <tr>{head.map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#E6ECE8]">
              {rows.map((r) => (
                <tr key={r.participantId} className={r.tied ? 'bg-[#FFF6D6]' : r.medicalOut ? 'bg-[#FEF1EF]' : ''}>
                  <Td><RankCell row={r} /></Td>
                  <Td className="tabular-nums">{r.sbd}</Td>
                  <Td className="font-medium">{r.fullName}</Td>
                  <Td>{r.region ? (REGIONS[r.region] || r.region).split(' & ')[0] : '—'}</Td>
                  <Td>{positionLabel(r.positions)}</Td>
                  {cols.map((c) => <Td key={c.key}><ComponentCell row={r} k={c.key} /></Td>)}
                  <Td><TotalCell row={r} /></Td>
                  <Td>{r.complete && r.classification ? <Badge tone="green">{r.classification}</Badge> : '—'}</Td>
                  <Td className="tabular-nums">{r.votes}</Td>
                  <Td><FlagBadges row={r} /></Td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length === 0 && <p className="px-3 py-6 text-center text-[#66766D]">Chưa có điểm vòng. Cần tính lại điểm vòng sau khi có số đo.</p>}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-[12px] text-[#56665D]">
        <span><Badge tone="gold">chưa đủ</Badge> thiếu phần BHL hoặc 7v7 của vòng đánh giá tay cuối, chưa có tổng.</span>
        <span>Điểm từng phần đã quy theo trọng số của công thức vòng.</span>
        <span>Phiếu: số thành viên BGK đã chọn người này.</span>
      </div>
    </>
  );
}
