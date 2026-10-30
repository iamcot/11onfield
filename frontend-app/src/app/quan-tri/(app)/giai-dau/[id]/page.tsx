'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useIsManager } from '@/components/admin/me';
import { Button, Card, Field, Input, Loading, Select, Textarea, useUi } from '@/components/admin/ui';
import { COMP_STATUS } from '@/lib/admin/labels';

export default function CompetitionInfoPage() {
  const { id } = useParams<{ id: string }>();
  const manager = useIsManager();
  const { toast } = useUi();
  const comp = useApi<any>(`competitions/${id}`);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const c = comp.data;
    if (!c) return;
    setForm({
      title: c.title || '', description: c.description || '', status: c.status || 'DRAFT',
      registrationStartDate: c.registrationStartDate || '', registrationEndDate: c.registrationEndDate || '',
      competitionStartDate: c.competitionStartDate || '', competitionEndDate: c.competitionEndDate || '',
    });
  }, [comp.data]);

  const set = (k: string) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const locked = !!comp.data?.datesLocked;
  const readOnly = !manager;

  async function save() {
    if (!form.title.trim()) return toast('Cần nhập tên giải đấu', 'error');
    setSaving(true);
    try {
      await api(`competitions/${id}`, { method: 'PUT', body: form });
      toast('Đã lưu thông tin giải đấu');
      comp.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const c = comp.data;
  return (
    <>
      <CompetitionTabs id={id} title={c?.title} />
      <Loading error={comp.error} loading={comp.loading && !c} />
      {c && form.title !== undefined && (
        <div className="grid max-w-4xl gap-4 lg:grid-cols-[2fr_1fr]">
          <Card title="Thông tin chung">
            <div className="space-y-4">
              <Field label="Tên giải đấu *"><Input disabled={readOnly} value={form.title} onChange={set('title')} /></Field>
              <Field label="Mô tả"><Textarea disabled={readOnly} rows={5} value={form.description} onChange={set('description')} /></Field>
              <Field label="Trạng thái" hint="Chuyển vòng thi sẽ tự cập nhật trạng thái; chỉ đổi tay khi cần.">
                <Select disabled={readOnly} value={form.status} onChange={set('status')}>
                  {Object.entries(COMP_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mở đăng ký"><Input type="date" disabled={readOnly || locked} value={form.registrationStartDate} onChange={set('registrationStartDate')} /></Field>
                <Field label="Đóng đăng ký"><Input type="date" disabled={readOnly || locked} value={form.registrationEndDate} onChange={set('registrationEndDate')} /></Field>
                <Field label="Bắt đầu giải"><Input type="date" disabled={readOnly || locked} value={form.competitionStartDate} onChange={set('competitionStartDate')} /></Field>
                <Field label="Kết thúc giải"><Input type="date" disabled={readOnly} value={form.competitionEndDate} onChange={set('competitionEndDate')} /></Field>
              </div>
              {locked && <p className="text-[13px] text-[#66766D]">Giải đã bắt đầu nên không sửa được các ngày bắt đầu, chỉ sửa được ngày kết thúc.</p>}
              {manager ? (
                <Button variant="primary" disabled={saving} onClick={save}>{saving ? 'Đang lưu…' : 'Lưu'}</Button>
              ) : (
                <p className="text-[13px] text-[#66766D]">Chỉ Admin được sửa thông tin giải đấu.</p>
              )}
            </div>
          </Card>
          <Card title="Số liệu">
            <dl className="space-y-3 text-[14px]">
              {[['Thí sinh', c.participantCount], ['Vòng thi', c.stageCount], ['Tin tức', c.newsCount], ['Nhà tài trợ', c.sponsorCount]].map(([k, v]) => (
                <div key={k as string} className="flex justify-between border-b border-[#DCE5DF] pb-2"><dt className="text-[#46564D]">{k}</dt><dd className="tabular-nums">{v}</dd></div>
              ))}
            </dl>
          </Card>
        </div>
      )}
    </>
  );
}
