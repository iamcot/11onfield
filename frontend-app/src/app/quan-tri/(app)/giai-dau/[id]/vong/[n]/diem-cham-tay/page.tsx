'use client';

import { useParams } from 'next/navigation';
import { useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import ManualScores from '@/components/admin/ManualScores';
import { Loading } from '@/components/admin/ui';

export default function ManualScoresPage() {
  const { id, n } = useParams<{ id: string; n: string }>();
  const stages = useApi<{ stages: { id: number; stageNumber: number }[] }>(`competitions/${id}/stages`);
  const stage = stages.data?.stages.find((s) => String(s.stageNumber) === n);
  return (
    <>
      <CompetitionTabs />
      <Loading error={stages.error} loading={stages.loading && !stages.data} />
      {stages.data && !stage && <p className="text-[#66766D]">Không tìm thấy vòng {n}.</p>}
      {stage && <ManualScores stageId={stage.id} />}
    </>
  );
}
