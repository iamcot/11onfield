'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import { useMe } from '@/components/admin/me';
import {
  GROUP_LABELS, LETTERS, LEVELS, STATUS_LABELS, cellTone, verifiedLabel,
  type GenResult, type Overview, type QuizQuestion, type QuizTopic, type SettingsField,
} from '@/lib/quiz/admin';
import PitchDiagram from '@/components/quiz/PitchDiagram';
import { REPORT_REASONS } from '@/lib/quiz/play';

const REPORT_REASON_LABELS: Record<string, string> = Object.fromEntries(REPORT_REASONS.map((x) => [x.key, x.label]));
import QuestionEditor from '@/components/admin/quiz/QuestionEditor';
import { Badge, Button, Card, Check, Field, Input, Loading, Modal, PageTitle, Pagination, Select, Table, Td, Textarea, useUi } from '@/components/admin/ui';

const TABS = [
  { key: 'tong-quan', label: 'Tổng quan kho' },
  { key: 'duyet', label: 'Chờ duyệt' },
  { key: 'bao-loi', label: 'Bị báo lỗi' },
  { key: 'cau-hoi', label: 'Tất cả câu hỏi' },
  { key: 'chu-de', label: 'Chủ đề' },
  { key: 'cai-dat', label: 'Bật tắt & cài đặt' },
] as const;
type TabKey = (typeof TABS)[number]['key'];

/** Back office of the football quiz practice: question bank (AI writing through AnyLearn, review), topics, switch and numbers. */
export default function QuizAdminPage() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const tab = (TABS.find((t) => t.key === params.get('tab'))?.key || 'tong-quan') as TabKey;
  const topics = useApi<QuizTopic[]>('quiz/topics');
  const status = useApi<{ values: Record<string, number> }>('quiz/settings');
  const go = (t: TabKey, extra = '') => router.push(`${pathname}?tab=${t}${extra}`);
  const ov = useApi<Overview>('quiz/overview');
  const reported = Number(ov.data?.totals.reported || 0);
  // after an approve, hide, edit or dismiss: this page's counts and the sidebar badge
  const changed = () => { ov.reload(); window.dispatchEvent(new Event('admin:badges')); };
  const on = status.data?.values.enabled === 1;

  return (
    <>
      <PageTitle title="Luyện tập trắc nghiệm">
        {status.data && (
          <button type="button" onClick={() => go('cai-dat')} className="text-left">
            <Badge tone={on ? 'green' : 'gold'}>{on ? 'Đang bật cho cầu thủ' : 'Đang tắt · chỉ ADMIN/EDITOR thấy'}</Badge>
          </button>
        )}
      </PageTitle>
      <div role="tablist" className="mb-5 flex gap-1 overflow-x-auto border-b border-[#DCE5DF]">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => go(t.key)}
            className={`whitespace-nowrap border-b-2 px-3 py-2 text-[14px] font-medium ${tab === t.key ? 'border-[#1F7A3A] text-[#0F3324]' : 'border-transparent text-[#66766D] hover:text-[#10231A]'}`}
          >
            {t.label}
            {t.key === 'bao-loi' && reported > 0 && <span className="ml-1.5 rounded-full bg-[#B42318] px-1.5 py-px text-[11px] font-semibold text-white">{reported}</span>}
          </button>
        ))}
      </div>
      <Loading error={topics.error} loading={topics.loading && !topics.data} />
      {topics.data && (
        <>
          {tab === 'tong-quan' && <OverviewTab topics={topics.data} onOpen={(topic, d) => go('cau-hoi', `&topic=${topic}&difficulty=${d}`)} onTab={go} />}
          {tab === 'duyet' && <QuestionsTab key="duyet" topics={topics.data} review onChanged={changed} />}
          {tab === 'bao-loi' && <QuestionsTab key="bao-loi" topics={topics.data} reported onChanged={changed} />}
          {tab === 'cau-hoi' && <QuestionsTab key={`all-${params.get('status') || ''}`} topics={topics.data} onChanged={changed} />}
          {tab === 'chu-de' && <TopicsTab topics={topics.data} reload={topics.reload} />}
          {tab === 'cai-dat' && <SettingsTab onChanged={status.reload} />}
        </>
      )}
    </>
  );
}

