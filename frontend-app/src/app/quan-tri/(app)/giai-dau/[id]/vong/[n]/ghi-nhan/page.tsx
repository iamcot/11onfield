'use client';

import { useParams } from 'next/navigation';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import JudgeNotes from '@/components/admin/day/JudgeNotes';
import LiveOnly from '@/components/admin/day/LiveOnly';

export default function RoundJudgeNotesPage() {
  const { n } = useParams<{ n: string }>();
  return (
    <>
      <CompetitionTabs />
      <LiveOnly n={n} what="Ghi nhận thí sinh"><JudgeNotes /></LiveOnly>
    </>
  );
}
