'use client';

// Group entry mode of the station scoring screen (plan 06, part 2b): a group of 6–8 contestants scans in at the
// table, then the scout fills a grid of contestants × attempts, either down (everyone's attempt 1, then attempt 2)
// or across (all attempts of one contestant, then the next). Each cell is saved on its own through the same
// field-scoring/save + offline queue as the single-contestant mode. The group itself only lives on this device.

import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/admin/client';
import SbdScanner from '@/components/admin/SbdScanner';
import { isNetworkError, newClientUuid, queuePut, queueRemove, sendSave, type QueuedSave } from '@/lib/admin/offline-queue';
import { Keypad, Spinner } from './keypad';

interface Assessment { id: number; title: string; unit: string | null; attemptsCount: number; scoringMethod: string }
type CellStatus = 'FAULT' | 'DNS';
type CellState = 'saving' | 'ok' | 'queued' | 'review' | 'error';

interface Member {
  participantId: number;
  sbd: number;
  fullName: string;
  values: Record<string, string>;
  statuses: Record<string, CellStatus>;
  notes: Record<string, string>;
  /** Signature of what the server (or the queue) already has, per cell. */
  saved: Record<string, string>;
  state: Record<string, CellState>;
}

interface Lookup {
  participant?: { id: number; sbd: number; fullName: string };
  scores?: Record<string, number>;
  blocked?: boolean;
  sbdError?: string;
}

interface MineRow { participantId: number; sbd: number; fullName: string; scores: Record<string, number>; statuses: Record<string, CellStatus> }

const INK = 'text-[#06140D]';
const FAULTS = ['Va cọc', 'Trượt chân', 'Lỗi khác'];
const sig = (m: Member, key: string) => (m.statuses[key] ? `s:${m.statuses[key]}:${m.notes[key] || ''}` : `v:${m.values[key] || ''}`);
const storeKey = (stepId: number) => `of:group:${stepId}`;

