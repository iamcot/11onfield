'use client';

import { useState } from 'react';
import { api, useApi } from '@/lib/admin/client';
import { Badge, Button, Check, Field, Input, Loading, Modal, PageTitle, Pagination, Select, Table, Td, useUi } from '@/components/admin/ui';
import { fmtDate, ROLES, STAFF_ROLE_KEYS } from '@/lib/admin/labels';

interface Row { id: number; phone: string; fullName: string | null; email: string | null; role: string; enabled: boolean; locked: boolean; createdAt: string | null }
type Form = { id: number | null; phone: string; fullName: string; email: string; role: string; password: string; enabled: boolean };
const EMPTY: Form = { id: null, phone: '', fullName: '', email: '', role: 'EDITOR', password: '', enabled: true };

export default function AccountsPage() {
  const { toast, confirm } = useUi();
  const [page, setPage] = useState(0);
  const [all, setAll] = useState(false);
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [form, setForm] = useState<Form | null>(null);
  const [busy, setBusy] = useState(false);
  const [shown, setShown] = useState<{ phone: string; password: string } | null>(null);
  const list = useApi<{ items: Row[]; totalPages: number; totalItems: number }>(`users?page=${page}&all=${all}&q=${encodeURIComponent(term)}`);

  async function save() {
    if (!form) return;
    setBusy(true);
    try {
      if (form.id === null) {
        await api('users', { body: { phone: form.phone, fullName: form.fullName, email: form.email, role: form.role, password: form.password } });
        toast('Đã tạo tài khoản');
      } else {
        await api(`users/${form.id}`, { method: 'PUT', body: { fullName: form.fullName, email: form.email, role: form.role, enabled: form.enabled } });
        toast('Đã cập nhật tài khoản');
      }
      setForm(null);
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function act(u: Row, action: 'lock' | 'unlock' | 'reset-password', text: string) {
    if (!(await confirm(text))) return;
    try {
      const r = await api<{ message: string; password?: string }>(`users/${u.id}/${action}`, { method: 'POST' });
      if (r.password) setShown({ phone: u.phone, password: r.password });
      else toast(r.message);
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  const set = (k: keyof Form) => (v: string | boolean) => setForm((f) => (f ? { ...f, [k]: v } : f));

  return (
    <>
      <PageTitle title="Tài khoản và phân quyền">
        <Button variant="primary" onClick={() => setForm(EMPTY)}>+ Tạo tài khoản</Button>
      </PageTitle>
      <form className="mb-3 flex flex-wrap items-center gap-3" onSubmit={(e) => { e.preventDefault(); setPage(0); setTerm(q.trim()); }}>
        <div className="w-full max-w-xs"><Input placeholder="Tìm theo số điện thoại hoặc tên" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Button type="submit">Tìm</Button>
        <Check label="Hiện cả người dùng thường (không gồm cầu thủ)" checked={all} onChange={(v) => { setAll(v); setPage(0); }} />
      </form>
      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <>
          <Table head={['Số điện thoại', 'Họ tên', 'Vai trò', 'Trạng thái', 'Tạo lúc', '']} empty="Không có tài khoản.">
            {list.data.items.map((u) => (
              <tr key={u.id}>
                <Td className="tabular-nums">{u.phone}</Td>
                <Td>{u.fullName}<div className="text-[12px] text-[#66766D]">{u.email}</div></Td>
                <Td><Badge tone={STAFF_ROLE_KEYS.includes(u.role) ? 'green' : 'gray'}>{ROLES[u.role] || u.role}</Badge></Td>
                <Td>{u.locked ? <Badge tone="red">Đã khoá</Badge> : u.enabled ? <Badge tone="green">Hoạt động</Badge> : <Badge tone="gold">Vô hiệu</Badge>}</Td>
                <Td className="text-[13px] text-[#46564D]">{fmtDate(u.createdAt?.split('T')[0])}</Td>
                <Td className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button small onClick={() => setForm({ id: u.id, phone: u.phone, fullName: u.fullName || '', email: u.email || '', role: u.role, password: '', enabled: u.enabled })}>Sửa</Button>
                    {u.locked
                      ? <Button small onClick={() => act(u, 'unlock', `Mở khoá tài khoản ${u.phone}?`)}>Mở khoá</Button>
                      : <Button small variant="danger" onClick={() => act(u, 'lock', `Khoá tài khoản ${u.phone}?`)}>Khoá</Button>}
                    <Button small onClick={() => act(u, 'reset-password', `Đặt lại mật khẩu cho ${u.phone}? Mật khẩu mới sẽ hiện một lần.`)}>Đặt lại mật khẩu</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
          <Pagination page={page} totalPages={list.data.totalPages} onPage={setPage} />
        </>
      )}

      {form && (
        <Modal title={form.id === null ? 'Tạo tài khoản' : 'Sửa tài khoản'} onClose={() => setForm(null)}>
          <div className="space-y-4">
            <Field label="Số điện thoại *"><Input disabled={form.id !== null} value={form.phone} onChange={(e) => set('phone')(e.target.value)} /></Field>
            <Field label="Họ tên"><Input value={form.fullName} onChange={(e) => set('fullName')(e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={form.email} onChange={(e) => set('email')(e.target.value)} /></Field>
            <Field label="Vai trò" hint="Admin quản trị web và cấu hình giải. Biên tập viên viết bài và duyệt nội dung cầu thủ. Y tế đặt cờ không đủ điều kiện cho thí sinh. HLV và tuyển trạch viên chỉ vào được trang quản trị khi admin thêm họ vào hội đồng tuyển trạch của giải (tab Hội đồng của giải đấu).">
              <Select value={form.role} onChange={(e) => set('role')(e.target.value)}>
                {Object.entries(ROLES).filter(([k]) => k !== 'PLAYER').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </Field>
            {form.id === null ? (
              <Field label="Mật khẩu *" hint="Tối thiểu 6 ký tự"><Input type="text" autoComplete="off" value={form.password} onChange={(e) => set('password')(e.target.value)} /></Field>
            ) : (
              <Check label="Cho phép đăng nhập" checked={form.enabled} onChange={(v) => set('enabled')(v)} />
            )}
            <div className="flex justify-end gap-2">
              <Button onClick={() => setForm(null)}>Huỷ</Button>
              <Button variant="primary" disabled={busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu'}</Button>
            </div>
          </div>
        </Modal>
      )}
      {shown && (
        <Modal title="Mật khẩu mới" onClose={() => setShown(null)}>
          <p className="text-[14px]">Tài khoản <b>{shown.phone}</b> có mật khẩu mới. Hãy gửi cho người dùng ngay, màn hình này sẽ không hiện lại.</p>
          <p className="mt-4 select-all border border-[#1F7A3A] bg-[#F6F9F7] px-4 py-3 text-center font-mono text-[22px] tracking-wider text-[#1F6B32]">{shown.password}</p>
          <div className="mt-4 flex justify-end"><Button variant="primary" onClick={() => setShown(null)}>Đã ghi lại</Button></div>
        </Modal>
      )}
    </>
  );
}
