'use client';

import { useEffect, useState } from 'react';
import { useApi } from '@/lib/admin/client';
import ManualScores from '@/components/admin/ManualScores';
import { Field, Loading, PageTitle, Select } from '@/components/admin/ui';

interface Ctx { competition?: { id: number; title: string }; stages?: { id: number; stageNumber: number; title: string; status: string }[]; stage?: { id: number } }

/** Manual scores for the scouting panel, who have no access to the competition admin. */
export default function PanelManualScoresPage() {
  const ctx = useApi<Ctx>('scouting/context');
  const [stageId, setStageId] = useState<number | null>(null);
  const stages = ctx.data?.stages || [];
  useEffect(() => {
    if (stageId || !ctx.data) return;
    const done = [...stages].reverse().find((s) => s.status === 'COMPLETED');
    setStageId(ctx.data.stage?.id || done?.id || stages[0]?.id || null);
  }, [ctx.data, stageId, stages]);

  return (
    <>
      <PageTitle title="Điểm chấm tay" />
      <Loading error={ctx.error} loading={ctx.loading} />
      {ctx.data && !ctx.data.competition && <p className="text-[#66766D]">Chưa có giải đấu đang diễn ra.</p>}
      {stages.length > 0 && (
        <div className="mb-4 max-w-sm">
          <Field label="Vòng thi">
            <Select value={stageId ?? ''} onChange={(e) => setStageId(Number(e.target.value))}>
              {stages.map((s) => <option key={s.id} value={s.id}>Vòng {s.stageNumber} · {s.title}</option>)}
            </Select>
          </Field>
        </div>
      )}
      {stageId && <ManualScores key={stageId} stageId={stageId} />}
    </>
  );
}
