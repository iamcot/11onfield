'use client';

// Score groups the head coach scores by hand ("HLV chấm tay" on the round setup), entered after the exam.

import { useEffect, useState } from 'react';
import { api, useApi } from '@/lib/admin/client';
import { useMe } from '@/components/admin/me';
import { Button, Card, Field, Input, Loading, Modal, Select, Table, Td, Textarea, useUi } from '@/components/admin/ui';
import { fmtDateTime } from '@/lib/admin/labels';

/** A hand-scored score group of the round; owner is who enters it (HLV). */
interface Component { key: string; label: string; max: number; owner?: 'HLV' | 'TTV' }
interface Row {
  id: number; sbd: number; fullName: string;
  scores: Record<string, number>;
  judges: { full: number; partial: number; none: number; withNote: number };
}
interface Data { components: Component[]; participants: Row[] }
interface Entry { componentKey: string; points: number; enteredBy: string | null; enteredAt: string; reason: string | null }

function ScoreModal({ stageId, row, comps: all, onClose, onSaved }: { stageId: number; row: Row; comps: Component[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useUi();
  const me = useMe();
  // Only the head coach (and the admin) enters these.
  const comps = me.role === 'TTV' ? all.filter((c) => c.owner !== 'HLV') : all;
  const history = useApi<Entry[]>(`stages/${stageId}/manual-scores/${row.id}/history`);
  const [key, setKey] = useState(comps[0]?.key ?? '');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const comp = comps.find((c) => c.key === key)!;
  const current = row.scores[key];
  const detail = useApi<{ judgeNotes: { judge: string; step: string | null; participation: string; ticked: boolean; note: string | null }[] }>(`scouting/participants/${row.id}`);

  useEffect(() => { setPoints(current != null ? String(current) : ''); setReason(''); }, [key, current]);

  async function save() {
    setBusy(true);
    try {
      await api(`stages/${stageId}/manual-scores`, { method: 'PUT', body: { participantId: row.id, componentKey: key, points, reason } });
      toast('Đã lưu điểm');
      onSaved();
      history.reload();
      setReason('');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`SBD ${row.sbd} · ${row.fullName}`} onClose={onClose} wide>
      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <Field label="Hạng mục">
            <Select value={key} onChange={(e) => setKey(e.target.value)}>
              {comps.map((c) => <option key={c.key} value={c.key}>{c.label} (tối đa {c.max})</option>)}
            </Select>
          </Field>
          <Field label={`Điểm (0–${comp.max})`} className="mt-3">
            <Input inputMode="decimal" value={points} onChange={(e) => setPoints(e.target.value)} />
          </Field>
          <Field label={current != null ? 'Lý do sửa *' : 'Ghi chú'} className="mt-3">
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
          </Field>
          <div className="mt-3 flex justify-end">
            <Button variant="primary" disabled={busy || points === '' || (current != null && !reason.trim())} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu điểm'}</Button>
          </div>
          <h3 className="mt-5 mb-2 text-[12px] font-semibold uppercase tracking-wider text-[#46564D]">Lịch sử nhập</h3>
          <Loading error={history.error} loading={history.loading && !history.data} />
          <ul className="divide-y divide-[#E6ECE8] text-[13px]">
            {history.data?.map((h, i) => (
              <li key={i} className="py-1.5">
                <b>{comps.find((c) => c.key === h.componentKey)?.label}</b>: {h.points} điểm · {h.enteredBy} · {fmtDateTime(h.enteredAt)}
                {h.reason && <div className="text-[#46564D]">{h.reason}</div>}
              </li>
            ))}
            {history.data?.length === 0 && <li className="py-1.5 text-[#66766D]">Chưa nhập điểm nào.</li>}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[#46564D]">Ghi nhận của ban giám khảo</h3>
          <Loading error={detail.error} loading={detail.loading && !detail.data} />
          <ul className="max-h-[420px] divide-y divide-[#E6ECE8] overflow-y-auto text-[13px]">
            {detail.data?.judgeNotes.map((n, i) => (
              <li key={i} className="py-1.5">
                <span className="font-medium">{n.step}</span> · {n.judge} · {n.participation === 'FULL' ? 'Đủ' : n.participation === 'PARTIAL' ? 'Một phần' : 'Không'}{n.ticked ? ' · ✓' : ''}
                {n.note && <div className="text-[#46564D]">{n.note}</div>}
              </li>
            ))}
            {detail.data?.judgeNotes.length === 0 && <li className="py-1.5 text-[#66766D]">Chưa có ghi nhận.</li>}
          </ul>
        </div>
      </div>
    </Modal>
  );
}

export default function ManualScores({ stageId }: { stageId: number }) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Row | null>(null);
  const data = useApi<Data>(`stages/${stageId}/manual-scores?q=${encodeURIComponent(q.trim())}`);

  return (
    <Card>
      <p className="mb-3 max-w-2xl text-[13px] text-[#46564D]">
        Các nhóm điểm “HLV chấm tay” của vòng này (đặt ở bước Bài thi và thang điểm), ví dụ đối kháng, tâm lý, hình ảnh. HLV nhập điểm từng thí sinh sau khi thi; sửa điểm đã nhập phải có lý do. Bảng xếp hạng ghi “chưa đủ” cho đến khi các nhóm này được nhập.
      </p>
      {data.data && data.data.components.length === 0 && (
        <p className="mb-3 rounded-md bg-[#FDF1DE] px-3 py-2 text-[13px] text-[#8A4F07]">Vòng này chưa có nhóm điểm nào chọn “HLV chấm tay”, nên chưa có gì để nhập ở đây.</p>
      )}
      <div className="mb-3 flex flex-wrap gap-2">
        <Input className="max-w-xs" placeholder="Tìm SBD hoặc tên" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <Loading error={data.error} loading={data.loading && !data.data} />
      {data.data && (
        <Table head={['SBD', 'Thí sinh', ...data.data.components.map((c) => `${c.label} /${c.max}`), 'Ghi nhận', '']} empty="Không có thí sinh.">
          {data.data.participants.slice(0, 200).map((p) => (
            <tr key={p.id} className="cursor-pointer hover:bg-[#F6FAF7]" onClick={() => setOpen(p)}>
              <Td className="tabular-nums">{p.sbd}</Td>
              <Td className="font-medium">{p.fullName}</Td>
              {data.data!.components.map((c) => (
                <Td key={c.key} className="tabular-nums">{p.scores[c.key] != null ? p.scores[c.key] : <span className="text-[#9AA8A0]">—</span>}</Td>
              ))}
              <Td className="text-[12px] text-[#46564D]">
                {p.judges.full + p.judges.partial + p.judges.none === 0 ? '—' : `Đủ ${p.judges.full} · Một phần ${p.judges.partial} · Không ${p.judges.none}`}
                {p.judges.withNote > 0 && ` · ${p.judges.withNote} ghi chú`}
              </Td>
              <td className="w-8 px-3 text-right text-[22px] text-[#9AA8A0]" aria-hidden="true">›</td>
            </tr>
          ))}
        </Table>
      )}
      {open && data.data && (
        <ScoreModal stageId={stageId} row={open} comps={data.data.components} onClose={() => setOpen(null)} onSaved={() => data.reload()} />
      )}
    </Card>
  );
}

