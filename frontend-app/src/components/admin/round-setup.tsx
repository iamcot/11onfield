'use client';

// Editors for one round's setup: the 5-level scale of a test and the score groups of a day.

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, Card, Field, Input, Loading, Select, useUi } from '@/components/admin/ui';

export type Color = 'GREY' | 'RED' | 'ORANGE' | 'YELLOW' | 'GREEN';
export interface SetupAssessment { id: number; assessmentNumber: number; title: string; unit: string | null; attemptsCount: number; scoringMethod: string }
export const METHODS: Record<string, string> = { BEST_OF: 'lượt tốt nhất', SUM: 'cộng các lượt', AVERAGE: 'trung bình các lượt' };

type Action = 'NONE' | 'FLAG' | 'ELIMINATE';
interface Config {
  stepId: number; title: string; isScored: boolean; audience: 'ALL' | 'OUTFIELD' | 'GOALKEEPER'; topicId: number | null; locked: boolean;
  assessments: { id: number; title: string; unit: string | null; attemptsCount: number; direction: 'HIGHER' | 'LOWER'; plausibleMin: number | null; plausibleMax: number | null; tolerance: number | null; valueType: string }[];
  levels: { level: number; color: Color; action: Action; description: string | null; conditions: { assessmentId: number; min: number | null; max: number | null }[] }[];
  topics: Topic[];
}
export interface Topic { id?: number; topicKey: string; name: string; maxPoints: number | string; tieBreakOrder?: number | string | null }

/** One editable level; bounds are kept as text so a half-typed number is not lost. */
interface LevelForm { level: number; color: Color; action: Action; description: string; bounds: Record<number, { min: string; max: string }> }
interface AssessmentForm { id: number; direction: 'HIGHER' | 'LOWER'; plausibleMin: string; plausibleMax: string; tolerance: string; valueType: string }

export const COLORS: Record<Color, { label: string; bg: string; text: string }> = {
  GREY: { label: 'Xám', bg: '#C9D0CC', text: '#2B3530' },
  RED: { label: 'Đỏ', bg: '#E5564A', text: '#fff' },
  ORANGE: { label: 'Cam', bg: '#F0953A', text: '#2B1A00' },
  YELLOW: { label: 'Vàng', bg: '#F2D544', text: '#2B2500' },
  GREEN: { label: 'Xanh', bg: '#3FA45B', text: '#fff' },
};
const DEFAULT_COLORS: Color[] = ['GREY', 'RED', 'ORANGE', 'YELLOW', 'GREEN'];
export const AUDIENCES = { ALL: 'Mọi thí sinh', OUTFIELD: 'Cầu thủ chạy', GOALKEEPER: 'Thủ môn' };
const ACTIONS: Record<Action, string> = { NONE: 'Không', FLAG: 'Gắn cờ Low Performance', ELIMINATE: 'Loại' };
const VALUE_TYPES = { NUMBER: 'Số', DURATION: 'Thời gian', COUNT: 'Số đếm' };

const txt = (v: number | null | undefined) => (v === null || v === undefined ? '' : String(v));
const num = (s: string) => (s.trim() === '' ? null : Number(s.replace(',', '.')));

function toForms(cfg: Config) {
  const byLevel = new Map(cfg.levels.map((l) => [l.level, l]));
  const levels: LevelForm[] = [1, 2, 3, 4, 5].map((n) => {
    const l = byLevel.get(n);
    const bounds: LevelForm['bounds'] = {};
    for (const a of cfg.assessments) {
      const c = l?.conditions.find((x) => x.assessmentId === a.id);
      bounds[a.id] = { min: txt(c?.min), max: txt(c?.max) };
    }
    return { level: n, color: l?.color || DEFAULT_COLORS[n - 1], action: l?.action || 'NONE', description: l?.description || '', bounds };
  });
  const assessments: AssessmentForm[] = cfg.assessments.map((a) => ({
    id: a.id, direction: a.direction || 'HIGHER', plausibleMin: txt(a.plausibleMin), plausibleMax: txt(a.plausibleMax), tolerance: txt(a.tolerance), valueType: a.valueType || 'NUMBER',
  }));
  return { levels, assessments };
}

