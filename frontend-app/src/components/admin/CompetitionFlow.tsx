'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useApi } from '@/lib/admin/client';
import { useIsManager } from './me';
import { PHASES, STEPS, roundOfPath, stepHref, stepOfPath, type FlowStep } from '@/lib/admin/competition-flow';
import { STAGE_STATUS } from '@/lib/admin/labels';

export type StepState = 'done' | 'warn' | 'todo';
export interface StepStatus { state?: StepState; meta?: string; warn?: string }
interface StageRow { id: number; stageNumber: number; title: string; status: string }

interface Flow {
  id: string;
  round: number | null;
  stages: StageRow[];
  status: Record<string, StepStatus>;
  /** Call after saving something, so the marks in the bar catch up. */
  reloadFlow: () => void;
}
const FlowContext = createContext<Flow | null>(null);
/** The bar's state, for screens that save data and want the ✓ / ! marks refreshed. */
export const useFlow = () => useContext(FlowContext);

const ROUND_KEY = (id: string) => `admin:round:${id}`;

/**
 * Header of every competition screen: competition name, round picker and the bar of steps in three phases.
 * The chosen step's screen renders right below it (the route's own page).
 */
export function CompetitionFlowLayout({ id, children }: { id: string; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const manager = useIsManager();
  const list = useApi<{ id: number; title: string }[]>('competitions');
  const stagesApi = useApi<{ liveStageNumber: number | null; nextUpcomingStageNumber: number | null; stages: StageRow[] }>(`competitions/${id}/stages`);
  const stages = useMemo(() => stagesApi.data?.stages ?? [], [stagesApi.data]);
  const [picked, setPicked] = useState<number | null>(null);
  const inPath = roundOfPath(pathname);

  // Round shown in the bar: the one in the address, else the last picked here, else the live / next one, else the first.
  useEffect(() => {
    if (inPath !== null) {
      setPicked(inPath);
      try { localStorage.setItem(ROUND_KEY(id), String(inPath)); } catch { /* storage blocked */ }
      return;
    }
    if (picked !== null || !stagesApi.data) return;
    let saved: number | null = null;
    try { saved = Number(localStorage.getItem(ROUND_KEY(id))) || null; } catch { /* storage blocked */ }
    const has = (n: number | null) => n !== null && stages.some((s) => s.stageNumber === n);
    setPicked([saved, stagesApi.data.liveStageNumber, stagesApi.data.nextUpcomingStageNumber, stages[0]?.stageNumber ?? null].find(has) ?? null);
  }, [inPath, id, picked, stagesApi.data, stages]);

  const round = inPath ?? picked;
  const statusApi = useApi<{ steps: Record<string, StepStatus> }>(round ? `competitions/${id}/flow?stage=${round}` : `competitions/${id}/flow`);
  const reloadStatus = statusApi.reload;
  // Marks follow the data: refresh them whenever the admin moves to another screen.
  useEffect(() => { reloadStatus(); }, [pathname, reloadStatus]);

  const current = stepOfPath(pathname, id);
  const comp = list.data?.find((c) => String(c.id) === id);

  function pickRound(n: number) {
    setPicked(n);
    try { localStorage.setItem(ROUND_KEY(id), String(n)); } catch { /* storage blocked */ }
    if (current?.perRound) router.push(stepHref(current, id, n));
  }

  const flow: Flow = {
    id,
    round,
    stages,
    status: statusApi.data?.steps ?? {},
    reloadFlow: () => { statusApi.reload(); stagesApi.reload(); },
  };
  const visible = (s: FlowStep) => manager || !s.managerOnly;

  return (
    <FlowContext.Provider value={flow}>
      <div className="print:hidden">
        <Link href="/quan-tri/giai-dau" className="text-[13px] text-[#66766D] hover:text-[#1F7A3A]">← Danh sách giải đấu</Link>
        <div className="mb-3 mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#0F2A1C]">{comp?.title || 'Giải đấu'}</h1>
          {stages.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Chọn vòng">
              <span className="mr-1 text-[12px] text-[#66766D]">Đang xem</span>
              {stages.length > 4 ? (
                <select
                  aria-label="Vòng đang xem"
                  value={round ?? ''}
                  onChange={(e) => pickRound(Number(e.target.value))}
                  className="rounded-full border border-[#1F7A3A] bg-white px-3 py-1 text-[13px] text-[#10231A]"
                >
                  {stages.map((s) => (
                    <option key={s.id} value={s.stageNumber}>
                      Vòng {s.stageNumber} · {s.title} · {STAGE_STATUS[s.status]?.label.toLowerCase() || s.status}
                    </option>
                  ))}
                </select>
              ) : stages.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={round === s.stageNumber}
                  onClick={() => pickRound(s.stageNumber)}
                  className={`rounded-full border px-3 py-1 text-[13px] ${round === s.stageNumber ? 'border-[#1F7A3A] bg-[#1F7A3A] text-white' : 'border-[#DCE5DF] bg-white text-[#10231A] hover:border-[#1F7A3A]'}`}
                >
                  Vòng {s.stageNumber}
                  <span className={round === s.stageNumber ? 'text-white/80' : 'text-[#66766D]'}> · {STAGE_STATUS[s.status]?.label.toLowerCase() || s.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <nav aria-label="Các bước của giải" className="sticky top-14 z-20 -mx-1 border-b border-[#DCE5DF] bg-[#F3F5F2] px-1 pb-3 pt-2 max-md:static">
          <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,0.6fr)]">
            {PHASES.map((p) => {
              const steps = STEPS.filter((s) => s.phase === p.key && visible(s));
              if (!steps.length) return null;
              const here = steps.some((s) => s.id === current?.id);
              const done = steps.filter((s) => flow.status[s.id]?.state === 'done').length;
              return (
                <div key={p.key} className={`rounded-lg border bg-white px-2 pb-1.5 pt-2 ${here ? 'border-[#1F7A3A]' : 'border-[#DCE5DF]'}`}>
                  <div className="flex items-baseline justify-between gap-2 px-1.5 pb-1">
                    <span className="text-[12px] font-semibold uppercase tracking-wider text-[#14482E]">
                      {p.key !== 'content' && <span className="mr-1 text-[#66766D]">{PHASES.indexOf(p) + 1} ·</span>}
                      {p.title}
                    </span>
                    {p.when && <span className="text-[11.5px] text-[#66766D]">{done}/{steps.length} xong</span>}
                  </div>
                  <ul>
                    {steps.map((s) => {
                      const st = flow.status[s.id] || {};
                      const on = s.id === current?.id;
                      const disabled = s.perRound && round === null;
                      return (
                        <li key={s.id}>
                          <Link
                            href={disabled ? stepHref(STEPS[2], id, null) : stepHref(s, id, round)}
                            aria-current={on ? 'page' : undefined}
                            title={st.warn || undefined}
                            className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-[13px] ${on ? 'bg-[#E4F1E8] font-semibold text-[#14482E]' : 'text-[#10231A] hover:bg-[#F3F5F2]'}`}
                          >
                            <Mark state={p.key === 'content' ? undefined : st.state} />
                            <span className="min-w-0 flex-1 truncate">{s.label}</span>
                            {s.perRound && round !== null && <span className="rounded border border-[#DCE5DF] px-1 text-[10px] font-semibold text-[#66766D]">V{round}</span>}
                            {st.meta && <span className={`whitespace-nowrap text-[11.5px] font-normal ${st.state === 'warn' ? 'text-[#B4690E]' : 'text-[#66766D]'}`}>{st.meta}</span>}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </nav>
      </div>

      <div className="pt-5">
        {current && <StepHeading step={current} round={round} status={flow.status[current.id]} />}
        {children}
      </div>
    </FlowContext.Provider>
  );
}

function Mark({ state }: { state?: StepState }) {
  if (state === 'done') return <span aria-label="Đã xong" className="grid h-[18px] w-[18px] flex-none place-items-center rounded-full bg-[#1F7A3A] text-[11px] font-bold text-white">✓</span>;
  if (state === 'warn') return <span aria-label="Cần chú ý" className="grid h-[18px] w-[18px] flex-none place-items-center rounded-full bg-[#B4690E] text-[11px] font-bold text-white">!</span>;
  return <span aria-label="Chưa làm" className="h-[18px] w-[18px] flex-none rounded-full border-[1.5px] border-[#9AA8A0]" />;
}

/** Phase and round above the screen, plus the reason a step needs attention. */
function StepHeading({ step, round, status }: { step: FlowStep; round: number | null; status?: StepStatus }) {
  const phase = PHASES.find((p) => p.key === step.phase)!;
  return (
    <div className="print:hidden">
      <div className="text-[12px] text-[#66766D]">{phase.title}{step.perRound && round !== null ? ` · Vòng ${round}` : ''}</div>
      {status?.state === 'warn' && status.warn && (
        <div className="mb-3 mt-2 rounded-md bg-[#FDF1DE] px-3 py-2 text-[13px] text-[#8A4F07]">! {status.warn}</div>
      )}
    </div>
  );
}
