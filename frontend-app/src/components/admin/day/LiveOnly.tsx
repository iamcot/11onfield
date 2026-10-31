'use client';

import type { ReactNode } from 'react';
import { useFlow } from '@/components/admin/CompetitionFlow';
import { STAGE_STATUS } from '@/lib/admin/labels';

/**
 * The exam-day boards work on the round that is live now. Inside a competition they show for the picked round only
 * while it is the live one; otherwise the admin is told why the board is empty.
 */
export default function LiveOnly({ n, what, children }: { n: string; what: string; children: ReactNode }) {
  const flow = useFlow();
  const stage = flow?.stages.find((s) => String(s.stageNumber) === n);
  if (!flow || !stage) return null;
  if (stage.status === 'LIVE') return <>{children}</>;
  return (
    <div className="rounded-lg border border-[#DCE5DF] bg-white p-5 text-[14px] text-[#46564D]">
      Vòng {n} đang ở trạng thái <b>{STAGE_STATUS[stage.status]?.label.toLowerCase() || stage.status}</b>. {what} chỉ dùng được khi vòng đang diễn ra:
      kích hoạt vòng ở bước Chuẩn bị, rồi quay lại đây.
    </div>
  );
}
