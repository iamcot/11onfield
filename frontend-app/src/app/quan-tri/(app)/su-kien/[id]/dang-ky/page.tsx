'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import { REG_STATUS, fmtDateTime } from '@/lib/admin/labels';
import { Badge, Button, ClickRow, LinkButton, Loading, PageTitle, Select, Table, Td, ChevronCell, useUi } from '@/components/admin/ui';

interface Row {
  id: number;
  userid: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  status: 'SUBMITTED' | 'FORWARDED';
  createdAt: string;
  updatedAt: string;
  forwardedAt: string | null;
}

/** Applications to one recruitment event: open one to download its PDF, then mark it forwarded. */
export default function EventRegistrationsPage() {
  const { id } = useParams<{ id: string }>();
  const { toast, confirm } = useUi();
  const list = useApi<{ event: { id: number; title: string; partnerName: string }; items: Row[] }>(`events/${id}/registrations`);
  const [filter, setFilter] = useState('');
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);

  const rows = useMemo(() => (list.data?.items || []).filter((r) => !filter || r.status === filter), [list.data, filter]);
  const waiting = (list.data?.items || []).filter((r) => r.status === 'SUBMITTED').length;
  const allPicked = rows.length > 0 && rows.every((r) => picked.has(r.id));

  const toggle = (rid: number) => setPicked((s) => {
    const n = new Set(s);
    if (n.has(rid)) n.delete(rid); else n.add(rid);
    return n;
  });

  async function forwardPicked() {
    const ids = rows.filter((r) => picked.has(r.id) && r.status === 'SUBMITTED').map((r) => r.id);
    if (ids.length === 0) return toast('Chưa chọn hồ sơ nào đang chờ chuyển', 'error');
    const partner = list.data?.event.partnerName || 'đơn vị tuyển sinh';
    if (!(await confirm(`Đánh dấu ${ids.length} hồ sơ đã chuyển tới ${partner}? Mỗi cầu thủ sẽ nhận email báo hồ sơ đã được chuyển.`))) return;
    setBusy(true);
    try {
      const r = await api<{ forwarded: number }>('event-registrations/forward', { body: { ids } });
      toast(`Đã đánh dấu ${r.forwarded} hồ sơ và gửi email cho cầu thủ`);
      setPicked(new Set());
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const pickedIds = rows.filter((r) => picked.has(r.id)).map((r) => r.id);

  return (
    <>
      <PageTitle title="Hồ sơ đăng ký" back={{ href: `/quan-tri/su-kien/${id}`, label: list.data?.event.title || 'Sự kiện' }}>
        {pickedIds.length > 0 && (
          <>
            <LinkButton href={`/quan-tri/su-kien/${id}/dang-ky/in?ids=${pickedIds.join(',')}`}>Tải PDF {pickedIds.length} hồ sơ</LinkButton>
            <Button variant="primary" disabled={busy} onClick={forwardPicked}>Đánh dấu đã chuyển</Button>
          </>
        )}
      </PageTitle>

      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3 text-[14px] text-[#46564D]">
            <span>
              {list.data.items.length} hồ sơ · <strong className="text-[#9A6B00]">{waiting} chờ chuyển</strong>
              {list.data.event.partnerName && <> · chuyển tới <strong className="text-[#10231A]">{list.data.event.partnerName}</strong></>}
            </span>
            <Select className="!w-40" value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="">Tất cả</option>
              <option value="SUBMITTED">Chờ chuyển</option>
              <option value="FORWARDED">Đã chuyển</option>
            </Select>
          </div>
          <Table head={['', 'Cầu thủ', 'Liên hệ', 'Gửi lúc', 'Trạng thái', '']} empty="Chưa có hồ sơ nào.">
            {rows.map((r) => (
              <ClickRow key={r.id} href={`/quan-tri/su-kien/${id}/dang-ky/${r.id}`}>
                <Td className="w-10">
                  <input type="checkbox" className="h-4 w-4 accent-[#1F7A3A]" checked={picked.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Chọn ${r.fullName}`} />
                </Td>
                <Td>
                  <div className="flex items-center gap-3">
                    {r.avatar ? <img src={r.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <div className="h-9 w-9 shrink-0 rounded-full bg-[#E6ECE8]" />}
                    <div>
                      <div className="font-medium">{r.fullName}</div>
                      <Link href={`/profile/${r.userid}`} target="_blank" className="text-[12px] text-[#66766D] hover:text-[#1F6B32]">Xem hồ sơ 11of ↗</Link>
                    </div>
                  </div>
                </Td>
                <Td className="text-[13px] text-[#46564D]">
                  <div>{r.phone}</div>
                  <div>{r.email}</div>
                </Td>
                <Td className="whitespace-nowrap text-[13px] text-[#46564D]">{fmtDateTime(r.updatedAt)}</Td>
                <Td>
                  <Badge tone={REG_STATUS[r.status].tone}>{REG_STATUS[r.status].label}</Badge>
                  {r.forwardedAt && <div className="mt-0.5 text-[11px] text-[#66766D]">{fmtDateTime(r.forwardedAt)}</div>}
                </Td>
                <ChevronCell />
              </ClickRow>
            ))}
          </Table>
          {rows.length > 0 && (
            <div className="mt-2">
              <Button small onClick={() => setPicked(allPicked ? new Set() : new Set(rows.map((r) => r.id)))}>{allPicked ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}</Button>
            </div>
          )}
        </>
      )}
    </>
  );
}
