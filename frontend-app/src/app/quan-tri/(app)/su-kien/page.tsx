'use client';

import { useState } from 'react';
import { api, useApi } from '@/lib/admin/client';
import { EVENT_STATUS, fmtDate } from '@/lib/admin/labels';
import { Badge, Button, Input, LinkButton, Loading, PageTitle, Pagination, Select, Table, Td, useUi } from '@/components/admin/ui';

interface EventRow {
  id: number;
  title: string;
  picture: string | null;
  startDate: string;
  endDate: string;
  location: string | null;
  provinceName: string | null;
  status: string;
  participantCount: number;
}

export default function EventsPage() {
  const { toast, confirm } = useUi();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [provinceId, setProvinceId] = useState('');
  const [q, setQ] = useState('');

  const qs = new URLSearchParams({ page: String(page), size: '20' });
  if (q) qs.set('search', q);
  if (status) qs.set('status', status);
  if (provinceId) qs.set('provinceId', provinceId);
  const list = useApi<{ items: EventRow[]; totalPages: number; totalItems: number }>(`events?${qs}`);
  const provinces = useApi<{ id: number; name: string }[]>('provinces');

  async function act(e: EventRow) {
    const deleting = e.status !== 'DELETED';
    if (deleting && !(await confirm(`Xoá sự kiện "${e.title}"?`))) return;
    try {
      await api(deleting ? `events/${e.id}` : `events/${e.id}/activate`, { method: deleting ? 'DELETE' : 'POST' });
      toast(deleting ? 'Đã xoá sự kiện' : 'Đã khôi phục sự kiện');
      list.reload();
    } catch (err) {
      toast((err as Error).message, 'error');
    }
  }

  return (
    <>
      <PageTitle title="Sự kiện">
        <LinkButton href="/quan-tri/su-kien/moi" variant="primary">+ Tạo sự kiện</LinkButton>
      </PageTitle>

      <form
        className="mb-4 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(0);
          setQ(search.trim());
        }}
      >
        <Input className="!w-56" placeholder="Tìm theo tên…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="!w-44" value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }}>
          <option value="">Mọi trạng thái</option>
          {Object.entries(EVENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
        <Select className="!w-44" value={provinceId} onChange={(e) => { setProvinceId(e.target.value); setPage(0); }}>
          <option value="">Mọi tỉnh/thành</option>
          {provinces.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Button type="submit" variant="primary">Tìm</Button>
      </form>

      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <>
          <Table head={['Sự kiện', 'Thời gian', 'Địa điểm', 'Trạng thái', 'Tham gia', '']} empty="Không có sự kiện nào.">
            {list.data.items.map((e) => (
              <tr key={e.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    {e.picture ? <img src={e.picture} alt="" className="h-10 w-14 shrink-0 object-cover" /> : <div className="h-10 w-14 shrink-0 bg-[#F3F6F4]" />}
                    <span className="font-medium">{e.title}</span>
                  </div>
                </Td>
                <Td className="whitespace-nowrap text-[#46564D]">{fmtDate(e.startDate)}{e.endDate !== e.startDate && ` – ${fmtDate(e.endDate)}`}</Td>
                <Td className="text-[#46564D]">{[e.location, e.provinceName].filter(Boolean).join(', ')}</Td>
                <Td><Badge tone={EVENT_STATUS[e.status]?.tone}>{EVENT_STATUS[e.status]?.label || e.status}</Badge></Td>
                <Td className="tabular-nums">{e.participantCount}</Td>
                <Td className="whitespace-nowrap text-right">
                  <LinkButton small href={`/quan-tri/su-kien/${e.id}`}>Sửa</LinkButton>{' '}
                  <Button small variant={e.status === 'DELETED' ? 'ghost' : 'danger'} onClick={() => act(e)}>{e.status === 'DELETED' ? 'Khôi phục' : 'Xoá'}</Button>
                </Td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} totalPages={list.data.totalPages} onPage={setPage} />
        </>
      )}
    </>
  );
}
