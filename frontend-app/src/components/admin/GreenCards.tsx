'use client';

// The four Green Cards of a competition: each holder may send one contestant straight into the Top 30.

import { useMemo, useState } from 'react';
import { api, useApi } from '@/lib/admin/client';
import { useMe } from '@/components/admin/me';
import { Badge, Button, Card, Input, Loading, Select, Table, Td, useUi } from '@/components/admin/ui';
import { fmtDateTime } from '@/lib/admin/labels';

interface Holder { userId: number | ''; title: string }
interface CardRow { id: number; holderUserId: number; holderName: string | null; holderPhone: string | null; title: string; used: boolean; reason: string | null; usedAt: string | null; participant?: { sbd: number; fullName: string } }

export default function GreenCards({ id }: { id: string }) {
  const me = useMe();
  const { toast } = useUi();
  const list = useApi<{ cards: CardRow[]; limit: number }>(`competitions/${id}/green-cards`);
  // Only the panel's head coaches (HLV) can hold a card.
  const panel = useApi<{ members: { userId: number; fullName: string | null; phone: string; panelRole: 'HLV' | 'TTV' }[] }>(me.role === 'ADMIN' ? `competitions/${id}/panel` : null);
  const [holders, setHolders] = useState<Holder[] | null>(null);
  const [busy, setBusy] = useState(false);

  const cards = list.data?.cards || [];
  const edit = () => setHolders(cards.map((c) => ({ userId: c.holderUserId, title: c.title })));

  async function save() {
    if (!holders) return;
    setBusy(true);
    try {
      const r = await api<{ message: string }>(`competitions/${id}/green-cards`, { method: 'PUT', body: { holders: holders.filter((h) => h.userId) } });
      toast(r.message);
      setHolders(null);
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const usedIds = useMemo(() => new Set(cards.filter((c) => c.used).map((c) => c.holderUserId)), [cards]);

  return (
    <Card title="Green Card">
      <p className="mb-3 max-w-2xl text-[13px] text-[#46564D]">
        Bốn thẻ cho mỗi giải, giao cho HLV trong hội đồng tuyển trạch. Người giữ thẻ dùng một lần trên trang thí sinh, thí sinh vào thẳng Top 30 và không thu hồi được.
      </p>
      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && !holders && (
        <>
          <Table head={['Người giữ thẻ', 'Chức danh', 'Tình trạng', 'Lý do']} empty="Chưa chỉ định người giữ thẻ.">
            {cards.map((c) => (
              <tr key={c.id}>
                <Td className="font-medium">{c.holderName || c.holderPhone}</Td>
                <Td>{c.title}</Td>
                <Td>
                  {c.used ? <Badge tone="green">Đã dùng cho SBD {c.participant?.sbd} · {c.participant?.fullName} ({fmtDateTime(c.usedAt)})</Badge> : <Badge tone="gold">Chưa dùng</Badge>}
                </Td>
                <Td className="text-[13px] text-[#46564D]">{c.reason}</Td>
              </tr>
            ))}
          </Table>
          {me.role === 'ADMIN' && <div className="mt-3"><Button onClick={edit}>Chỉ định người giữ thẻ</Button></div>}
        </>
      )}
      {holders && (
        <div className="space-y-2">
          {holders.map((h, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <Select className="max-w-xs" disabled={usedIds.has(Number(h.userId))} value={h.userId} onChange={(e) => setHolders(holders.map((x, j) => (j === i ? { ...x, userId: Number(e.target.value) || '' } : x)))}>
                <option value="">Chọn tài khoản…</option>
                {panel.data?.members.filter((u) => u.panelRole === 'HLV').map((u) => <option key={u.userId} value={u.userId}>{u.fullName || u.phone}</option>)}
              </Select>
              <Input className="max-w-xs" placeholder="Chức danh (vd. Giám đốc kỹ thuật)" value={h.title} onChange={(e) => setHolders(holders.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              {!usedIds.has(Number(h.userId)) && <Button small onClick={() => setHolders(holders.filter((_, j) => j !== i))}>Bỏ</Button>}
            </div>
          ))}
          {holders.length < (list.data?.limit || 4) && <Button small onClick={() => setHolders([...holders, { userId: '', title: '' }])}>+ Thêm người giữ thẻ</Button>}
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={() => setHolders(null)}>Huỷ</Button>
            <Button variant="primary" disabled={busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu'}</Button>
          </div>
        </div>
      )}
    </Card>
  );
}

