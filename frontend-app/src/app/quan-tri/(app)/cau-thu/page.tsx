'use client';

import { useState } from 'react';
import { api, useApi } from '@/lib/admin/client';
import { LEVELS, POSITIONS } from '@/lib/admin/labels';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, Input, LinkButton, Loading, PageTitle, Pagination, Select, Table, Td, useUi } from '@/components/admin/ui';

interface Row {
  id: number;
  userid: string;
  fullName: string;
  phone: string;
  avatar: string | null;
  enabled: boolean;
  positions: string | null;
  level: string | null;
  verified: boolean;
  provinceName: string | null;
  hasPending: boolean;
  attributeKind: 'synthetic' | 'real' | 'none';
  hexagon: { key: string; name: string; value: number }[];
}

const KIND = { synthetic: 'Giả lập', real: 'Thật', none: 'Chưa có' } as const;

export default function PlayersPage() {
  const { toast, confirm } = useUi();
  const manager = useIsManager();
  const [page, setPage] = useState(0);
  const [f, setF] = useState({ search: '', position: '', provinceId: '', level: '', verified: '', pending: false });
  const [applied, setApplied] = useState(f);

  const qs = new URLSearchParams({ page: String(page), size: '20' });
  if (applied.search) qs.set('search', applied.search);
  if (applied.position) qs.set('position', applied.position);
  if (applied.provinceId) qs.set('provinceId', applied.provinceId);
  if (applied.level) qs.set('level', applied.level);
  if (applied.verified) qs.set('verified', applied.verified);
  if (applied.pending) qs.set('hasPendingItems', 'true');
  const list = useApi<{ items: Row[]; totalPages: number; totalItems: number }>(`players?${qs}`);
  const provinces = useApi<{ id: number; name: string }[]>('provinces');

  const apply = (patch: Partial<typeof f>) => {
    const next = { ...f, ...patch };
    setF(next);
    setApplied(next);
    setPage(0);
  };

  async function run(fn: () => Promise<unknown>, ok: string) {
    try {
      await fn();
      toast(ok);
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function bulkGenerate() {
    if (!(await confirm('Tạo chỉ số giả lập cho mọi cầu thủ chưa có chỉ số nào?'))) return;
    try {
      const { count } = await api<{ count: number }>('players/bulk-generate-attributes', { method: 'POST' });
      toast(count ? `Đã tạo chỉ số cho ${count} cầu thủ` : 'Không có cầu thủ nào cần tạo chỉ số');
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <>
      <PageTitle title={`Cầu thủ${list.data ? ` (${list.data.totalItems})` : ''}`}>
        <LinkButton href="/quan-tri/duyet">Hàng chờ duyệt</LinkButton>
        {manager && <Button onClick={bulkGenerate}>Tạo chỉ số hàng loạt</Button>}
      </PageTitle>

      <form
        className="mb-4 flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          apply({});
        }}
      >
        <Input className="!w-56" placeholder="Tên hoặc số điện thoại…" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
        <Select className="!w-36" value={f.position} onChange={(e) => apply({ position: e.target.value })}>
          <option value="">Mọi vị trí</option>
          {Object.entries(POSITIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select className="!w-44" value={f.provinceId} onChange={(e) => apply({ provinceId: e.target.value })}>
          <option value="">Mọi tỉnh/thành</option>
          {provinces.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select className="!w-40" value={f.level} onChange={(e) => apply({ level: e.target.value })}>
          <option value="">Mọi trình độ</option>
          {Object.entries(LEVELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select className="!w-40" value={f.verified} onChange={(e) => apply({ verified: e.target.value })}>
          <option value="">Xác minh: tất cả</option>
          <option value="true">Đã xác minh</option>
          <option value="false">Chưa xác minh</option>
        </Select>
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" className="h-4 w-4 accent-[#1F7A3A]" checked={f.pending} onChange={(e) => apply({ pending: e.target.checked })} />
          Có mục chờ duyệt
        </label>
        <Button type="submit" variant="primary">Tìm</Button>
        <Button onClick={() => apply({ search: '', position: '', provinceId: '', level: '', verified: '', pending: false })}>Xoá lọc</Button>
      </form>

      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <>
          <Table head={['Cầu thủ', 'Vị trí', 'Trình độ', 'Tỉnh/thành', 'Chỉ số', 'Trạng thái', '']} empty="Không có cầu thủ nào.">
            {list.data.items.map((p) => (
              <tr key={p.id} className={p.enabled ? '' : 'opacity-60'}>
                <Td>
                  <div className="flex items-center gap-3">
                    {p.avatar ? <img src={p.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <div className="h-10 w-10 shrink-0 rounded-full bg-[#EEF2EF]" />}
                    <div>
                      <div className="font-medium">{p.fullName || '(chưa có tên)'}</div>
                      <div className="text-[12px] text-[#66766D]">{p.phone}</div>
                    </div>
                  </div>
                </Td>
                <Td className="text-[#46564D]">{p.positions ? POSITIONS[p.positions] || p.positions : '—'}</Td>
                <Td className="text-[#46564D]">{p.level ? LEVELS[p.level] || p.level : '—'}</Td>
                <Td className="text-[#46564D]">{p.provinceName || '—'}</Td>
                <Td>
                  <Badge tone={p.attributeKind === 'none' ? 'gray' : 'green'}>{KIND[p.attributeKind]}</Badge>
                  {p.hexagon.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] tabular-nums text-[#66766D]">
                      {p.hexagon.map((h) => <span key={h.key} title={h.name}>{h.key} {h.value}</span>)}
                    </div>
                  )}
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    <Badge tone={p.verified ? 'green' : 'gray'}>{p.verified ? 'Đã xác minh' : 'Chưa xác minh'}</Badge>
                    {p.hasPending && <Badge tone="gold">Chờ duyệt</Badge>}
                    {!p.enabled && <Badge tone="red">Đã khoá</Badge>}
                  </div>
                </Td>
                <Td className="whitespace-nowrap text-right">
                  <LinkButton small href={`/quan-tri/cau-thu/${p.id}`}>{manager ? 'Sửa' : 'Xem'}</LinkButton>{' '}
                  <LinkButton small href={`/quan-tri/cau-thu/${p.id}/chi-so`}>Chỉ số</LinkButton>
                  {manager && (
                    <>
                      {' '}
                      <Button small onClick={() => run(() => api(`players/${p.id}/verified?verified=${!p.verified}`, { method: 'POST' }), p.verified ? 'Đã bỏ xác minh' : 'Đã xác minh')}>
                        {p.verified ? 'Bỏ xác minh' : 'Xác minh'}
                      </Button>{' '}
                      <Button small variant={p.enabled ? 'danger' : 'primary'} onClick={() => run(() => api(`players/${p.id}/enabled?enabled=${!p.enabled}`, { method: 'POST' }), p.enabled ? 'Đã khoá tài khoản' : 'Đã mở khoá')}>
                        {p.enabled ? 'Khoá' : 'Mở khoá'}
                      </Button>
                    </>
                  )}
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
