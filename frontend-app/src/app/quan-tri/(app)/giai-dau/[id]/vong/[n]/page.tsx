'use client';

// One screen to set up a round (mockup screen 1): the tree of days → score groups → tests on the left, the selected
// day or test on the right. Words: "bài thi" is a test (a step on the server), "nội dung thi" one measured content
// of it (an assessment).

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useIsManager } from '@/components/admin/me';
import { Button, Card, Field, Input, Loading, Modal, Select, Textarea, useUi } from '@/components/admin/ui';
import { AUDIENCES, COLORS, type Color, METHODS, type SetupAssessment, StepEditor, type Topic, TopicsEditor } from '@/components/admin/round-setup';

interface Level { level: number; color: Color | null }
interface Step {
  id: number; stepNumber: number; title: string; description: string | null; isScored: boolean | null;
  audience: keyof typeof AUDIENCES | null; topicId: number | null; assessments: SetupAssessment[]; ratingScales: Level[];
}
interface Day { id: number; dayNumber: number; title: string; description: string | null; assessmentDate: string | null; assessmentSteps: Step[] }

type Dialog =
  | { kind: 'day'; id?: number; form: { title: string; description: string; assessmentDate: string } }
  | { kind: 'step'; id?: number; dayId: number; form: { title: string; description: string } }
  | { kind: 'assessment'; id?: number; stepId: number; form: { title: string; unit: string; attemptsCount: string; scoringMethod: string } }
  | { kind: 'copy'; sources: { stageNumber: number; title: string }[]; from: string };

type Selection = { kind: 'day'; id: number } | { kind: 'step'; id: number } | null;

const scored = (s: Step) => s.isScored !== false;
const hasScale = (s: Step) => s.ratingScales.length === 5;

/** What still blocks a day from scoring, in plain words. */
function problemsOf(day: Day, topics: Topic[] | undefined): string[] {
  const out: string[] = [];
  if (topics) {
    const total = topics.reduce((sum, t) => sum + (Number(t.maxPoints) || 0), 0);
    if (topics.length === 0) out.push(`Ngày ${day.dayNumber}: chưa có nhóm điểm`);
    else if (total !== 100) out.push(`Ngày ${day.dayNumber}: các nhóm cộng lại ${total} điểm, chưa bằng 100`);
    for (const t of topics) {
      if (t.id && !day.assessmentSteps.some((s) => s.topicId === t.id && scored(s))) out.push(`Nhóm ${t.name}: chưa có bài thi nào`);
    }
  }
  for (const s of day.assessmentSteps) {
    if (!scored(s)) continue;
    if (s.assessments.length === 0) out.push(`${s.title}: chưa có nội dung thi`);
    else if (!hasScale(s)) out.push(`${s.title}: chưa có thang 5 mức`);
    if (!s.topicId) out.push(`${s.title}: chưa chọn nhóm điểm`);
  }
  return out;
}

