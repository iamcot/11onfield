'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import ImageField from '@/components/admin/ImageField';
import RichText from '@/components/admin/RichText';
import { Button, Card, Check, Field, Input, Loading, PageTitle, Select, Textarea, useUi } from '@/components/admin/ui';

export default function NewsEditPage() {
  const { id, newsId } = useParams<{ id: string; newsId: string }>();
  const isNew = newsId === 'moi';
  const router = useRouter();
  const { toast } = useUi();
  const [form, setForm] = useState({
    competitionId: id, title: '', shortContent: '', content: '', authorByline: '', thumbnail: '', isFeatured: false, status: 'DRAFT',
  });
  const [ready, setReady] = useState(isNew);
  const [saving, setSaving] = useState(false);
  const comps = useApi<{ id: number; title: string }[]>('competitions');
  const existing = useApi<any>(isNew ? null : `news/${newsId}`);

  useEffect(() => {
    const n = existing.data;
    if (!n) return;
    setForm({
      competitionId: String(n.competitionId), title: n.title || '', shortContent: n.shortContent || '', content: n.content || '',
      authorByline: n.authorByline || '', thumbnail: n.thumbnail || '', isFeatured: !!n.isFeatured, status: n.status,
    });
    setReady(true);
  }, [existing.data]);

  const set = <K extends keyof typeof form>(k: K) => (v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const back = `/quan-tri/giai-dau/${id}/tin-tuc`;

  async function save() {
    if (!form.title.trim()) return toast('Cần nhập tiêu đề', 'error');
    setSaving(true);
    try {
      await api(isNew ? 'news' : `news/${newsId}`, { method: isNew ? 'POST' : 'PUT', body: { ...form, competitionId: Number(form.competitionId) } });
      toast(isNew ? 'Đã tạo tin tức' : 'Đã lưu tin tức');
      router.push(back);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageTitle title={isNew ? 'Viết tin mới' : 'Sửa tin tức'} back={{ href: back, label: 'Danh sách tin tức' }} />
      <Loading error={existing.error} loading={!ready} />
      {ready && (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <Card>
            <div className="space-y-4">
              <Field label="Tiêu đề *"><Input value={form.title} onChange={(e) => set('title')(e.target.value)} /></Field>
              <Field label="Mô tả ngắn"><Textarea value={form.shortContent} onChange={(e) => set('shortContent')(e.target.value)} /></Field>
              <div>
                <span className="mb-1 block text-[12px] uppercase tracking-wider text-[#8FA597]">Nội dung</span>
                <RichText value={form.content} onChange={set('content')} imageType="news" />
              </div>
            </div>
          </Card>
          <div className="space-y-4">
            <Card title="Ảnh đại diện"><ImageField type="news" value={form.thumbnail} onChange={set('thumbnail')} label="Thumbnail" /></Card>
            <Card title="Đăng bài">
              <div className="space-y-3">
                <Field label="Giải đấu">
                  <Select value={form.competitionId} onChange={(e) => set('competitionId')(e.target.value)}>
                    {comps.data?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </Select>
                </Field>
                <Field label="Bút danh / tác giả"><Input value={form.authorByline} onChange={(e) => set('authorByline')(e.target.value)} /></Field>
                <Field label="Trạng thái">
                  <Select value={form.status} onChange={(e) => set('status')(e.target.value)}>
                    <option value="DRAFT">Nháp</option>
                    <option value="PUBLISHED">Đăng ngay</option>
                  </Select>
                </Field>
                <Check label="Tin nổi bật" checked={form.isFeatured} onChange={set('isFeatured')} />
              </div>
            </Card>
            <div className="flex gap-2">
              <Button variant="primary" disabled={saving} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
              <Button onClick={() => router.push(back)}>Huỷ</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
