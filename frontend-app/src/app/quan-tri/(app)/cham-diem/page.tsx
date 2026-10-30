'use client';

import { useEffect, useState } from 'react';
import { api, useApi } from '@/lib/admin/client';
import { Button, Card, Input, Loading, PageTitle, Pagination, useUi } from '@/components/admin/ui';

interface Assessment { id: number; title: string; unit: string | null; attemptsCount: number; scoringMethod: string }
interface Ctx {
  competition?: { id: number; title: string };
  stage?: { id: number; stageNumber: number; title: string };
  days?: { id: number; title: string }[];
  steps?: { id: number; title: string }[];
  assessments?: Assessment[];
  participant?: { id: number; sbd: number; fullName: string; phone: string | null };
  scores?: Record<string, number>;
  sbdError?: string;
  history?: { sbd: number; participantId: number; fullName: string; filled: number; total: number }[];
  historyPage?: number;
  historyTotalPages?: number;
}

const chip = (active: boolean) =>
  `min-h-[44px] border px-4 py-2 text-[15px] ${active ? 'border-[#A6E35A] bg-[rgba(166,227,90,0.15)] text-[#D6FA9E]' : 'border-white/20 text-[#E8F0EA]'}`;

export default function FieldScoringPage() {
  const { toast } = useUi();
  const [dayId, setDayId] = useState<number | null>(null);
  const [stepId, setStepId] = useState<number | null>(null);
  const [sbdInput, setSbdInput] = useState('');
  const [lookup, setLookup] = useState<{ sbd?: string; participantId?: number }>({});
  const [historyPage, setHistoryPage] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const params = new URLSearchParams();
  if (dayId) params.set('dayId', String(dayId));
  if (dayId && stepId) params.set('stepId', String(stepId));
  if (stepId && lookup.participantId) params.set('participantId', String(lookup.participantId));
  else if (stepId && lookup.sbd) params.set('sbd', lookup.sbd);
  params.set('historyPage', String(historyPage));
  const ctx = useApi<Ctx>(`field-scoring?${params}`);
  const c = ctx.data;

  // Refill the inputs whenever another contestant (or fresh scores) arrive.
  useEffect(() => {
    const next: Record<string, string> = {};
    Object.entries(c?.scores || {}).forEach(([k, v]) => (next[k] = String(v)));
    setValues(next);
  }, [c?.participant?.id, c?.scores]);

  const pickDay = (id: number) => { setDayId(id); setStepId(null); setLookup({}); setSbdInput(''); setHistoryPage(0); };
  const pickStep = (id: number) => { setStepId(id); setLookup({}); setSbdInput(''); setHistoryPage(0); };

  async function save() {
    if (!c?.participant || !stepId) return;
    setSaving(true);
    try {
      await api('field-scoring/save', { body: { stepId, participantId: c.participant.id, scores: values } });
      toast(`Đã lưu điểm SBD ${c.participant.sbd}`);
      setLookup({});
      setSbdInput('');
      ctx.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title="Chấm điểm hiện trường" />
      <Loading error={ctx.error} loading={ctx.loading && !c} />
      {c && !c.competition && <p className="text-[#C4D0C8]">Hiện chưa có giải đấu nào đang diễn ra.</p>}
      {c?.competition && !c.stage && <p className="text-[#C4D0C8]">Giải “{c.competition.title}” chưa có vòng nào ở trạng thái đang diễn ra. Admin cần kích hoạt vòng thi trước.</p>}

      {c?.stage && (
        <div className="mx-auto max-w-xl space-y-4">
          <p className="text-[13px] text-[#8FA597]">{c.competition?.title} · Vòng {c.stage.stageNumber}: {c.stage.title}</p>

          <Card title="1. Ngày thi">
            <div className="flex flex-wrap gap-2">
              {c.days?.map((d) => <button key={d.id} type="button" className={chip(dayId === d.id)} onClick={() => pickDay(d.id)}>{d.title}</button>)}
              {c.days?.length === 0 && <p className="text-[#8FA597]">Vòng này chưa có cấu trúc chấm.</p>}
            </div>
          </Card>

          {dayId && (
            <Card title="2. Bước thi">
              <div className="flex flex-wrap gap-2">
                {c.steps?.map((s) => <button key={s.id} type="button" className={chip(stepId === s.id)} onClick={() => pickStep(s.id)}>{s.title}</button>)}
                {c.steps?.length === 0 && <p className="text-[#8FA597]">Ngày này chưa có bước thi.</p>}
              </div>
            </Card>
          )}

          {stepId && (
            <Card title="3. Số báo danh">
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setLookup({ sbd: sbdInput.trim() }); }}>
                <Input inputMode="numeric" autoFocus placeholder="Nhập SBD" className="!min-h-[48px] !text-[18px]" value={sbdInput} onChange={(e) => setSbdInput(e.target.value)} />
                <Button variant="primary" className="min-h-[48px] px-6" type="submit">Tìm</Button>
              </form>
              {c.sbdError && <p className="mt-2 text-[14px] text-[#FFB4AB]" role="alert">{c.sbdError}</p>}
            </Card>
          )}

          {stepId && c.participant && (
            <Card title={`SBD ${c.participant.sbd} — ${c.participant.fullName}`}>
              <div className="space-y-5">
                {c.assessments?.map((a) => (
                  <div key={a.id}>
                    <p className="font-medium">{a.title}{a.unit ? ` (${a.unit})` : ''}</p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      {Array.from({ length: a.attemptsCount }, (_, i) => i + 1).map((attempt) => (
                        <label key={attempt} className="block text-[12px] text-[#8FA597]">
                          Lượt {attempt}
                          <Input
                            type="number" inputMode="decimal" step="any" className="!min-h-[48px] !text-[18px]"
                            value={values[`${a.id}_${attempt}`] ?? ''}
                            onChange={(e) => setValues((v) => ({ ...v, [`${a.id}_${attempt}`]: e.target.value }))}
                          />
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                <Button variant="primary" className="min-h-[52px] w-full text-[16px]" disabled={saving} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu điểm'}</Button>
              </div>
            </Card>
          )}

          {stepId && c.history && (
            <Card title="Đã nhập ở bước này">
              {c.history.length === 0 && <p className="text-[#8FA597]">Chưa có thí sinh nào.</p>}
              <ul className="divide-y divide-white/10">
                {c.history.map((h) => (
                  <li key={h.participantId}>
                    <button type="button" className="flex min-h-[44px] w-full items-center justify-between py-2 text-left text-[14px]" onClick={() => { setLookup({ participantId: h.participantId }); setSbdInput(String(h.sbd)); }}>
                      <span><span className="tabular-nums text-[#8FA597]">{h.sbd}</span> · {h.fullName}</span>
                      <span className="tabular-nums text-[#D6FA9E]">{h.filled}/{h.total}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {(c.historyTotalPages ?? 0) > 1 && <Pagination page={historyPage} totalPages={c.historyTotalPages!} onPage={setHistoryPage} />}
            </Card>
          )}
        </div>
      )}
    </>
  );
}
