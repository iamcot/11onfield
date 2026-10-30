'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import { Button, Card, Check, Field, Input, Loading, PageTitle, Textarea, useUi } from '@/components/admin/ui';
import { CHANNELS } from '@/lib/admin/labels';
import RichText from '@/components/admin/RichText';

interface Template { id: number; channel: string; subject: string | null; bodyTemplate: string; variables: string | null; active: boolean }

function TemplateCard({ t }: { t: Template }) {
  const { toast } = useUi();
  const [f, setF] = useState({ subject: t.subject || '', bodyTemplate: t.bodyTemplate, active: t.active });
  const [saving, setSaving] = useState(false);
  let vars: string[] = [];
  try { vars = t.variables ? JSON.parse(t.variables) : []; } catch { /* free text */ }

  async function save() {
    setSaving(true);
    try {
      await api(`notifications/templates/${t.id}`, { method: 'PUT', body: f });
      toast('Đã lưu template');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card title={CHANNELS[t.channel] || t.channel}>
      <div className="space-y-4">
        <Field label="Tiêu đề"><Input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} /></Field>
        <Field label="Nội dung" hint={vars.length ? `Biến có thể dùng: ${vars.map((v) => `{{${v}}}`).join(' ')}` : 'Dùng {{tenBien}} để chèn dữ liệu'}>
          {t.channel === 'EMAIL' ? (
            <RichText value={f.bodyTemplate} imageType="news" height={360} onChange={(html) => setF((x) => ({ ...x, bodyTemplate: html }))} />
          ) : (
            <Textarea rows={8} value={f.bodyTemplate} onChange={(e) => setF({ ...f, bodyTemplate: e.target.value })} />
          )}
        </Field>
        <Check label="Đang sử dụng" checked={f.active} onChange={(v) => setF({ ...f, active: v })} />
        <Button variant="primary" disabled={saving} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
      </div>
    </Card>
  );
}

export default function TemplatesPage() {
  const { id } = useParams<{ id: string }>();
  const data = useApi<{ scenario: { name: string }; templates: Template[] }>(`notifications/scenarios/${id}/templates`);
  const [ready, setReady] = useState(false);
  useEffect(() => { if (data.data) setReady(true); }, [data.data]);
  return (
    <>
      <PageTitle title={data.data ? `Nội dung mẫu — ${data.data.scenario.name}` : 'Nội dung mẫu'} back={{ href: '/quan-tri/thong-bao', label: 'Thông báo' }} />
      <Loading error={data.error} loading={!ready && data.loading} />
      {data.data?.templates.length === 0 && <p className="text-[#66766D]">Kịch bản này chưa có template.</p>}
      <div className="grid max-w-4xl gap-4">{data.data?.templates.map((t) => <TemplateCard key={t.id} t={t} />)}</div>
    </>
  );
}
