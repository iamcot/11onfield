'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useIsManager } from '@/components/admin/me';
import { Badge, Input, Loading, Select, Table, Td } from '@/components/admin/ui';
import { fmtDateTime, PARTICIPANT_STATUS, REGIONS } from '@/lib/admin/labels';

interface Contestant { id: number; sbd: number; fullName: string; phone: string | null; status: string; region: string | null; registrationDate: string | null }

export default function ContestantsPage() {
  const { id } = useParams<{ id: string }>();
  const manager = useIsManager();
  const list = useApi<Contestant[]>(`competitions/${id}/contestants`);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [region, setRegion] = useState('');

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (list.data || []).filter(
      (c) =>
        (!status || c.status === status) &&
        (!region || c.region === region) &&
        (!needle || String(c.sbd) === needle || c.fullName?.toLowerCase().includes(needle) || c.phone?.includes(needle)),
    );
  }, [list.data, q, status, region]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    (list.data || []).forEach((c) => (m[c.region || ''] = (m[c.region || ''] || 0) + 1));
    return m;
  }, [list.data]);

  return (
    <>
      <CompetitionTabs id={id}>
        {manager && <a className="inline-block border border-[#C9D5CD] px-4 py-2 text-[14px] font-medium hover:border-[#1F7A3A]" href={`/quan-tri/api/proxy/competitions/${id}/export/participants`}>Xuất Excel</a>}
      </CompetitionTabs>
      <p className="mb-3 text-[13px] text-[#46564D]">
        Tổng {list.data?.length ?? 0} thí sinh{Object.entries(REGIONS).map(([k, v]) => ` · ${v}: ${counts[k] || 0}`).join('')}. SBD tính theo thứ tự đăng ký.
      </p>
      <div className="mb-3 grid gap-2 sm:grid-cols-3">
        <Input placeholder="Tìm theo SBD, tên, số điện thoại" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(PARTICIPANT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
        <Select value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">Mọi khu vực</option>
          {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>
      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <Table head={['SBD', 'Thí sinh', 'Điện thoại', 'Khu vực', 'Trạng thái', 'Đăng ký lúc']} empty="Không có thí sinh phù hợp.">
          {rows.map((c) => {
            const st = PARTICIPANT_STATUS[c.status];
            return (
              <tr key={c.id}>
                <Td className="tabular-nums">{c.sbd}</Td>
                <Td className="font-medium">{c.fullName}</Td>
                <Td className="tabular-nums">{c.phone}</Td>
                <Td>{c.region ? REGIONS[c.region] || c.region : '—'}</Td>
                <Td><Badge tone={st?.tone || 'gray'}>{st?.label || c.status}</Badge></Td>
                <Td className="text-[13px] text-[#46564D]">{fmtDateTime(c.registrationDate)}</Td>
              </tr>
            );
          })}
        </Table>
      )}
    </>
  );
}
