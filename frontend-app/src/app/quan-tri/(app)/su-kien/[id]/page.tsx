'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import { EVENT_STATUS } from '@/lib/admin/labels';
import ImageField from '@/components/admin/ImageField';
import RichText from '@/components/admin/RichText';
import { Button, Card, Field, Input, Loading, PageTitle, Select, Textarea, useUi } from '@/components/admin/ui';

const EMPTY = {
  title: '', picture: '', shortContent: '', content: '', startDate: '', startTime: '', endDate: '', endTime: '',
  location: '', provinceId: '', status: 'PLAN',
};

export default function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'moi';
  const router = useRouter();
  const { toast } = useUi();
  const [form, setForm] = useState(EMPTY);
  const [ready, setReady] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const provinces = useApi<{ id: number; name: string }[]>('provinces');
  const existing = useApi<any>(isNew ? null : `events/${id}`);

  useEffect(() => {
    const e = existing.data;
    if (!e) return;
    setForm({
      title: e.title || '', picture: e.picture || '', shortContent: e.shortContent || '', content: e.content || '',
      startDate: e.startDate || '', startTime: (e.startTime || '').slice(0, 5), endDate: e.endDate || '', endTime: (e.endTime || '').slice(0, 5),
      location: e.location || '', provinceId: e.provinceId ? String(e.provinceId) : '', status: e.status,
    });
    setReady(true);
  }, [existing.data]);

  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.title.trim() || !form.startDate || !form.endDate) {
      toast('Cần nhập tên sự kiện, ngày bắt đầu và ngày kết thúc', 'error');
      return;
    }
    setSaving(true);
    try {
      const body = { ...form, provinceId: form.provinceId ? Number(form.provinceId) : null };
      await api(isNew ? 'events' : `events/${id}`, { method: isNew ? 'POST' : 'PUT', body });
      toast(isNew ? 'Đã tạo sự kiện' : 'Đã lưu sự kiện');
      router.push('/quan-tri/su-kien');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title={isNew ? 'Tạo sự kiện' : 'Sửa sự kiện'} back={{ href: '/quan-tri/su-kien', label: 'Danh sách sự kiện' }} />
      <Loading error={existing.error} loading={!ready} />
      {ready && (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <Card>
              <div className="space-y-4">
                <Field label="Tên sự kiện *"><Input value={form.title} onChange={(e) => set('title')(e.target.value)} /></Field>
                <Field label="Mô tả ngắn"><Textarea value={form.shortContent} onChange={(e) => set('shortContent')(e.target.value)} /></Field>
                <div>
                  <span className="mb-1 block text-[12px] uppercase tracking-wider text-[#8FA597]">Nội dung</span>
                  <RichText value={form.content} onChange={set('content')} imageType="event" />
                </div>
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card title="Ảnh đại diện"><ImageField type="event" value={form.picture} onChange={set('picture')} label="Ảnh sự kiện" /></Card>
            <Card title="Thời gian & địa điểm">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Ngày bắt đầu *"><Input type="date" value={form.startDate} onChange={(e) => set('startDate')(e.target.value)} /></Field>
                <Field label="Giờ bắt đầu"><Input type="time" value={form.startTime} onChange={(e) => set('startTime')(e.target.value)} /></Field>
                <Field label="Ngày kết thúc *"><Input type="date" value={form.endDate} onChange={(e) => set('endDate')(e.target.value)} /></Field>
                <Field label="Giờ kết thúc"><Input type="time" value={form.endTime} onChange={(e) => set('endTime')(e.target.value)} /></Field>
                <Field label="Địa điểm" className="col-span-2"><Input value={form.location} onChange={(e) => set('location')(e.target.value)} /></Field>
                <Field label="Tỉnh/thành" className="col-span-2">
                  <Select value={form.provinceId} onChange={(e) => set('provinceId')(e.target.value)}>
                    <option value="">— Chưa chọn —</option>
                    {provinces.data?.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </Select>
                </Field>
              </div>
            </Card>
            <Card title="Trạng thái">
              <Select value={form.status} onChange={(e) => set('status')(e.target.value)}>
                {Object.entries(EVENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </Card>
            <div className="flex gap-2">
              <Button variant="primary" disabled={saving} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
              <Button onClick={() => router.push('/quan-tri/su-kien')}>Huỷ</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
