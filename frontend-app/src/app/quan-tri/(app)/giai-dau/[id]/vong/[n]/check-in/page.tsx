'use client';

import { useParams } from 'next/navigation';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useFlow } from '@/components/admin/CompetitionFlow';
import CheckinBoard from '@/components/admin/day/CheckinBoard';

export default function RoundCheckinPage() {
  const { n } = useParams<{ n: string }>();
  const stage = useFlow()?.stages.find((s) => String(s.stageNumber) === n);
  return (
    <>
      <CompetitionTabs />
      {stage && <CheckinBoard fixedStageId={stage.id} />}
    </>
  );
}
