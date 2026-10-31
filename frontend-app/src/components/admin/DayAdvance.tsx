'use client';

// "Đi tiếp sang ngày sau" (plan 06 part 3), on the round results screen: for a day that has a next day, the number
// that goes on, a button that puts the top of this day's ranking on the next day's list, and exceptions that a coach
// or the admin adds with a reason. A day with a list only takes (and ranks) the people on it.

import { useState } from 'react';
import { api, useApi } from '@/lib/admin/client';
import { useMe } from '@/components/admin/me';
import { Button, Input, Loading, useUi } from '@/components/admin/ui';

interface Advance {
  dayId: number;
  dayNumber: number;
  advanceCount: number | null;
  nextDayId: number | null;
  nextDayNumber: number | null;
  ranked: number;
  list: { participantId: number; sbd: number; fullName: string; reason: 'TOP' | 'EXCEPTION'; note: string | null; rank: number | null; total: number | null }[];
  summary: { total: number; complete: number; incomplete: number; blocked: number; advancing: number; out: number };
  standings: Standing[];
}
type Status = 'TOP' | 'EXCEPTION' | 'OUT' | 'COMPLETE' | 'INCOMPLETE' | 'BLOCKED';
interface Standing { participantId: number; sbd: number; fullName: string; total: number | null; rank: number | null; missing: number; status: Status }

const STATUS: Record<Status, { label: string; cls: string }> = {
  TOP: { label: 'Đi tiếp (top)', cls: 'bg-[#E4F1E8] text-[#1F6B32]' },
  EXCEPTION: { label: 'Đi tiếp (ngoại lệ)', cls: 'bg-[#FDF1DE] text-[#8A4F07]' },
  COMPLETE: { label: 'Đủ điểm', cls: 'bg-[#EEF2EF] text-[#10231A]' },
  OUT: { label: 'Dừng', cls: 'bg-[#EEF2EF] text-[#66766D]' },
  INCOMPLETE: { label: 'Thiếu điểm', cls: 'bg-[#FFF4D6] text-[#8A5A00]' },
  BLOCKED: { label: 'Y tế loại', cls: 'bg-[#FDE4E1] text-[#B42318]' },
};
const FILTERS: { id: string; label: string; match: (s: Status) => boolean }[] = [
  { id: 'all', label: 'Tất cả', match: () => true },
  { id: 'go', label: 'Đi tiếp', match: (s) => s === 'TOP' || s === 'EXCEPTION' },
  { id: 'out', label: 'Dừng', match: (s) => s === 'OUT' },
  { id: 'inc', label: 'Thiếu điểm', match: (s) => s === 'INCOMPLETE' },
  { id: 'blk', label: 'Y tế loại', match: (s) => s === 'BLOCKED' },
];

export default function DayAdvance({ days }: { days: { id: number; dayNumber: number }[] }) {
  const withNext = [...days].sort((a, b) => a.dayNumber - b.dayNumber).slice(0, -1);
  if (withNext.length === 0) return null;
  return <div className="mb-6 space-y-4">{withNext.map((d) => <DayPanel key={d.id} dayId={d.id} />)}</div>;
}

