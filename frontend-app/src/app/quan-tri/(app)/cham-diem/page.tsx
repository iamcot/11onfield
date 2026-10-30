'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import { useMe, useIsManager } from '@/components/admin/me';

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

function Keypad({ onKey, allowDot }: { onKey: (k: string) => void; allowDot: boolean }) {
  const keys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', allowDot ? '.' : '', '0', '⌫'];
  return (
    <div className="grid grid-cols-3 gap-2">
      {keys.map((k, i) =>
        k ? (
          <button
            key={i}
            type="button"
            onClick={() => onKey(k)}
            className={`h-[68px] rounded-xl border-2 border-[#0B2419]/20 bg-white font-[family-name:var(--font-hud)] text-[30px] font-bold ${INK} shadow-[0_2px_0_rgba(11,36,25,0.18)] active:translate-y-[1px] active:bg-[#E4F3D6] active:shadow-none`}
            aria-label={k === '⌫' ? 'Xoá một ký tự' : k}
          >
            {k}
          </button>
        ) : (
          <span key={i} />
        ),
      )}
      <button type="button" onClick={() => onKey('C')} className={`col-span-3 h-[52px] rounded-xl border-2 border-[#0B2419]/20 bg-white text-[17px] font-semibold ${INK} active:bg-[#FDE4E1]`}>
        Xoá ô đang chọn
      </button>
    </div>
  );
}

