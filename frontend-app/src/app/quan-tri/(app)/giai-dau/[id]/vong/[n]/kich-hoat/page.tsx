'use client';

import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useFlow } from '@/components/admin/CompetitionFlow';
import { Badge, Button, Card, useUi } from '@/components/admin/ui';
import { STEPS, stepHref } from '@/lib/admin/competition-flow';
import { STAGE_STATUS } from '@/lib/admin/labels';
import Link from 'next/link';

/** Open or stop a round, with what is still missing from the preparation listed first. */
export default function ActivateRoundPage() {
  const { id, n } = useParams<{ id: string; n: string }>();
  const flow = useFlow();
  const { toast, confirm } = useUi();
  const data = useApi<{ liveStageNumber: number | null; nextUpcomingStageNumber: number | null; stages: { stageNumber: number; title: string; status: string }[] }>(`competitions/${id}/stages`);
  const stage = data.data?.stages.find((s) => String(s.stageNumber) === n);
  const live = data.data?.liveStageNumber ?? null;
  const next = data.data?.nextUpcomingStageNumber ?? null;
  const num = Number(n);
  const prep = STEPS.filter((s) => s.phase === 'prep' && s.id !== 'kich-hoat');
  const missing = prep.filter((s) => flow?.status[s.id]?.state !== 'done');

  async function act(action: 'activate' | 'deactivate', text: string) {
    if (!(await confirm(text))) return;
    try {
      const r = await api<{ message: string }>(`competitions/${id}/stages/${n}/${action}`, { method: 'POST' });
      toast(r?.message || 'Đã cập nhật');
      data.reload();
      flow?.reloadFlow();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  const st = stage ? STAGE_STATUS[stage.status] : null;
  return (
    <>
      <CompetitionTabs />
      {stage && (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Card title="Trạng thái vòng">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[16px] font-semibold">Vòng {n} · {stage.title}</span>
              <Badge tone={st?.tone || 'gray'}>{st?.label || stage.status}</Badge>
            </div>
            <p className="mt-2 text-[14px] text-[#46564D]">
              Khi kích hoạt, tablet của hội đồng nhận vòng này: mở được check-in, chấm điểm tại trạm và ghi nhận. Vòng đang diễn ra trước đó (nếu có) chuyển thành “Đã xong”.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {stage.status === 'UPCOMING' && num === next && (
                <Button variant="primary" onClick={() => act('activate', `Kích hoạt vòng ${n}?${missing.length ? ` Còn ${missing.length} bước chuẩn bị chưa xong.` : ''}`)}>Kích hoạt vòng {n}</Button>
              )}
              {stage.status === 'UPCOMING' && num !== next && (
                <p className="text-[13px] text-[#66766D]">Các vòng kích hoạt lần lượt. Vòng kế tiếp được kích hoạt là vòng {next ?? '—'}.</p>
              )}
              {stage.status === 'LIVE' && <Button variant="danger" onClick={() => act('deactivate', `Đặt vòng ${n} về “Sắp diễn ra”?`)}>Dừng vòng {n}</Button>}
              {stage.status === 'COMPLETED' && live !== null && num === live - 1 && (
                <Button onClick={() => act('activate', `Mở lại vòng ${n}? Vòng ${live} sẽ trở về “Sắp diễn ra”.`)}>Mở lại vòng {n}</Button>
              )}
            </div>
          </Card>
          <Card title="Chuẩn bị đã xong chưa">
            <ul className="space-y-1.5 text-[14px]">
              {prep.map((s) => {
                const ok = flow?.status[s.id]?.state === 'done';
                return (
                  <li key={s.id} className="flex items-center gap-2">
                    <span className={ok ? 'text-[#1F7A3A]' : 'text-[#B4690E]'}>{ok ? '✓' : '!'}</span>
                    <Link href={stepHref(s, id, n)} className="hover:underline">{s.label}</Link>
                    {!ok && <span className="text-[12px] text-[#66766D]">{flow?.status[s.id]?.warn || flow?.status[s.id]?.meta || 'chưa xong'}</span>}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
