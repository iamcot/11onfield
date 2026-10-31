'use client';

import { useParams } from 'next/navigation';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import FieldScoring from '@/components/admin/day/FieldScoring';
import LiveOnly from '@/components/admin/day/LiveOnly';

export default function RoundFieldScoringPage() {
  const { n } = useParams<{ n: string }>();
  return (
    <>
      <CompetitionTabs />
      <LiveOnly n={n} what="Chấm điểm tại trạm"><FieldScoring /></LiveOnly>
    </>
  );
}
