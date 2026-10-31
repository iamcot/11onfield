'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/admin/client';
import ContestantDetail, { type Row } from '@/components/admin/ContestantDetail';
import { Badge, ChevronCell, Drawer, Input, Loading, PageTitle, Table, Td } from '@/components/admin/ui';
import { FLAG_KINDS, PARTICIPANT_STATUS } from '@/lib/admin/labels';

export default function ScoutingParticipantsPage() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);
  const list = useApi<{ participants: Row[] }>(`scouting/participants?q=${encodeURIComponent(debounced)}`);

  return (
    <>
      <PageTitle title="Thí sinh" />
      <p className="mb-3 max-w-2xl text-[14px] text-[#46564D]">Tìm theo SBD, tên hoặc số điện thoại để xem và đặt cờ. Hiện tối đa 100 thí sinh.</p>
      <Input className="mb-3 max-w-sm" placeholder="Tìm theo SBD, tên, số điện thoại" value={q} onChange={(e) => setQ(e.target.value)} />
      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <Table head={['SBD', 'Thí sinh', 'Điện thoại', 'Trạng thái', 'Cờ', '']} empty="Không có thí sinh phù hợp.">
          {list.data.participants.map((p) => {
            const st = PARTICIPANT_STATUS[p.status];
            return (
              <tr key={p.id} className="cursor-pointer hover:bg-[#F6F9F7]" onClick={() => setOpen(p.id)}>
                <Td className="tabular-nums">{p.sbd}</Td>
                <Td className="font-medium">{p.fullName}</Td>
                <Td className="tabular-nums">{p.phone}</Td>
                <Td><Badge tone={st?.tone || 'gray'}>{st?.label || p.status}</Badge></Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {p.flags.map((f) => <Badge key={f} tone={FLAG_KINDS[f]?.tone || 'gray'}>{FLAG_KINDS[f]?.label || f}</Badge>)}
                    {p.greenCard && <Badge tone="green">Green Card</Badge>}
                  </div>
                </Td>
                <ChevronCell />
              </tr>
            );
          })}
        </Table>
      )}
      {open !== null && (
        <Drawer title="Thí sinh" onClose={() => setOpen(null)}>
          <ContestantDetail id={open} onChanged={list.reload} />
        </Drawer>
      )}
    </>
  );
}
