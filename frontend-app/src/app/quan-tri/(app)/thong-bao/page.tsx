'use client';

import { api, useApi } from '@/lib/admin/client';
import { Check, LinkButton, Loading, PageTitle, Table, Td, useUi } from '@/components/admin/ui';

interface Scenario { id: number; scenarioKey: string; name: string; description: string | null; emailEnabled: boolean; inappEnabled: boolean; znsEnabled: boolean }
type Flag = 'emailEnabled' | 'inappEnabled' | 'znsEnabled';

export default function NotificationsPage() {
  const { toast } = useUi();
  const list = useApi<Scenario[]>('notifications/scenarios');

  async function toggle(s: Scenario, flag: Flag, value: boolean) {
    list.setData((d) => d && d.map((x) => (x.id === s.id ? { ...x, [flag]: value } : x)));
    try {
      await api(`notifications/scenarios/${s.id}`, { method: 'PUT', body: { [flag]: value } });
      toast('Đã cập nhật');
    } catch (e) {
      toast((e as Error).message, 'error');
      list.reload();
    }
  }

  return (
    <>
      <PageTitle title="Thông báo" />
      <p className="mb-3 text-[13px] text-[#46564D]">Bật hoặc tắt từng kênh cho mỗi tình huống, và chỉnh nội dung mẫu.</p>
      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <Table head={['Tình huống', 'Email', 'Trong ứng dụng', 'Zalo ZNS', '']} empty="Chưa có kịch bản nào.">
          {list.data.map((s) => (
            <tr key={s.id}>
              <Td>
                <div className="font-medium">{s.name}</div>
                {s.description && <div className="text-[12px] text-[#66766D]">{s.description}</div>}
              </Td>
              <Td><Check label="" checked={s.emailEnabled} onChange={(v) => toggle(s, 'emailEnabled', v)} /></Td>
              <Td><Check label="" checked={s.inappEnabled} onChange={(v) => toggle(s, 'inappEnabled', v)} /></Td>
              <Td><Check label="" checked={s.znsEnabled} onChange={(v) => toggle(s, 'znsEnabled', v)} /></Td>
              <Td className="text-right"><LinkButton small href={`/quan-tri/thong-bao/${s.id}`}>Nội dung mẫu</LinkButton></Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
