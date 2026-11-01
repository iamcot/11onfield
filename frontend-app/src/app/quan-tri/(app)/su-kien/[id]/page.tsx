'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import { EVENT_STATUS } from '@/lib/admin/labels';
import ImageField from '@/components/admin/ImageField';
import RichText from '@/components/admin/RichText';
import FormBuilder, { type FormField } from '@/components/admin/FormBuilder';
import { Button, Card, Field, Input, LinkButton, Loading, PageTitle, Select, Textarea, useUi } from '@/components/admin/ui';

const EMPTY = {
  title: '', picture: '', shortContent: '', content: '', startDate: '', startTime: '', endDate: '', endTime: '',
  location: '', provinceId: '', status: 'PLAN', eventType: 'GENERAL', partnerName: '',
};

export default function EventEditPage() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === 'moi';
  const router = useRouter();
  const { toast } = useUi();
  const [form, setForm] = useState(EMPTY);
  const [ready, setReady] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const [formSchema, setFormSchema] = useState<FormField[]>([]);
  const defaults = useApi<{ defaultForm: FormField[] }>(isNew ? 'event-form/fields' : null);
  const provinces = useApi<{ id: number; name: string }[]>('provinces');
  const existing = useApi<any>(isNew ? null : `events/${id}`);

  useEffect(() => {
    const e = existing.data;
    if (!e) return;
    setForm({
      title: e.title || '', picture: e.picture || '', shortContent: e.shortContent || '', content: e.content || '',
      startDate: e.startDate || '', startTime: (e.startTime || '').slice(0, 5), endDate: e.endDate || '', endTime: (e.endTime || '').slice(0, 5),
      location: e.location || '', provinceId: e.provinceId ? String(e.provinceId) : '', status: e.status,
      eventType: e.eventType || 'GENERAL', partnerName: e.partnerName || '',
    });
    setFormSchema(e.formSchema || []);
    setReady(true);
  }, [existing.data]);

  // a new recruitment event starts with the default form
  useEffect(() => {
    if (form.eventType === 'RECRUITMENT' && formSchema.length === 0 && defaults.data) setFormSchema(defaults.data.defaultForm);
  }, [form.eventType, defaults.data]);

  const set = (k: keyof typeof EMPTY) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    if (!form.title.trim() || !form.startDate || !form.endDate) {
      toast('Cần nhập tên sự kiện, ngày bắt đầu và ngày kết thúc', 'error');
      return;
    }
    setSaving(true);
    try {
      if (form.eventType === 'RECRUITMENT' && formSchema.length === 0) {
        toast('Biểu mẫu đăng ký cần ít nhất một trường', 'error');
        setSaving(false);
        return;
      }
      const body = {
        ...form,
        provinceId: form.provinceId ? Number(form.provinceId) : null,
        formSchema: form.eventType === 'RECRUITMENT' ? formSchema.map((f) => ({ ...f, options: f.options?.map((o) => o.trim()).filter(Boolean) ?? null })) : null,
      };
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
      <PageTitle title={isNew ? 'Tạo sự kiện' : 'Sửa sự kiện'} back={{ href: '/quan-tri/su-kien', label: 'Danh sách sự kiện' }}>
        {!isNew && form.eventType === 'RECRUITMENT' && (
          <LinkButton href={`/quan-tri/su-kien/${id}/dang-ky`}>Hồ sơ đăng ký</LinkButton>
        )}
      </PageTitle>
      <Loading error={existing.error} loading={!ready} />
      {ready && (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <Card>
              <div className="space-y-4">
                <Field label="Tên sự kiện *"><Input value={form.title} onChange={(e) => set('title')(e.target.value)} /></Field>
                <Field label="Mô tả ngắn"><Textarea value={form.shortContent} onChange={(e) => set('shortContent')(e.target.value)} /></Field>
                <div>
                  <span className="mb-1 block text-[12px] uppercase tracking-wider text-[#66766D]">Nội dung</span>
                  <RichText value={form.content} onChange={set('content')} imageType="event" />
                </div>
              </div>
            </Card>
            {form.eventType === 'RECRUITMENT' && (
              <Card title="Biểu mẫu đăng ký">
                <p className="mb-3 text-[13px] text-[#46564D]">
                  Cầu thủ bấm “Tham gia” sẽ điền biểu mẫu này. Trường lấy từ hồ sơ được điền sẵn; trường tùy chỉnh do cầu thủ tự nhập.
                </p>
                <FormBuilder value={formSchema} onChange={setFormSchema} />
              </Card>
            )}
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
            <Card title="Loại sự kiện">
              <div className="space-y-3">
                <Select value={form.eventType} onChange={(e) => set('eventType')(e.target.value)}>
                  <option value="GENERAL">Sự kiện thường</option>
                  <option value="RECRUITMENT">Tuyển sinh (có biểu mẫu đăng ký)</option>
                </Select>
                {form.eventType === 'RECRUITMENT' && (
                  <Field label="Đơn vị tuyển sinh" hint="Hồ sơ sẽ được chuyển tới đơn vị này; tên hiện cho cầu thủ và trong email.">
                    <Input value={form.partnerName} placeholder="VD: Học viện bóng đá ABC" onChange={(e) => set('partnerName')(e.target.value)} />
                  </Field>
                )}
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
