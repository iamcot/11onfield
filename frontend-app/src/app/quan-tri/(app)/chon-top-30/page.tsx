'use client';

import { useApi } from '@/lib/admin/client';
import Top30Selection from '@/components/admin/Top30Selection';
import { Loading, PageTitle } from '@/components/admin/ui';

/** Judges (BGK) have no access to the competition admin, so they get the same selection screen from the menu. */
export default function JudgeSelectionPage() {
  const ctx = useApi<{ competition?: { id: number; title: string } }>('scouting/context');
  const comp = ctx.data?.competition;
  return (
    <>
      <PageTitle title={comp ? `Chọn Top 30 · ${comp.title}` : 'Chọn Top 30'} />
      <Loading error={ctx.error} loading={ctx.loading} />
      {ctx.data && !comp && <p className="text-[#66766D]">Chưa có giải đấu đang diễn ra.</p>}
      {comp && <Top30Selection id={String(comp.id)} />}
    </>
  );
}
