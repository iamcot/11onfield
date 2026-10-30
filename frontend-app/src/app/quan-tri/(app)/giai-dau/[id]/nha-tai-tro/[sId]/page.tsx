'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import ImageField from '@/components/admin/ImageField';
import { Button, Card, Check, Field, Input, Loading, PageTitle, useUi } from '@/components/admin/ui';

export default function SponsorEditPage() {
  const { id, sId } = useParams<{ id: string; sId: string }>();
  const isNew = sId === 'moi';
  const router = useRouter();
  const { toast } = useUi();
  const [form, setForm] = useState({ name: '', websiteUrl: '', logoUrl: '', bannerImageUrl: '', adPosition: '', displayOrder: '0', isActive: true });
  const [ready, setReady] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const existing = useApi<any>(isNew ? null : `sponsors/${sId}`);

  useEffect(() => {
    const s = existing.data;
    if (!s) return;
    setForm({
      name: s.name || '', websiteUrl: s.websiteUrl || '', logoUrl: s.logoUrl || '', bannerImageUrl: s.bannerImageUrl || '',
      adPosition: s.adPosition || '', displayOrder: String(s.displayOrder ?? 0), isActive: !!s.isActive,
    });
    setReady(true);
  }, [existing.data]);

  const set = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const back = `/quan-tri/giai-dau/${id}/nha-tai-tro`;

  async function save() {
    if (!form.name.trim()) return toast('Cần nhập tên nhà tài trợ', 'error');
    setSaving(true);
    try {
      await api(isNew ? `competitions/${id}/sponsors` : `sponsors/${sId}`, {
        method: isNew ? 'POST' : 'PUT',
        body: { ...form, displayOrder: Number(form.displayOrder) || 0 },
      });
      toast(isNew ? 'Đã thêm nhà tài trợ' : 'Đã lưu nhà tài trợ');
      router.push(back);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title={isNew ? 'Thêm nhà tài trợ' : 'Sửa nhà tài trợ'} back={{ href: back, label: 'Danh sách nhà tài trợ' }} />
      <Loading error={existing.error} loading={!ready} />
      {ready && (
        <div className="grid max-w-4xl gap-4 lg:grid-cols-2">
          <Card>
            <div className="space-y-4">
              <Field label="Tên *"><Input value={form.name} onChange={(e) => set('name')(e.target.value)} /></Field>
              <Field label="Website"><Input type="url" placeholder="https://" value={form.websiteUrl} onChange={(e) => set('websiteUrl')(e.target.value)} /></Field>
              <Field label="Vị trí quảng cáo" hint="Để trống nếu chỉ hiện logo"><Input value={form.adPosition} onChange={(e) => set('adPosition')(e.target.value)} /></Field>
              <Field label="Thứ tự hiển thị"><Input type="number" value={form.displayOrder} onChange={(e) => set('displayOrder')(e.target.value)} /></Field>
              <Check label="Hiển thị trên trang web" checked={form.isActive} onChange={set('isActive')} />
            </div>
          </Card>
          <Card>
            <div className="space-y-5">
              <ImageField type="sponsor" label="Logo" value={form.logoUrl} onChange={set('logoUrl')} />
              <ImageField type="sponsor" label="Banner" value={form.bannerImageUrl} onChange={set('bannerImageUrl')} />
            </div>
          </Card>
          <div className="flex gap-2">
            <Button variant="primary" disabled={saving} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
            <Button onClick={() => router.push(back)}>Huỷ</Button>
          </div>
        </div>
      )}
    </>
  );
}
