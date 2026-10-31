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
}

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
          <p className="text-[13px] text-[#46564D]">
            {a.list.length === 0
              ? `Ngày ${a.nextDayNumber} chưa có danh sách, nên đang mở cho mọi thí sinh.`
              : `Ngày ${a.nextDayNumber} có ${a.list.length} người: ${tops} người top, ${exceptions.length} ngoại lệ. Chỉ những người này được chấm và xếp hạng ở Ngày ${a.nextDayNumber}.`}
            {' '}Ngày {a.dayNumber} đang có {a.ranked} người đủ điểm.
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