export default function GroupEntry({ dayId, stepId, assessments, competitionId, flash, onQueueChange }: {
  dayId: number;
  stepId: number;
  assessments: Assessment[];
  competitionId?: number;
  flash: (tone: 'ok' | 'error', text: string) => void;
  onQueueChange: () => void;
}) {
  const [members, setMembers] = useState<Member[]>([]);
  const [restored, setRestored] = useState(false);
  const [target, setTarget] = useState<{ pid: number; key: string } | 'sbd'>('sbd');
  const [fresh, setFresh] = useState(true);
  const [sbdInput, setSbdInput] = useState('');
  const [adding, setAdding] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [down, setDown] = useState(true);
  const [drawer, setDrawer] = useState(false);
  const membersRef = useRef<Member[]>([]);
  membersRef.current = members;

  const cols = useMemo(
    () => assessments.flatMap((a) => Array.from({ length: a.attemptsCount }, (_, i) => ({ key: `${a.id}_${i + 1}`, a, n: i + 1 }))),
    [assessments],
  );

  // The group survives a reload of the page (state only, the numbers themselves are saved per cell).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storeKey(stepId));
      const saved = raw ? (JSON.parse(raw) as { members: Member[]; down?: boolean }) : null;
      setMembers(saved?.members || []);
      if (saved?.down != null) setDown(saved.down);
    } catch { setMembers([]); }
    setTarget('sbd');
    setRestored(true);
  }, [stepId]);
  useEffect(() => {
    if (!restored) return;
    try { localStorage.setItem(storeKey(stepId), JSON.stringify({ members, down })); } catch { /* storage blocked */ }
  }, [members, down, stepId, restored]);

  const update = (pid: number, fn: (m: Member) => Member) => setMembers((ms) => ms.map((m) => (m.participantId === pid ? fn(m) : m)));

  // ---------- Adding contestants ----------
  async function add(sbd: string) {
    const s = sbd.trim();
    if (!s || adding) return;
    if (members.some((m) => String(m.sbd) === s)) { flash('error', `SBD ${s} đã có trong nhóm`); setSbdInput(''); return; }
    setAdding(true);
    try {
      const r = await api<Lookup>(`field-scoring?dayId=${dayId}&stepId=${stepId}&sbd=${encodeURIComponent(s)}`);
      if (r.sbdError || !r.participant) { flash('error', r.sbdError || `Không tìm thấy SBD ${s}`); return; }
      if (r.blocked) { flash('error', `SBD ${s} đã bị bác sĩ loại khỏi vòng thi, không thêm vào nhóm`); return; }
      const values: Record<string, string> = {};
      const saved: Record<string, string> = {};
      Object.entries(r.scores || {}).forEach(([k, v]) => { values[k] = String(v); saved[k] = `v:${v}`; });
      const p = r.participant;
      setMembers((ms) => (ms.some((m) => m.participantId === p.id) ? ms
        : [...ms, { participantId: p.id, sbd: p.sbd, fullName: p.fullName, values, statuses: {}, notes: {}, saved, state: {} }]));
      setSbdInput('');
      setFresh(true);
    } catch (e) {
      flash('error', isNetworkError(e) ? 'Mất mạng, chưa tra được SBD. Thử lại khi có mạng.' : (e as Error).message);
    } finally {
      setAdding(false);
    }
  }

  function onScanned(v: { competitionId: string; sbd: string }) {
    setScanning(false);
    if (competitionId && String(competitionId) !== v.competitionId) { flash('error', 'Phiếu SBD này thuộc giải đấu khác'); return; }
    add(v.sbd);
  }

  // ---------- Saving one cell ----------
  async function commit(pid: number, key: string) {
    const m = membersRef.current.find((x) => x.participantId === pid);
    if (!m) return;
    const s = sig(m, key);
    if (s === (m.saved[key] ?? 'v:') || s === 'v:') return;
    const status = m.statuses[key];
    const item: QueuedSave = {
      id: newClientUuid(),
      stepId,
      participantId: pid,
      label: `SBD ${m.sbd} · ${m.fullName}`,
      scores: status ? {} : { [key]: m.values[key] },
      statuses: status ? { [key]: status } : {},
      notes: m.notes[key] ? { [key]: m.notes[key] } : {},
      createdAt: Date.now(),
    };
    const before = m.saved[key];
    update(pid, (x) => ({ ...x, saved: { ...x.saved, [key]: s }, state: { ...x.state, [key]: 'saving' } }));
    let stored = true;
    try { await queuePut(item); } catch { stored = false; }
    try {
      const r = await sendSave(item);
      if (stored) await queueRemove(item.id).catch(() => {});
      const review = (r.review || []).some((x: { key: string }) => x.key === key);
      update(pid, (x) => ({ ...x, state: { ...x.state, [key]: review ? 'review' : 'ok' } }));
    } catch (e) {
      if (isNetworkError(e) && stored) {
        update(pid, (x) => ({ ...x, state: { ...x.state, [key]: 'queued' } }));
      } else {
        if (stored) await queueRemove(item.id).catch(() => {});
        update(pid, (x) => {
          const saved = { ...x.saved };
          if (before === undefined) delete saved[key]; else saved[key] = before;
          return { ...x, saved, state: { ...x.state, [key]: 'error' } };
        });
        flash('error', `SBD ${m.sbd}: ${(e as Error).message}`);
      }
    } finally {
      onQueueChange();
    }
  }

  // ---------- Moving between cells ----------
  const order = useMemo(() => {
    const out: { pid: number; key: string }[] = [];
    if (down) cols.forEach((c) => members.forEach((m) => out.push({ pid: m.participantId, key: c.key })));
    else members.forEach((m) => cols.forEach((c) => out.push({ pid: m.participantId, key: c.key })));
    return out;
  }, [cols, members, down]);

  function go(next: { pid: number; key: string } | 'sbd') {
    if (target !== 'sbd') commit(target.pid, target.key);
    setTarget(next);
    setFresh(true);
  }
  function nextCell() {
    if (target === 'sbd') { add(sbdInput); return; }
    const i = order.findIndex((c) => c.pid === target.pid && c.key === target.key);
    go(i >= 0 && i < order.length - 1 ? order[i + 1] : target);
  }

  function onKey(k: string) {
    if (target === 'sbd') {
      const base = fresh ? '' : sbdInput;
      setFresh(false);
      if (k === '⌫') setSbdInput((v) => v.slice(0, -1));
      else if (k === 'C') setSbdInput('');
      else if (k !== '.' && base.length < 5) setSbdInput(base + k);
      return;
    }
    const { pid, key } = target;
    const replace = fresh && k !== '⌫';
    setFresh(false);
    update(pid, (m) => {
      const statuses = { ...m.statuses };
      const notes = { ...m.notes };
      delete statuses[key];
      delete notes[key];
      const cur = replace ? '' : m.values[key] ?? '';
      let next = cur;
      if (k === '⌫') next = cur.slice(0, -1);
      else if (k === 'C') next = '';
      else if (k === '.') next = cur.includes('.') ? cur : (cur || '0') + '.';
      else if (cur.length < 8) next = cur === '0' ? k : cur + k;
      const state = { ...m.state };
      delete state[key];
      return { ...m, statuses, notes, values: { ...m.values, [key]: next }, state };
    });
  }

  function mark(status: CellStatus, note?: string) {
    if (target === 'sbd') return;
    const { pid, key } = target;
    const m = membersRef.current.find((x) => x.participantId === pid);
    if (!m) return;
    const notes = { ...m.notes };
    if (note) notes[key] = note; else delete notes[key];
    const marked = { ...m, statuses: { ...m.statuses, [key]: status }, notes, values: { ...m.values, [key]: '' } };
    // Save it right away and move on, like "Tiếp".
    membersRef.current = membersRef.current.map((x) => (x.participantId === pid ? marked : x));
    setMembers(membersRef.current);
    nextCell();
  }

  const unsaved = members.flatMap((m) => cols.filter((c) => sig(m, c.key) !== 'v:' && sig(m, c.key) !== (m.saved[c.key] ?? 'v:')).map((c) => ({ pid: m.participantId, key: c.key })));
  const waiting = members.some((m) => Object.values(m.state).includes('saving'));

  function finishGroup() {
    if (target !== 'sbd') commit(target.pid, target.key);
    unsaved.forEach((c) => commit(c.pid, c.key));
    const missing = members.reduce((n, m) => n + cols.filter((c) => sig(m, c.key) === 'v:').length, 0);
    if (missing > 0 && !window.confirm(`Còn ${missing} ô chưa có số. Vẫn xong nhóm? (Có thể nhập bù sau ở Danh sách đã thi.)`)) return;
    setMembers([]);
    setTarget('sbd');
    flash('ok', 'Đã xong nhóm. Quét SBD để tạo nhóm mới.');
  }

  function remove(pid: number) {
    const m = members.find((x) => x.participantId === pid);
    if (!m) return;
    if (cols.some((c) => sig(m, c.key) !== 'v:' && sig(m, c.key) !== (m.saved[c.key] ?? 'v:'))
      && !window.confirm(`SBD ${m.sbd} còn ô chưa lưu. Vẫn bỏ khỏi nhóm?`)) return;
    setMembers((ms) => ms.filter((x) => x.participantId !== pid));
    if (target !== 'sbd' && target.pid === pid) setTarget('sbd');
  }

  const targetLabel = target === 'sbd' ? 'Số báo danh để thêm vào nhóm' : (() => {
    const m = members.find((x) => x.participantId === target.pid);
    const c = cols.find((x) => x.key === target.key);
    return `SBD ${m?.sbd ?? ''} · ${c?.a.title ?? ''} · lượt ${c?.n ?? ''}`;
  })();

  return (
    <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <div className="min-w-0 space-y-4">
        <section className="rounded-2xl border-2 border-[#0B2419]/15 bg-white p-4 lg:p-5">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => go('sbd')}
              aria-label="Số báo danh"
              className={`flex min-h-[64px] min-w-[160px] flex-1 items-center rounded-xl border-[3px] px-4 text-left ${target === 'sbd' ? 'border-[#1F7A3A] bg-[#F3FBEC]' : 'border-[#0B2419]/25'}`}
            >
              <span className="mr-3 text-[15px] font-bold uppercase">SBD</span>
              <span className="font-[family-name:var(--font-hud)] text-[32px] font-bold tabular-nums">{sbdInput || <span className="text-[#0B2419]/30">—</span>}</span>
            </button>
            <button type="button" onClick={() => setScanning(true)} className="min-h-[64px] rounded-xl border-[3px] border-[#0B2419] px-5 text-[18px] font-bold active:bg-[#E4F3D6]">Quét QR</button>
            <button type="button" onClick={() => add(sbdInput)} disabled={adding} className="flex min-h-[64px] items-center gap-2 rounded-xl bg-[#0B2419] px-6 text-[18px] font-bold text-[#D6FA9E] active:bg-[#18522F] disabled:opacity-80">
              {adding ? <><Spinner /> Đang tìm</> : '+ Thêm vào nhóm'}
            </button>
            <button type="button" onClick={() => setDrawer(true)} className="min-h-[64px] rounded-xl border-2 border-[#0B2419]/30 px-5 text-[17px] font-semibold active:bg-[#E4F3D6]">Danh sách đã thi</button>
          </div>
        </section>

        <section className="rounded-2xl border-2 border-[#0B2419]/15 bg-white p-2 lg:p-3">
          <div className="flex flex-wrap items-center justify-between gap-2 px-2 pb-2 pt-1">
            <h2 className="text-[18px] font-bold uppercase tracking-wide">Nhóm thi · {members.length} người</h2>
            {unsaved.length > 0 && <span className="rounded-md bg-[#F5C451] px-2 py-1 text-[14px] font-bold">{unsaved.length} ô chưa lưu</span>}
          </div>
          {members.length === 0 ? (
            <p className="px-2 py-6 text-center text-[18px]">Quét QR hoặc gõ SBD để thêm thí sinh vào nhóm.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-1">
                <thead>
                  <tr className="text-left text-[13px] font-bold uppercase">
                    <th className="px-2">SBD</th>
                    <th className="px-2">Thí sinh</th>
                    {cols.map((c) => (
                      <th key={c.key} className="min-w-[96px] px-2">
                        {assessments.length > 1 && <span className="block truncate normal-case text-[12px] font-semibold text-[#46564D]">{c.a.title}</span>}
                        Lượt {c.n}
                      </th>
                    ))}
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.participantId}>
                      <td className="px-2 font-[family-name:var(--font-hud)] text-[24px] font-bold tabular-nums">{m.sbd}</td>
                      <td className="max-w-[180px] truncate px-2 text-[16px] font-medium">{m.fullName}</td>
                      {cols.map((c) => {
                        const active = target !== 'sbd' && target.pid === m.participantId && target.key === c.key;
                        const st = m.statuses[c.key];
                        const state = m.state[c.key];
                        return (
                          <td key={c.key}>
                            <button
                              type="button"
                              onClick={() => go({ pid: m.participantId, key: c.key })}
                              className={`relative flex h-[64px] w-full flex-col items-center justify-center rounded-xl border-[3px] px-1 ${active ? 'border-[#1F7A3A] bg-[#F3FBEC] shadow-[0_0_0_3px_rgba(31,122,58,0.18)]' : state === 'error' ? 'border-[#B42318]' : 'border-[#0B2419]/20'}`}
                            >
                              {st ? (
                                <span className={`rounded-md px-1.5 py-0.5 text-[14px] font-bold ${st === 'DNS' ? 'bg-[#0B2419] text-white' : 'bg-[#B42318] text-white'}`}>{st === 'DNS' ? 'Không thi' : 'Lỗi'}</span>
                              ) : (
                                <span className="font-[family-name:var(--font-hud)] text-[26px] font-bold tabular-nums">{m.values[c.key] || <span className="text-[#0B2419]/25">—</span>}</span>
                              )}
                              {state === 'review' && <span className="text-[11px] font-bold text-[#B42318]">cần xem</span>}
                              {state === 'queued' && <span className="text-[11px] font-bold text-[#8A5A00]">chờ mạng</span>}
                              {state === 'saving' && <span className="absolute right-1 top-1"><Spinner className="h-3.5 w-3.5" /></span>}
                              {state === 'ok' && <span className="absolute right-1.5 top-0.5 text-[12px] font-bold text-[#1F7A3A]" aria-label="đã lưu">✓</span>}
                            </button>
                          </td>
                        );
                      })}
                      <td>
                        <button type="button" aria-label={`Bỏ SBD ${m.sbd} khỏi nhóm`} onClick={() => remove(m.participantId)} className="h-[48px] w-[44px] rounded-lg text-[20px] text-[#66766D] active:bg-[#FDE4E1]">×</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-[84px] lg:self-start">
        <div className="rounded-2xl border-2 border-[#0B2419]/15 bg-[#E9EFEB] p-3">
          <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-white p-1" role="group" aria-label="Thứ tự nhập">
            {[{ v: true, label: 'Đi dọc', hint: 'cả nhóm lượt 1, rồi lượt 2' }, { v: false, label: 'Đi ngang', hint: 'hết lượt một người' }].map((o) => (
              <button key={o.label} type="button" aria-pressed={down === o.v} onClick={() => setDown(o.v)}
                className={`rounded-lg px-2 py-2 text-left ${down === o.v ? 'bg-[#0B2419] text-[#D6FA9E]' : INK}`}>
                <span className="block text-[17px] font-bold">{o.label}</span>
                <span className="block text-[12px] leading-tight opacity-80">{o.hint}</span>
              </button>
            ))}
          </div>
          <p className="mb-2 px-1 text-[15px] font-bold">Đang nhập: {targetLabel}</p>
          <Keypad allowDot={target !== 'sbd'} onKey={onKey} />
          {target !== 'sbd' && (
            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                {FAULTS.map((f) => (
                  <button key={f} type="button" onClick={() => mark('FAULT', f === 'Lỗi khác' ? undefined : f)} className="min-h-[52px] rounded-xl border-2 border-[#B42318] bg-white px-1 text-[15px] font-bold leading-tight text-[#B42318] active:bg-[#FDE4E1]">{f}</button>
                ))}
              </div>
              <button type="button" onClick={() => mark('DNS')} className="min-h-[52px] w-full rounded-xl bg-[#0B2419] text-[17px] font-bold text-white active:bg-[#18522F]">Không thi</button>
            </div>
          )}
          <button type="button" onClick={nextCell} className="mt-3 h-[64px] w-full rounded-xl bg-[#1F7A3A] text-[21px] font-bold text-white active:bg-[#18602E]">
            {target === 'sbd' ? '+ Thêm vào nhóm' : 'Tiếp →'}
          </button>
        </div>
        <button type="button" disabled={members.length === 0 || waiting} onClick={finishGroup}
          className="mt-3 h-[60px] w-full rounded-2xl border-[3px] border-[#0B2419] bg-white text-[19px] font-bold active:bg-[#E4F3D6] disabled:opacity-40">
          Xong nhóm, tạo nhóm mới
        </button>
      </aside>

      {scanning && <SbdScanner onScan={onScanned} onClose={() => setScanning(false)} />}
      {drawer && <DoneDrawer stepId={stepId} cols={cols} assessments={assessments} flash={flash} onQueueChange={onQueueChange} onClose={() => setDrawer(false)}
        onEdited={(pid, scores) => update(pid, (m) => {
          const statuses = { ...m.statuses }; const saved = { ...m.saved }; const state = { ...m.state };
          Object.entries(scores).forEach(([k, v]) => { delete statuses[k]; saved[k] = `v:${v}`; state[k] = 'ok'; });
          return { ...m, values: { ...m.values, ...scores }, statuses, saved, state };
        })} />}
    </div>
  );
}