// ---------- overview + AI writing ----------

function OverviewTab({ topics, onOpen, onTab }: { topics: QuizTopic[]; onOpen: (topic: string, difficulty: number) => void; onTab: (t: TabKey, extra?: string) => void }) {
  const { toast } = useUi();
  const [target, setTarget] = useState(30);
  const ov = useApi<Overview>(`quiz/overview?target=${target}`);
  const runs = useApi<Record<string, any>[]>('quiz/runs?limit=10');
  const [gen, setGen] = useState<{ topic: string; difficulty: number; count: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [fill, setFill] = useState<{ done: number; total: number; saved: number } | null>(null);

  const byTopic = useMemo(() => {
    const m = new Map<string, Overview['cells']>();
    ov.data?.cells.forEach((c) => m.set(c.topic, [...(m.get(c.topic) || []), c]));
    return m;
  }, [ov.data]);

  async function generate(topic: string, difficulty: number, count: number) {
    const r = await api<GenResult>('quiz/generate', { body: { topic, difficulty, count } });
    return r;
  }
  async function runOne() {
    if (!gen) return;
    setBusy(true);
    try {
      const r = await generate(gen.topic, gen.difficulty, gen.count);
      toast(`AI viết ${r.returned} câu: lưu ${r.saved} chờ duyệt, ${r.duplicates} trùng, ${r.invalid} lỗi, ${r.verifyFailed} lệch đáp án`);
      setGen(null);
      ov.reload();
      runs.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }
  /** Tops up every short cell, one AI call at a time, so the page shows progress and can be left. */
  async function fillAll() {
    const short = (ov.data?.cells || []).filter((c) => c.shortfall > 0);
    if (!short.length) return;
    setFill({ done: 0, total: short.length, saved: 0 });
    let saved = 0;
    for (let i = 0; i < short.length; i++) {
      const c = short[i];
      const t = topics.find((x) => x.key === c.topic);
      try {
        const r = await generate(c.topic, c.difficulty, Math.min(c.shortfall, t?.withDiagram ? 4 : 10));
        saved += r.saved;
      } catch (e) {
        toast(`${c.topicLabel} mức ${c.difficulty}: ${(e as Error).message}`, 'error');
        if ((e as Error).message.includes('cấu hình') || (e as Error).message.includes('giới hạn')) break;
      }
      setFill({ done: i + 1, total: short.length, saved });
    }
    toast(`Xong: thêm ${saved} câu chờ duyệt`);
    setFill(null);
    ov.reload();
    runs.reload();
  }

  const tones = { red: 'bg-[#FDE4E1] text-[#B42318]', gold: 'bg-[#FBEFD5] text-[#8A5A00]', green: 'bg-[#E4F3D6] text-[#1F6B32]' };
  return (
    <div className="space-y-5">
      <Loading error={ov.error} loading={ov.loading && !ov.data} />
      {ov.data && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {([
              ['Đang dùng', ov.data.totals.active, () => onTab('cau-hoi', '&status=active'), ''],
              ['Chờ duyệt', ov.data.totals.pending, () => onTab('duyet'), Number(ov.data.totals.pending) > 0 ? 'text-[#8A5A00]' : ''],
              ['Đã ẩn', ov.data.totals.hidden, () => onTab('cau-hoi', '&status=hidden'), ''],
              ['Bị báo lỗi', ov.data.totals.reported, () => onTab('bao-loi'), Number(ov.data.totals.reported) > 0 ? 'text-[#B42318]' : ''],
            ] as const).map(([l, v, open, tone]) => (
              <button
                key={l}
                type="button"
                onClick={open}
                className="group flex items-start justify-between rounded-lg border border-[#DCE5DF] bg-white p-4 text-left shadow-[0_1px_2px_rgba(16,35,26,0.06)] transition hover:border-[#1F7A3A] hover:shadow-[0_2px_8px_rgba(16,35,26,0.12)] lg:p-5"
              >
                <span>
                  <span className="block text-[12px] uppercase tracking-wider text-[#66766D]">{l}</span>
                  <span className={`mt-1 block text-[26px] font-semibold ${tone}`}>{v}</span>
                </span>
                <span aria-hidden className="text-[20px] text-[#9AA9A0] transition group-hover:translate-x-0.5 group-hover:text-[#1F7A3A]">›</span>
              </button>
            ))}
          </div>
          {!ov.data.totals.aiConfigured && (
            <p className="rounded-md border border-[#F0D9A8] bg-[#FFF8E6] px-3 py-2 text-[14px] text-[#8A5A00]">
              Chưa nối AI: máy chủ cần ZNS_RELAY_URL và ZNS_RELAY_API_KEY trỏ tới AnyLearn. Vẫn thêm câu hỏi bằng tay được.
            </p>
          )}
          <Card title="Số câu đang dùng theo chủ đề × độ khó">
            <div className="mb-3 flex flex-wrap items-end gap-3">
              <Field label="Mục tiêu mỗi ô" className="w-32">
                <Input type="number" min={1} max={1000} value={target} onChange={(e) => setTarget(Math.max(1, Number(e.target.value) || 1))} />
              </Field>
              <Button variant="primary" disabled={!!fill || !ov.data.totals.aiConfigured} onClick={fillAll}>
                {fill ? `AI đang viết ${fill.done}/${fill.total} ô · +${fill.saved} câu` : 'AI viết bù tất cả ô thiếu'}
              </Button>
              <span className="text-[12px] text-[#66766D]">Bấm một ô để xem câu hỏi; nút ✎ để AI viết thêm cho ô đó. Câu AI viết luôn vào hàng chờ duyệt.</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-[#56665D]">
                    <th className="px-2 py-2 text-left font-medium">Chủ đề</th>
                    {[1, 2, 3, 4, 5].map((d) => <th key={d} className="px-2 py-2 font-medium">{d}. {LEVELS[d]}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(GROUP_LABELS).map(([g, gl]) => {
                    const rows = topics.filter((t) => t.active && t.group === g);
                    if (!rows.length) return null;
                    return (
                      <Fragment key={g}>
                        <tr><td colSpan={6} className="pt-3 text-[11px] font-semibold uppercase tracking-wider text-[#1F6B32]">{gl}</td></tr>
                        {rows.map((t) => (
                          <tr key={t.key}>
                            <td className="px-2 py-1.5">{t.label}{t.withDiagram && <span className="ml-1 text-[11px] text-[#66766D]">· sơ đồ</span>}</td>
                            {(byTopic.get(t.key) || []).map((c) => (
                              <td key={c.difficulty} className="p-1">
                                <div className={`flex items-center justify-between gap-1 rounded-md px-2 py-1.5 ${tones[cellTone(c)]}`}>
                                  <button type="button" className="flex-1 text-left" onClick={() => onOpen(c.topic, c.difficulty)} title={`Đúng ${c.correctRate == null ? '–' : Math.round(c.correctRate * 100) + '%'} · đã ra ${c.served} lần`}>
                                    <b className="text-[15px]">{c.active}</b>
                                    {c.pending > 0 && <span className="ml-1 text-[11px]">+{c.pending} chờ</span>}
                                  </button>
                                  {ov.data!.totals.aiConfigured && (
                                    <button type="button" aria-label={`AI viết thêm ${t.label} mức ${c.difficulty}`} className="rounded px-1 text-[13px] opacity-70 hover:bg-white/60 hover:opacity-100"
                                      onClick={() => setGen({ topic: c.topic, difficulty: c.difficulty, count: Math.max(1, Math.min(c.shortfall || 5, t.withDiagram ? 4 : 10)) })}>
                                      ✎
                                    </button>
                                  )}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
          <Card title="Các lần AI viết gần đây">
            <Table head={['Lúc', 'Chủ đề', 'Mức', 'Xin', 'Nhận', 'Lưu', 'Trùng', 'Lỗi', 'Lệch', 'Token', 'Ghi chú']} empty="Chưa có lần nào.">
              {(runs.data || []).map((r) => (
                <tr key={r.id}>
                  <Td className="whitespace-nowrap text-[#46564D]">{String(r.createdAt).replace('T', ' ').slice(0, 16)}</Td>
                  <Td>{topics.find((t) => t.key === r.topic)?.label || r.topic}</Td>
                  <Td>{r.difficulty}</Td><Td>{r.requested}</Td><Td>{r.returned}</Td><Td className="font-semibold">{r.saved}</Td>
                  <Td>{r.duplicates}</Td><Td>{r.invalid}</Td><Td>{r.verifyFailed}</Td>
                  <Td className="text-[#46564D]">{(r.inputTokens || 0) + (r.outputTokens || 0)}</Td>
                  <Td className="max-w-[220px] truncate text-[#B42318]">{r.error}</Td>
                </tr>
              ))}
            </Table>
          </Card>
        </>
      )}
      {gen && (
        <Modal title="AI viết thêm câu hỏi" onClose={() => !busy && setGen(null)}>
          <p className="mb-3 text-[14px]">
            {topics.find((t) => t.key === gen.topic)?.label} · mức {gen.difficulty} ({LEVELS[gen.difficulty]}).
            Một lần gọi viết tối đa {topics.find((t) => t.key === gen.topic)?.withDiagram ? 4 : 10} câu, mất khoảng 20 đến 60 giây.
          </p>
          <Field label="Số câu" className="w-32">
            <Input type="number" min={1} max={10} value={gen.count} onChange={(e) => setGen({ ...gen, count: Math.max(1, Math.min(10, Number(e.target.value) || 1)) })} />
          </Field>
          <div className="mt-5 flex justify-end gap-2">
            <Button disabled={busy} onClick={() => setGen(null)}>Huỷ</Button>
            <Button variant="primary" disabled={busy} onClick={runOne}>{busy ? 'AI đang viết…' : 'Viết'}</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------- question list (review queue and full bank) ----------

function QuestionsTab({ topics, review, reported, onChanged }: { topics: QuizTopic[]; review?: boolean; reported?: boolean; onChanged?: () => void }) {
  const params = useSearchParams();
  const { toast } = useUi();
  const [topic, setTopic] = useState(params.get('topic') || '');
  const [difficulty, setDifficulty] = useState(params.get('difficulty') || '');
  const [status, setStatus] = useState(review ? 'pending' : reported ? 'reported' : params.get('status') || '');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(0);
  const [picked, setPicked] = useState<number[]>([]);
  const [editing, setEditing] = useState<QuizQuestion | 'new' | null>(null);
  useEffect(() => { setPage(0); setPicked([]); }, [topic, difficulty, status, q]);
  const path = `quiz/questions?page=${page}&size=20${topic ? `&topic=${topic}` : ''}${difficulty ? `&difficulty=${difficulty}` : ''}${status ? `&status=${status}` : ''}${q ? `&q=${encodeURIComponent(q)}` : ''}`;
  const list = useApi<{ total: number; items: QuizQuestion[] }>(path);
  const items = list.data?.items || [];
  const label = (k: string) => topics.find((t) => t.key === k)?.label || k;

  async function setMany(ids: number[], s: 'active' | 'hidden' | 'pending') {
    if (!ids.length) return;
    try {
      const r = await api<{ changed: number }>('quiz/questions/status', { body: { ids, status: s } });
      toast(`${s === 'active' ? 'Đã duyệt' : s === 'hidden' ? 'Đã ẩn' : 'Đã chuyển về chờ duyệt'} ${r.changed} câu`);
      setPicked([]);
      list.reload();
      onChanged?.();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function dismiss(id: number) {
    try {
      await api(`quiz/questions/${id}/dismiss-reports`, { body: {} });
      toast('Đã bỏ báo lỗi, câu hỏi dùng tiếp');
      list.reload();
      onChanged?.();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Chủ đề" className="w-56">
          <Select value={topic} onChange={(e) => setTopic(e.target.value)}>
            <option value="">Tất cả</option>
            {topics.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
          </Select>
        </Field>
        <Field label="Độ khó" className="w-36">
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="">Tất cả</option>
            {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{k}. {v}</option>)}
          </Select>
        </Field>
        {!review && !reported && (
          <Field label="Trạng thái" className="w-40">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Tất cả</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              <option value="reported">Bị báo lỗi</option>
            </Select>
          </Field>
        )}
        <Field label="Tìm trong câu hỏi" className="min-w-[200px] flex-1"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Từ khoá…" /></Field>
        <Button variant="primary" onClick={() => setEditing('new')}>+ Thêm câu hỏi</Button>
      </div>
      {reported && <p className="text-[13px] text-[#66766D]">Câu cầu thủ báo lỗi. Sai thì bấm Sửa rồi lưu (lưu xong báo lỗi tự đóng); không sai thì bấm "Câu đúng, bỏ báo lỗi". Câu bị báo 3 lần đã tự ẩn, bỏ báo lỗi sẽ cho dùng lại.</p>}
      {review && <p className="text-[13px] text-[#66766D]">Câu AI viết nằm ở đây đến khi có người duyệt. Câu AI tự kiểm tra lệch đáp án đã bị ẩn sẵn và nằm ở tab Tất cả câu hỏi (lọc Đã ẩn).</p>}
      <div className="flex flex-wrap items-center gap-2 text-[13px]">
        <Check label={`Chọn cả trang (${items.length})`} checked={!!items.length && picked.length === items.length} onChange={(v) => setPicked(v ? items.map((i) => i.id) : [])} />
        {picked.length > 0 && (
          <>
            <span className="text-[#46564D]">Đã chọn {picked.length}:</span>
            <Button small variant="primary" onClick={() => setMany(picked, 'active')}>Duyệt</Button>
            <Button small variant="danger" onClick={() => setMany(picked, 'hidden')}>Ẩn</Button>
          </>
        )}
        <span className="ml-auto text-[#66766D]">{list.data?.total ?? 0} câu</span>
      </div>
      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && !items.length && <p className="rounded-lg border border-[#DCE5DF] bg-white px-4 py-6 text-center text-[#66766D]">{review ? 'Không có câu nào chờ duyệt.' : reported ? 'Không còn câu nào bị báo lỗi.' : 'Không có câu hỏi nào khớp bộ lọc.'}</p>}
      <div className="space-y-3">
        {items.map((it) => {
          const v = verifiedLabel(it.verified);
          return (
            <article key={it.id} className="rounded-lg border border-[#DCE5DF] bg-white p-4 shadow-[0_1px_2px_rgba(16,35,26,0.06)]">
              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                <input type="checkbox" aria-label={`Chọn câu ${it.id}`} className="h-4 w-4 accent-[#1F7A3A]" checked={picked.includes(it.id)} onChange={(e) => setPicked((p) => (e.target.checked ? [...p, it.id] : p.filter((x) => x !== it.id)))} />
                <span className="text-[#66766D]">#{it.id}</span>
                <Badge>{label(it.topic)}</Badge>
                <Badge>Mức {it.difficulty} · {LEVELS[it.difficulty]}</Badge>
                <Badge tone={it.status === 'active' ? 'green' : it.status === 'pending' ? 'gold' : 'gray'}>{STATUS_LABELS[it.status]}</Badge>
                {it.source === 'ai' && <Badge tone={v.tone}>{v.text}</Badge>}
                {it.reportCount > 0 && <Badge tone="red">{it.reportCount} báo lỗi</Badge>}
                {it.timesServed > 0 && <span className="text-[#66766D]">Đúng {Math.round((100 * it.timesCorrect) / it.timesServed)}% / {it.timesServed} lượt</span>}
              </div>
              <div className={`mt-3 grid gap-4 ${it.diagram ? 'md:grid-cols-[1fr_280px]' : ''}`}>
                <div>
                  <p className="text-[15px] font-medium">{it.body}</p>
                  <ol className="mt-2 grid gap-1 text-[14px] sm:grid-cols-2">
                    {it.options.map((o, i) => (
                      <li key={i} className={`rounded px-2 py-1 ${i === it.correct ? 'bg-[#E4F3D6] font-medium text-[#1F6B32]' : 'bg-[#F3F6F4]'}`}>{LETTERS[i]}. {o}</li>
                    ))}
                  </ol>
                  {it.explanation && <p className="mt-2 text-[13px] text-[#46564D]">💡 {it.explanation}</p>}
                  {it.reviewNote && <p className="mt-1 text-[13px] text-[#B42318]">{it.reviewNote}</p>}
                  {!!it.reports?.length && (
                    <div className="mt-3 rounded-md border border-[#F5C2BB] bg-[#FDF1EF] px-3 py-2 text-[13px]">
                      <div className="font-medium text-[#B42318]">Cầu thủ báo lỗi</div>
                      <ul className="mt-1 space-y-0.5 text-[#46564D]">
                        {it.reports.map((rp, i) => (
                          <li key={i}>
                            • {REPORT_REASON_LABELS[rp.reason] || rp.reason}
                            {rp.note && <span className="text-[#10231A]">: “{rp.note}”</span>}
                            <span className="text-[#8A968F]"> · {new Date(rp.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                {it.diagram && <PitchDiagram diagram={it.diagram} animate={false} className="rounded-md" />}
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-2">
                {it.reportCount > 0 && <Button small variant="primary" onClick={() => dismiss(it.id)}>Câu đúng, bỏ báo lỗi</Button>}
                <Button small onClick={() => setEditing(it)}>Sửa</Button>
                {it.status !== 'active' && <Button small variant="primary" onClick={() => setMany([it.id], 'active')}>Duyệt</Button>}
                {it.status !== 'hidden' && <Button small variant="danger" onClick={() => setMany([it.id], 'hidden')}>Ẩn</Button>}
              </div>
            </article>
          );
        })}
      </div>
      {list.data && <Pagination page={page} totalPages={Math.ceil(list.data.total / 20)} onPage={setPage} />}
      {editing && (
        <QuestionEditor
          question={editing === 'new' ? null : editing}
          topics={topics}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); list.reload(); onChanged?.(); }}
        />
      )}
    </div>
  );
}

// ---------- topics ----------

function TopicsTab({ topics, reload }: { topics: QuizTopic[]; reload: () => void }) {
  const { toast } = useUi();
  const [edit, setEdit] = useState<(QuizTopic & { isNew?: boolean }) | null>(null);
  async function save() {
    if (!edit) return;
    try {
      const body = { key: edit.key, label: edit.label, group: edit.group, hint: edit.hint, withDiagram: edit.withDiagram, sortOrder: edit.sortOrder, active: edit.active };
      if (edit.isNew) await api('quiz/topics', { body });
      else await api(`quiz/topics/${edit.key}`, { method: 'PUT', body });
      toast('Đã lưu chủ đề');
      setEdit(null);
      reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setEdit({ key: '', label: '', group: 'knowledge', hint: '', withDiagram: false, sortOrder: (topics.length + 1) * 10, active: true, isNew: true })}>+ Thêm chủ đề</Button>
      </div>
      <Table head={['Chủ đề', 'Nhóm', 'AI viết về', 'Sơ đồ', 'Hiện', '']}>
        {topics.map((t) => (
          <tr key={t.key} className="cursor-pointer hover:bg-[#F6FAF7]" onClick={() => setEdit(t)}>
            <Td><b>{t.label}</b><div className="text-[12px] text-[#66766D]">{t.key}</div></Td>
            <Td>{GROUP_LABELS[t.group] || t.group}</Td>
            <Td className="max-w-[360px] text-[13px] text-[#46564D]">{t.hint}</Td>
            <Td>{t.withDiagram ? 'Có' : '–'}</Td>
            <Td>{t.active ? <Badge tone="green">Hiện</Badge> : <Badge>Ẩn</Badge>}</Td>
            <td className="w-8 px-3 text-right text-[22px] text-[#9AA8A0]" aria-hidden="true">›</td>
          </tr>
        ))}
      </Table>
      {edit && (
        <Modal title={edit.isNew ? 'Thêm chủ đề' : `Sửa chủ đề ${edit.label}`} onClose={() => setEdit(null)}>
          <div className="space-y-3">
            {edit.isNew && <Field label="Mã (chữ thường, không dấu)" hint="Ví dụ: set_piece"><Input value={edit.key} onChange={(e) => setEdit({ ...edit, key: e.target.value })} /></Field>}
            <Field label="Tên hiện cho cầu thủ"><Input value={edit.label} onChange={(e) => setEdit({ ...edit, label: e.target.value })} /></Field>
            <Field label="Nhóm">
              <Select value={edit.group} onChange={(e) => setEdit({ ...edit, group: e.target.value })}>
                {Object.entries(GROUP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            <Field label="AI viết về" hint="Mô tả cho AI biết chủ đề gồm những ý gì."><Textarea rows={3} value={edit.hint} onChange={(e) => setEdit({ ...edit, hint: e.target.value })} /></Field>
            <Field label="Thứ tự" className="w-28"><Input type="number" value={edit.sortOrder} onChange={(e) => setEdit({ ...edit, sortOrder: Number(e.target.value) || 0 })} /></Field>
            <Check label="Câu hỏi có sơ đồ sân (AI vẽ tình huống)" checked={edit.withDiagram} onChange={(v) => setEdit({ ...edit, withDiagram: v })} />
            <Check label="Hiện cho cầu thủ và AI viết bù" checked={edit.active} onChange={(v) => setEdit({ ...edit, active: v })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setEdit(null)}>Huỷ</Button>
              <Button variant="primary" onClick={save}>Lưu</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ---------- switch, numbers, play stats ----------

function SettingsTab({ onChanged }: { onChanged: () => void }) {
  const me = useMe();
  const { toast, confirm } = useUi();
  const s = useApi<{ values: Record<string, number>; fields: SettingsField[] }>('quiz/settings');
  const stats = useApi<Record<string, any>>('quiz/stats');
  const [vals, setVals] = useState<Record<string, number>>({});
  useEffect(() => { if (s.data) setVals(s.data.values); }, [s.data]);
  const isAdmin = me?.role === 'ADMIN';
  const enabled = s.data?.values.enabled === 1;

  async function toggle() {
    const next = enabled ? 0 : 1;
    if (!(await confirm(next ? 'Bật luyện tập trắc nghiệm cho mọi cầu thủ? Tab "Luyện tập" sẽ hiện trong trang giải đấu.' : 'Tắt luyện tập trắc nghiệm? Cầu thủ không thấy tab nữa, chỉ ADMIN/EDITOR còn vào thử được.'))) return;
    try {
      await api('quiz/settings', { method: 'PUT', body: { enabled: next } });
      toast(next ? 'Đã bật cho cầu thủ' : 'Đã tắt');
      s.reload();
      onChanged();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }
  async function saveNumbers() {
    const body = Object.fromEntries(Object.entries(vals).filter(([k]) => k !== 'enabled'));
    try {
      await api('quiz/settings', { method: 'PUT', body });
      toast('Đã lưu cài đặt');
      s.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <div className="space-y-5">
      <Loading error={s.error} loading={s.loading && !s.data} />
      {s.data && (
        <>
          <Card>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-[16px] font-semibold">Tính năng luyện tập cho cầu thủ</h2>
                <p className="mt-1 text-[14px] text-[#46564D]">
                  {enabled
                    ? 'Đang bật: mọi cầu thủ thấy tab "Luyện tập" trong trang giải đấu và bảng xếp hạng.'
                    : 'Đang tắt: cầu thủ không thấy gì. ADMIN và EDITOR vẫn vào chơi thử được (có nhãn "Đang thử").'}
                </p>
                {!isAdmin && <p className="mt-1 text-[13px] text-[#8A5A00]">Chỉ ADMIN được bật hoặc tắt.</p>}
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                disabled={!isAdmin}
                onClick={toggle}
                className={`relative h-8 w-14 shrink-0 rounded-full transition-colors disabled:opacity-50 ${enabled ? 'bg-[#1F7A3A]' : 'bg-[#C9D5CD]'}`}
              >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </Card>
          <Card title="Con số của trò chơi">
            <div className="grid gap-3 md:grid-cols-2">
              {s.data.fields.filter((f) => f.key !== 'enabled').map((f) => (
                <Field key={f.key} label={f.label} hint={`Từ ${f.min} đến ${f.max}, mặc định ${f.def}`}>
                  <Input type="number" min={f.min} max={f.max} value={vals[f.key] ?? f.def} onChange={(e) => setVals({ ...vals, [f.key]: Number(e.target.value) })} />
                </Field>
              ))}
            </div>
            <div className="mt-4 flex justify-end"><Button variant="primary" onClick={saveNumbers}>Lưu cài đặt</Button></div>
          </Card>
        </>
      )}
      {stats.data && (
        <Card title="Người chơi">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ['Người đã chơi', stats.data.players],
              ['Chơi 7 ngày qua', stats.data.players7d],
              ['Câu trả lời 7 ngày', stats.data.answers7d],
              ['Tỉ lệ đúng 7 ngày', stats.data.correctRate7d == null ? '–' : `${Math.round(stats.data.correctRate7d * 100)}%`],
              ['Đề thử 7 ngày', stats.data.mocks7d],
            ].map(([l, v]) => (
              <div key={l as string}><div className="text-[12px] uppercase tracking-wider text-[#66766D]">{l}</div><div className="text-[22px] font-semibold">{v}</div></div>
            ))}
          </div>
          <h3 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wider text-[#46564D]">Số người ở mỗi hạng</h3>
          <div className="flex flex-wrap gap-2">
            {(stats.data.rankLabels as string[]).map((l, i) => (
              <Badge key={l} tone={i >= 5 ? 'gold' : 'gray'}>{l}: {(stats.data!.ranks as { rank: number; players: number }[]).find((r) => r.rank === i)?.players || 0}</Badge>
            ))}
          </div>
          {(stats.data.flagged as any[]).length > 0 && (
            <>
              <h3 className="mb-2 mt-5 text-[12px] font-semibold uppercase tracking-wider text-[#46564D]">Trả lời đáng ngờ 7 ngày (quá nhanh hoặc rời trang) · không tính vào bảng xếp hạng</h3>
              <ul className="text-[14px]">
                {(stats.data.flagged as { name: string; userid: string; flagged: number }[]).map((f) => <li key={f.userid}>{f.name}: {f.flagged} câu</li>)}
              </ul>
            </>
          )}
        </Card>
      )}
    </div>
  );
}
