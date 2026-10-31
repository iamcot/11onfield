'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import AddContestantModal from '@/components/admin/AddContestantModal';
import ContestantDetail from '@/components/admin/ContestantDetail';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, ChevronCell, Drawer, Input, LinkButton, Loading, Select, Table, Td, useUi } from '@/components/admin/ui';
import { fmtDateTime, PARTICIPANT_STATUS, REGIONS } from '@/lib/admin/labels';

interface Contestant {
  id: number; sbd: number; playerId: number | null; fullName: string; phone: string | null; status: string; region: string | null; registrationDate: string | null;
  lastCheckin: { stageTitle: string; stageNumber: number; at: string } | null;
}

export default function ContestantsPage() {
  const { id } = useParams<{ id: string }>();
  const manager = useIsManager();
  const list = useApi<Contestant[]>(`competitions/${id}/contestants`);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [region, setRegion] = useState('');
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState<Contestant | null>(null);
  const { toast, confirm } = useUi();

  const setOut = async (c: Contestant, out: boolean) => {
    const text = out
      ? `Cho ${c.fullName} ra khỏi giải? Điểm và check-in vẫn được giữ, có thể đưa lại sau.`
      : `Đưa ${c.fullName} trở lại giải?`;
    if (!(await confirm(text))) return;
    try {
      const r = await api<{ message: string }>(`competitions/${id}/participants/${c.id}/${out ? 'withdraw' : 'restore'}`, { method: 'POST' });
      toast(r.message);
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  };

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
        {manager && <Button variant="primary" onClick={() => setAdding(true)}>+ Thêm cầu thủ</Button>}
        <LinkButton href={`/quan-tri/giai-dau/${id}/thi-sinh/phieu-sbd`}>In phiếu SBD</LinkButton>
        {manager && <a className="inline-block border border-[#C9D5CD] px-4 py-2 text-[14px] font-medium hover:border-[#1F7A3A]" href={`/quan-tri/api/proxy/competitions/${id}/export/participants`}>Xuất Excel</a>}
      </CompetitionTabs>
      {adding && <AddContestantModal competitionId={id} onClose={() => setAdding(false)} onAdded={list.reload} />}
      <p className="mb-3 text-[13px] text-[#46564D]">
        Tổng {list.data?.length ?? 0} thí sinh{Object.entries(REGIONS).map(([k, v]) => ` · ${v}: ${counts[k] || 0}`).join('')}. SBD cấp cố định khi hồ sơ được duyệt.
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
        <Table head={['SBD', 'Thí sinh', 'Điện thoại', 'Khu vực', 'Trạng thái', 'Check-in gần nhất', 'Đăng ký lúc', ...(manager ? [''] : []), '']} empty="Không có thí sinh phù hợp.">
          {rows.map((c) => {
            const st = PARTICIPANT_STATUS[c.status];
            return (
              <tr key={c.id} className={`cursor-pointer hover:bg-[#F6F9F7] ${c.status === 'WITHDRAWN' ? 'opacity-60' : ''}`} onClick={() => setOpen(c)}>
                <Td className="tabular-nums">{c.sbd}</Td>
                <Td className="font-medium">{c.fullName}</Td>
                <Td className="tabular-nums">{c.phone}</Td>
                <Td>{c.region ? REGIONS[c.region] || c.region : '—'}</Td>
                <Td><Badge tone={st?.tone || 'gray'}>{st?.label || c.status}</Badge></Td>
                <Td className="text-[13px] text-[#46564D]">
                  {c.lastCheckin ? <><div className="text-[#10231A]">{c.lastCheckin.stageTitle}</div>{fmtDateTime(c.lastCheckin.at)}</> : '—'}
                </Td>
                <Td className="text-[13px] text-[#46564D]">{fmtDateTime(c.registrationDate)}</Td>
                {manager && (
                  <Td className="whitespace-nowrap">
                    <span onClick={(e) => e.stopPropagation()}>
                      {c.status === 'WITHDRAWN'
                        ? <Button small onClick={() => setOut(c, false)}>Đưa lại vào giải</Button>
                        : <Button small onClick={() => setOut(c, true)}>Cho ra khỏi giải</Button>}
                    </span>
                  </Td>
                )}
                <ChevronCell />
              </tr>
            );
          })}
        </Table>
      )}
      {open && (
        <Drawer title="Thí sinh" onClose={() => setOpen(null)}>
          {open.playerId && (
            <div className="mb-3 flex justify-end">
              <a href={`/quan-tri/cau-thu/${open.playerId}`} target="_blank" rel="noopener noreferrer"
                className="inline-block border border-[#C9D5CD] px-3 py-1.5 text-[13px] font-medium hover:border-[#1F7A3A]">Xem hồ sơ ↗</a>
            </div>
          )}
          <ContestantDetail id={open.id} onChanged={list.reload} />
        </Drawer>
      )}
    </>
  );
}
