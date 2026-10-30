'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, Card, Check, Field, Input, LinkButton, Loading, Modal, Select, Textarea, useUi } from '@/components/admin/ui';

interface Assessment { id: number; assessmentNumber: number; title: string; unit: string | null; attemptsCount: number; scoringMethod: string }
interface Step { id: number; stepNumber: number; title: string; hasRatingScale: boolean; assessments: Assessment[] }
interface Day { id: number; dayNumber: number; title: string; description: string | null; assessmentDate: string | null; assessmentSteps: Step[] }
interface Level { level: number; thresholdType: 'EXACT' | 'RANGE'; thresholdValue: string; rangeMin: string; rangeMax: string; description: string }

const METHODS: Record<string, string> = { BEST_OF: 'Lấy lần tốt nhất', SUM: 'Cộng các lần', AVERAGE: 'Trung bình các lần' };

type Dialog =
  | { kind: 'day'; form: { title: string; description: string; assessmentDate: string } }
  | { kind: 'step'; dayId: number; form: { title: string; description: string; hasRatingScale: boolean } }
  | { kind: 'assessment'; stepId: number; form: { title: string; unit: string; attemptsCount: string; scoringMethod: string } }
  | { kind: 'rating'; stepId: number; title: string; levels: Level[] }
  | { kind: 'copy'; sources: { stageNumber: number; title: string }[]; from: string };

