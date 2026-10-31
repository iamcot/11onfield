'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import { useMe, useIsManager } from '@/components/admin/me';
import FlagBanner from '@/components/admin/FlagBanner';
import SbdScanner from '@/components/admin/SbdScanner';
import { Keypad, Spinner } from './keypad';
import GroupEntry from './GroupEntry';
import {
  flushQueue, isNetworkError, newClientUuid, queueAll, queuePut, queueRemove, sendSave, type QueuedSave,
} from '@/lib/admin/offline-queue';

interface Assessment { id: number; title: string; unit: string | null; attemptsCount: number; scoringMethod: string }
interface Ctx {
  competition?: { id: number; title: string };
  stage?: { id: number; stageNumber: number; title: string };
  days?: { id: number; title: string }[];
  /** scoreSource HLV: the head coach's score; only the HLV (or admin) enters it. */
  steps?: { id: number; title: string; scoreSource?: 'MEASURED' | 'HLV' }[];
  assessments?: Assessment[];
  participant?: { id: number; sbd: number; fullName: string; phone: string | null };
  scores?: Record<string, number>;
  sbdError?: string;
  history?: { sbd: number; participantId: number; fullName: string; filled: number; total: number }[];
  historyPage?: number;
  historyTotalPages?: number;
}

type CellStatus = 'FAULT' | 'DNS';
interface Preview {
  level: number | null;
  color: string | null;
  perAssessment: Record<string, number>;
  warnings: { key: string; message: string }[];
}

// 5-level colors of the rating scale (level 1 grey .. level 5 green).
const COLORS: Record<string, { label: string; bg: string; fg: string }> = {
  GREY: { label: 'Xám', bg: '#9AA5A0', fg: '#06140D' },
  RED: { label: 'Đỏ', bg: '#D92D20', fg: '#FFFFFF' },
  ORANGE: { label: 'Cam', bg: '#F79009', fg: '#06140D' },
  YELLOW: { label: 'Vàng', bg: '#F5C451', fg: '#06140D' },
  GREEN: { label: 'Xanh', bg: '#1F7A3A', fg: '#FFFFFF' },
};
const FAULTS = ['Va cọc', 'Trượt chân', 'Lỗi khác'];

const METHOD: Record<string, string> = { BEST_OF: 'lấy lượt tốt nhất', SUM: 'cộng các lượt', AVERAGE: 'trung bình các lượt' };

