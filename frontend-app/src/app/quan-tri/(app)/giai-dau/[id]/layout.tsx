'use client';

import { useParams } from 'next/navigation';
import { CompetitionFlowLayout } from '@/components/admin/CompetitionFlow';

/** Every screen of one competition sits under the bar of steps (Chuẩn bị / Ngày thi / Sau khi thi). */
export default function CompetitionLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams<{ id: string }>();
  return <CompetitionFlowLayout id={id}>{children}</CompetitionFlowLayout>;
}