function StepDot({ step }: { step: Step }) {
  if (!scored(step)) return <span className="text-[11px] text-[#66766D]">không tính</span>;
  if (!hasScale(step)) return <span className="text-[11px] font-medium text-[#8A5A00]">chưa có thang</span>;
  const levels = [...step.ratingScales].sort((a, b) => a.level - b.level);
  return (
    <span className="flex gap-0.5" aria-label="Đã có thang 5 mức">
      {levels.map((l) => <span key={l.level} className="h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[(l.color || 'GREY') as Color]?.bg }} />)}
    </span>
  );
}

function DayTree({ day, topics, selection, onSelect, onAddStep, manager }: {
  day: Day; topics: Topic[] | undefined; selection: Selection; onSelect: (s: Selection) => void; onAddStep: () => void; manager: boolean;
}) {
  const total = (topics || []).reduce((sum, t) => sum + (Number(t.maxPoints) || 0), 0);
  const daySelected = selection?.kind === 'day' && selection.id === day.id;
  const groups = (topics || []).filter((t) => t.id).map((t) => ({ topic: t, steps: day.assessmentSteps.filter((s) => s.topicId === t.id) }));
  const loose = day.assessmentSteps.filter((s) => !s.topicId || !(topics || []).some((t) => t.id === s.topicId));

  const stepButton = (s: Step) => {
    const active = selection?.kind === 'step' && selection.id === s.id;
    return (
      <li key={s.id}>
        <button
          type="button"
          onClick={() => onSelect({ kind: 'step', id: s.id })}
          aria-current={active ? 'true' : undefined}
          className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-[13px] ${active ? 'bg-[#E4F1E8] font-semibold text-[#14482E]' : 'hover:bg-[#F1F5F2]'}`}
        >
          <span className="min-w-0 truncate">{s.title}</span>
          <StepDot step={s} />
        </button>
      </li>
    );
  };

  return (
    <div className="rounded-lg border border-[#DCE5DF] bg-white p-3">
      <button
        type="button"
        onClick={() => onSelect({ kind: 'day', id: day.id })}
        aria-current={daySelected ? 'true' : undefined}
        className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1.5 text-left ${daySelected ? 'bg-[#E4F1E8]' : 'hover:bg-[#F1F5F2]'}`}
      >
        <span className="text-[12px] font-semibold uppercase tracking-wider text-[#46564D]">Ngày {day.dayNumber} · {day.title}</span>
        <span className={`text-[12px] ${total === 100 ? 'text-[#46564D]' : 'font-medium text-[#8A5A00]'}`}>{total} điểm</span>
      </button>
      <div className="mt-1 space-y-2">
        {groups.map(({ topic, steps }) => (
          <div key={topic.id}>
            <div className="flex justify-between px-2 pt-1 text-[14px] font-medium"><span>{topic.name}</span><span className="text-[#66766D]">{topic.maxPoints}</span></div>
            <ul className="pl-2">{steps.map(stepButton)}</ul>
            {steps.length === 0 && <p className="px-4 text-[12px] text-[#8A5A00]">Chưa có bài thi</p>}
          </div>
        ))}
        {loose.length > 0 && (
          <div>
            <div className="px-2 pt-1 text-[14px] font-medium text-[#66766D]">{groups.length ? 'Chưa vào nhóm' : 'Bài thi'}</div>
            <ul className="pl-2">{loose.map(stepButton)}</ul>
          </div>
        )}
        {day.assessmentSteps.length === 0 && <p className="px-2 text-[13px] text-[#66766D]">Chưa có bài thi.</p>}
      </div>
      {manager && (
        <div className="mt-2 flex gap-2 px-2">
          <Button small onClick={onAddStep}>+ Bài thi</Button>
          {!topics?.length && <Button small onClick={() => onSelect({ kind: 'day', id: day.id })}>Đặt nhóm điểm</Button>}
        </div>
      )}
    </div>
  );
}

export default function RoundSetupPage() {
  const { id, n } = useParams<{ id: string; n: string }>();
  const router = useRouter();
  const search = useSearchParams();
  const manager = useIsManager();
  const { toast, confirm } = useUi();
  const base = `competitions/${id}/stages/${n}`;
  const days = useApi<Day[]>(`${base}/assessment-structure`);
  const [topicsVersion, setTopicsVersion] = useState(0);
  const [topicsByDay, setTopicsByDay] = useState<Record<number, Topic[]>>({});
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [busy, setBusy] = useState(false);

  // The selection lives in the address so a reload or a shared link opens the same test.
  const selection: Selection = useMemo(() => {
    const step = Number(search.get('bai'));
    const day = Number(search.get('ngay'));
    if (step) return { kind: 'step', id: step };
    if (day) return { kind: 'day', id: day };
    return null;
  }, [search]);
  const select = (s: Selection) => {
    const q = s ? `?${s.kind === 'step' ? 'bai' : 'ngay'}=${s.id}` : '';
    router.replace(`/quan-tri/giai-dau/${id}/vong/${n}${q}`, { scroll: false });
  };

  // Load every day's score groups for the tree and the problem list.
  const dayIds = (days.data || []).map((d) => d.id).join(',');
  useEffect(() => {
    if (!days.data) return;
    let stop = false;
    Promise.all(days.data.map((d) => api<{ topics: Topic[] }>(`assessment-days/${d.id}/topics`).then((r) => [d.id, r.topics] as const).catch(() => [d.id, []] as const)))
      .then((rows) => { if (!stop) setTopicsByDay(Object.fromEntries(rows)); });
    return () => { stop = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayIds, topicsVersion]);

  // Open the first test when nothing is chosen yet.
  useEffect(() => {
    if (selection || !days.data?.length) return;
    const first = days.data.flatMap((d) => d.assessmentSteps)[0];
    select(first ? { kind: 'step', id: first.id } : { kind: 'day', id: days.data[0].id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days.data, selection]);

  const allSteps = (days.data || []).flatMap((d) => d.assessmentSteps.map((s) => ({ step: s, day: d })));
  const current = selection?.kind === 'step' ? allSteps.find((x) => x.step.id === selection.id) : undefined;
  const currentDay = selection?.kind === 'day' ? days.data?.find((d) => d.id === selection.id) : undefined;
  const problems = (days.data || []).flatMap((d) => problemsOf(d, topicsByDay[d.id]));

  async function run(fn: () => Promise<unknown>, ok: string, after?: (r: unknown) => void) {
    setBusy(true);
    try {
      const r = await fn();
      toast(ok);
      setDialog(null);
      days.reload();
      after?.(r);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function remove(path: string, text: string, after?: () => void) {
    if (!(await confirm(text))) return;
    run(() => api(`${base}/${path}`, { method: 'DELETE' }), 'Đã xoá', after);
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
      const body = { title: f.title, description: f.description || null, assessmentDate: f.assessmentDate || null };
      if (dialog.id) return run(() => api(`${base}/assessment-days/${dialog.id}`, { method: 'PUT', body }), 'Đã lưu ngày thi');
      const dayNumber = Math.max(0, ...(days.data || []).map((d) => d.dayNumber)) + 1;
      run(() => api<{ id: number }>(`${base}/assessment-days`, { body: { ...body, dayNumber, displayOrder: dayNumber } }), 'Đã thêm ngày thi',
        (r) => select({ kind: 'day', id: (r as { id: number }).id }));
    } else if (dialog.kind === 'step') {
      const f = dialog.form;
      if (!f.title.trim()) return toast('Cần nhập tên bài thi', 'error');
      if (dialog.id) return run(() => api(`${base}/assessment-steps/${dialog.id}`, { method: 'PUT', body: { title: f.title, description: f.description || null, hasRatingScale: true } }), 'Đã lưu bài thi');
      const day = days.data?.find((d) => d.id === dialog.dayId);
      const stepNumber = Math.max(0, ...(day?.assessmentSteps || []).map((s) => s.stepNumber)) + 1;
      run(() => api<{ id: number }>(`${base}/assessment-days/${dialog.dayId}/steps`, { body: { stepNumber, title: f.title, description: f.description || null, hasRatingScale: true, displayOrder: stepNumber } }),
        'Đã thêm bài thi, giờ thêm nội dung thi', (r) => select({ kind: 'step', id: (r as { id: number }).id }));
    } else if (dialog.kind === 'assessment') {
      const f = dialog.form;
      if (!f.title.trim()) return toast('Cần nhập tên nội dung thi', 'error');
      const body = { title: f.title, unit: f.unit || null, attemptsCount: Math.max(1, Number(f.attemptsCount) || 1), scoringMethod: f.scoringMethod };
      if (dialog.id) return run(() => api(`${base}/assessments/${dialog.id}`, { method: 'PUT', body }), 'Đã lưu nội dung thi');
      const step = allSteps.find((x) => x.step.id === dialog.stepId)?.step;
      const assessmentNumber = Math.max(0, ...(step?.assessments || []).map((a) => a.assessmentNumber)) + 1;
      run(() => api(`${base}/assessment-steps/${dialog.stepId}/assessments`, { body: { ...body, assessmentNumber, displayOrder: assessmentNumber } }), 'Đã thêm nội dung thi');
    } else if (dialog.kind === 'copy') {
      confirm('Sao chép sẽ thêm toàn bộ cấu hình của vòng nguồn (ngày, nhóm điểm, bài thi, thang) vào vòng này. Tiếp tục?').then((ok) => {
        if (ok) run(() => api(`${base}/copy-from/${dialog.from}`, { method: 'POST' }), 'Đã sao chép cấu hình', () => setTopicsVersion((v) => v + 1));
      });
    }
  }

  const setForm = (patch: Record<string, unknown>) => setDialog((d) => (d && 'form' in d ? ({ ...d, form: { ...d.form, ...patch } } as Dialog) : d));
  const newAssessment = (stepId: number) => setDialog({ kind: 'assessment', stepId, form: { title: '', unit: '', attemptsCount: '1', scoringMethod: 'BEST_OF' } });
  const topicOf = (s: Step, d: Day) => topicsByDay[d.id]?.find((t) => t.id === s.topicId);

  return (
    <>
      <CompetitionTabs />
      <Loading error={days.error} loading={days.loading && !days.data} />

      {days.data && days.data.length === 0 && (
        <Card>
          <h2 className="text-[18px] font-semibold">Vòng này chưa được cấu hình</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px] text-[#46564D]">
            <li>Thêm ngày thi, rồi đặt các nhóm điểm của ngày (cộng lại 100).</li>
            <li>Thêm bài thi vào ngày, chọn nhóm điểm cho bài.</li>
            <li>Thêm nội dung thi của bài (ví dụ tốc độ sút, trúng đích), rồi đặt thang 5 mức.</li>
          </ol>
          {manager && (
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="primary" onClick={() => setDialog({ kind: 'day', form: { title: '', description: '', assessmentDate: '' } })}>+ Thêm ngày thi</Button>
              <Button onClick={openCopy}>Sao chép từ vòng khác</Button>
            </div>
          )}
        </Card>
      )}

      {days.data && days.data.length > 0 && (
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <nav aria-label="Cấu trúc vòng" className="flex w-full shrink-0 flex-col gap-3 lg:w-72">
            {days.data.map((d) => (
              <DayTree key={d.id} day={d} topics={topicsByDay[d.id]} selection={selection} onSelect={select} manager={manager}
                onAddStep={() => setDialog({ kind: 'step', dayId: d.id, form: { title: '', description: '' } })} />
            ))}
            {manager && <Button onClick={() => setDialog({ kind: 'day', form: { title: '', description: '', assessmentDate: '' } })}>+ Thêm ngày thi</Button>}
            {problems.length > 0 && (
              <div className="rounded-lg border border-[#F0D49A] bg-[#FFF4E0] p-3 text-[13px]">
                <p className="mb-1 font-semibold text-[#6B3F00]">Còn {problems.length} việc trước khi chấm</p>
                <ul className="space-y-0.5">{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
                <p className="mt-1 text-[12px] text-[#6B3F00]">Thang bị hở hoặc chồng sẽ được báo khi lưu bài.</p>
              </div>
            )}
            {manager && (
              <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-[13px]">
                <button type="button" className="text-[#1F6B44] underline" onClick={openCopy}>Sao chép từ vòng khác</button>
                <button type="button" className="text-[#1F6B44] underline" onClick={async () => { if (await confirm('Tính lại toàn bộ điểm của vòng này?')) run(() => api(`${base}/recalculate`, { method: 'POST' }), 'Đã tính lại điểm'); }}>Tính lại điểm</button>
              </div>
            )}
          </nav>

          <main className="min-w-0 flex-1 space-y-4">
            {current && (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[13px] text-[#66766D]">
                      Ngày {current.day.dayNumber} · {topicOf(current.step, current.day)?.name ? `Nhóm ${topicOf(current.step, current.day)!.name}` : 'chưa vào nhóm'}
                      {current.step.audience && current.step.audience !== 'ALL' ? ` · chỉ ${AUDIENCES[current.step.audience].toLowerCase()}` : ''}
                    </p>
                    <h2 className="mt-0.5 text-[24px] font-semibold">Bài thi: {current.step.title}</h2>
                  </div>
                  {manager && (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => newAssessment(current.step.id)}>+ Nội dung thi</Button>
                      <Button onClick={() => setDialog({ kind: 'step', id: current.step.id, dayId: current.day.id, form: { title: current.step.title, description: current.step.description || '' } })}>Đổi tên</Button>
                      <Button variant="danger" onClick={() => remove(`assessment-steps/${current.step.id}`, `Xoá bài “${current.step.title}” cùng mọi nội dung, thang và điểm đã chấm?`, () => select({ kind: 'day', id: current.day.id }))}>Xoá bài</Button>
                    </div>
                  )}
                </div>
                <StepEditor
                  key={`${current.step.id}-${current.step.assessments.map((a) => a.id).join('.')}-${topicsVersion}`}
                  competitionId={id}
                  stage={n}
                  step={current.step}
                  onChanged={() => days.reload()}
                  onEditAssessment={(a) => setDialog({ kind: 'assessment', id: a.id, stepId: current.step.id, form: { title: a.title, unit: a.unit || '', attemptsCount: String(a.attemptsCount), scoringMethod: a.scoringMethod } })}
                  onDeleteAssessment={(a) => remove(`assessments/${a.id}`, `Xoá nội dung “${a.title}” và điểm đã nhập?`)}
                />
              </>
            )}

            {currentDay && (
              <>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[13px] text-[#66766D]">{currentDay.assessmentDate ? currentDay.assessmentDate.split('-').reverse().join('/') : 'Chưa đặt ngày'}</p>
                    <h2 className="mt-0.5 text-[24px] font-semibold">Ngày {currentDay.dayNumber}: {currentDay.title}</h2>
                  </div>
                  {manager && (
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={() => setDialog({ kind: 'step', dayId: currentDay.id, form: { title: '', description: '' } })}>+ Bài thi</Button>
                      <Button onClick={() => setDialog({ kind: 'day', id: currentDay.id, form: { title: currentDay.title, description: currentDay.description || '', assessmentDate: currentDay.assessmentDate || '' } })}>Sửa ngày</Button>
                      <Button variant="danger" onClick={() => remove(`assessment-days/${currentDay.id}`, `Xoá ngày “${currentDay.title}” cùng mọi bài thi và điểm bên trong?`, () => select(null))}>Xoá ngày</Button>
                    </div>
                  )}
                </div>
                <TopicsEditor key={`${currentDay.id}-${topicsVersion}`} dayId={currentDay.id} readOnly={!manager} otherDays={(days.data || []).filter((d) => d.dayNumber < currentDay.dayNumber).map((d) => ({ id: d.id, label: `Ngày ${d.dayNumber}: ${d.title}` }))} onSaved={() => { setTopicsVersion((v) => v + 1); days.reload(); }} />
              </>
            )}

            {!current && !currentDay && selection && <p className="text-[#66766D]">Không tìm thấy mục này. Chọn một ngày hoặc bài thi ở bên trái.</p>}
          </main>
        </div>
      )}

      {dialog && (
        <Modal
          title={{ day: dialog.kind === 'day' && dialog.id ? 'Sửa ngày thi' : 'Thêm ngày thi', step: dialog.kind === 'step' && dialog.id ? 'Đổi tên bài thi' : 'Thêm bài thi', assessment: dialog.kind === 'assessment' && dialog.id ? 'Sửa nội dung thi' : 'Thêm nội dung thi', copy: 'Sao chép cấu hình' }[dialog.kind]}
          onClose={() => setDialog(null)}
        >
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
                <Field label="Tên bài thi *" hint="Ví dụ: Shot (dứt điểm), Sprint 30 m"><Input value={dialog.form.title} onChange={(e) => setForm({ title: e.target.value })} /></Field>
                <Field label="Mô tả"><Textarea value={dialog.form.description} onChange={(e) => setForm({ description: e.target.value })} /></Field>
                {!dialog.id && <p className="text-[13px] text-[#66766D]">Sau khi thêm, chọn nhóm điểm, thêm nội dung thi và đặt thang 5 mức ở màn bên phải.</p>}
              </>
            )}
            {dialog.kind === 'assessment' && (
              <>
                <Field label="Tên nội dung *" hint="Ví dụ: Tốc độ sút, Trúng đích"><Input value={dialog.form.title} onChange={(e) => setForm({ title: e.target.value })} /></Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Đơn vị"><Input placeholder="km/h, giây, lần…" value={dialog.form.unit} onChange={(e) => setForm({ unit: e.target.value })} /></Field>
                  <Field label="Số lượt"><Input type="number" min={1} value={dialog.form.attemptsCount} onChange={(e) => setForm({ attemptsCount: e.target.value })} /></Field>
                </div>
                <Field label="Lấy kết quả theo">
                  <Select value={dialog.form.scoringMethod} onChange={(e) => setForm({ scoringMethod: e.target.value })}>
                    {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v[0].toUpperCase() + v.slice(1)}</option>)}
                  </Select>
                </Field>
              </>
            )}
            {dialog.kind === 'copy' && (
              <Field label="Sao chép cấu hình từ">
                <Select value={dialog.from} onChange={(e) => setDialog({ ...dialog, from: e.target.value })}>
                  {dialog.sources.map((s) => <option key={s.stageNumber} value={s.stageNumber}>Vòng {s.stageNumber} — {s.title}</option>)}
                </Select>
              </Field>
            )}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setDialog(null)}>Huỷ</Button>
              <Button variant="primary" disabled={busy} onClick={submit}>{busy ? 'Đang lưu…' : dialog.kind === 'copy' ? 'Sao chép' : 'Lưu'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
