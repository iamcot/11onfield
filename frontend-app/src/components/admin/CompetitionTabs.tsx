'use client';

import { useParams, usePathname } from 'next/navigation';
import { stepOfPath } from '@/lib/admin/competition-flow';

/**
 * Title row of one competition screen, under the bar of steps (see CompetitionFlow). The competition name and the
 * navigation live in the layout; this only names the screen and holds its actions.
 */
export default function CompetitionTabs({ title, children }: { id?: string; title?: string; children?: React.ReactNode }) {
  const pathname = usePathname();
  const { id } = useParams<{ id: string }>();
  const step = stepOfPath(pathname, id);
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-[22px] font-semibold tracking-tight text-[#0F2A1C]">{title || step?.label || ''}</h2>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}
