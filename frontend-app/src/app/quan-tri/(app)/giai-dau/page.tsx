'use client';

import { useApi } from '@/lib/admin/client';
import { Badge, LinkButton, Loading, PageTitle, Table, Td } from '@/components/admin/ui';

interface Comp {
  id: number;
  title: string;
  season: number;
  status: string | null;
}

export default function CompetitionsPage() {
  const list = useApi<Comp[]>('competitions');
  return (
    <>
      <PageTitle title="Giải đấu" />
      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <Table head={['Mùa', 'Giải đấu', 'Trạng thái', '']} empty="Chưa có giải đấu nào.">
          {list.data.map((c) => (
            <tr key={c.id}>
              <Td className="tabular-nums">{c.season}</Td>
              <Td className="font-medium">{c.title}</Td>
              <Td><Badge tone="gray">{c.status || '—'}</Badge></Td>
              <Td className="text-right"><LinkButton small href={`/quan-tri/giai-dau/${c.id}`}>Mở</LinkButton></Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
