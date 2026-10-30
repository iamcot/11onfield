'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlayerAttributes } from '@/components/admin/PlayerAttributes';
import { api, useApi } from '@/lib/admin/client';
import { LEVELS, POSITIONS } from '@/lib/admin/labels';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, ChevronCell, ClickRow, Drawer, Hexagon, Input, LinkButton, Loading, PageTitle, Pagination, Select, Table, Td, Toggle, useUi } from '@/components/admin/ui';

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
  pendingCount: number;
  competitions: { id: number; title: string; season: number }[];
  attributeKind: 'synthetic' | 'real' | 'none';
  hexagon: { key: string; name: string; value: number }[];
}

const KIND = { synthetic: 'Giả lập', real: 'Thật', none: 'Chưa có' } as const;

export default function PlayersPage() {
  const { toast, confirm } = useUi();
  const manager = useIsManager();
  const [page, setPage] = useState(0);
  const params = useSearchParams();
  const [f, setF] = useState({ search: '', position: '', provinceId: '', level: '', verified: params.get('verified') || '', pending: false, competitionId: '' });
  const [drawer, setDrawer] = useState<Row | null>(null);
  const [applied, setApplied] = useState(f);

  const qs = new URLSearchParams({ page: String(page), size: '20' });
  if (applied.search) qs.set('search', applied.search);
  if (applied.position) qs.set('position', applied.position);
  if (applied.provinceId) qs.set('provinceId', applied.provinceId);
  if (applied.level) qs.set('level', applied.level);
  if (applied.verified) qs.set('verified', applied.verified);
  if (applied.pending) qs.set('hasPendingItems', 'true');
  if (applied.competitionId) qs.set('competitionId', applied.competitionId);
  const list = useApi<{ items: Row[]; totalPages: number; totalItems: number }>(`players?${qs}`);
  const provinces = useApi<{ id: number; name: string }[]>('provinces');
  const competitions = useApi<{ id: number; title: string; season: number }[]>('competitions');

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
        <Select className="!w-48" value={f.competitionId} onChange={(e) => apply({ competitionId: e.target.value })}>
          <option value="">Mọi giải đấu</option>
          {competitions.data?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </Select>
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" className="h-4 w-4 accent-[#1F7A3A]" checked={f.pending} onChange={(e) => apply({ pending: e.target.checked })} />
          Có mục chờ duyệt
        </label>
        <Button type="submit" variant="primary">Tìm</Button>
        <Button onClick={() => apply({ search: '', position: '', provinceId: '', level: '', verified: '', pending: false, competitionId: '' })}>Xoá lọc</Button>
      </form>

      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <>
          <Table head={['Cầu thủ', 'Vị trí', 'Trình độ', 'Tỉnh/thành', 'Giải đấu', 'Xác minh', 'Hoạt động', 'Chỉ số', '']} empty="Không có cầu thủ nào.">
            {list.data.items.map((p) => (
              <ClickRow
                key={p.id}
                href={`/quan-tri/cau-thu/${p.id}`}
                className={p.enabled ? '' : 'bg-[#FAFAFA] text-[#66766D]'}
              >
                <Td>
                  <div className="flex items-center gap-3">
                    {p.avatar ? <img src={p.avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" /> : <div className="h-10 w-10 shrink-0 rounded-full bg-[#EEF2EF]" />}
                    <div>
                      <div className="flex items-center gap-2 font-medium">
                        {p.fullName || '(chưa có tên)'}
                        {p.pendingCount > 0 && (
                          <span title={`${p.pendingCount} mục chờ duyệt`} className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#E8590C] px-1.5 text-[11px] font-bold text-white">
                            {p.pendingCount}
                          </span>
                        )}
                      </div>
                      <div className="text-[12px] text-[#66766D]">{p.phone}</div>
                    </div>
                  </div>
                </Td>
                <Td className="text-[#46564D]">{p.positions ? POSITIONS[p.positions] || p.positions : '—'}</Td>
                <Td className="text-[#46564D]">{p.level ? LEVELS[p.level] || p.level : '—'}</Td>
                <Td className="text-[#46564D]">{p.provinceName || '—'}</Td>
                <Td>
                  <div className="flex max-w-[200px] flex-wrap gap-1">
                    {p.competitions.length ? p.competitions.map((c) => <Badge key={c.id} tone="green">{c.title}</Badge>) : <span className="text-[#66766D]">—</span>}
                  </div>
                </Td>
                <Td>
                  <Toggle
                    label={p.verified ? 'Đã xác minh' : 'Chưa xác minh'}
                    checked={p.verified}
                    disabled={!manager}
                    onChange={(v) => run(() => api(`players/${p.id}/verified?verified=${v}`, { method: 'POST' }), v ? 'Đã xác minh' : 'Đã bỏ xác minh')}
                  />
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <Toggle
                      label={p.enabled ? 'Đang hoạt động' : 'Đã khoá'}
                      checked={p.enabled}
                      disabled={!manager}
                      onChange={async (v) => {
                        if (!v && !(await confirm(`Khoá tài khoản ${p.fullName || p.phone}?`))) return;
                        run(() => api(`players/${p.id}/enabled?enabled=${v}`, { method: 'POST' }), v ? 'Đã mở khoá' : 'Đã khoá tài khoản');
                      }}
                    />
                    <span className={`text-[12px] ${p.enabled ? 'text-[#1F6B32]' : 'text-[#B42318]'}`}>{p.enabled ? 'Hoạt động' : 'Khoá'}</span>
                  </div>
                </Td>
                <Td>
                  <button
                    type="button"
                    title="Xem chỉ số"
                    onClick={(e) => { e.stopPropagation(); setDrawer(p); }}
                    className="flex items-center gap-2 rounded-md p-1 hover:bg-[#E4F3D6]"
                  >
                    <Hexagon items={p.hexagon} size={52} />
                    <span className="text-[11px] text-[#66766D]">{KIND[p.attributeKind]}</span>
                  </button>
                </Td>
                <ChevronCell />
              </ClickRow>
            ))}
          </Table>
          <Pagination page={page} totalPages={list.data.totalPages} onPage={setPage} />
        </>
      )}
      {drawer && (
        <Drawer title={`Chỉ số – ${drawer.fullName || drawer.phone}`} onClose={() => setDrawer(null)}>
          <PlayerAttributes id={String(drawer.id)} stacked onChanged={list.reload} />
        </Drawer>
      )}
    </>
  );
}
