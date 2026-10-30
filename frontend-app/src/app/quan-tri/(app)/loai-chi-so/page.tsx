'use client';

import { useState } from 'react';
import { api, useApi } from '@/lib/admin/client';
import { Badge, Button, Check, Field, Input, Loading, Modal, PageTitle, Table, Td, useUi } from '@/components/admin/ui';

interface Type { id: number; attributeKey: string; attributeName: string; isHexagon: boolean; isGoalKeeper: boolean; attributeGroup: string | null }
const EMPTY = { attributeKey: '', attributeName: '', isHexagon: true, isGoalKeeper: false, attributeGroup: '' };

export default function AttributeTypesPage() {
  const { toast, confirm } = useUi();
  const list = useApi<Type[]>('attribute-types');
  const [edit, setEdit] = useState<{ id: number | null; form: typeof EMPTY } | null>(null);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!edit) return;
    if (!edit.form.attributeKey.trim() || !edit.form.attributeName.trim()) return toast('Cần nhập mã và tên chỉ số', 'error');
    setSaving(true);
    try {
      await api(edit.id ? `attribute-types/${edit.id}` : 'attribute-types', { method: edit.id ? 'PUT' : 'POST', body: edit.form });
      toast(edit.id ? 'Đã cập nhật loại chỉ số' : 'Đã tạo loại chỉ số');
      setEdit(null);
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }
  async function remove(t: Type) {
    if (!(await confirm(`Xoá loại chỉ số "${t.attributeName}"? Giá trị của cầu thủ cho chỉ số này cũng mất.`))) return;
    try {
      await api(`attribute-types/${t.id}`, { method: 'DELETE' });
      toast('Đã xoá loại chỉ số');
      list.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }
  const setForm = (patch: Partial<typeof EMPTY>) => setEdit((e) => (e ? { ...e, form: { ...e.form, ...patch } } : e));

  return (
    <>
      <PageTitle title="Loại chỉ số">
        <Button variant="primary" onClick={() => setEdit({ id: null, form: EMPTY })}>+ Thêm loại chỉ số</Button>
      </PageTitle>
      <Loading error={list.error} loading={list.loading && !list.data} />
      {list.data && (
        <Table head={['Mã', 'Tên', 'Nhóm', 'Hiển thị', '']} empty="Chưa có loại chỉ số nào.">
          {list.data.map((t) => (
            <tr key={t.id}>
              <Td className="font-mono text-[13px]">{t.attributeKey}</Td>
              <Td>{t.attributeName}</Td>
              <Td className="text-[#46564D]">{t.attributeGroup || '—'}</Td>
              <Td>
                <div className="flex gap-1">
                  {t.isHexagon && <Badge tone="green">Lục giác</Badge>}
                  {t.isGoalKeeper && <Badge tone="gold">Thủ môn</Badge>}
                </div>
              </Td>
              <Td className="whitespace-nowrap text-right">
                <Button small onClick={() => setEdit({ id: t.id, form: { attributeKey: t.attributeKey, attributeName: t.attributeName, isHexagon: t.isHexagon, isGoalKeeper: t.isGoalKeeper, attributeGroup: t.attributeGroup || '' } })}>Sửa</Button>{' '}
                <Button small variant="danger" onClick={() => remove(t)}>Xoá</Button>
              </Td>
            </tr>
          ))}
        </Table>
      )}
      {edit && (
        <Modal title={edit.id ? 'Sửa loại chỉ số' : 'Thêm loại chỉ số'} onClose={() => setEdit(null)}>
          <div className="space-y-4">
            <Field label="Mã *" hint="Ví dụ: speed, passing"><Input value={edit.form.attributeKey} onChange={(e) => setForm({ attributeKey: e.target.value })} /></Field>
            <Field label="Tên hiển thị *"><Input value={edit.form.attributeName} onChange={(e) => setForm({ attributeName: e.target.value })} /></Field>
            <Field label="Nhóm" hint="Ví dụ: physical, technical, mental"><Input value={edit.form.attributeGroup} onChange={(e) => setForm({ attributeGroup: e.target.value })} /></Field>
            <Check label="Hiện trên biểu đồ lục giác" checked={edit.form.isHexagon} onChange={(v) => setForm({ isHexagon: v })} />
            <Check label="Chỉ dành cho thủ môn" checked={edit.form.isGoalKeeper} onChange={(v) => setForm({ isGoalKeeper: v })} />
            <div className="flex justify-end gap-2 pt-2">
              <Button onClick={() => setEdit(null)}>Huỷ</Button>
              <Button variant="primary" disabled={saving} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
