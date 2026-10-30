'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useIsManager } from '@/components/admin/me';
import { Button, Field, Input, Loading, Modal, Table, Td, Textarea, useUi } from '@/components/admin/ui';

interface Contestant { id: number; sbd: number; userId: number; fullName: string; phone: string | null }
interface Result { id: number; userId: number; fullName: string; score: number | null; rankPosition: number | null; performanceNotes: string | null; videoUrl: string | null }

export default function StageResultsPage() {
  const { id, n } = useParams<{ id: string; n: string }>();
  const manager = useIsManager();
  const { toast, confirm } = useUi();
  const results = useApi<Result[]>(`competitions/${id}/stages/${n}/results`);
  const contestants = useApi<Contestant[]>(`competitions/${id}/contestants`);
  const [edit, setEdit] = useState<{ c: Contestant; score: string; rank: string; notes: string; video: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');

  const rows = useMemo(() => {
    const byUser = new Map((results.data || []).map((r) => [r.userId, r]));
    const needle = q.trim().toLowerCase();
    return (contestants.data || [])
      .map((c) => ({ c, r: byUser.get(c.userId) }))
      .filter(({ c }) => !needle || String(c.sbd) === needle || c.fullName?.toLowerCase().includes(needle))
      .sort((a, b) => (a.r?.rankPosition ?? 1e9) - (b.r?.rankPosition ?? 1e9) || a.c.sbd - b.c.sbd);
  }, [results.data, contestants.data, q]);

  async function save() {
    if (!edit) return;
    setBusy(true);
    try {
      await api(`competitions/${id}/stages/${n}/results/${edit.c.id}`, {
        method: 'PUT',
        body: { score: edit.score === '' ? null : Number(edit.score), rankPosition: edit.rank === '' ? null : Number(edit.rank), performanceNotes: edit.notes || null, videoUrl: edit.video || null },
      });
      toast('Đã lưu kết quả');
      setEdit(null);
      results.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function recalc() {
    if (!(await confirm('Tính lại điểm toàn vòng từ điểm các bài thi? Điểm nhập tay sẽ bị ghi đè.'))) return;
    try {
      await api(`competitions/${id}/stages/${n}/recalculate`, { method: 'POST' });
      toast('Đã tính lại điểm');
      results.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <>
      <CompetitionTabs id={id} title={`Kết quả — vòng ${n}`}>
        <div className="flex gap-2">
          <a className="inline-block border border-[#C9D5CD] px-4 py-2 text-[14px] font-medium hover:border-[#1F7A3A]" href={`/quan-tri/api/proxy/competitions/${id}/export/results`}>Xuất Excel</a>
          {manager && <Button onClick={recalc}>Tính lại điểm</Button>}
        </div>
      </CompetitionTabs>
      <div className="mb-3 max-w-xs"><Input placeholder="Tìm theo SBD hoặc tên" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      <Loading error={results.error || contestants.error} loading={(results.loading || contestants.loading) && !results.data} />
      {results.data && contestants.data && (
        <Table head={['SBD', 'Thí sinh', 'Điểm', 'Hạng', 'Nhận xét', '']} empty="Chưa có thí sinh.">
          {rows.map(({ c, r }) => (
            <tr key={c.id}>
              <Td className="tabular-nums">{c.sbd}</Td>
              <Td className="font-medium">{c.fullName}</Td>
              <Td className="tabular-nums">{r?.score != null ? Number(r.score).toFixed(2) : '—'}</Td>
              <Td className="tabular-nums">{r?.rankPosition ?? '—'}</Td>
              <Td className="max-w-[260px] truncate text-[13px] text-[#46564D]">{r?.performanceNotes || ''}</Td>
              <Td className="text-right">
                {manager && <Button small onClick={() => setEdit({ c, score: r?.score != null ? String(r.score) : '', rank: r?.rankPosition != null ? String(r.rankPosition) : '', notes: r?.performanceNotes || '', video: r?.videoUrl || '' })}>Sửa</Button>}
              </Td>
            </tr>
          ))}
        </Table>
      )}
      {edit && (
        <Modal title={`SBD ${edit.c.sbd} — ${edit.c.fullName}`} onClose={() => setEdit(null)}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Điểm"><Input type="number" step="0.01" value={edit.score} onChange={(e) => setEdit({ ...edit, score: e.target.value })} /></Field>
              <Field label="Xếp hạng"><Input type="number" min={1} value={edit.rank} onChange={(e) => setEdit({ ...edit, rank: e.target.value })} /></Field>
            </div>
            <Field label="Nhận xét"><Textarea rows={4} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></Field>
            <Field label="Link video"><Input type="url" placeholder="https://" value={edit.video} onChange={(e) => setEdit({ ...edit, video: e.target.value })} /></Field>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEdit(null)}>Huỷ</Button>
              <Button variant="primary" disabled={busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
