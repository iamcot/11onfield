'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useIsManager, useMe } from '@/components/admin/me';
import { Badge, Button, Card, Field, Input, LinkButton, Loading, Modal, Select, Textarea, useUi } from '@/components/admin/ui';
import { fmtDateTime } from '@/lib/admin/labels';

interface Assessment { id: number; title: string }
interface Step { id: number; stepNumber: number; title: string; assessments: Assessment[] }
interface Day { id: number; dayNumber: number; title: string; assessmentSteps: Step[] }

interface Raw {
  id: number; value: number | null; status: 'OK' | 'FAULT' | 'DNS'; faultNote: string | null; source: 'DEVICE' | 'FILE' | 'VIDEO' | 'MANUAL';
  deviceId: string | null; recordedBy: string | number | null; measuredAt: string | null; receivedAt: string | null; evidenceUrl: string | null; supersedesId: number | null; reason: string | null;
}
interface Item {
  officialId: number; participantId: number; fullName: string; stepId: number; stepTitle: string; assessmentId: number; assessmentTitle: string; unit: string | null;
  attemptNumber: number; reason: Reason; pickedRawId: number | null; records: Raw[];
}
type Reason = 'SOURCE_MISMATCH' | 'IMPLAUSIBLE' | 'AFTER_LOCK' | 'AFTER_RESOLVE';
interface Review { items: Item[]; counts: Partial<Record<'AUTO' | 'REVIEW' | 'RESOLVED' | 'LOCKED', number>> }

const REASONS: Record<Reason, { label: string; hint: string }> = {
  SOURCE_MISMATCH: { label: 'Hai nguồn lệch nhau', hint: 'Các nguồn đo lệch quá sai số cho phép.' },
  IMPLAUSIBLE: { label: 'Ngoài ngưỡng hợp lý', hint: 'Giá trị nằm ngoài khoảng hợp lý của nội dung.' },
  AFTER_LOCK: { label: 'Số tới sau khi khoá sổ', hint: 'Có bản ghi mới đến khi bài đã khoá.' },
  AFTER_RESOLVE: { label: 'Số mới sau khi đã chốt', hint: 'Có bản ghi mới đến sau khi đã chốt tay.' },
};
const SOURCES = { DEVICE: 'Thiết bị', FILE: 'File thiết bị', VIDEO: 'Video', MANUAL: 'Nhập tay' };
const STATUS = { OK: '', FAULT: 'Lỗi kỹ thuật', DNS: 'Không thi' };
const COUNTS: { key: keyof Review['counts']; label: string; tone: 'green' | 'gold' | 'red' | 'gray' }[] = [
  { key: 'REVIEW', label: 'Cần xem', tone: 'red' },
  { key: 'AUTO', label: 'Tự chốt', tone: 'green' },
  { key: 'RESOLVED', label: 'Đã chốt tay', tone: 'gold' },
  { key: 'LOCKED', label: 'Đã khoá', tone: 'gray' },
];

const show = (r: Raw, unit: string | null) => (r.status !== 'OK' ? STATUS[r.status] : `${r.value}${unit ? ` ${unit}` : ''}`);
const who = (r: Raw) => (r.source === 'DEVICE' && r.deviceId ? `${SOURCES.DEVICE} ${r.deviceId}` : SOURCES[r.source] || r.source) + (r.recordedBy ? ` · ${r.recordedBy}` : '');

