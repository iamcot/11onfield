'use client';

import { useEffect, useState } from 'react';
import { api, useApi } from '@/lib/admin/client';
import { Badge, Button, Input, Loading, PageTitle, Select, Textarea, useUi } from '@/components/admin/ui';
import { PARTICIPATION } from '@/lib/admin/labels';

interface Ctx {
  competition?: { id: number; title: string };
  stage?: { id: number; title: string };
  days?: { id: number; title: string; steps: { id: number; title: string }[] }[];
}
interface Note { participation: 'FULL' | 'PARTIAL' | 'NONE'; ticked: boolean; note: string }
interface Row { id: number; sbd: number; fullName: string; avatar: string | null; blocked: boolean; note: Note | null }
interface List { participants: Row[]; recorded: number; total: number }

const LEVELS: ('FULL' | 'PARTIAL' | 'NONE')[] = ['FULL', 'PARTIAL', 'NONE'];
const LEVEL_CLS = {
  FULL: 'border-[#1F7A3A] bg-[#1F7A3A] text-white',
  PARTIAL: 'border-[#B7791F] bg-[#B7791F] text-white',
  NONE: 'border-[#B42318] bg-[#B42318] text-white',
};

/** One contestant: three participation buttons, a tick and a note. Saves as soon as a button is pressed. */
function Item({ row, stepId, onSaved }: { row: Row; stepId: number; onSaved: () => void }) {
  const { toast } = useUi();
  const [note, setNote] = useState(row.note?.note ?? '');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const cur = row.note;

  async function save(patch: Partial<Note>) {
    const next = { participation: cur?.participation ?? 'FULL', ticked: cur?.ticked ?? false, note, ...patch };
    setBusy(true);
    try {
      await api('judge-notes', { method: 'PUT', body: { stepId, participantId: row.id, ...next } });
      onSaved();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className={`rounded-lg border-2 bg-white p-3 ${cur ? 'border-[#1F7A3A]/40' : 'border-[#DCE5DF]'} ${row.blocked ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className="w-14 text-center font-[family-name:var(--font-hud)] text-[26px] font-bold tabular-nums text-[#0B2419]">{row.sbd}</span>
        <span className="min-w-[140px] flex-1 text-[17px] font-semibold">{row.fullName}</span>
        {row.blocked ? (
          <Badge tone="red">Đã bị loại (y tế)</Badge>
        ) : (
          <>
            <div className="flex gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  disabled={busy}
                  onClick={() => save({ participation: l })}
                  className={`min-h-[52px] min-w-[84px] rounded-lg border-2 px-3 text-[16px] font-semibold ${cur?.participation === l ? LEVEL_CLS[l] : 'border-[#0B2419]/25 bg-white text-[#06140D] active:bg-[#E4F3D6]'}`}
                >
                  {PARTICIPATION[l]}
                </button>
              ))}
            </div>
            <button
              type="button"
              disabled={busy}
              aria-pressed={!!cur?.ticked}
              onClick={() => save({ ticked: !cur?.ticked })}
              className={`min-h-[52px] rounded-lg border-2 px-4 text-[16px] font-semibold ${cur?.ticked ? 'border-[#0B2419] bg-[#0B2419] text-[#D6FA9E]' : 'border-[#0B2419]/25 bg-white'}`}
            >
              {cur?.ticked ? '✓ Đã tick' : 'Tick'}
            </button>
            <button type="button" className="min-h-[52px] px-2 text-[14px] text-[#1F6B32] underline" onClick={() => setOpen((v) => !v)}>
              {cur?.note ? 'Sửa ghi chú' : 'Ghi chú'}
            </button>
          </>
        )}
      </div>
      {open && !row.blocked && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <Textarea className="flex-1" placeholder="Ghi chú về thí sinh ở bài này" value={note} onChange={(e) => setNote(e.target.value)} />
          <Button variant="primary" disabled={busy} onClick={() => save({})}>Lưu ghi chú</Button>
        </div>
      )}
      {!open && cur?.note && <p className="mt-2 pl-[68px] text-[14px] text-[#46564D]">{cur.note}</p>}
    </li>
  );
}

export default function JudgeNotes() {
  const ctx = useApi<Ctx>('scouting/context');
  const [dayId, setDayId] = useState<number | null>(null);
  const [stepId, setStepId] = useState<number | null>(null);
  const [q, setQ] = useState('');
  const days = ctx.data?.days || [];
  const day = days.find((d) => d.id === dayId) || days[0];

  useEffect(() => {
    if (!dayId && days[0]) setDayId(days[0].id);
  }, [days, dayId]);

  const list = useApi<List>(stepId ? `judge-notes?stepId=${stepId}&q=${encodeURIComponent(q.trim())}` : null);

  return (
    <>
      <PageTitle title="Ghi nhận ban giám khảo">
        {ctx.data?.stage && <Badge tone="green">{ctx.data.stage.title}</Badge>}
      </PageTitle>
      <p className="mb-4 max-w-2xl text-[14px] text-[#46564D]">
        Chọn bài, rồi với mỗi thí sinh bấm mức tham gia (Đủ / Một phần / Không), tick nếu cần và ghi chú. Không chấm điểm số ở đây; chỉ ghi nhận của bạn,
        người khác không thấy.
      </p>
      <Loading error={ctx.error} loading={ctx.loading && !ctx.data} />
      {ctx.data && !ctx.data.stage && <p className="text-[#66766D]">Chưa có vòng thi nào đang diễn ra.</p>}
      {day && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Select className="max-w-xs" value={day.id} onChange={(e) => { setDayId(Number(e.target.value)); setStepId(null); }}>
            {days.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
          </Select>
          <Select className="max-w-xs" value={stepId ?? ''} onChange={(e) => setStepId(e.target.value ? Number(e.target.value) : null)}>
            <option value="">Chọn bài thi…</option>
            {day.steps.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
          </Select>
          {stepId && <Input className="max-w-[220px]" placeholder="Tìm SBD hoặc tên" value={q} onChange={(e) => setQ(e.target.value)} />}
        </div>
      )}
      {stepId && (
        <>
          <Loading error={list.error} loading={list.loading && !list.data} />
          {list.data && (
            <>
              <p className="mb-2 text-[13px] text-[#46564D]">Đã ghi nhận {list.data.recorded} thí sinh ở bài này.</p>
              <ul className="space-y-2">
                {list.data.participants.map((r) => <Item key={r.id} row={r} stepId={stepId} onSaved={list.reload} />)}
              </ul>
            </>
          )}
        </>
      )}
    </>
  );
}