export default function FieldScoringPage() {
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
  const [notice, setNotice] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout>>();

  const params = new URLSearchParams();
  if (dayId) params.set('dayId', String(dayId));
  if (dayId && stepId) params.set('stepId', String(stepId));
  if (stepId && lookup.participantId) params.set('participantId', String(lookup.participantId));
  else if (stepId && lookup.sbd) params.set('sbd', lookup.sbd);
  params.set('historyPage', String(historyPage));
  const ctx = useApi<Ctx>(`field-scoring?${params}`);
  const c = ctx.data;

  // Refill the attempt cells whenever another contestant (or fresh scores) arrive.
  useEffect(() => {
    const next: Record<string, string> = {};
    Object.entries(c?.scores || {}).forEach(([k, v]) => (next[k] = String(v)));
    setValues(next);
    setLoaded(next);
    const first = c?.assessments?.[0];
    setTarget(c?.participant && first ? `${first.id}_1` : 'sbd');
  }, [c?.participant?.id, c?.scores, c?.assessments]);

  const dirty = JSON.stringify(values) !== JSON.stringify(loaded);
  const flash = (tone: 'ok' | 'error', text: string) => {
    setNotice({ tone, text });
    clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 3500);
  };

  const pickDay = (id: number) => { setDayId(id); setStepId(null); setLookup({}); setSbdInput(''); setHistoryPage(0); setTarget('sbd'); };
  const pickStep = (id: number) => { setStepId(id); setLookup({}); setSbdInput(''); setHistoryPage(0); setTarget('sbd'); };
  const find = () => { if (sbdInput.trim()) setLookup({ sbd: sbdInput.trim() }); };

  // Order of the attempt cells, so the keypad can move on to the next one.
  const cells = (c?.assessments || []).flatMap((a) => Array.from({ length: a.attemptsCount }, (_, i) => `${a.id}_${i + 1}`));

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

  async function save() {
    if (!c?.participant || !stepId) return;
    setSaving(true);
    try {
      await api('field-scoring/save', { body: { stepId, participantId: c.participant.id, scores: values } });
      flash('ok', `Đã lưu điểm SBD ${c.participant.sbd} · ${c.participant.fullName}`);
      setLookup({});
      setSbdInput('');
      setTarget('sbd');
      ctx.reload();
    } catch (e) {
      flash('error', (e as Error).message);
    } finally {
      setSaving(false);
    }
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
      <header className="sticky top-0 z-20 flex min-h-[64px] items-center gap-3 bg-[#0B2419] px-4 text-white lg:px-6">
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
        <button type="button" onClick={goFullscreen} className="min-h-[48px] rounded-lg border-2 border-white/30 px-3 text-[15px] font-semibold active:bg-white/10">Toàn màn hình</button>
        {manager ? (
          <button type="button" onClick={() => router.push('/quan-tri')} className="min-h-[48px] rounded-lg border-2 border-white/30 px-3 text-[15px] font-semibold active:bg-white/10">Về quản trị</button>
        ) : (
          <button type="button" onClick={logout} className="min-h-[48px] rounded-lg border-2 border-white/30 px-3 text-[15px] font-semibold active:bg-white/10">Đăng xuất</button>
        )}
      </header>

      {notice && (
        <div role="status" className={`sticky top-[64px] z-20 px-4 py-3 text-center text-[18px] font-semibold ${notice.tone === 'ok' ? 'bg-[#1F7A3A] text-white' : 'bg-[#B42318] text-white'}`}>
          {notice.text}
        </div>
      )}

      <main className="mx-auto max-w-[1400px] p-4 lg:p-6">
        {ctx.error && <p role="alert" className="mb-4 rounded-xl border-2 border-[#B42318] bg-white p-4 text-[18px] font-semibold text-[#B42318]">{ctx.error}</p>}
        {ctx.loading && !c && <p className="text-[18px]">Đang tải…</p>}
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
                  {c.steps?.map((s) => <button key={s.id} type="button" className={seg(stepId === s.id)} onClick={() => pickStep(s.id)}>{s.title}</button>)}
                  {c.steps?.length === 0 && <span className="text-[17px]">Ngày này chưa có bước thi.</span>}
                </div>
              )}
            </section>

            {!stepId && <p className="mt-8 text-center text-[20px] font-medium">Chọn ngày thi và bước thi để bắt đầu chấm.</p>}

            {stepId && (
              <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
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
                      <button type="button" onClick={find} className="min-h-[72px] rounded-xl bg-[#0B2419] px-8 text-[20px] font-bold text-[#D6FA9E] active:bg-[#18522F]">Tìm</button>
                    </div>
                    {c.sbdError && <p role="alert" className="mt-3 text-[18px] font-semibold text-[#B42318]">{c.sbdError}</p>}
                    {c.participant && (
                      <div className="mt-4 flex items-center gap-4 rounded-xl bg-[#0B2419] px-4 py-3 text-white">
                        <span className="font-[family-name:var(--font-display)] text-[44px] font-bold leading-none text-[#A6E35A]">{c.participant.sbd}</span>
                        <span className="text-[22px] font-semibold leading-tight">{c.participant.fullName}</span>
                        {dirty && <span className="ml-auto rounded-md bg-[#F5C451] px-2 py-1 text-[14px] font-bold text-[#06140D]">Chưa lưu</span>}
                      </div>
                    )}
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
                                <span className="font-[family-name:var(--font-hud)] text-[34px] font-bold leading-tight tabular-nums">
                                  {values[key] || <span className="text-[#0B2419]/25">—</span>}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </section>
                    ))}

                </div>

                {/* Right: keypad + save, stays in view on a landscape tablet */}
                <aside className="lg:sticky lg:top-[84px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
                  <div className="rounded-2xl border-2 border-[#0B2419]/15 bg-[#E9EFEB] p-3">
                    <p className="mb-2 px-1 text-[15px] font-bold">
                      Đang nhập: {target === 'sbd' ? 'Số báo danh' : (() => { const [aid, n] = target.split('_'); const a = c.assessments?.find((x) => String(x.id) === aid); return `${a?.title || ''} · lượt ${n}`; })()}
                    </p>
                    <Keypad allowDot={allowDot} onKey={onKey} />
                    {target === 'sbd' ? (
                      <button type="button" onClick={find} className="mt-3 h-[64px] w-full rounded-xl bg-[#0B2419] text-[20px] font-bold text-[#D6FA9E] active:bg-[#18522F]">Tìm thí sinh</button>
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
                      disabled={saving}
                      onClick={save}
                      className="fixed inset-x-4 bottom-4 z-20 h-[72px] rounded-2xl bg-[#1F7A3A] text-[22px] font-bold text-white shadow-[0_6px_20px_rgba(6,20,13,0.35)] active:bg-[#18602E] disabled:opacity-60 lg:static lg:mt-4 lg:w-full"
                    >
                      {saving ? 'Đang lưu…' : `Lưu điểm SBD ${c.participant.sbd}`}
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
                            onClick={() => { setLookup({ participantId: h.participantId }); setSbdInput(String(h.sbd)); }}
                          >
                            <span className="w-12 font-[family-name:var(--font-hud)] text-[22px] font-bold tabular-nums">{h.sbd}</span>
                            <span className="min-w-0 flex-1 truncate text-[17px]">{h.fullName}</span>
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
            {c.participant && <div className="h-24 lg:hidden" />}
          </>
        )}
      </main>
    </div>
  );
}