function ItemCard({ item, onDone, readOnly }: { item: Item; onDone: () => void; readOnly: boolean }) {
  const { toast } = useUi();
  const [pick, setPick] = useState<number | 'typed' | null>(item.pickedRawId ?? null);
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'OK' | 'FAULT' | 'DNS'>('OK');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<{ records: Raw[] } | null>(null);
  const r = REASONS[item.reason];

  async function resolve() {
    if (pick === null) return toast('Chọn một bản ghi hoặc nhập số đúng', 'error');
    if (!note.trim()) return toast('Cần ghi lý do chốt', 'error');
    if (pick === 'typed' && status === 'OK' && value.trim() === '') return toast('Nhập số đúng', 'error');
    setBusy(true);
    try {
      await api(`measurements/official/${item.officialId}/resolve`, {
        method: 'POST',
        body: pick === 'typed' ? { value: status === 'OK' ? Number(value.replace(',', '.')) : null, status, note } : { rawId: pick, note },
      });
      toast(`Đã chốt ${item.assessmentTitle} lượt ${item.attemptNumber} của ${item.fullName}`);
      onDone();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function openHistory() {
    try {
      setHistory(await api(`measurements/history?assessmentId=${item.assessmentId}&participantId=${item.participantId}&attempt=${item.attemptNumber}`));
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[16px] font-semibold">{item.fullName}</p>
          <p className="text-[13px] text-[#46564D]">{item.stepTitle} › {item.assessmentTitle} · lượt {item.attemptNumber}</p>
        </div>
        <div className="text-right">
          <Badge tone="red">{r.label}</Badge>
          <p className="mt-0.5 text-[12px] text-[#66766D]">{r.hint}</p>
        </div>
      </div>

      <div className="mt-3 divide-y divide-[#E6ECE8] border border-[#DCE5DF]">
        {item.records.map((rec) => (
          <label key={rec.id} className={`flex cursor-pointer flex-wrap items-center gap-3 px-3 py-2 ${pick === rec.id ? 'bg-[#EAF5E0]' : 'hover:bg-[#F6FAF7]'}`}>
            <input type="radio" name={`pick-${item.officialId}`} disabled={readOnly} checked={pick === rec.id} onChange={() => setPick(rec.id)} className="h-4 w-4 accent-[#1F7A3A]" />
            <span className="w-28 text-[16px] font-semibold tabular-nums">{show(rec, item.unit)}</span>
            <span className="text-[13px] text-[#46564D]">{who(rec)}</span>
            <span className="text-[12px] text-[#66766D]">{fmtDateTime(rec.measuredAt || rec.receivedAt)}</span>
            {rec.id === item.pickedRawId && <Badge tone="gold">Đang chọn</Badge>}
            {rec.faultNote && <span className="text-[12px] text-[#8A5A00]">{rec.faultNote}</span>}
            {rec.evidenceUrl && <a href={rec.evidenceUrl} target="_blank" rel="noreferrer" className="text-[12px] text-[#1F6B32] underline">Bằng chứng</a>}
          </label>
        ))}
        {item.records.length === 0 && <p className="px-3 py-3 text-[13px] text-[#66766D]">Không còn bản ghi nào.</p>}
        {!readOnly && (
          <div className={`px-3 py-2 ${pick === 'typed' ? 'bg-[#EAF5E0]' : ''}`}>
            <label className="flex cursor-pointer items-center gap-3">
              <input type="radio" name={`pick-${item.officialId}`} checked={pick === 'typed'} onChange={() => setPick('typed')} className="h-4 w-4 accent-[#1F7A3A]" />
              <span className="text-[14px]">Nhập số đúng</span>
            </label>
            {pick === 'typed' && (
              <div className="mt-2 grid max-w-md grid-cols-2 gap-2 pl-7">
                <Select aria-label="Trạng thái" value={status} onChange={(e) => setStatus(e.target.value as 'OK' | 'FAULT' | 'DNS')}>
                  <option value="OK">Có kết quả</option><option value="FAULT">Lỗi kỹ thuật</option><option value="DNS">Không thi</option>
                </Select>
                {status === 'OK' && <Input inputMode="decimal" placeholder={item.unit || 'Giá trị'} aria-label="Giá trị đúng" value={value} onChange={(e) => setValue(e.target.value)} />}
              </div>
            )}
          </div>
        )}
      </div>

      {!readOnly && (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Field label="Lý do chốt (bắt buộc)" className="min-w-[220px] flex-1">
            <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ví dụ: xem lại video, dây đo trượt" />
          </Field>
          <Button small onClick={openHistory}>Lịch sử</Button>
          <Button variant="primary" disabled={busy} onClick={resolve}>{busy ? 'Đang chốt…' : 'Chốt'}</Button>
        </div>
      )}
      {readOnly && <div className="mt-3"><Button small onClick={openHistory}>Lịch sử</Button></div>}

      {history && (
        <Modal title={`Lịch sử: ${item.assessmentTitle} lượt ${item.attemptNumber}`} wide onClose={() => setHistory(null)}>
          <ol className="space-y-2 text-[14px]">
            {history.records.map((rec) => (
              <li key={rec.id} className="border border-[#DCE5DF] px-3 py-2">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-semibold tabular-nums">{show(rec, item.unit)}</span>
                  <span className="text-[13px] text-[#46564D]">{who(rec)}</span>
                  <span className="text-[12px] text-[#66766D]">{fmtDateTime(rec.receivedAt || rec.measuredAt)}</span>
                  {rec.supersedesId && <Badge tone="gold">Thay bản #{rec.supersedesId}</Badge>}
                </div>
                {rec.reason && <p className="mt-1 text-[13px] text-[#46564D]">Lý do: {rec.reason}</p>}
              </li>
            ))}
            {history.records.length === 0 && <li className="text-[#66766D]">Chưa có bản ghi.</li>}
          </ol>
        </Modal>
      )}
    </Card>
  );
}

function LockBar({ step, onChanged }: { step: Step; onChanged: () => void }) {
  const { role } = useMe();
  const { toast, confirm } = useUi();
  const cfg = useApi<{ locked: boolean }>(`assessment-steps/${step.id}/combine-config`);
  const [reason, setReason] = useState<string | null>(null);
  const locked = !!cfg.data?.locked;

  async function lock() {
    if (!(await confirm(`Khoá sổ bài “${step.title}”? Sau khi khoá, số tới sau sẽ vào hàng cần xem.`))) return;
    try {
      await api(`assessment-steps/${step.id}/lock`, { method: 'POST' });
      toast(`Đã khoá sổ “${step.title}”`);
      cfg.reload();
      onChanged();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }
  async function unlock() {
    if (!reason?.trim()) return toast('Cần ghi lý do mở khoá', 'error');
    try {
      await api(`assessment-steps/${step.id}/unlock`, { body: { reason } });
      toast(`Đã mở khoá “${step.title}”`);
      setReason(null);
      cfg.reload();
      onChanged();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-2 py-2">
      <span className="min-w-[10rem] flex-1 text-[14px] font-medium">Bài {step.stepNumber}. {step.title}</span>
      {cfg.data && (locked ? <Badge tone="red">Đã khoá sổ</Badge> : <Badge tone="green">Đang mở</Badge>)}
      {cfg.data && !locked && <Button small onClick={lock}>Khoá sổ</Button>}
      {locked && role === 'SUPER_USER' && reason === null && <Button small onClick={() => setReason('')}>Mở khoá</Button>}
      {locked && role !== 'SUPER_USER' && <span className="text-[12px] text-[#66766D]">Chỉ SUPER_USER mở khoá</span>}
      {reason !== null && (
        <span className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <Textarea rows={1} className="min-w-[220px]" placeholder="Lý do mở khoá" value={reason} onChange={(e) => setReason(e.target.value)} />
          <Button small variant="danger" onClick={unlock}>Mở khoá</Button>
          <Button small onClick={() => setReason(null)}>Huỷ</Button>
        </span>
      )}
    </li>
  );
}

export default function ReconcilePage() {
  const { id, n } = useParams<{ id: string; n: string }>();
  const manager = useIsManager();
  const days = useApi<Day[]>(`competitions/${id}/stages/${n}/assessment-structure`);
  const [dayId, setDayId] = useState<number | null>(null);
  const [stepId, setStepId] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const review = useApi<Review>(dayId ? `assessment-days/${dayId}/review${stepId ? `?stepId=${stepId}` : ''}` : null);

  useEffect(() => {
    if (days.data?.length && dayId === null) setDayId(days.data[0].id);
  }, [days.data, dayId]);

  const day = days.data?.find((d) => d.id === dayId);
  const items = (review.data?.items || []).filter((i) => !reasonFilter || i.reason === reasonFilter);
  const counts = review.data?.counts || {};
  const total = COUNTS.reduce((s, c) => s + (counts[c.key] || 0), 0);

  return (
    <>
      <CompetitionTabs id={id} title={`Đối soát — vòng ${n}`}>
        <LinkButton href={`/quan-tri/giai-dau/${id}/vong/${n}`}>Cấu trúc bài thi</LinkButton>
        <LinkButton href={`/quan-tri/giai-dau/${id}/vong/${n}/thang-diem`}>Thang điểm</LinkButton>
      </CompetitionTabs>
      <Loading error={days.error} loading={days.loading && !days.data} />
      {days.data && days.data.length === 0 && <p className="text-[#66766D]">Vòng này chưa có cấu trúc chấm.</p>}
      {days.data && days.data.length > 0 && (
        <div className="space-y-4">
          <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
            <Field label="Ngày thi">
              <Select value={dayId ?? ''} onChange={(e) => { setDayId(Number(e.target.value)); setStepId(''); }}>
                {days.data.map((d) => <option key={d.id} value={d.id}>Ngày {d.dayNumber}{d.title ? ` — ${d.title}` : ''}</option>)}
              </Select>
            </Field>
            <Field label="Bài thi">
              <Select value={stepId} onChange={(e) => setStepId(e.target.value)}>
                <option value="">Tất cả bài</option>
                {day?.assessmentSteps.map((s) => <option key={s.id} value={s.id}>Bài {s.stepNumber}. {s.title}</option>)}
              </Select>
            </Field>
            <Field label="Lý do">
              <Select value={reasonFilter} onChange={(e) => setReasonFilter(e.target.value)}>
                <option value="">Mọi lý do</option>
                {Object.entries(REASONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </Field>
          </div>

          <div className="flex flex-wrap gap-2" aria-label="Số lượt theo trạng thái">
            {COUNTS.map((c) => (
              <div key={c.key} className="min-w-[7rem] border border-[#DCE5DF] bg-white px-3 py-2">
                <p className="text-[22px] font-semibold tabular-nums">{counts[c.key] ?? 0}</p>
                <Badge tone={c.tone}>{c.label}</Badge>
              </div>
            ))}
            {total > 0 && <p className="self-center text-[13px] text-[#66766D]">{total} lượt</p>}
          </div>

          {manager && day && (
            <Card title="Khoá sổ theo bài">
              <ul className="divide-y divide-[#E6ECE8]">
                {day.assessmentSteps.map((s) => <LockBar key={s.id} step={s} onChanged={() => review.reload()} />)}
              </ul>
              <p className="mt-2 text-[12px] text-[#66766D]">Chỉ khoá được khi bài hết lượt cần xem và không thiếu lượt.</p>
            </Card>
          )}

          <Loading error={review.error} loading={review.loading && !review.data} />
          {review.data && items.length === 0 && (
            <p className="border border-[#DCE5DF] bg-white px-4 py-8 text-center text-[#46564D]">
              {review.data.items.length === 0 ? 'Không còn lượt nào cần xem.' : 'Không có lượt nào khớp bộ lọc.'}
            </p>
          )}
          {items.map((it) => <ItemCard key={`${it.officialId}-${it.pickedRawId}-${it.records.length}`} item={it} readOnly={!manager} onDone={() => review.reload()} />)}
        </div>
      )}
    </>
  );
}
