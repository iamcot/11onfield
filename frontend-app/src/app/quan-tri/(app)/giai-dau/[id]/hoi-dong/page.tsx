'use client';

// The competition's scouting panel: which coach (HLV) and scout (TTV) accounts may work it.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, Card, Input, Loading, Select, Table, Td, useUi } from '@/components/admin/ui';

type PanelRole = 'HLV' | 'TTV';
interface Member { userId: number; fullName: string | null; phone: string; websiteRole: string; panelRole: PanelRole }

const ROLE_INFO: Record<PanelRole, { label: string; does: string }> = {
  HLV: { label: 'HLV', does: 'Người cao nhất của hội đồng: nhập điểm BHL, xem phiếu của cả hội đồng, chốt Top 30, dùng Green Card khi được giao thẻ.' },
  TTV: { label: 'Tuyển trạch viên', does: 'Check-in, chấm điểm tại trạm, ghi nhận thí sinh, ghi kỷ luật, nhập điểm 7v7, tư duy, GPS, bỏ phiếu Top 30.' },
};

export default function PanelPage() {
  const { id } = useParams<{ id: string }>();
  const manager = useIsManager();
  const { toast } = useUi();
  const panel = useApi<{ members: Member[] }>(`competitions/${id}/panel`);
  const [rows, setRows] = useState<Member[]>([]);
  const [q, setQ] = useState('');
  const candidates = useApi<Member[]>(q.trim().length >= 2 ? `competitions/${id}/panel/candidates?q=${encodeURIComponent(q.trim())}` : null);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (panel.data) setRows(panel.data.members); }, [panel.data]);
  const dirty = JSON.stringify(rows.map((r) => [r.userId, r.panelRole])) !== JSON.stringify((panel.data?.members || []).map((r) => [r.userId, r.panelRole]));

  async function save() {
    setBusy(true);
    try {
      const r = await api<{ message: string }>(`competitions/${id}/panel`, { method: 'PUT', body: { members: rows.map((m) => ({ userId: m.userId, panelRole: m.panelRole })) } });
      toast(r.message);
      panel.reload();
      setQ('');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <CompetitionTabs id={id} />
      <div className="mb-4 grid gap-3 md:grid-cols-2">
        {(Object.keys(ROLE_INFO) as PanelRole[]).map((k) => (
          <div key={k} className="rounded-lg border border-[#DCE5DF] bg-white p-3 text-[13px]">
            <p className="font-semibold">{ROLE_INFO[k].label}</p>
            <p className="mt-1 text-[#46564D]">{ROLE_INFO[k].does}</p>
          </div>
        ))}
      </div>
      <Card title="Hội đồng tuyển trạch của giải">
        <p className="mb-3 max-w-3xl text-[13px] text-[#46564D]">
          Chọn trong các tài khoản Huấn luyện viên và Tuyển trạch viên của trang web. Chỉ người có tên ở đây mới vào được các màn chấm điểm của giải, và nhận quyền mới từ lần đăng nhập kế tiếp.
          Y tế là tài khoản riêng, tạo ở mục Tài khoản.
        </p>
        <Loading error={panel.error} loading={panel.loading && !panel.data} />
        {panel.data && (
          <Table head={['Họ tên', 'Điện thoại', 'Tài khoản web', 'Vai trò trong hội đồng', '']} empty="Chưa có ai trong hội đồng.">
            {rows.map((m) => (
              <tr key={m.userId}>
                <Td className="font-medium">{m.fullName || '—'}</Td>
                <Td className="tabular-nums">{m.phone}</Td>
                <Td><Badge>{m.websiteRole === 'COACH' ? 'Huấn luyện viên' : 'Tuyển trạch viên'}</Badge></Td>
                <Td>
                  <Select disabled={!manager} aria-label={`Vai trò của ${m.fullName || m.phone}`} value={m.panelRole} onChange={(e) => setRows(rows.map((x) => (x.userId === m.userId ? { ...x, panelRole: e.target.value as PanelRole } : x)))}>
                    <option value="HLV">HLV</option>
                    <option value="TTV">Tuyển trạch viên</option>
                  </Select>
                </Td>
                <Td className="text-right">{manager && <Button small variant="danger" onClick={() => setRows(rows.filter((x) => x.userId !== m.userId))}>Bỏ</Button>}</Td>
              </tr>
            ))}
          </Table>
        )}
        {manager && (
          <div className="mt-4 space-y-2">
            <Input className="max-w-sm" placeholder="Thêm người: gõ tên hoặc số điện thoại" value={q} onChange={(e) => setQ(e.target.value)} />
            {candidates.data && (
              <ul className="max-w-xl divide-y divide-[#E6ECE8] rounded border border-[#DCE5DF] bg-white text-[14px]">
                {candidates.data.filter((c) => !rows.some((r) => r.userId === c.userId)).map((c) => (
                  <li key={c.userId} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span>{c.fullName || c.phone} <span className="text-[12px] text-[#66766D]">· {c.phone} · {c.websiteRole === 'COACH' ? 'Huấn luyện viên' : 'Tuyển trạch viên'}</span></span>
                    <Button small onClick={() => setRows([...rows, c])}>Thêm làm {c.panelRole === 'HLV' ? 'HLV' : 'TTV'}</Button>
                  </li>
                ))}
                {candidates.data.length === 0 && <li className="px-3 py-2 text-[#66766D]">Không tìm thấy tài khoản HLV hoặc tuyển trạch viên nào.</li>}
              </ul>
            )}
            <div className="flex justify-end">
              <Button variant="primary" disabled={!dirty || busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu hội đồng'}</Button>
            </div>
          </div>
        )}
      </Card>
    </>
  );
}