export default function StructurePage() {
  const { id, n } = useParams<{ id: string; n: string }>();
  const manager = useIsManager();
  const { toast, confirm } = useUi();
  const base = `competitions/${id}/stages/${n}`;
  const days = useApi<Day[]>(`${base}/assessment-structure`);
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<unknown>, ok: string) {
    setBusy(true);
    try {
      await fn();
      toast(ok);
      setDialog(null);
      days.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(path: string, text: string) {
    if (!(await confirm(text))) return;
    run(() => api(`${base}/${path}`, { method: 'DELETE' }), 'Đã xoá');
  }

  async function openRating(step: Step) {
    try {
      const levels = await api<any[]>(`${base}/assessment-steps/${step.id}/rating-scale`);
      setDialog({
        kind: 'rating', stepId: step.id, title: step.title,
        levels: levels.map((l) => ({ level: l.level, thresholdType: l.thresholdType, thresholdValue: l.thresholdValue ?? '', rangeMin: l.rangeMin ?? '', rangeMax: l.rangeMax ?? '', description: l.description || '' })),
      });
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function openCopy() {
    try {
      const sources = await api<{ stageNumber: number; title: string }[]>(`${base}/available-source-stages`);
      if (!sources.length) return toast('Chưa có vòng nào khác để sao chép', 'error');
      setDialog({ kind: 'copy', sources, from: String(sources[0].stageNumber) });
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  function submit() {
    if (!dialog) return;
    if (dialog.kind === 'day') {
      const f = dialog.form;
      if (!f.title.trim()) return toast('Cần nhập tên ngày thi', 'error');
      const dayNumber = Math.max(0, ...(days.data || []).map((d) => d.dayNumber)) + 1;
      run(() => api(`${base}/assessment-days`, { body: { dayNumber, title: f.title, description: f.description || null, assessmentDate: f.assessmentDate || null, displayOrder: dayNumber } }), 'Đã thêm ngày thi');
    } else if (dialog.kind === 'step') {
      const f = dialog.form;
      if (!f.title.trim()) return toast('Cần nhập tên bước', 'error');
      const day = days.data?.find((d) => d.id === dialog.dayId);
      const stepNumber = Math.max(0, ...(day?.assessmentSteps || []).map((s) => s.stepNumber)) + 1;
      run(() => api(`${base}/assessment-days/${dialog.dayId}/steps`, { body: { stepNumber, title: f.title, description: f.description || null, hasRatingScale: f.hasRatingScale, displayOrder: stepNumber } }), 'Đã thêm bước');
    } else if (dialog.kind === 'assessment') {
      const f = dialog.form;
      if (!f.title.trim()) return toast('Cần nhập tên bài thi', 'error');
      const step = days.data?.flatMap((d) => d.assessmentSteps).find((s) => s.id === dialog.stepId);
      const assessmentNumber = Math.max(0, ...(step?.assessments || []).map((a) => a.assessmentNumber)) + 1;
      run(() => api(`${base}/assessment-steps/${dialog.stepId}/assessments`, { body: { assessmentNumber, title: f.title, unit: f.unit || null, attemptsCount: Math.max(1, Number(f.attemptsCount) || 1), scoringMethod: f.scoringMethod, displayOrder: assessmentNumber } }), 'Đã thêm bài thi');
    } else if (dialog.kind === 'rating') {
      const levels = dialog.levels.map((l, i) => ({
        level: i + 1, thresholdType: l.thresholdType, description: l.description || null,
        thresholdValue: l.thresholdType === 'EXACT' && l.thresholdValue !== '' ? Number(l.thresholdValue) : null,
        rangeMin: l.thresholdType === 'RANGE' && l.rangeMin !== '' ? Number(l.rangeMin) : null,
        rangeMax: l.thresholdType === 'RANGE' && l.rangeMax !== '' ? Number(l.rangeMax) : null,
      }));
      run(() => api(`${base}/assessment-steps/${dialog.stepId}/rating-scale`, { method: 'PUT', body: { levels } }), 'Đã lưu thang điểm');
    } else if (dialog.kind === 'copy') {
      confirm('Sao chép sẽ thêm toàn bộ cấu trúc của vòng nguồn vào vòng này. Tiếp tục?').then((ok) => {
        if (ok) run(() => api(`${base}/copy-from/${dialog.from}`, { method: 'POST' }), 'Đã sao chép cấu trúc');
      });
    }
  }

  const setForm = (patch: Record<string, unknown>) => setDialog((d) => (d && 'form' in d ? ({ ...d, form: { ...d.form, ...patch } } as Dialog) : d));
  const setLevel = (i: number, patch: Partial<Level>) =>
    setDialog((d) => (d && d.kind === 'rating' ? { ...d, levels: d.levels.map((l, j) => (j === i ? { ...l, ...patch } : l)) } : d));

  return (
    <>
      <CompetitionTabs id={id} title={`Cấu trúc chấm — vòng ${n}`}>
        <div className="flex flex-wrap gap-2">
          <LinkButton href={`/quan-tri/giai-dau/${id}/vong/${n}/ket-qua`}>Kết quả vòng</LinkButton>
          {manager && (
            <>
              <Button onClick={openCopy}>Sao chép từ vòng khác</Button>
              <Button onClick={async () => { if (await confirm('Tính lại toàn bộ điểm của vòng này?')) run(() => api(`${base}/recalculate`, { method: 'POST' }), 'Đã tính lại điểm'); }}>Tính lại điểm</Button>
              <Button variant="primary" onClick={() => setDialog({ kind: 'day', form: { title: '', description: '', assessmentDate: '' } })}>+ Thêm ngày thi</Button>
            </>
          )}
        </div>
      </CompetitionTabs>
      <Loading error={days.error} loading={days.loading && !days.data} />
      {days.data && days.data.length === 0 && <p className="text-[#8FA597]">Vòng này chưa có cấu trúc chấm. {manager ? 'Thêm ngày thi hoặc sao chép từ vòng khác.' : ''}</p>}
      <div className="space-y-4">
        {days.data?.map((d) => (
          <Card key={d.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-[16px] font-semibold">Ngày {d.dayNumber}. {d.title}</h3>
                {d.assessmentDate && <p className="text-[12px] text-[#8FA597]">{d.assessmentDate.split('-').reverse().join('/')}</p>}
              </div>
              {manager && (
                <div className="flex gap-2">
                  <Button small onClick={() => setDialog({ kind: 'step', dayId: d.id, form: { title: '', description: '', hasRatingScale: true } })}>+ Bước</Button>
                  <Button small variant="danger" onClick={() => remove(`assessment-days/${d.id}`, `Xoá ngày “${d.title}” và mọi bước, bài thi, điểm bên trong?`)}>Xoá</Button>
                </div>
              )}
            </div>
            <div className="mt-3 space-y-3">
              {d.assessmentSteps.map((s) => (
                <div key={s.id} className="border border-white/10 bg-[#0B2419] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Bước {s.stepNumber}. {s.title}</span>
                      {s.hasRatingScale && <Badge tone="gold">Có thang điểm</Badge>}
                    </div>
                    <div className="flex gap-2">
                      {s.hasRatingScale && <Button small onClick={() => openRating(s)}>{manager ? 'Thang điểm' : 'Xem thang điểm'}</Button>}
                      {manager && <Button small onClick={() => setDialog({ kind: 'assessment', stepId: s.id, form: { title: '', unit: '', attemptsCount: '1', scoringMethod: 'BEST_OF' } })}>+ Bài thi</Button>}
                      {manager && <Button small variant="danger" onClick={() => remove(`assessment-steps/${s.id}`, `Xoá bước “${s.title}” và mọi bài thi, điểm bên trong?`)}>Xoá</Button>}
                    </div>
                  </div>
                  <ul className="mt-2 divide-y divide-white/10 text-[14px]">
                    {s.assessments.map((a) => (
                      <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                        <span>{a.assessmentNumber}. {a.title}{a.unit ? ` (${a.unit})` : ''} <span className="text-[12px] text-[#8FA597]">· {a.attemptsCount} lượt · {METHODS[a.scoringMethod] || a.scoringMethod}</span></span>
                        {manager && <Button small variant="danger" onClick={() => remove(`assessments/${a.id}`, `Xoá bài thi “${a.title}” và điểm đã nhập?`)}>Xoá</Button>}
                      </li>
                    ))}
                    {s.assessments.length === 0 && <li className="py-1.5 text-[#8FA597]">Chưa có bài thi.</li>}
                  </ul>
                </div>
              ))}
              {d.assessmentSteps.length === 0 && <p className="text-[13px] text-[#8FA597]">Chưa có bước nào.</p>}
            </div>
          </Card>
        ))}
      </div>

      {dialog && (
        <Modal title={{ day: 'Thêm ngày thi', step: 'Thêm bước', assessment: 'Thêm bài thi', rating: 'Thang điểm', copy: 'Sao chép cấu trúc' }[dialog.kind]} wide={dialog.kind === 'rating'} onClose={() => setDialog(null)}>
          <div className="space-y-4">
            {dialog.kind === 'day' && (
              <>
                <Field label="Tên ngày thi *"><Input value={dialog.form.title} onChange={(e) => setForm({ title: e.target.value })} /></Field>
                <Field label="Mô tả"><Textarea value={dialog.form.description} onChange={(e) => setForm({ description: e.target.value })} /></Field>
                <Field label="Ngày" hint="Có thể để trống"><Input type="date" value={dialog.form.assessmentDate} onChange={(e) => setForm({ assessmentDate: e.target.value })} /></Field>
              </>
            )}
            {dialog.kind === 'step' && (
              <>
                <Field label="Tên bước *"><Input value={dialog.form.title} onChange={(e) => setForm({ title: e.target.value })} /></Field>
                <Field label="Mô tả"><Textarea value={dialog.form.description} onChange={(e) => setForm({ description: e.target.value })} /></Field>
                <Check label="Bước này quy điểm theo thang điểm" checked={dialog.form.hasRatingScale} onChange={(v) => setForm({ hasRatingScale: v })} />
              </>
            )}
            {dialog.kind === 'assessment' && (
              <>
                <Field label="Tên bài thi *"><Input value={dialog.form.title} onChange={(e) => setForm({ title: e.target.value })} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Đơn vị"><Input placeholder="giây, m, quả…" value={dialog.form.unit} onChange={(e) => setForm({ unit: e.target.value })} /></Field>
                  <Field label="Số lượt thi"><Input type="number" min={1} value={dialog.form.attemptsCount} onChange={(e) => setForm({ attemptsCount: e.target.value })} /></Field>
                </div>
                <Field label="Cách tính điểm">
                  <Select value={dialog.form.scoringMethod} onChange={(e) => setForm({ scoringMethod: e.target.value })}>
                    {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </Field>
              </>
            )}
            {dialog.kind === 'rating' && (
              <>
                <p className="text-[13px] text-[#C4D0C8]">{dialog.title}. Mỗi mức tương ứng một ngưỡng kết quả: “Đúng bằng” hoặc “Trong khoảng”.</p>
                <div className="space-y-2">
                  {dialog.levels.map((l, i) => (
                    <div key={i} className="grid grid-cols-[2.5rem_1fr] items-center gap-2 sm:grid-cols-[2.5rem_9rem_1fr_1fr_2rem]">
                      <span className="tabular-nums text-[#8FA597]">#{i + 1}</span>
                      <Select disabled={!manager} value={l.thresholdType} onChange={(e) => setLevel(i, { thresholdType: e.target.value as Level['thresholdType'] })}>
                        <option value="EXACT">Đúng bằng</option>
                        <option value="RANGE">Trong khoảng</option>
                      </Select>
                      {l.thresholdType === 'EXACT' ? (
                        <Input disabled={!manager} className="sm:col-span-2" type="number" placeholder="Giá trị" value={l.thresholdValue} onChange={(e) => setLevel(i, { thresholdValue: e.target.value })} />
                      ) : (
                        <>
                          <Input disabled={!manager} type="number" placeholder="Từ" value={l.rangeMin} onChange={(e) => setLevel(i, { rangeMin: e.target.value })} />
                          <Input disabled={!manager} type="number" placeholder="Đến" value={l.rangeMax} onChange={(e) => setLevel(i, { rangeMax: e.target.value })} />
                        </>
                      )}
                      {manager && <button type="button" aria-label="Xoá mức" className="text-[20px] text-[#FFB4AB]" onClick={() => setDialog((d) => (d && d.kind === 'rating' ? { ...d, levels: d.levels.filter((_, j) => j !== i) } : d))}>×</button>}
                    </div>
                  ))}
                  {dialog.levels.length === 0 && <p className="text-[#8FA597]">Chưa có mức nào.</p>}
                </div>
                {manager && <Button small onClick={() => setDialog((d) => (d && d.kind === 'rating' ? { ...d, levels: [...d.levels, { level: d.levels.length + 1, thresholdType: 'RANGE', thresholdValue: '', rangeMin: '', rangeMax: '', description: '' }] } : d))}>+ Thêm mức</Button>}
              </>
            )}
            {dialog.kind === 'copy' && (
              <Field label="Sao chép cấu trúc từ">
                <Select value={dialog.from} onChange={(e) => setDialog({ ...dialog, from: e.target.value })}>
                  {dialog.sources.map((s) => <option key={s.stageNumber} value={s.stageNumber}>Vòng {s.stageNumber} — {s.title}</option>)}
                </Select>
              </Field>
            )}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setDialog(null)}>{dialog.kind === 'rating' && !manager ? 'Đóng' : 'Huỷ'}</Button>
              {(dialog.kind !== 'rating' || manager) && <Button variant="primary" disabled={busy} onClick={submit}>{busy ? 'Đang lưu…' : dialog.kind === 'copy' ? 'Sao chép' : 'Lưu'}</Button>}
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