function DayPanel({ dayId }: { dayId: number }) {
  const me = useMe();
  const admin = me.role === 'ADMIN';
  const canExcept = admin || me.role === 'HLV';
  const { toast, confirm } = useUi();
  const res = useApi<Advance>(`assessment-days/${dayId}/advance`);
  const a = res.data;
  const [count, setCount] = useState<string | null>(null);
  const [sbd, setSbd] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [board, setBoard] = useState(false);
  const [filter, setFilter] = useState('all');

  async function run(path: string, init: { method?: string; body?: unknown }, ok: string) {
    setBusy(true);
    try {
      res.setData(await api<Advance>(`assessment-days/${dayId}/advance${path}`, init));
      toast(ok);
      return true;
    } catch (e) {
      toast((e as Error).message, 'error');
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (!a) return <Loading error={res.error} loading={res.loading} />;
  const value = count ?? (a.advanceCount != null ? String(a.advanceCount) : '');
  const tops = a.list.filter((r) => r.reason === 'TOP').length;
  const exceptions = a.list.filter((r) => r.reason === 'EXCEPTION');

  return (
    <section className="rounded-lg border border-[#DCE5DF] bg-white p-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-semibold">Đi tiếp từ Ngày {a.dayNumber} sang Ngày {a.nextDayNumber}</h2>
          <div className="mt-2 flex flex-wrap gap-2 text-[13px]">
            <span className="rounded bg-[#EEF2EF] px-2 py-1">Dự thi Ngày {a.dayNumber}: <b>{a.summary.total}</b></span>
            <span className="rounded bg-[#E4F1E8] px-2 py-1 text-[#1F6B32]">Đủ điểm: <b>{a.summary.complete}</b></span>
            <span className="rounded bg-[#FFF4D6] px-2 py-1 text-[#8A5A00]">Thiếu điểm: <b>{a.summary.incomplete}</b></span>
            <span className="rounded bg-[#FDE4E1] px-2 py-1 text-[#B42318]">Y tế loại: <b>{a.summary.blocked}</b></span>
            {a.list.length > 0 && <>
              <span className="rounded bg-[#0F3324] px-2 py-1 text-[#D6FA9E]">Đi tiếp Ngày {a.nextDayNumber}: <b>{a.summary.advancing}</b> ({tops} top, {exceptions.length} ngoại lệ)</span>
              <span className="rounded bg-[#EEF2EF] px-2 py-1 text-[#66766D]">Dừng: <b>{a.standings.filter((x) => x.status !== 'TOP' && x.status !== 'EXCEPTION').length}</b></span>
            </>}
          </div>
          <p className="mt-1 text-[12px] text-[#66766D]">
            {a.list.length === 0
              ? `Ngày ${a.nextDayNumber} chưa có danh sách nên đang mở cho mọi thí sinh. Chốt bằng nút chuyển top.`
              : `Chỉ những người đi tiếp được chấm và xếp hạng ở Ngày ${a.nextDayNumber}.`}
            {a.summary.incomplete > 0 && ` Còn ${a.summary.incomplete} người thiếu điểm: nhập bù trước khi chốt, hoặc họ sẽ không vào top.`}
          </p>
        </div>
        <label className="w-[150px] text-[13px] font-medium">
          Số người đi tiếp
          <Input className="mt-1" inputMode="numeric" disabled={!admin || busy} value={value} placeholder="ví dụ 110" onChange={(e) => setCount(e.target.value.replace(/\D/g, ''))} />
        </label>
        {admin && count != null && count !== String(a.advanceCount ?? '') && (
          <Button disabled={busy} onClick={async () => { if (await run('', { method: 'PUT', body: { advanceCount: count || null } }, 'Đã lưu số người đi tiếp')) setCount(null); }}>Lưu số</Button>
        )}
        {admin && (
          <Button variant="primary" disabled={busy || !a.advanceCount || count != null && count !== String(a.advanceCount ?? '')}
            onClick={async () => {
              if (tops > 0 && !(await confirm(`Thay ${tops} người top hiện có bằng top ${a.advanceCount} mới nhất của Ngày ${a.dayNumber}? Ngoại lệ vẫn giữ.`))) return;
              run('/top', { method: 'POST' }, `Đã chuyển top ${a.advanceCount} sang Ngày ${a.nextDayNumber}`);
            }}>
            Chuyển top {a.advanceCount ?? 'x'} sang Ngày {a.nextDayNumber}
          </Button>
        )}
      </div>

      {canExcept && (
        <div className="mt-4 flex flex-wrap items-end gap-2 rounded-md bg-[#F6F8F7] p-3">
          <label className="w-[110px] text-[13px] font-medium">SBD ngoại lệ<Input className="mt-1" inputMode="numeric" value={sbd} onChange={(e) => setSbd(e.target.value.replace(/\D/g, ''))} /></label>
          <label className="min-w-[220px] flex-1 text-[13px] font-medium">Lý do (bắt buộc)<Input className="mt-1" value={note} placeholder="ví dụ: thủ môn tiềm năng, chấn thương nhẹ ở bài 2000m" onChange={(e) => setNote(e.target.value)} /></label>
          <Button disabled={busy || !sbd || !note.trim()} onClick={async () => {
            if (await run('/exception', { method: 'POST', body: { sbd, note } }, `Đã thêm SBD ${sbd} vào Ngày ${a.nextDayNumber}`)) { setSbd(''); setNote(''); }
          }}>Thêm ngoại lệ</Button>
        </div>
      )}

      <div className="mt-3">
        <button type="button" className="text-[13px] font-medium text-[#1F6B32] underline" onClick={() => setBoard((o) => !o)}>
          {board ? 'Ẩn bảng chốt' : `Xem bảng chốt Ngày ${a.dayNumber} (${a.standings.length} người)`}
        </button>
        {board && (
          <div className="mt-2">
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => (
                <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                  className={`rounded-md border px-2.5 py-1 text-[12px] font-medium ${filter === f.id ? 'border-[#0F3324] bg-[#0F3324] text-[#D6FA9E]' : 'border-[#C9D5CD] bg-white'}`}>
                  {f.label} ({a.standings.filter((x) => f.match(x.status)).length})
                </button>
              ))}
            </div>
            <table className="mt-2 w-full text-[13px]">
              <thead><tr className="text-left text-[12px] uppercase text-[#66766D]"><th className="py-1">Hạng</th><th>SBD</th><th>Thí sinh</th><th>Điểm N{a.dayNumber}</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {a.standings.filter((x) => FILTERS.find((f) => f.id === filter)!.match(x.status)).map((r) => (
                  <tr key={r.participantId} className={`border-t ${filter === 'all' && a.advanceCount && r.rank === a.advanceCount ? 'border-b-2 border-b-[#1F7A3A]' : ''} border-[#EEF2EF]`}>
                    <td className="py-1.5 tabular-nums">{r.rank ?? '—'}</td>
                    <td className="tabular-nums">{r.sbd}</td>
                    <td className="font-medium">{r.fullName}</td>
                    <td className="tabular-nums">{r.total != null && r.status !== 'INCOMPLETE' ? Number(r.total).toFixed(2) : '—'}</td>
                    <td>
                      <span className={`rounded px-1.5 py-0.5 text-[12px] font-semibold ${STATUS[r.status].cls}`}>{STATUS[r.status].label}</span>
                      {r.status === 'INCOMPLETE' && <span className="ml-2 text-[12px] text-[#8A5A00]">{r.missing < 0 ? 'chưa có số đo' : `thiếu ${r.missing} bài`}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filter === 'all' && a.advanceCount ? <p className="mt-1 text-[12px] text-[#66766D]">Vạch xanh đậm là vạch cắt top {a.advanceCount}.</p> : null}
          </div>
        )}
      </div>

      {a.list.length > 0 && (
        <div className="mt-3">
          <button type="button" className="text-[13px] font-medium text-[#1F6B32] underline" onClick={() => setOpen((o) => !o)}>
            {open ? 'Ẩn danh sách' : `Xem danh sách Ngày ${a.nextDayNumber} (${a.list.length})`}
          </button>
          {open && (
            <table className="mt-2 w-full text-[13px]">
              <thead><tr className="text-left text-[12px] uppercase text-[#66766D]"><th className="py-1">SBD</th><th>Thí sinh</th><th>Hạng N{a.dayNumber}</th><th>Điểm N{a.dayNumber}</th><th>Lý do</th><th /></tr></thead>
              <tbody>
                {a.list.map((r) => (
                  <tr key={r.participantId} className="border-t border-[#EEF2EF]">
                    <td className="py-1.5 tabular-nums">{r.sbd}</td>
                    <td className="font-medium">{r.fullName}</td>
                    <td className="tabular-nums">{r.rank ?? '—'}</td>
                    <td className="tabular-nums">{r.total != null ? Number(r.total).toFixed(2) : '—'}</td>
                    <td>{r.reason === 'TOP' ? 'Top' : <span><span className="rounded bg-[#FDF1DE] px-1.5 text-[12px] font-semibold text-[#8A4F07]">Ngoại lệ</span> {r.note}</span>}</td>
                    <td className="text-right">
                      {canExcept && <Button small variant="danger" disabled={busy} onClick={async () => {
                        if (await confirm(`Bỏ SBD ${r.sbd} khỏi danh sách Ngày ${a.nextDayNumber}?`)) run(`/${r.participantId}`, { method: 'DELETE' }, `Đã bỏ SBD ${r.sbd}`);
                      }}>Bỏ</Button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}
