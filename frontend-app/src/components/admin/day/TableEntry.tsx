'use client';

// Table mode of the station scoring screen (plan 06, part 2): catch-up at the end of the day from the paper sheet.
// One row per contestant of the day, one column per attempt, typed with a keyboard: Enter goes down the column, Tab
// goes across. Each changed cell is saved when it loses focus, through field-scoring/save and the offline queue.
// "L" marks a failed attempt (Lỗi), "K" one not taken (Không thi).

import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/admin/client';
import { isNetworkError, newClientUuid, queuePut, queueRemove, sendSave, type QueuedSave } from '@/lib/admin/offline-queue';
import { Spinner } from './keypad';

interface Assessment { id: number; title: string; unit: string | null; attemptsCount: number; scoringMethod: string }
interface Row {
  participantId: number;
  sbd: number;
  fullName: string;
  blocked: boolean;
  scores: Record<string, number>;
  statuses: Record<string, 'FAULT' | 'DNS'>;
  review: string[];
}
type CellState = 'saving' | 'ok' | 'queued' | 'review' | 'error';
const LIMIT = 200;

const shown = (r: Row, key: string) => (r.statuses[key] === 'FAULT' ? 'L' : r.statuses[key] === 'DNS' ? 'K' : r.scores[key] != null ? String(Number(r.scores[key])) : '');

