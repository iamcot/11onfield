'use client';

import { useState } from 'react';
import { api } from '@/lib/admin/client';
import { ARROW_LABELS, cleanDiagram, starterDiagram, type ArrowKind, type Diagram } from '@/lib/quiz/diagram';
import { LETTERS, LEVELS, STATUS_LABELS, type QuizQuestion, type QuizTopic } from '@/lib/quiz/admin';
import PitchDiagram, { type DragTarget } from '@/components/quiz/PitchDiagram';
import { Button, Drawer, Field, Input, Select, Textarea, useUi } from '@/components/admin/ui';

type Draft = {
  topic: string; difficulty: number; pool: string; body: string; options: string[]; correct: number;
  explanation: string; diagram: Diagram | null; status: string;
};

const fromQuestion = (q: QuizQuestion | null, topics: QuizTopic[]): Draft =>
  q
    ? { topic: q.topic, difficulty: q.difficulty, pool: q.pool, body: q.body, options: [...q.options], correct: q.correct, explanation: q.explanation || '', diagram: q.diagram, status: q.status }
    : { topic: topics[0]?.key || '', difficulty: 2, pool: 'practice', body: '', options: ['', '', '', ''], correct: 0, explanation: '', diagram: null, status: 'active' };

/** Drawer to write or fix one question; the pitch diagram can be dragged, edited with buttons, or pasted as JSON. */
export default function QuestionEditor({ question, topics, onClose, onSaved }: { question: QuizQuestion | null; topics: QuizTopic[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useUi();
  const [d, setD] = useState<Draft>(() => fromQuestion(question, topics));
  const [sel, setSel] = useState<DragTarget | null>(null);
  const [json, setJson] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }));
  const dg = d.diagram;
  const setDiagram = (fn: (g: Diagram) => Diagram) => setD((x) => (x.diagram ? { ...x, diagram: fn(x.diagram) } : x));

  function move(t: DragTarget, x: number, y: number) {
    setDiagram((g) => {
      if (t.kind === 'player') return { ...g, players: g.players.map((p, i) => (i === t.index ? { ...p, x, y } : p)) };
      if (t.kind === 'ball') return { ...g, ball: { x, y } };
      return { ...g, arrows: (g.arrows || []).map((a, i) => (i === t.index ? { ...a, [t.kind]: [x, y] as [number, number] } : a)) };
    });
  }
  function removeSelected() {
    if (!sel) return;
    setDiagram((g) => {
      if (sel.kind === 'player') return g.players.length > 1 ? { ...g, players: g.players.filter((_, i) => i !== sel.index) } : g;
      if (sel.kind === 'ball') return { ...g, ball: null };
      return { ...g, arrows: (g.arrows || []).filter((_, i) => i !== sel.index) };
    });
    setSel(null);
  }
  const selPlayer = sel?.kind === 'player' && dg ? dg.players[sel.index] : null;
  const selArrow = (sel?.kind === 'from' || sel?.kind === 'to') && dg ? (dg.arrows || [])[sel.index] : null;

  async function save() {
    setBusy(true);
    try {
      const body = { ...d, diagram: d.diagram, mediaType: d.diagram ? 'diagram' : 'none' };
      if (question) await api(`quiz/questions/${question.id}`, { method: 'PUT', body });
      else await api('quiz/questions', { body });
      toast('Đã lưu câu hỏi');
      onSaved();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer title={question ? `Sửa câu #${question.id}` : 'Thêm câu hỏi'} onClose={onClose}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Field label="Chủ đề" className="col-span-2">
            <Select value={d.topic} onChange={(e) => set({ topic: e.target.value })}>
              {topics.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Độ khó">
            <Select value={d.difficulty} onChange={(e) => set({ difficulty: Number(e.target.value) })}>
              {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{k}. {v}</option>)}
            </Select>
          </Field>
          <Field label="Trạng thái">
            <Select value={d.status} onChange={(e) => set({ status: e.target.value })}>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="Câu hỏi"><Textarea rows={3} value={d.body} onChange={(e) => set({ body: e.target.value })} /></Field>
        <div className="space-y-2">
          <span className="block text-[12px] uppercase tracking-wider text-[#66766D]">Đáp án (bấm chữ cái để chọn đáp án đúng)</span>
          {d.options.map((o, i) => (
            <div key={i} className="flex items-center gap-2">
              <button
                type="button"
                aria-label={`Đáp án đúng là ${LETTERS[i]}`}
                aria-pressed={d.correct === i}
                onClick={() => set({ correct: i })}
                className={`h-9 w-9 shrink-0 rounded-md border text-[14px] font-bold ${d.correct === i ? 'border-[#1F7A3A] bg-[#1F7A3A] text-white' : 'border-[#C9D5CD] bg-white text-[#46564D]'}`}
              >
                {LETTERS[i]}
              </button>
              <Input value={o} onChange={(e) => set({ options: d.options.map((x, j) => (j === i ? e.target.value : x)) })} />
            </div>
          ))}
        </div>
        <Field label="Giải thích (hiện sau khi trả lời)"><Textarea rows={2} value={d.explanation} onChange={(e) => set({ explanation: e.target.value })} /></Field>

        <section className="rounded-lg border border-[#DCE5DF] bg-white p-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider text-[#46564D]">Sơ đồ sân</h3>
            {dg ? (
              <Button small variant="danger" onClick={() => { set({ diagram: null }); setSel(null); }}>Bỏ sơ đồ</Button>
            ) : (
              <Button small onClick={() => set({ diagram: starterDiagram() })}>+ Thêm sơ đồ</Button>
            )}
          </div>
          {dg && (
            <>
              <PitchDiagram diagram={dg} onMove={move} selected={sel} onSelect={setSel} animate={false} className="rounded-md" />
              <p className="mt-1 text-[12px] text-[#66766D]">Kéo cầu thủ, bóng hoặc hai đầu mũi tên. Đội mình (xanh) luôn tấn công sang phải.</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button small onClick={() => setDiagram((g) => ({ ...g, players: [...g.players, { team: 'own' as const, x: 50, y: 50, label: '' }].slice(0, 22) }))}>+ Đồng đội</Button>
                <Button small onClick={() => setDiagram((g) => ({ ...g, players: [...g.players, { team: 'opp' as const, x: 60, y: 50, label: '' }].slice(0, 22) }))}>+ Đối thủ</Button>
                {!dg.ball && <Button small onClick={() => setDiagram((g) => ({ ...g, ball: { x: 50, y: 50 } }))}>+ Bóng</Button>}
                {(Object.keys(ARROW_LABELS) as ArrowKind[]).map((k) => (
                  <Button key={k} small onClick={() => setDiagram((g) => ({ ...g, arrows: [...(g.arrows || []), { kind: k, from: [45, 50] as [number, number], to: [60, 40] as [number, number] }].slice(0, 12) }))}>
                    + {ARROW_LABELS[k]}
                  </Button>
                ))}
                <Button small onClick={() => setDiagram((g) => ({ ...g, zones: [...(g.zones || []), { x: 60, y: 30, w: 15, h: 20, label: 'Khoảng trống' }].slice(0, 6) }))}>+ Vùng</Button>
                {(dg.zones || []).length > 0 && <Button small onClick={() => setDiagram((g) => ({ ...g, zones: (g.zones || []).slice(0, -1) }))}>− Vùng cuối</Button>}
              </div>
              {sel && (
                <div className="mt-3 flex flex-wrap items-end gap-2 rounded-md bg-[#F3F6F4] p-2">
                  {selPlayer && (
                    <>
                      <Field label="Số áo / vị trí" className="w-28">
                        <Input maxLength={3} value={selPlayer.label || ''} onChange={(e) => setDiagram((g) => ({ ...g, players: g.players.map((p, i) => (i === sel.index ? { ...p, label: e.target.value } : p)) }))} />
                      </Field>
                      <Button small onClick={() => setDiagram((g) => ({ ...g, players: g.players.map((p, i) => (i === sel.index ? { ...p, team: p.team === 'own' ? ('opp' as const) : ('own' as const) } : p)) }))}>Đổi đội</Button>
                      <Button small onClick={() => setDiagram((g) => ({ ...g, players: g.players.map((p, i) => ({ ...p, me: i === sel.index ? !p.me : false })) }))}>
                        {selPlayer.me ? 'Bỏ "Bạn"' : 'Đặt là "Bạn"'}
                      </Button>
                    </>
                  )}
                  {selArrow && (
                    <Field label="Loại mũi tên" className="w-36">
                      <Select value={selArrow.kind} onChange={(e) => setDiagram((g) => ({ ...g, arrows: (g.arrows || []).map((a, i) => (i === sel.index ? { ...a, kind: e.target.value as ArrowKind } : a)) }))}>
                        {(Object.keys(ARROW_LABELS) as ArrowKind[]).map((k) => <option key={k} value={k}>{ARROW_LABELS[k]}</option>)}
                      </Select>
                    </Field>
                  )}
                  <Button small variant="danger" onClick={removeSelected}>Xoá mục đang chọn</Button>
                </div>
              )}
            </>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer text-[13px] text-[#1F6B32]">Dán hoặc xem JSON</summary>
            <Textarea rows={5} className="mt-2 font-mono text-[12px]" placeholder={dg ? JSON.stringify(dg) : '{"players":[...]}'} value={json} onChange={(e) => setJson(e.target.value)} />
            <div className="mt-2 flex gap-2">
              <Button small onClick={() => setJson(JSON.stringify(dg, null, 1))} disabled={!dg}>Lấy JSON hiện tại</Button>
              <Button small variant="primary" onClick={() => {
                try {
                  const clean = cleanDiagram(JSON.parse(json));
                  if (!clean) throw new Error('Sơ đồ cần ít nhất một cầu thủ');
                  set({ diagram: clean });
                  setSel(null);
                } catch (e) {
                  toast((e as Error).message, 'error');
                }
              }}>Áp dụng JSON</Button>
            </div>
          </details>
        </section>

        <div className="flex justify-end gap-2 border-t border-[#DCE5DF] pt-4">
          <Button onClick={onClose}>Huỷ</Button>
          <Button variant="primary" disabled={busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu'}</Button>
        </div>
      </div>
    </Drawer>
  );
}
