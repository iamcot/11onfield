'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, Card, Loading, useUi } from '@/components/admin/ui';
import { PARTICIPANT_STATUS, REGIONS } from '@/lib/admin/labels';
import Top30Selection from '@/components/admin/Top30Selection';

interface Candidate { id: number; fullName: string; status: string; selectedRegion: string | null; totalScore: number | null }

function Picker({ id, kind, limit, manager }: { id: string; kind: 'top30' | 'top11'; limit: number; manager: boolean }) {
  const { toast, confirm } = useUi();
  const list = useApi<Candidate[]>(`competitions/${id}/select-${kind}/eligible`);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  // Start from whoever is already selected so an edit does not drop them.
  useEffect(() => {
    if (list.data) setPicked(new Set(list.data.filter((c) => c.status === (kind === 'top30' ? 'SELECTED_TOP30' : 'SELECTED_TOP11')).map((c) => c.id)));
  }, [list.data, kind]);

  const toggle = (cid: number) => setPicked((s) => { const n = new Set(s); n.has(cid) ? n.delete(cid) : n.add(cid); return n; });

  async function save() {
    if (picked.size !== limit && !(await confirm(`Đã chọn ${picked.size}/${limit} thí sinh. Vẫn lưu?`))) return;
    setBusy(true);
    try {
      const r = await api<{ message: string }>(`competitions/${id}/select-${kind}`, { body: { participantIds: Array.from(picked) } });
      toast(r?.message || 'Đã lưu');
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title={`${kind === 'top30' ? 'Top 30' : 'Top 11'} — đã chọn ${picked.size}/${limit}`}>
      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && list.data.length === 0 && <p className="text-[#66766D]">Chưa có thí sinh đủ điều kiện.</p>}
      <ul className="divide-y divide-[#E6ECE8]">
        {list.data?.map((c, i) => {
          const st = PARTICIPANT_STATUS[c.status];
          return (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-3 py-2 text-[14px]">
                <input type="checkbox" className="h-4 w-4 accent-[#1F7A3A]" disabled={!manager} checked={picked.has(c.id)} onChange={() => toggle(c.id)} />
                <span className="w-6 tabular-nums text-[#66766D]">{i + 1}</span>
                <span className="flex-1 font-medium">{c.fullName}</span>
                <span className="hidden text-[12px] text-[#66766D] sm:inline">{c.selectedRegion ? REGIONS[c.selectedRegion] : ''}</span>
                <span className="tabular-nums text-[#1F6B32]">{c.totalScore != null ? Number(c.totalScore).toFixed(2) : '—'}</span>
                <Badge tone={st?.tone || 'gray'}>{st?.label || c.status}</Badge>
              </label>
            </li>
          );
        })}
      </ul>
      {manager && list.data && list.data.length > 0 && <div className="mt-4"><Button variant="primary" disabled={busy} onClick={save}>{busy ? 'Đang lưu…' : `Lưu Top ${limit}`}</Button></div>}
    </Card>
  );
}

export default function SelectionPage() {
  const { id } = useParams<{ id: string }>();
  const manager = useIsManager();
  return (
    <>
      <CompetitionTabs id={id} />
      <h2 className="mb-2 text-[16px] font-semibold">Top 30</h2>
      <Top30Selection id={id} />
      <h2 className="mb-2 mt-8 text-[16px] font-semibold">Top 11</h2>
      <p className="mb-3 text-[13px] text-[#46564D]">Chọn Top 11 từ Top 30 sau khi Top 30 đã chốt. {manager ? '' : 'Bạn chỉ có quyền xem.'}</p>
      <div className="max-w-3xl">
        <Picker id={id} kind="top11" limit={11} manager={manager} />
      </div>
    </>
  );
}
