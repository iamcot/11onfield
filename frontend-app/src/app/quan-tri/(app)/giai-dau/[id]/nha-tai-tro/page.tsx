'use client';

import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { Badge, Button, LinkButton, Loading, Table, Td, useUi } from '@/components/admin/ui';

interface Sponsor {
  id: number;
  name: string;
  logoUrl: string | null;
  websiteUrl: string | null;
  adPosition: string | null;
  displayOrder: number;
  isActive: boolean;
}

export default function SponsorsPage() {
  const { id } = useParams<{ id: string }>();
  const { toast, confirm } = useUi();
  const list = useApi<Sponsor[]>(`competitions/${id}/sponsors`);

  async function toggle(s: Sponsor) {
    try {
      await api(`sponsors/${s.id}/toggle`, { method: 'POST' });
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }
  async function remove(s: Sponsor) {
    if (!(await confirm(`Xoá nhà tài trợ "${s.name}"? Logo và banner cũng bị xoá.`))) return;
    try {
      await api(`sponsors/${s.id}`, { method: 'DELETE' });
      toast('Đã xoá nhà tài trợ');
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <>
      <CompetitionTabs id={id}>
        <LinkButton href={`/quan-tri/giai-dau/${id}/nha-tai-tro/moi`} variant="primary">+ Thêm nhà tài trợ</LinkButton>
      </CompetitionTabs>
      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <Table head={['Nhà tài trợ', 'Vị trí quảng cáo', 'Thứ tự', 'Trạng thái', '']} empty="Chưa có nhà tài trợ nào.">
          {list.data.map((s) => (
            <tr key={s.id}>
              <Td>
                <div className="flex items-center gap-3">
                  {s.logoUrl ? <img src={s.logoUrl} alt="" className="h-10 w-16 shrink-0 bg-white/90 object-contain p-1" /> : <div className="h-10 w-16 shrink-0 bg-white/5" />}
                  <div>
                    <div className="font-medium">{s.name}</div>
                    {s.websiteUrl && <a href={s.websiteUrl} target="_blank" rel="noreferrer" className="text-[12px] text-[#8FA597] hover:text-[#A6E35A]">{s.websiteUrl}</a>}
                  </div>
                </div>
              </Td>
              <Td className="text-[#C4D0C8]">{s.adPosition || '—'}</Td>
              <Td className="tabular-nums">{s.displayOrder}</Td>
              <Td><Badge tone={s.isActive ? 'green' : 'gray'}>{s.isActive ? 'Đang hiện' : 'Đã ẩn'}</Badge></Td>
              <Td className="whitespace-nowrap text-right">
                <LinkButton small href={`/quan-tri/giai-dau/${id}/nha-tai-tro/${s.id}`}>Sửa</LinkButton>{' '}
                <Button small onClick={() => toggle(s)}>{s.isActive ? 'Ẩn' : 'Hiện'}</Button>{' '}
                <Button small variant="danger" onClick={() => remove(s)}>Xoá</Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}
