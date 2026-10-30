'use client';

import { useApi } from '@/lib/admin/client';
import { Badge, LinkButton, Loading, PageTitle, Table, Td } from '@/components/admin/ui';
import { COMP_STATUS, fmtDate } from '@/lib/admin/labels';

interface Comp {
  id: number;
  title: string;
  season: number;
  status: string | null;
  participantCount: number;
  stageCount: number;
  competitionStartDate: string | null;
  competitionEndDate: string | null;
}

export default function CompetitionsPage() {
  const list = useApi<Comp[]>('competitions');
  return (
    <>
      <PageTitle title="Giải đấu" />
      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <Table head={['Mùa', 'Giải đấu', 'Trạng thái', 'Thời gian', 'Thí sinh', 'Vòng', '']} empty="Chưa có giải đấu nào.">
          {list.data.map((c) => {
            const st = COMP_STATUS[c.status || ''];
            return (
              <tr key={c.id}>
                <Td className="tabular-nums">{c.season}</Td>
                <Td className="font-medium">{c.title}</Td>
                <Td><Badge tone={st?.tone || 'gray'}>{st?.label || c.status || '—'}</Badge></Td>
                <Td className="text-[13px] text-[#46564D]">{c.competitionStartDate ? `${fmtDate(c.competitionStartDate)} – ${fmtDate(c.competitionEndDate)}` : '—'}</Td>
                <Td className="tabular-nums">{c.participantCount}</Td>
                <Td className="tabular-nums">{c.stageCount}</Td>
                <Td className="text-right"><LinkButton small href={`/quan-tri/giai-dau/${c.id}`}>Mở</LinkButton></Td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