/** Contestants this scout entered on this test, with their numbers; "Hiệu chỉnh" turns a row into inputs. */
function DoneDrawer({ stepId, cols, assessments, flash, onQueueChange, onClose, onEdited }: {
  stepId: number;
  cols: { key: string; a: Assessment; n: number }[];
  assessments: Assessment[];
  flash: (tone: 'ok' | 'error', text: string) => void;
  onQueueChange: () => void;
  onClose: () => void;
  /** A correction saved here also updates that contestant's row in the open group. */
  onEdited: (participantId: number, scores: Record<string, string>) => void;
}) {
  const [rows, setRows] = useState<MineRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const load = () => api<{ rows: MineRow[] }>(`field-scoring/mine?stepId=${stepId}`)
    .then((r) => { setRows(r.rows); setError(null); })
    .catch((e) => setError(isNetworkError(e) ? 'Mất mạng, chưa tải được danh sách.' : (e as Error).message));
  useEffect(() => { load(); }, [stepId]); // eslint-disable-line react-hooks/exhaustive-deps

  const show = (r: MineRow, key: string) => (r.statuses[key] === 'DNS' ? 'Không thi' : r.statuses[key] === 'FAULT' ? 'Lỗi' : r.scores[key] != null ? String(Number(r.scores[key])) : '—');

  async function saveRow(r: MineRow) {
    const scores: Record<string, string> = {};
    for (const c of cols) {
      const v = (draft[c.key] ?? '').trim().replace(',', '.');
      if (v === '' || v === show(r, c.key)) continue;
      if (Number.isNaN(Number(v))) { flash('error', `${c.a.title} lượt ${c.n}: số không hợp lệ`); return; }
      scores[c.key] = v;
    }
    if (Object.keys(scores).length === 0) { setEditing(null); return; }
    setSaving(true);
    const item: QueuedSave = { id: newClientUuid(), stepId, participantId: r.participantId, label: `SBD ${r.sbd} · ${r.fullName}`, scores, statuses: {}, notes: {}, createdAt: Date.now() };
    let stored = true;
    try { await queuePut(item); } catch { stored = false; }
    try {
      const res = await sendSave(item);
      if (stored) await queueRemove(item.id).catch(() => {});
      flash('ok', res.review?.length ? `${res.message} · SBD ${r.sbd}` : `Đã sửa điểm SBD ${r.sbd}`);
      onEdited(r.participantId, scores);
      setEditing(null);
      load();
    } catch (e) {
      if (isNetworkError(e) && stored) { flash('ok', `Chưa có mạng: đã giữ bản sửa SBD ${r.sbd}, sẽ tự gửi khi có mạng`); setEditing(null); }
      else { if (stored) await queueRemove(item.id).catch(() => {}); flash('error', (e as Error).message); }
    } finally {
      setSaving(false);
      onQueueChange();
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={onClose}>
      <div role="dialog" aria-label="Danh sách đã thi" className="flex h-full w-full max-w-[720px] flex-col bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 border-b-2 border-[#0B2419]/10 p-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-[20px] font-bold">Danh sách đã thi</h2>
            <p className="text-[14px] text-[#46564D]">Thí sinh bạn đã nhập ở bài này{assessments.length === 1 ? ` · ${assessments[0].title}` : ''}</p>
          </div>
          <button type="button" onClick={load} className="min-h-[48px] rounded-lg border-2 border-[#0B2419]/25 px-3 text-[15px] font-semibold">⟳ Tải lại</button>
          <button type="button" onClick={onClose} className="min-h-[48px] rounded-lg bg-[#0B2419] px-4 text-[15px] font-bold text-white">Đóng</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {error && <p role="alert" className="rounded-lg bg-[#FDE4E1] p-3 font-semibold text-[#B42318]">{error}</p>}
          {!rows && !error && <p className="flex items-center gap-2 p-3 text-[17px]"><Spinner /> Đang tải…</p>}
          {rows?.length === 0 && <p className="p-3 text-[17px]">Bạn chưa nhập thí sinh nào ở bài này.</p>}
          <ul className="space-y-2">
            {rows?.map((r) => (
              <li key={r.participantId} className="rounded-xl border-2 border-[#0B2419]/10 p-3">
                <div className="flex items-center gap-3">
                  <span className="w-14 font-[family-name:var(--font-hud)] text-[22px] font-bold tabular-nums">{r.sbd}</span>
                  <span className="min-w-0 flex-1 truncate text-[17px] font-medium">{r.fullName}</span>
                  {editing === r.participantId ? (
                    <>
                      <button type="button" onClick={() => setEditing(null)} className="min-h-[44px] rounded-lg border-2 border-[#0B2419]/25 px-3 text-[15px] font-semibold">Huỷ</button>
                      <button type="button" disabled={saving} onClick={() => saveRow(r)} className="min-h-[44px] rounded-lg bg-[#1F7A3A] px-4 text-[15px] font-bold text-white disabled:opacity-60">{saving ? 'Đang lưu…' : 'Lưu'}</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => { setEditing(r.participantId); setDraft(Object.fromEntries(cols.map((c) => [c.key, r.scores[c.key] != null ? String(Number(r.scores[c.key])) : '']))); }}
                      className="min-h-[44px] rounded-lg border-2 border-[#0B2419] px-3 text-[15px] font-bold">Hiệu chỉnh</button>
                  )}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {cols.map((c) => (
                    <label key={c.key} className="min-w-[92px] flex-1 rounded-lg bg-[#F1F5F2] px-2 py-1">
                      <span className="block text-[12px] font-semibold text-[#46564D]">{assessments.length > 1 ? `${c.a.title} · ` : ''}Lượt {c.n}</span>
                      {editing === r.participantId ? (
                        <input inputMode="decimal" value={draft[c.key] ?? ''} onChange={(e) => setDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                          className="w-full rounded border-2 border-[#1F7A3A] bg-white px-2 py-1 font-[family-name:var(--font-hud)] text-[20px] font-bold tabular-nums" />
                      ) : (
                        <span className="font-[family-name:var(--font-hud)] text-[20px] font-bold tabular-nums">{show(r, c.key)}</span>
                      )}
                    </label>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