// High-contrast, touch-first palette for outdoor use on a tablet.
const INK = 'text-[#06140D]';
const seg = (active: boolean) =>
  `min-h-[60px] shrink-0 rounded-xl border-2 px-5 text-[18px] font-semibold transition-colors ${
    active ? 'border-[#0B2419] bg-[#0B2419] text-[#D6FA9E]' : `border-[#0B2419]/25 bg-white ${INK} active:bg-[#E4F3D6]`
  }`;

/** Keeps the screen awake while judges are scoring (ignored where the browser does not support it). */
function useWakeLock() {
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const nav = navigator as Navigator & { wakeLock?: { request: (t: 'screen') => Promise<{ release: () => Promise<void> }> } };
    const take = async () => {
      try {
        if (nav.wakeLock && document.visibilityState === 'visible') lock = await nav.wakeLock.request('screen');
      } catch {
        /* not allowed, e.g. low battery */
      }
    };
    take();
    document.addEventListener('visibilitychange', take);
    return () => {
      document.removeEventListener('visibilitychange', take);
      lock?.release().catch(() => {});
    };
  }, []);
}

export default function FieldScoring() {
  useWakeLock();
  const me = useMe();
  const manager = useIsManager();
  const router = useRouter();
  const [dayId, setDayId] = useState<number | null>(null);
  const [stepId, setStepId] = useState<number | null>(null);
  const [sbdInput, setSbdInput] = useState('');
  const [lookup, setLookup] = useState<{ sbd?: string; participantId?: number }>({});
  const [historyPage, setHistoryPage] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [loaded, setLoaded] = useState<Record<string, string>>({});
  const [target, setTargetRaw] = useState<string>('sbd');
  const [fresh, setFresh] = useState(true);
  const setTarget = (t: string) => { setTargetRaw(t); setFresh(true); };
  const [saving, setSaving] = useState(false);
  // What the in-flight request was started by, so that control can show a spinner.
  const [pending, setPending] = useState<'find' | 'reload' | number | null>(null);
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>();
  const [statuses, setStatuses] = useState<Record<string, CellStatus>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [preview, setPreview] = useState<Preview | null>(null);
  const [previewError, setPreviewError] = useState(false);
  const [confirmWarnings, setConfirmWarnings] = useState<{ key: string; message: string }[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const [online, setOnline] = useState(true);
  const [queue, setQueue] = useState<QueuedSave[]>([]);
  const [syncing, setSyncing] = useState(false);
  // One contestant at a time, or a whole group at the table (GroupEntry). Remembered on this device.
  const [mode, setModeRaw] = useState<'one' | 'group'>('one');
  useEffect(() => { try { if (localStorage.getItem('of:scoring-mode') === 'group') setModeRaw('group'); } catch { /* storage blocked */ } }, []);
  const setMode = (m: 'one' | 'group') => { setModeRaw(m); try { localStorage.setItem('of:scoring-mode', m); } catch { /* storage blocked */ } };
  const previewSeq = useRef(0);
  const syncingRef = useRef(false);

  const params = new URLSearchParams();
  if (dayId) params.set('dayId', String(dayId));
  if (dayId && stepId) params.set('stepId', String(stepId));
  if (stepId && lookup.participantId) params.set('participantId', String(lookup.participantId));
  else if (stepId && lookup.sbd) params.set('sbd', lookup.sbd);
  params.set('historyPage', String(historyPage));
  const ctx = useApi<Ctx>(`field-scoring?${params}`);
  const c = ctx.data;
  const loading = ctx.loading;

  // Refill the attempt cells whenever another contestant (or fresh scores) arrive.
  useEffect(() => {
    const next: Record<string, string> = {};
    Object.entries(c?.scores || {}).forEach(([k, v]) => (next[k] = String(v)));
    setValues(next);
    setLoaded(next);
    setStatuses({});
    setNotes({});
    setPreview(null);
    const first = c?.assessments?.[0];
    setTarget(c?.participant && first ? `${first.id}_1` : 'sbd');
  }, [c?.participant?.id, c?.scores, c?.assessments]);

  const dirty = JSON.stringify(values) !== JSON.stringify(loaded) || Object.keys(statuses).length > 0;
  const flash = (tone: 'ok' | 'error', text: string) => {
    setNotice({ tone, text });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  };

  useEffect(() => {
    if (loading) return;
    if (pending === 'reload' && !ctx.error) flash('ok', 'Đã tải lại dữ liệu mới nhất');
    setPending(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const refreshQueue = async () => { try { setQueue(await queueAll()); } catch { /* IndexedDB blocked: the queue stays empty */ } };

  const sync = async () => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    setSyncing(true);
    try {
      const r = await flushQueue();
      setOnline(!r.offline);
      if (r.sent > 0) flash('ok', `Đã gửi ${r.sent} bản ghi chờ${r.reviews ? `, ${r.reviews} lượt cần BTC xem lại` : ''}`);
      if (r.sent > 0) ctx.reload();
    } catch { /* queue unreadable */ } finally {
      syncingRef.current = false;
      setSyncing(false);
      refreshQueue();
    }
  };

  // Watch the connection and send the waiting saves whenever it comes back (and once on open).
  useEffect(() => {
    setOnline(navigator.onLine);
    refreshQueue();
    sync();
    const up = () => { setOnline(true); sync(); };
    const down = () => setOnline(false);
    window.addEventListener('online', up);
    window.addEventListener('offline', down);
    const timer = setInterval(() => { queueAll().then((q) => { setQueue(q); if (q.some((i) => !i.error)) sync(); }).catch(() => {}); }, 20000);
    return () => { window.removeEventListener('online', up); window.removeEventListener('offline', down); clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Live color: ask the server what level these numbers get (no saving), shortly after typing stops.
  const scoresForPreview = () => {
    const out: Record<string, string> = {};
    Object.entries(values).forEach(([k, v]) => { if (v && !statuses[k]) out[k] = v; });
    return out;
  };
  const fetchPreview = async (): Promise<Preview | null> => {
    if (!stepId) return null;
    const scores = scoresForPreview();
    if (Object.keys(scores).length === 0) return null;
    return api<Preview>('field-scoring/preview', { body: { stepId, scores } });
  };
  useEffect(() => {
    if (!c?.participant || !stepId) { setPreview(null); return; }
    const seq = ++previewSeq.current;
    const t = setTimeout(async () => {
      try {
        const p = await fetchPreview();
        if (seq !== previewSeq.current) return;
        setPreview(p);
        setPreviewError(false);
      } catch {
        if (seq === previewSeq.current) setPreviewError(true);
      }
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, statuses, stepId, c?.participant?.id]);

  const pickDay = (id: number) => { setDayId(id); setStepId(null); setLookup({}); setSbdInput(''); setHistoryPage(0); setTarget('sbd'); };
  const pickStep = (id: number) => { setStepId(id); setLookup({}); setSbdInput(''); setHistoryPage(0); setTarget('sbd'); };
  const find = () => {
    const sbd = sbdInput.trim();
    if (!sbd || loading) return;
    setPending('find');
    // Same SBD again: the URL does not change, so ask for a fresh copy explicitly.
    if (lookup.sbd === sbd && !lookup.participantId) ctx.reload();
    else setLookup({ sbd });
  };
  const openHistory = (participantId: number, sbd: number) => {
    if (loading) return;
    setPending(participantId);
    if (lookup.participantId === participantId) ctx.reload();
    else setLookup({ participantId });
    setSbdInput(String(sbd));
  };
  const reload = () => { if (!loading) { setPending('reload'); ctx.reload(); } };

  // Order of the attempt cells, so the keypad can move on to the next one.
  const cells = (c?.assessments || []).flatMap((a) => Array.from({ length: a.attemptsCount }, (_, i) => `${a.id}_${i + 1}`));

  function clearStatus(key: string) {
    setStatuses((s) => { const n = { ...s }; delete n[key]; return n; });
    setNotes((s) => { const n = { ...s }; delete n[key]; return n; });
  }
  function markCell(key: string, status: CellStatus, note?: string) {
    setStatuses((s) => ({ ...s, [key]: status }));
    setNotes((s) => { const n = { ...s }; if (note) n[key] = note; else delete n[key]; return n; });
    setValues((v) => ({ ...v, [key]: '' }));
    const i = cells.indexOf(key);
    if (i >= 0 && i < cells.length - 1) setTarget(cells[i + 1]);
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
    const replace = fresh && k !== '⌫';
    setFresh(false);
    if (statuses[target]) clearStatus(target);
    setValues((all) => {
      const cur = replace ? '' : all[target] ?? '';
      let next = cur;
      if (k === '⌫') next = cur.slice(0, -1);
      else if (k === 'C') next = '';
      else if (k === '.') next = cur.includes('.') ? cur : (cur || '0') + '.';
      else if (cur.length < 8) next = cur === '0' ? k : cur + k;
      return { ...all, [target]: next };
    });
  }

  /** Clears the form after a save (sent or queued) so the next contestant can be entered. */
  function resetForm() {
    setLookup({});
    setSbdInput('');
    setTarget('sbd');
  }

  async function save(confirmed = false) {
    if (!c?.participant || !stepId) return;
    setSaving(true);
    try {
      // Numbers outside the plausible range need a second look before they are saved (they still can be saved).
      if (!confirmed && navigator.onLine) {
        try {
          const p = await fetchPreview();
          if (p?.warnings.length) { setConfirmWarnings(p.warnings); return; }
        } catch { /* preview unavailable: save anyway, the server flags it for review */ }
      }
      setConfirmWarnings(null);
      const item: QueuedSave = {
        id: newClientUuid(),
        stepId,
        participantId: c.participant.id,
        label: `SBD ${c.participant.sbd} · ${c.participant.fullName}`,
        scores: values,
        statuses,
        notes,
        createdAt: Date.now(),
      };
      // Always write to the device first: a refresh or a dropped connection cannot lose the entry.
      let stored = true;
      try { await queuePut(item); } catch { stored = false; }
      try {
        const r = await sendSave(item);
        if (stored) await queueRemove(item.id).catch(() => {});
        flash('ok', r.review?.length ? `${r.message} · SBD ${c.participant.sbd}` : `Đã lưu điểm SBD ${c.participant.sbd} · ${c.participant.fullName}`);
        resetForm();
        ctx.reload();
      } catch (e) {
        if (isNetworkError(e) && stored) {
          setOnline(false);
          flash('ok', `Chưa có mạng: đã giữ bản ghi SBD ${c.participant.sbd} trên máy, sẽ tự gửi khi có mạng`);
          resetForm();
          // No network to reload from: clear the contestant here so the next one can be entered.
          ctx.setData((d) => (d ? { ...d, participant: undefined, scores: undefined } : d));
        } else {
          if (stored) await queueRemove(item.id).catch(() => {});
          flash('error', (e as Error).message);
        }
      }
    } finally {
      setSaving(false);
      refreshQueue();
    }
  }

  function onScanned(v: { competitionId: string; sbd: string }) {
    setScanning(false);
    if (c?.competition && String(c.competition.id) !== v.competitionId) {
      flash('error', 'Phiếu SBD này thuộc giải đấu khác');
      return;
    }
    setSbdInput(v.sbd);
    setPending('find');
    if (lookup.sbd === v.sbd && !lookup.participantId) ctx.reload();
    else setLookup({ sbd: v.sbd });
  }

  async function goFullscreen() {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (el.requestFullscreen) await el.requestFullscreen();
      else el.webkitRequestFullscreen?.();
    } catch {
      /* iPhone Safari has no fullscreen; "Add to Home Screen" gives the same effect */
    }
  }

  async function logout() {
    await fetch('/quan-tri/api/logout', { method: 'POST' });
    router.replace('/quan-tri/dang-nhap');
  }

  const allowDot = target !== 'sbd';

  return (
    <div className={`min-h-screen touch-manipulation select-none bg-[#F4F7F5] ${INK}`}>
      {/* Top bar */}
      <header className="sticky top-0 z-20 relative flex min-h-[64px] items-center gap-3 bg-[#0B2419] px-4 text-white lg:px-6">
        <div className="min-w-0 flex-1">
          <div className="font-[family-name:var(--font-hud)] text-[12px] font-semibold uppercase tracking-[0.16em] text-[#A6E35A]">Chấm điểm hiện trường</div>
          <div className="truncate text-[17px] font-semibold">
            {c?.stage ? `Vòng ${c.stage.stageNumber} · ${c.stage.title}` : c?.competition?.title || '11 On Field'}
          </div>
        </div>
        <span className="hidden text-right text-[14px] leading-tight sm:block">
          {me.fullName || 'Giám khảo'}
          <span className="block text-[12px] text-[#A9B8AF]">{manager ? 'Quản trị' : 'Ban giám khảo'}</span>
        </span>
        <button
          type="button"
          onClick={sync}
          aria-label="Trạng thái kết nối và hàng chờ gửi"
          className={`flex min-h-[48px] items-center gap-2 rounded-lg border-2 px-3 text-[15px] font-semibold ${online ? 'border-white/30' : 'border-[#F5C451] bg-[#F5C451]/15 text-[#F5C451]'}`}
        >
          <span aria-hidden="true" className={`h-3 w-3 rounded-full ${online ? 'bg-[#A6E35A]' : 'bg-[#F5C451]'}`} />
          {syncing ? 'Đang gửi…' : online ? 'Có mạng' : 'Mất mạng'}
          {queue.length > 0 && <span className="rounded-md bg-[#F5C451] px-2 py-0.5 text-[14px] font-bold tabular-nums text-[#06140D]">{queue.length} chờ gửi</span>}
        </button>
        <button
          type="button"
          onClick={reload}
          aria-label="Tải lại dữ liệu"
          className="flex min-h-[48px] items-center gap-2 rounded-lg border-2 border-white/30 px-3 text-[15px] font-semibold active:bg-white/10"
        >
          {pending === 'reload' ? <Spinner className="h-5 w-5" /> : <span aria-hidden="true" className="text-[18px] leading-none">⟳</span>}
          Tải lại
        </button>
        <button type="button" onClick={goFullscreen} className="min-h-[48px] rounded-lg border-2 border-white/30 px-3 text-[15px] font-semibold active:bg-white/10">Toàn màn hình</button>
        {manager ? (
          <button type="button" onClick={() => router.push('/quan-tri')} className="min-h-[48px] rounded-lg border-2 border-white/30 px-3 text-[15px] font-semibold active:bg-white/10">Về quản trị</button>
        ) : (
          <button type="button" onClick={logout} className="min-h-[48px] rounded-lg border-2 border-white/30 px-3 text-[15px] font-semibold active:bg-white/10">Đăng xuất</button>
        )}
        {loading && <span className="absolute inset-x-0 bottom-0 h-1 overflow-hidden bg-white/10" aria-hidden="true"><span className="block h-full w-1/3 animate-[ofbar_1s_ease-in-out_infinite] bg-[#A6E35A]" /></span>}
      </header>
      <style>{`@keyframes ofbar{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}@keyframes ofpop{0%{box-shadow:0 0 0 0 rgba(166,227,90,0.9)}100%{box-shadow:0 0 0 14px rgba(166,227,90,0)}}`}</style>
      {loading && c && <p className="sr-only" role="status">Đang tải</p>}

      {notice && (
        <div role="status" className={`sticky top-[64px] z-20 px-4 py-3 text-center text-[18px] font-semibold ${notice.tone === 'ok' ? 'bg-[#1F7A3A] text-white' : 'bg-[#B42318] text-white'}`}>
          {notice.text}
        </div>
      )}

      <main className="mx-auto max-w-[1400px] p-4 lg:p-6">
        {ctx.error && <p role="alert" className="mb-4 rounded-xl border-2 border-[#B42318] bg-white p-4 text-[18px] font-semibold text-[#B42318]">{ctx.error}</p>}
        {loading && !c && <p className="flex items-center gap-3 text-[18px]"><Spinner /> Đang tải…</p>}
        {c && !c.competition && <p className="rounded-xl bg-white p-6 text-[20px]">Hiện chưa có giải đấu nào đang diễn ra.</p>}
        {c?.competition && !c.stage && (
          <p className="rounded-xl bg-white p-6 text-[20px]">Giải “{c.competition.title}” chưa có vòng nào đang diễn ra. Admin cần kích hoạt vòng thi trước.</p>
        )}

        {c?.stage && (
          <>
            {/* Day and step pickers */}
            <section className="space-y-3">
              <div className="flex items-center gap-3 overflow-x-auto pb-1">
                <span className="w-24 shrink-0 text-[15px] font-bold uppercase tracking-wide">Ngày thi</span>
                {c.days?.map((d) => <button key={d.id} type="button" className={seg(dayId === d.id)} onClick={() => pickDay(d.id)}>{d.title}</button>)}
                {c.days?.length === 0 && <span className="text-[17px]">Vòng này chưa có cấu trúc chấm.</span>}
              </div>
              {dayId && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  <span className="w-24 shrink-0 text-[15px] font-bold uppercase tracking-wide">Bước thi</span>
                  {c.steps?.filter((s) => s.scoreSource !== 'HLV' || me.role !== 'TTV').map((s) => <button key={s.id} type="button" className={seg(stepId === s.id)} onClick={() => pickStep(s.id)}>{s.title}{s.scoreSource === 'HLV' && <span className="ml-1.5 rounded bg-[#FDF1DE] px-1.5 text-[12px] font-semibold text-[#8A4F07]">Điểm HLV</span>}</button>)}
                  {c.steps?.length === 0 && <span className="text-[17px]">Ngày này chưa có bước thi.</span>}
                </div>
              )}
            </section>

            {!stepId && <p className="mt-8 text-center text-[20px] font-medium">Chọn ngày thi và bước thi để bắt đầu chấm.</p>}

            {stepId && (
              <div className="mt-4 flex items-center gap-3">
                <span className="w-24 shrink-0 text-[15px] font-bold uppercase tracking-wide">Cách nhập</span>
                <button type="button" className={seg(mode === 'one')} onClick={() => setMode('one')}>Từng thí sinh</button>
                <button type="button" className={seg(mode === 'group')} onClick={() => setMode('group')}>Theo nhóm thi</button>
              </div>
            )}

            {stepId && dayId && mode === 'group' && c.assessments && (
              <GroupEntry dayId={dayId} stepId={stepId} assessments={c.assessments} competitionId={c.competition?.id} flash={flash} onQueueChange={refreshQueue} />
            )}

            {stepId && mode === 'one' && (
              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-[auto_1fr] lg:items-start">
                {/* Left: contestant + attempts */}
                <div className="space-y-5 lg:col-start-1 lg:row-start-1">
                  <section className="rounded-2xl border-2 border-[#0B2419]/15 bg-white p-4 lg:p-5">
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setTarget('sbd')}
                        aria-label="Số báo danh"
                        className={`flex min-h-[72px] min-w-[180px] flex-1 items-center rounded-xl border-[3px] px-4 text-left ${target === 'sbd' ? 'border-[#1F7A3A] bg-[#F3FBEC]' : 'border-[#0B2419]/25'}`}
                      >
                        <span className="mr-3 text-[15px] font-bold uppercase">SBD</span>
                        <span className="font-[family-name:var(--font-hud)] text-[36px] font-bold tabular-nums">{sbdInput || <span className="text-[#0B2419]/30">—</span>}</span>
                      </button>
                      <button type="button" onClick={() => setScanning(true)} className="min-h-[72px] rounded-xl border-[3px] border-[#0B2419] px-6 text-[19px] font-bold active:bg-[#E4F3D6]">Quét QR</button>
                      <button type="button" onClick={find} disabled={loading} className="flex min-h-[72px] min-w-[120px] items-center justify-center gap-2 rounded-xl bg-[#0B2419] px-8 text-[20px] font-bold text-[#D6FA9E] active:bg-[#18522F] disabled:opacity-80">
                        {pending === 'find' ? <><Spinner /> Đang tìm</> : 'Tìm'}
                      </button>
                    </div>
                    {c.sbdError && <p role="alert" className="mt-3 text-[18px] font-semibold text-[#B42318]">{c.sbdError}</p>}
                    {c.participant && (
                      <div key={c.participant.id} className="mt-4 flex animate-[ofpop_0.7s_ease-out] items-center gap-4 rounded-xl bg-[#0B2419] px-4 py-3 text-white">
                        <span className="font-[family-name:var(--font-display)] text-[44px] font-bold leading-none text-[#A6E35A]">{c.participant.sbd}</span>
                        <span className="text-[22px] font-semibold leading-tight">{c.participant.fullName}</span>
                        {dirty && <span className="ml-auto rounded-md bg-[#F5C451] px-2 py-1 text-[14px] font-bold text-[#06140D]">Chưa lưu</span>}
                      </div>
                    )}
                    {c.participant && <FlagBanner participantId={c.participant.id} />}
                  </section>

                  {c.participant &&
                    c.assessments?.map((a) => (
                      <section key={a.id} className="rounded-2xl border-2 border-[#0B2419]/15 bg-white p-4 lg:p-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h2 className="text-[22px] font-bold">{a.title}{a.unit ? <span className="font-medium"> ({a.unit})</span> : null}</h2>
                          <span className="text-[15px] font-medium">{a.attemptsCount} lượt · {METHOD[a.scoringMethod] || a.scoringMethod}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {Array.from({ length: a.attemptsCount }, (_, i) => i + 1).map((n) => {
                            const key = `${a.id}_${n}`;
                            const active = target === key;
                            return (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setTarget(key)}
                                className={`flex min-h-[84px] flex-col justify-center rounded-xl border-[3px] px-4 text-left ${active ? 'border-[#1F7A3A] bg-[#F3FBEC] shadow-[0_0_0_3px_rgba(31,122,58,0.18)]' : 'border-[#0B2419]/25 bg-white'}`}
                              >
                                <span className="text-[14px] font-bold uppercase">Lượt {n}</span>
                                {statuses[key] ? (
                                  <span className={`mt-1 inline-flex w-fit rounded-md px-2 py-1 text-[18px] font-bold ${statuses[key] === 'DNS' ? 'bg-[#0B2419] text-white' : 'bg-[#B42318] text-white'}`}>
                                    {statuses[key] === 'DNS' ? 'Không thi' : `Lỗi${notes[key] ? ` · ${notes[key]}` : ''}`}
                                  </span>
                                ) : (
                                  <span className="font-[family-name:var(--font-hud)] text-[34px] font-bold leading-tight tabular-nums">
                                    {values[key] || <span className="text-[#0B2419]/25">—</span>}
                                  </span>
                                )}
                                {preview?.warnings.some((w) => w.key === key) && !statuses[key] && (
                                  <span className="text-[13px] font-bold text-[#B42318]">Ngoài ngưỡng hợp lý</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}

                  {c.participant && (
                    <section aria-live="polite" className="rounded-2xl border-2 border-[#0B2419]/15 bg-white p-4 lg:p-5">
                      <h2 className="text-[16px] font-bold uppercase tracking-wide">Mức hiện tại</h2>
                      {preview?.level != null && preview.color && COLORS[preview.color] ? (
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                          <div className="flex min-h-[84px] min-w-[220px] items-center gap-4 rounded-2xl px-6" style={{ background: COLORS[preview.color].bg, color: COLORS[preview.color].fg }}>
                            <span className="font-[family-name:var(--font-display)] text-[56px] font-bold leading-none">{preview.level}</span>
                            <span className="text-[26px] font-bold">{COLORS[preview.color].label}</span>
                          </div>
                          <ul className="flex flex-wrap gap-2">
                            {c.assessments?.map((a) => preview.perAssessment[String(a.id)] != null && (
                              <li key={a.id} className="rounded-lg bg-[#E9EFEB] px-3 py-2 text-[16px] font-semibold">{a.title}: mức {preview.perAssessment[String(a.id)]}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <p className="mt-2 text-[17px] text-[#0B2419]/70">
                          {previewError ? 'Chưa tính được màu (mất mạng). Vẫn nhập và lưu được, bản ghi sẽ gửi khi có mạng.' : 'Nhập số đo để xem màu.'}
                        </p>
                      )}
                      {preview?.warnings.map((w) => <p key={w.key} role="alert" className="mt-2 rounded-lg bg-[#FDE4E1] px-3 py-2 text-[17px] font-semibold text-[#B42318]">⚠ {w.message}</p>)}
                    </section>
                  )}

                  {queue.length > 0 && (
                    <section className="rounded-2xl border-2 border-[#F5C451] bg-white p-4 lg:p-5">
                      <h2 className="text-[16px] font-bold uppercase tracking-wide">Chờ gửi ({queue.length})</h2>
                      <ul className="mt-2 space-y-2">
                        {queue.map((q) => (
                          <li key={q.id} className="flex items-center gap-3 rounded-xl bg-[#FFF8E1] px-3 py-2 text-[17px]">
                            <span className="min-w-0 flex-1 truncate font-semibold">{q.label}</span>
                            {q.error ? <span className="text-[15px] font-semibold text-[#B42318]">{q.error}</span> : <span className="text-[15px]">đang chờ mạng</span>}
                            {q.error && (
                              <button type="button" onClick={async () => { await queueRemove(q.id); refreshQueue(); }} className="min-h-[44px] rounded-lg border-2 border-[#B42318] px-3 text-[15px] font-bold text-[#B42318]">Bỏ</button>
                            )}
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                </div>

                {/* Right: keypad + save, stays in view on a landscape tablet */}
                <aside className="lg:sticky lg:top-[84px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
                  <div className="rounded-2xl border-2 border-[#0B2419]/15 bg-[#E9EFEB] p-3">
                    <p className="mb-2 px-1 text-[15px] font-bold">
                      Đang nhập: {target === 'sbd' ? 'Số báo danh' : (() => { const [aid, n] = target.split('_'); const a = c.assessments?.find((x) => String(x.id) === aid); return `${a?.title || ''} · lượt ${n}`; })()}
                    </p>
                    <Keypad allowDot={allowDot} onKey={onKey} />
                    {target !== 'sbd' && (
                      <div className="mt-3 space-y-2">
                        <p className="px-1 text-[14px] font-bold uppercase tracking-wide">Lượt này</p>
                        <div className="grid grid-cols-3 gap-2">
                          {FAULTS.map((f) => (
                            <button key={f} type="button" onClick={() => markCell(target, 'FAULT', f === 'Lỗi khác' ? undefined : f)} className="min-h-[56px] rounded-xl border-2 border-[#B42318] bg-white px-1 text-[16px] font-bold leading-tight text-[#B42318] active:bg-[#FDE4E1]">{f}</button>
                          ))}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => markCell(target, 'DNS')} className="min-h-[56px] rounded-xl bg-[#0B2419] text-[17px] font-bold text-white active:bg-[#18522F]">Không thi</button>
                          <button type="button" disabled={!statuses[target]} onClick={() => clearStatus(target)} className="min-h-[56px] rounded-xl border-2 border-[#0B2419]/30 bg-white text-[17px] font-semibold disabled:opacity-40">Bỏ đánh dấu</button>
                        </div>
                      </div>
                    )}
                    {target === 'sbd' ? (
                      <button type="button" onClick={find} disabled={loading} className="mt-3 flex h-[64px] w-full items-center justify-center gap-2 rounded-xl bg-[#0B2419] text-[20px] font-bold text-[#D6FA9E] active:bg-[#18522F] disabled:opacity-80">
                        {pending === 'find' ? <><Spinner /> Đang tìm…</> : 'Tìm thí sinh'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { const i = cells.indexOf(target); if (i >= 0 && i < cells.length - 1) setTarget(cells[i + 1]); }}
                        className={`mt-3 h-[56px] w-full rounded-xl border-2 border-[#0B2419]/30 bg-white text-[18px] font-semibold ${INK}`}
                      >
                        Ô tiếp theo →
                      </button>
                    )}
                  </div>
                  {c.participant && (
                    <button
                      type="button"
                      disabled={saving || loading}
                      onClick={() => save()}
                      className="fixed flex items-center justify-center gap-3 inset-x-4 bottom-4 z-20 h-[72px] rounded-2xl bg-[#1F7A3A] text-[22px] font-bold text-white shadow-[0_6px_20px_rgba(6,20,13,0.35)] active:bg-[#18602E] disabled:opacity-60 lg:static lg:mt-4 lg:w-full"
                    >
                      {saving ? <><Spinner className="h-7 w-7" /> Đang lưu…</> : `Lưu điểm SBD ${c.participant.sbd}`}
                    </button>
                  )}
                </aside>
                  {/* History */}
                  <section className="rounded-2xl border-2 border-[#0B2419]/15 bg-white p-4 lg:col-start-1 lg:p-5">
                    <h2 className="text-[18px] font-bold uppercase tracking-wide">Đã nhập ở bước này</h2>
                    {c.history?.length === 0 && <p className="mt-2 text-[17px]">Chưa có thí sinh nào.</p>}
                    <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                      {c.history?.map((h) => (
                        <li key={h.participantId}>
                          <button
                            type="button"
                            className="flex min-h-[60px] w-full items-center gap-3 rounded-xl border-2 border-[#0B2419]/15 px-3 text-left active:bg-[#E4F3D6]"
                            onClick={() => openHistory(h.participantId, h.sbd)}
                          >
                            <span className="w-12 font-[family-name:var(--font-hud)] text-[22px] font-bold tabular-nums">{h.sbd}</span>
                            <span className="min-w-0 flex-1 truncate text-[17px]">{h.fullName}</span>
                            {pending === h.participantId && <Spinner className="h-5 w-5 text-[#1F7A3A]" />}
                            <span className={`rounded-md px-2 py-1 text-[15px] font-bold tabular-nums ${h.filled >= h.total ? 'bg-[#1F7A3A] text-white' : 'bg-[#F5C451] text-[#06140D]'}`}>{h.filled}/{h.total}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                    {(c.historyTotalPages ?? 0) > 1 && (
                      <div className="mt-3 flex items-center justify-between">
                        <button type="button" disabled={historyPage <= 0} onClick={() => setHistoryPage((p) => p - 1)} className="min-h-[52px] rounded-xl border-2 border-[#0B2419]/25 px-5 text-[17px] font-semibold disabled:opacity-40">‹ Trước</button>
                        <span className="text-[16px] font-medium">Trang {historyPage + 1}/{c.historyTotalPages}</span>
                        <button type="button" disabled={historyPage >= (c.historyTotalPages ?? 1) - 1} onClick={() => setHistoryPage((p) => p + 1)} className="min-h-[52px] rounded-xl border-2 border-[#0B2419]/25 px-5 text-[17px] font-semibold disabled:opacity-40">Sau ›</button>
                      </div>
                    )}
                  </section>
              </div>
            )}
            {/* Room for the floating save button on narrow screens */}
            {c.participant && mode === 'one' && <div className="h-24 lg:hidden" />}
          </>
        )}
      </main>

      {scanning && <SbdScanner onScan={onScanned} onClose={() => setScanning(false)} />}

      {confirmWarnings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="alertdialog" aria-label="Số đo ngoài ngưỡng hợp lý">
          <div className="w-full max-w-[560px] rounded-2xl border-4 border-[#B42318] bg-white p-6">
            <h2 className="text-[26px] font-bold text-[#B42318]">Số đo bất thường</h2>
            <ul className="mt-3 space-y-2">
              {confirmWarnings.map((w) => <li key={w.key} className="rounded-lg bg-[#FDE4E1] px-3 py-2 text-[19px] font-semibold text-[#B42318]">{w.message}</li>)}
            </ul>
            <p className="mt-3 text-[18px]">Kiểm tra lại số vừa nhập. Nếu đúng, vẫn lưu được; lượt này sẽ vào hàng “cần xem” để BTC đối soát.</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setConfirmWarnings(null)} className="min-h-[68px] rounded-xl border-2 border-[#0B2419]/30 text-[20px] font-bold">Sửa lại</button>
              <button type="button" onClick={() => save(true)} className="min-h-[68px] rounded-xl bg-[#B42318] text-[20px] font-bold text-white">Đúng, vẫn lưu</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