export default function TableEntry({ stepId, assessments, flash, onQueueChange }: {
  stepId: number;
  assessments: Assessment[];
  flash: (tone: 'ok' | 'error', text: string) => void;
  onQueueChange: () => void;
}) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [listed, setListed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [missingOnly, setMissingOnly] = useState(false);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [states, setStates] = useState<Record<string, CellState>>({});
  const tableRef = useRef<HTMLTableElement>(null);

  const cols = useMemo(
    () => assessments.flatMap((a) => Array.from({ length: a.attemptsCount }, (_, i) => ({ key: `${a.id}_${i + 1}`, a, n: i + 1 }))),
    [assessments],
  );

  const load = () => api<{ rows: Row[]; listed: boolean }>(`field-scoring/table?stepId=${stepId}`)
    .then((r) => { setRows(r.rows); setListed(r.listed); setError(null); })
    .catch((e) => setError(isNetworkError(e) ? 'Mất mạng, chưa tải được bảng.' : (e as Error).message));
  useEffect(() => { setRows(null); setDrafts({}); setStates({}); load(); }, [stepId]); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (rows || []).filter((r) =>
      (!needle || String(r.sbd) === needle || r.fullName?.toLowerCase().includes(needle))
      && (!missingOnly || cols.some((c) => shown(r, c.key) === '')));
  }, [rows, q, missingOnly, cols]);

  async function commit(r: Row, key: string) {
    const id = `${r.participantId}:${key}`;
    const raw = drafts[id];
    if (raw === undefined) return;
    const v = raw.trim().toUpperCase().replace(',', '.');
    if (v === shown(r, key) || v === '') { setDrafts((d) => { const n = { ...d }; delete n[id]; return n; }); return; }
    const status = v === 'L' ? 'FAULT' : v === 'K' ? 'DNS' : null;
    if (!status && Number.isNaN(Number(v))) {
      setStates((s) => ({ ...s, [id]: 'error' }));
      flash('error', `SBD ${r.sbd}: "${raw}" không phải số (gõ L = Lỗi, K = Không thi)`);
      return;
    }
    const item: QueuedSave = {
      id: newClientUuid(), stepId, participantId: r.participantId, label: `SBD ${r.sbd} · ${r.fullName}`,
      scores: status ? {} : { [key]: v }, statuses: status ? { [key]: status } : {}, notes: {}, createdAt: Date.now(),
    };
    setStates((s) => ({ ...s, [id]: 'saving' }));
    let stored = true;
    try { await queuePut(item); } catch { stored = false; }
    const applied = (x: Row): Row => {
      const scores = { ...x.scores }; const statuses = { ...x.statuses };
      if (status) { statuses[key] = status; delete scores[key]; } else { scores[key] = Number(v); delete statuses[key]; }
      return { ...x, scores, statuses };
    };
    try {
      const res = await sendSave(item);
      if (stored) await queueRemove(item.id).catch(() => {});
      const review = (res.review || []).some((x: { key: string }) => x.key === key);
      setRows((rs) => rs && rs.map((x) => (x.participantId === r.participantId ? applied(x) : x)));
      setDrafts((d) => { const n = { ...d }; delete n[id]; return n; });
      setStates((s) => ({ ...s, [id]: review ? 'review' : 'ok' }));
    } catch (e) {
      if (isNetworkError(e) && stored) {
        setRows((rs) => rs && rs.map((x) => (x.participantId === r.participantId ? applied(x) : x)));
        setDrafts((d) => { const n = { ...d }; delete n[id]; return n; });
        setStates((s) => ({ ...s, [id]: 'queued' }));
      } else {
        if (stored) await queueRemove(item.id).catch(() => {});
        setStates((s) => ({ ...s, [id]: 'error' }));
        flash('error', `SBD ${r.sbd}: ${(e as Error).message}`);
      }
    } finally {
      onQueueChange();
    }
  }

  // Enter moves down the column (the paper sheet is read top to bottom); Shift+Enter moves up.
  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const next = tableRef.current?.querySelector<HTMLInputElement>(`input[data-cell="${row + (e.shiftKey ? -1 : 1)}:${col}"]`);
    if (next) { next.focus(); next.select(); } else (e.target as HTMLInputElement).blur();
  }

  const filled = (rows || []).filter((r) => cols.every((c) => shown(r, c.key) !== '')).length;

  return (
    <section className="mt-5 rounded-2xl border-2 border-[#0B2419]/15 bg-white p-3 lg:p-4">
      <div className="flex flex-wrap items-center gap-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm SBD hoặc tên"
          className="min-h-[52px] w-[220px] rounded-xl border-2 border-[#0B2419]/25 px-3 text-[17px]" />
        <label className="flex min-h-[52px] items-center gap-2 text-[16px] font-medium">
          <input type="checkbox" className="h-5 w-5" checked={missingOnly} onChange={(e) => setMissingOnly(e.target.checked)} /> Chỉ người còn thiếu
        </label>
        <button type="button" onClick={load} className="min-h-[52px] rounded-xl border-2 border-[#0B2419]/25 px-4 text-[16px] font-semibold">⟳ Tải lại</button>
        <span className="ml-auto text-[15px] text-[#46564D]">
          {rows ? `${filled}/${rows.length} người đủ số${listed ? ' · theo danh sách của ngày' : ''}` : ''}
        </span>
      </div>
      <p className="mt-2 text-[14px] text-[#46564D]">Enter xuống dòng dưới, Tab sang lượt kế. Gõ <b>L</b> = Lỗi, <b>K</b> = Không thi. Ô tự lưu khi rời ô.</p>
      {error && <p role="alert" className="mt-3 rounded-lg bg-[#FDE4E1] p-3 font-semibold text-[#B42318]">{error}</p>}
      {!rows && !error && <p className="mt-3 flex items-center gap-2 text-[17px]"><Spinner /> Đang tải…</p>}
      {rows && (
        <div className="mt-3 overflow-x-auto">
          <table ref={tableRef} className="w-full border-collapse text-[16px]">
            <thead>
              <tr className="border-b-2 border-[#0B2419]/15 text-left text-[13px] font-bold uppercase">
                <th className="px-2 py-2">SBD</th>
                <th className="px-2">Thí sinh</th>
                {cols.map((c) => (
                  <th key={c.key} className="min-w-[100px] px-2">
                    {assessments.length > 1 && <span className="block truncate normal-case text-[12px] font-semibold text-[#46564D]">{c.a.title}</span>}
                    Lượt {c.n}{c.a.unit ? <span className="normal-case font-medium"> ({c.a.unit})</span> : null}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, LIMIT).map((r, ri) => (
                <tr key={r.participantId} className="border-b border-[#0B2419]/10">
                  <td className="px-2 py-1 font-[family-name:var(--font-hud)] text-[20px] font-bold tabular-nums">{r.sbd}</td>
                  <td className="max-w-[220px] truncate px-2">{r.fullName}{r.blocked && <span className="ml-2 rounded bg-[#B42318] px-1.5 text-[12px] font-bold text-white">Y tế loại</span>}</td>
                  {cols.map((c, ci) => {
                    const id = `${r.participantId}:${c.key}`;
                    const st = states[id] ?? (r.review.includes(c.key) ? 'review' : undefined);
                    return (
                      <td key={c.key} className="px-1 py-1">
                        <div className="relative">
                          <input
                            data-cell={`${ri}:${ci}`}
                            disabled={r.blocked}
                            inputMode="decimal"
                            autoComplete="off"
                            aria-label={`SBD ${r.sbd} ${c.a.title} lượt ${c.n}`}
                            value={drafts[id] ?? shown(r, c.key)}
                            onChange={(e) => { const v = e.target.value; setDrafts((d) => ({ ...d, [id]: v })); setStates((s) => { const n = { ...s }; delete n[id]; return n; }); }}
                            onFocus={(e) => e.target.select()}
                            onBlur={() => commit(r, c.key)}
                            onKeyDown={(e) => onKeyDown(e, ri, ci)}
                            className={`h-[46px] w-full rounded-lg border-2 px-2 text-right font-[family-name:var(--font-hud)] text-[20px] font-bold tabular-nums outline-none focus:border-[#1F7A3A] focus:bg-[#F3FBEC] disabled:bg-[#F1F5F2] ${st === 'error' ? 'border-[#B42318]' : st === 'review' ? 'border-[#F79009]' : 'border-[#0B2419]/15'}`}
                          />
                          {st === 'saving' && <span className="absolute left-1.5 top-1.5"><Spinner className="h-3.5 w-3.5" /></span>}
                          {st === 'ok' && <span className="absolute left-1.5 top-0.5 text-[12px] font-bold text-[#1F7A3A]">✓</span>}
                          {st === 'queued' && <span className="absolute left-1.5 top-0.5 text-[11px] font-bold text-[#8A5A00]">chờ</span>}
                          {st === 'review' && <span className="absolute left-1.5 top-0.5 text-[11px] font-bold text-[#B54708]">cần xem</span>}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length > LIMIT && <p className="mt-2 text-[15px] text-[#46564D]">Đang hiện {LIMIT}/{visible.length} người. Gõ SBD hoặc tên để lọc.</p>}
          {visible.length === 0 && <p className="mt-3 text-[17px]">Không có thí sinh nào khớp.</p>}
        </div>
      )}
    </section>
  );
}
