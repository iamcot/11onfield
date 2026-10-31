'use client';

import { useApi } from '@/lib/admin/client';
import { FLAG_KINDS } from '@/lib/admin/labels';

interface Detail { blocked: boolean; flags: { id: number; kind: string; reason: string | null; active: boolean }[] }

/** Warning under the contestant card on the scoring tablet: medical stop, Low Performance, discipline. */
export default function FlagBanner({ participantId }: { participantId: number }) {
  const d = useApi<Detail>(`scouting/participants/${participantId}`);
  const active = (d.data?.flags || []).filter((f) => f.active);
  if (active.length === 0) return null;
  return (
    <div role="alert" className="mt-3 space-y-2">
      {d.data?.blocked && (
        <p className="rounded-xl bg-[#B42318] px-4 py-3 text-[18px] font-bold text-white">Bác sĩ đã loại thí sinh này. Không ghi điểm ở trạm này.</p>
      )}
      {active.filter((f) => f.kind !== 'MEDICAL_OUT').map((f) => (
        <p key={f.id} className="rounded-xl border-2 border-[#B7791F] bg-[#FBEFD5] px-4 py-2 text-[16px] font-semibold text-[#6B4500]">
          {FLAG_KINDS[f.kind]?.label || f.kind}{f.reason ? `: ${f.reason}` : ''}
        </p>
      ))}
    </div>
  );
}