/** Same rule as the server: per content the highest level whose range holds the value; the step level is the lowest of them. */
function tryLevel(levels: LevelForm[], assessments: { id: number }[], values: Record<number, string>): number | null {
  let result: number | null = null;
  for (const a of assessments) {
    const raw = values[a.id];
    if (raw === undefined || raw.trim() === '') return null;
    const v = Number(raw.replace(',', '.'));
    if (Number.isNaN(v)) return null;
    let best = 0;
    for (const l of levels) {
      const b = l.bounds[a.id];
      const lo = num(b?.min ?? '');
      const hi = num(b?.max ?? '');
      const empty = lo === null && hi === null;
      if (empty && l.level === 1) best = Math.max(best, 1);
      else if (!empty && (lo === null || v >= lo) && (hi === null || v <= hi)) best = Math.max(best, l.level);
    }
    if (best === 0) return 0;
    result = result === null ? best : Math.min(result, best);
  }
  return result;
}

/**
 * Everything about one test (bài thi): whether it counts and for whom, its score group, its contents (nội dung thi)
 * with their plausible range, and its 5-level scale. Adding, renaming or removing a content is done by the page
 * through onEditAssessment / onDeleteAssessment.
 */
export function StepEditor({ competitionId, stage, step, onChanged, onEditAssessment, onDeleteAssessment }: {
  competitionId: string; stage: string; step: { id: number; title: string; assessments: SetupAssessment[] }; onChanged: () => void;
  onEditAssessment?: (a: SetupAssessment) => void; onDeleteAssessment?: (a: SetupAssessment) => void;
}) {
  const manager = useIsManager();
  const { toast } = useUi();
  const cfg = useApi<Config>(`assessment-steps/${step.id}/combine-config`);
  const [head, setHead] = useState({ isScored: true, audience: 'ALL', topicId: '' });
  const [levels, setLevels] = useState<LevelForm[]>([]);
  const [assessments, setAssessments] = useState<AssessmentForm[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [trial, setTrial] = useState<Record<number, string>>({});

  useEffect(() => {
    if (!cfg.data) return;
    const f = toForms(cfg.data);
    setLevels(f.levels);
    setAssessments(f.assessments);
    setHead({ isScored: cfg.data.isScored, audience: cfg.data.audience || 'ALL', topicId: cfg.data.topicId ? String(cfg.data.topicId) : '' });
  }, [cfg.data]);

  const data = cfg.data;
  const topics = data?.topics || [];
  const locked = !!data?.locked;
  const readOnly = !manager || locked;
  const topicName = topics.find((t) => String(t.id) === head.topicId)?.name;
  const trialLevel = useMemo(() => (data ? tryLevel(levels, data.assessments, trial) : null), [levels, data, trial]);

  const setLevel = (i: number, patch: Partial<LevelForm>) => setLevels((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const setBound = (i: number, aid: number, patch: Partial<{ min: string; max: string }>) =>
    setLevels((ls) => ls.map((l, j) => (j === i ? { ...l, bounds: { ...l.bounds, [aid]: { ...l.bounds[aid], ...patch } } } : l)));
  const setAssessment = (aid: number, patch: Partial<AssessmentForm>) => setAssessments((as) => as.map((a) => (a.id === aid ? { ...a, ...patch } : a)));

  async function save() {
    if (!data) return;
    setBusy(true);
    setProblems([]);
    try {
      await api(`assessment-steps/${step.id}/combine-config`, { method: 'PUT', body: { isScored: head.isScored, audience: head.audience, topicId: head.topicId ? Number(head.topicId) : null } });
      for (const a of assessments) {
        await api(`assessments/${a.id}/combine-config`, {
          method: 'PUT',
          body: { direction: a.direction, valueType: a.valueType, plausibleMin: num(a.plausibleMin), plausibleMax: num(a.plausibleMax), tolerance: num(a.tolerance) },
        });
      }
      if (head.isScored && assessments.length > 0) await api(`competitions/${competitionId}/stages/${stage}/assessment-steps/${step.id}/rating-scale`, {
        method: 'PUT',
        body: {
          levels: levels.map((l) => ({
            level: l.level, color: l.color, action: l.action, description: l.description || null,
            conditions: assessments
              .filter((a) => l.bounds[a.id] && (l.bounds[a.id].min.trim() !== '' || l.bounds[a.id].max.trim() !== ''))
              .map((a) => ({ assessmentId: a.id, min: num(l.bounds[a.id].min), max: num(l.bounds[a.id].max) })),
          })),
        },
      });
      toast(`Đã lưu “${step.title}”`);
      cfg.reload();
      onChanged();
    } catch (e) {
      const list = (e as Error & { problems?: string[] }).problems;
      if (list?.length) setProblems(list);
      toast(list?.length ? 'Thang chưa hợp lệ, xem các lỗi bên dưới' : (e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }


  return (
    <div className="space-y-4">
      <Loading error={cfg.error} loading={cfg.loading && !cfg.data} />

      {data && (
        <div className="space-y-4">
          {locked && <p className="border border-[#F0D9A0] bg-[#FBEFD5] px-3 py-2 text-[13px] text-[#8A5A00]">Bài đã khoá sổ nên không sửa được thang. Mở khoá ở màn Đối soát.</p>}

          <Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Tính điểm">
              <Select disabled={readOnly} value={head.isScored ? '1' : '0'} onChange={(e) => setHead({ ...head, isScored: e.target.value === '1' })}>
                <option value="1">Có, tính vào nhóm điểm</option>
                <option value="0">Không (chỉ ghi nhận)</option>
              </Select>
            </Field>
            <Field label="Đối tượng">
              <Select disabled={readOnly} value={head.audience} onChange={(e) => setHead({ ...head, audience: e.target.value })}>
                {Object.entries(AUDIENCES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            <Field label="Nhóm điểm" hint={topicName ? undefined : 'Chưa chọn thì bài không vào nhóm nào'}>
              <Select disabled={readOnly} value={head.topicId} onChange={(e) => setHead({ ...head, topicId: e.target.value })}>
                <option value="">— Không thuộc nhóm —</option>
                {topics.filter((t) => t.id).map((t) => <option key={t.id} value={t.id}>{t.name} ({t.maxPoints} điểm)</option>)}
              </Select>
            </Field>
          </div>
          </Card>

          <Card title="Nội dung thi">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-[14px]">
                <thead className="text-left text-[11px] uppercase tracking-wider text-[#56665D]">
                  <tr><th className="py-1 pr-2 font-medium">Nội dung</th><th className="px-2 font-medium">Chiều tốt</th><th className="px-2 font-medium">Kiểu giá trị</th><th className="px-2 font-medium">Hợp lý từ</th><th className="px-2 font-medium">đến</th><th className="px-2 font-medium">Sai số</th>{onEditAssessment && <th className="w-24" />}</tr>
                </thead>
                <tbody className="divide-y divide-[#E6ECE8]">
                  {data.assessments.map((a) => {
                    const f = assessments.find((x) => x.id === a.id);
                    if (!f) return null;
                    return (
                      <tr key={a.id}>
                        <td className="py-1.5 pr-2 font-medium">{a.title}{a.unit ? <span className="font-normal text-[#66766D]"> ({a.unit})</span> : null}<div className="text-[12px] font-normal text-[#66766D]">{a.attemptsCount} lượt{step.assessments.find((x) => x.id === a.id) ? ` · ${METHODS[step.assessments.find((x) => x.id === a.id)!.scoringMethod] || ''}` : ''}</div></td>
                        <td className="min-w-[11rem] px-2"><Select disabled={readOnly} value={f.direction} onChange={(e) => setAssessment(a.id, { direction: e.target.value as 'HIGHER' | 'LOWER' })}><option value="HIGHER">Càng cao càng tốt</option><option value="LOWER">Càng thấp càng tốt</option></Select></td>
                        <td className="px-2"><Select disabled={readOnly} value={f.valueType} onChange={(e) => setAssessment(a.id, { valueType: e.target.value })}>{Object.entries(VALUE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></td>
                        <td className="px-2"><Input disabled={readOnly} inputMode="decimal" aria-label={`${a.title}: ngưỡng hợp lý nhỏ nhất`} value={f.plausibleMin} onChange={(e) => setAssessment(a.id, { plausibleMin: e.target.value })} /></td>
                        <td className="px-2"><Input disabled={readOnly} inputMode="decimal" aria-label={`${a.title}: ngưỡng hợp lý lớn nhất`} value={f.plausibleMax} onChange={(e) => setAssessment(a.id, { plausibleMax: e.target.value })} /></td>
                        <td className="px-2"><Input disabled={readOnly} inputMode="decimal" aria-label={`${a.title}: sai số giữa hai nguồn`} value={f.tolerance} onChange={(e) => setAssessment(a.id, { tolerance: e.target.value })} /></td>
                        {onEditAssessment && (() => {
                          const full = step.assessments.find((x) => x.id === a.id);
                          return (
                            <td className="pl-2 text-right">
                              {full && !readOnly && (
                                <span className="inline-flex gap-1">
                                  <Button small onClick={() => onEditAssessment(full)}>Sửa</Button>
                                  {onDeleteAssessment && <Button small variant="danger" onClick={() => onDeleteAssessment(full)}>Xoá</Button>}
                                </span>
                              )}
                            </td>
                          );
                        })()}
                      </tr>
                    );
                  })}
                  {data.assessments.length === 0 && <tr><td colSpan={7} className="py-4 text-center text-[#66766D]">Bài này chưa có nội dung thi. Thêm nội dung trước rồi mới đặt thang.</td></tr>}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-[12px] text-[#66766D]">Ngoài ngưỡng hợp lý, tablet cảnh báo và lượt đó vào hàng “cần xem”. Sai số là mức lệch cho phép giữa hai nguồn đo.</p>
          </Card>

          {head.isScored && data.assessments.length > 0 && (
          <Card title="Thang 5 mức · phải đạt mọi nội dung">
            <p className="mb-2 text-[12px] text-[#66766D]">
              Cận từ và đến đều tính vào, bỏ trống là không giới hạn. Thí sinh nhận mức cao nhất mà <b>mọi</b> nội dung đều đạt. Mức Xám để trống là nhận mọi giá trị còn lại.
            </p>
            <div className="space-y-2">
              {[...levels].reverse().map((l) => {
                const i = l.level - 1;
                const c = COLORS[l.color];
                return (
                  <div key={l.level} className="grid gap-2 border border-[#DCE5DF] bg-[#F6F9F7] p-2.5 lg:grid-cols-[9rem_1fr_13rem]">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded text-[15px] font-bold" style={{ background: c.bg, color: c.text }}>{l.level}</span>
                      <Select disabled={readOnly} aria-label={`Màu mức ${l.level}`} value={l.color} onChange={(e) => setLevel(i, { color: e.target.value as Color })}>
                        {Object.entries(COLORS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      {data.assessments.map((a) => (
                        <div key={a.id} className="grid grid-cols-[1fr_5.5rem_5.5rem] items-center gap-2 sm:grid-cols-[minmax(0,1fr)_7rem_7rem]">
                          <span className="truncate text-[13px]" title={a.title}>{a.title}</span>
                          <Input disabled={readOnly} inputMode="decimal" placeholder="Từ" aria-label={`Mức ${l.level} ${a.title}: từ`} value={l.bounds[a.id]?.min ?? ''} onChange={(e) => setBound(i, a.id, { min: e.target.value })} />
                          <Input disabled={readOnly} inputMode="decimal" placeholder="Đến" aria-label={`Mức ${l.level} ${a.title}: đến`} value={l.bounds[a.id]?.max ?? ''} onChange={(e) => setBound(i, a.id, { max: e.target.value })} />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1.5">
                      <Select disabled={readOnly} aria-label={`Hành động mức ${l.level}`} value={l.action} onChange={(e) => setLevel(i, { action: e.target.value as Action })}>
                        {Object.entries(ACTIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </Select>
                      <Input disabled={readOnly} placeholder="Ghi chú mức" aria-label={`Ghi chú mức ${l.level}`} value={l.description} onChange={(e) => setLevel(i, { description: e.target.value })} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
          )}

          {problems.length > 0 && (
            <div role="alert" className="border border-[#F3B4AD] bg-[#FEF1EF] px-3 py-2 text-[14px] text-[#B42318]">
              <p className="mb-1 font-semibold">Thang chưa lưu được, cần sửa:</p>
              <ul className="list-disc space-y-0.5 pl-5">{problems.map((p, i) => <li key={i}>{p}</li>)}</ul>
            </div>
          )}

          {head.isScored && data.assessments.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
          <div className="border border-dashed border-[#C9D5CD] bg-white p-3">
            <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[#46564D]">Thử nhanh (theo thang đang nhập, chưa lưu)</h3>
            <div className="flex flex-wrap items-end gap-3">
              {data.assessments.map((a) => (
                <Field key={a.id} label={a.title} className="w-32">
                  <Input inputMode="decimal" value={trial[a.id] ?? ''} onChange={(e) => setTrial({ ...trial, [a.id]: e.target.value })} />
                </Field>
              ))}
              <div className="flex h-[38px] items-center gap-2">
                {trialLevel === null && <span className="text-[13px] text-[#66766D]">Nhập đủ giá trị để xem mức</span>}
                {trialLevel === 0 && <Badge tone="red">Không thuộc mức nào</Badge>}
                {trialLevel !== null && trialLevel > 0 && (
                  <>
                    <span className="flex h-9 w-9 items-center justify-center rounded text-[15px] font-bold" style={{ background: COLORS[levels[trialLevel - 1].color].bg, color: COLORS[levels[trialLevel - 1].color].text }}>{trialLevel}</span>
                    <span className="text-[14px] font-medium">Mức {trialLevel} · {COLORS[levels[trialLevel - 1].color].label}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="border border-[#DCE5DF] bg-white p-3 text-[14px]">
            <h3 className="mb-2 text-[12px] font-semibold uppercase tracking-wider text-[#46564D]">Cách bài này vào điểm nhóm</h3>
            {topicName ? (
              <>
                <p>{topicName} = tổng mức (1–5) các bài trong nhóm ÷ (5 × số bài) × {topics.find((t) => String(t.id) === head.topicId)?.maxPoints} điểm</p>
                <p className="mt-1 text-[13px] text-[#66766D]">Nhóm thiếu bài (chưa chấm, vắng) thì bảng xếp hạng ghi “chưa đủ”.</p>
              </>
            ) : (
              <p className="text-[#8A5A00]">Chưa chọn nhóm điểm nên bài này chưa được cộng vào điểm ngày.</p>
            )}
          </div>
          </div>
          )}

          {!readOnly && (
            <div className="flex justify-end">
              <Button variant="primary" disabled={busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu bài thi'}</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TopicsEditor({ dayId, onSaved, readOnly }: { dayId: number; onSaved: () => void; readOnly: boolean }) {
  const { toast } = useUi();
  const res = useApi<{ topics: Topic[]; totalPoints: number; warning: string | null }>(`assessment-days/${dayId}/topics`);
  const [rows, setRows] = useState<Topic[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (res.data) setRows(res.data.topics.map((t) => ({ ...t, maxPoints: String(t.maxPoints), tieBreakOrder: t.tieBreakOrder ?? '' })));
  }, [res.data]);

  const total = rows.reduce((s, t) => s + (Number(t.maxPoints) || 0), 0);
  const set = (i: number, patch: Partial<Topic>) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const move = (i: number, d: number) => setRows((rs) => {
    const j = i + d;
    if (j < 0 || j >= rs.length) return rs;
    const copy = [...rs];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    return copy;
  });

  async function save() {
    setBusy(true);
    try {
      const out = await api<{ warning: string | null }>(`assessment-days/${dayId}/topics`, {
        method: 'PUT',
        body: { topics: rows.map((t) => ({ id: t.id, topicKey: String(t.topicKey).trim(), name: String(t.name).trim(), maxPoints: Number(t.maxPoints), tieBreakOrder: t.tieBreakOrder === '' || t.tieBreakOrder == null ? null : Number(t.tieBreakOrder) })) },
      });
      toast(out.warning ? `Đã lưu. ${out.warning}` : 'Đã lưu nhóm điểm');
      res.reload();
      onSaved();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card title="Nhóm điểm của ngày (tổng 100)">
      <Loading error={res.error} loading={res.loading && !res.data} />
      {res.data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-[14px]">
              <thead className="text-left text-[11px] uppercase tracking-wider text-[#56665D]">
                <tr><th className="w-20 py-1 font-medium">Thứ tự</th><th className="px-2 font-medium">Tên nhóm</th><th className="w-28 px-2 font-medium">Điểm tối đa</th><th className="w-28 px-2 font-medium" title="Khi đồng điểm, nhóm có số này nhỏ hơn được xét trước">Ưu tiên đồng điểm</th><th className="w-8" /></tr>
              </thead>
              <tbody className="divide-y divide-[#E6ECE8]">
                {rows.map((t, i) => (
                  <tr key={t.id ?? `new${i}`}>
                    <td className="py-1.5"><div className="flex items-center gap-1"><Button small disabled={readOnly || i === 0} aria-label="Lên" onClick={() => move(i, -1)}>↑</Button><Button small disabled={readOnly || i === rows.length - 1} aria-label="Xuống" onClick={() => move(i, 1)}>↓</Button></div></td>
                    <td className="px-2"><Input disabled={readOnly} aria-label="Tên nhóm" value={t.name} onChange={(e) => set(i, { name: e.target.value })} /></td>
                    <td className="px-2"><Input disabled={readOnly} inputMode="decimal" aria-label="Điểm tối đa" value={String(t.maxPoints)} onChange={(e) => set(i, { maxPoints: e.target.value })} /></td>
                    <td className="px-2"><Input disabled={readOnly} inputMode="numeric" aria-label="Ưu tiên đồng điểm" placeholder="không xét" value={String(t.tieBreakOrder ?? '')} onChange={(e) => set(i, { tieBreakOrder: e.target.value })} /></td>
                    <td>{!readOnly && <button type="button" aria-label="Xoá nhóm" className="text-[20px] text-[#B42318]" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>×</button>}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan={6} className="py-4 text-center text-[#66766D]">Ngày này chưa có nhóm điểm.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className={`text-[14px] ${total === 100 ? 'text-[#1F6B32]' : 'text-[#8A5A00]'}`}>
              Tổng {total} điểm {total === 100 ? '✓' : '· chưa bằng 100'}
            </p>
            {!readOnly && (
              <div className="flex gap-2">
                <Button small onClick={() => setRows((rs) => [...rs, { topicKey: '', name: '', maxPoints: '10', tieBreakOrder: '' }])}>+ Thêm nhóm</Button>
                <Button variant="primary" small disabled={busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu nhóm điểm'}</Button>
              </div>
            )}
          </div>
          {!readOnly && <p className="mt-2 text-[12px] text-[#66766D]">Xoá một nhóm thì các bài đang thuộc nhóm đó thành “không thuộc nhóm”. Điểm nhóm = tổng mức 1–5 của các bài, quy theo điểm tối đa của nhóm. Ưu tiên đồng điểm: ghi 1 cho nhóm xét trước khi hai thí sinh bằng tổng điểm, 2 cho nhóm xét tiếp; để trống nếu không xét. Sau các nhóm, ai ít lỗi kỷ luật hơn xếp trên.</p>}
        </>
      )}
    </Card>
  );
}

