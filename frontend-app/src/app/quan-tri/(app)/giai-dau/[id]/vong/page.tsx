'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, Check, Field, Input, LinkButton, Loading, Modal, Select, Textarea, useUi } from '@/components/admin/ui';
import { fmtDate, REGIONS, STAGE_STATUS, STAGE_TYPES } from '@/lib/admin/labels';

interface Stage {
  id: number;
  stageNumber: number;
  title: string;
  description: string | null;
  stageDate: string | null;
  stageTime: string | null;
  stageType: string;
  region: string | null;
  status: string;
  isPublicScoring: boolean;
  daysCount: number;
  stepsCount: number;
  assessmentsCount: number;
}

const EMPTY = { title: '', description: '', stageDate: '', stageTime: '', stageType: 'REGIONAL_AUDITION', region: 'HANOI_NORTH', isPublicScoring: true };

export default function StagesPage() {
  const { id } = useParams<{ id: string }>();
  const manager = useIsManager();
  const { toast, confirm } = useUi();
  const data = useApi<{ liveStageNumber: number | null; nextUpcomingStageNumber: number | null; stages: Stage[] }>(`competitions/${id}/stages`);
  const [editing, setEditing] = useState<{ n: number | null; form: typeof EMPTY } | null>(null);
  const [busy, setBusy] = useState(false);

  async function act(n: number, action: 'activate' | 'deactivate', text: string) {
    if (!(await confirm(text))) return;
    try {
      const r = await api<{ message: string }>(`competitions/${id}/stages/${n}/${action}`, { method: 'POST' });
      toast(r?.message || 'Đã cập nhật');
      data.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function save() {
    if (!editing) return;
    const { n, form } = editing;
    if (!form.title.trim()) return toast('Cần nhập tên vòng thi', 'error');
    setBusy(true);
    try {
      await api(n === null ? `competitions/${id}/stages` : `competitions/${id}/stages/${n}`, { method: n === null ? 'POST' : 'PUT', body: form });
      toast(n === null ? 'Đã tạo vòng thi' : 'Đã lưu vòng thi');
      setEditing(null);
      data.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const live = data.data?.liveStageNumber ?? null;
  const next = data.data?.nextUpcomingStageNumber ?? null;
  const set = (k: keyof typeof EMPTY) => (v: string | boolean) => setEditing((e) => (e ? { ...e, form: { ...e.form, [k]: v } } : e));

  return (
    <>
      <CompetitionTabs id={id}>
        {manager && <Button variant="primary" onClick={() => setEditing({ n: null, form: EMPTY })}>+ Thêm vòng thi</Button>}
      </CompetitionTabs>
      <Loading error={data.error} loading={data.loading && !data.data} />
      {data.data && data.data.stages.length === 0 && <p className="text-[#66766D]">Chưa có vòng thi nào.</p>}
      <div className="space-y-3">
        {data.data?.stages.map((s) => {
          const st = STAGE_STATUS[s.status];
          const canRollback = s.status === 'COMPLETED' && live !== null && s.stageNumber === live - 1;
          return (
            <section key={s.id} className="rounded-lg border border-[#DCE5DF] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="tabular-nums text-[#66766D]">Vòng {s.stageNumber}</span>
                    <Badge tone={st?.tone || 'gray'}>{st?.label || s.status}</Badge>
                    {!s.isPublicScoring && <Badge>Nội bộ</Badge>}
                  </div>
                  <h3 className="mt-1 text-[16px] font-semibold">{s.title}</h3>
                  <p className="mt-1 text-[13px] text-[#46564D]">
                    {STAGE_TYPES[s.stageType] || s.stageType}
                    {s.region ? ` · ${REGIONS[s.region] || s.region}` : ''} ·{' '}
                    {s.stageDate ? fmtDate(s.stageDate) : <span className="text-[#8A5A00]">Đang cập nhật</span>}
                    {s.stageTime ? ` · ${s.stageTime}` : ''}
                  </p>
                  <p className="mt-1 text-[12px] text-[#66766D]">Cấu trúc chấm: {s.daysCount} ngày · {s.stepsCount} bước · {s.assessmentsCount} bài</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <LinkButton small href={`/quan-tri/giai-dau/${id}/vong/${s.stageNumber}`}>Cấu trúc chấm</LinkButton>
                  <LinkButton small href={`/quan-tri/giai-dau/${id}/vong/${s.stageNumber}/ket-qua`}>Kết quả</LinkButton>
                  {manager && (
                    <>
                      <Button small onClick={() => setEditing({ n: s.stageNumber, form: { ...EMPTY, title: s.title, description: s.description || '', stageDate: s.stageDate || '', stageTime: s.stageTime || '', stageType: s.stageType, region: s.region || '', isPublicScoring: s.isPublicScoring } })}>Sửa</Button>
                      {s.status === 'LIVE' && <Button small variant="danger" onClick={() => act(s.stageNumber, 'deactivate', `Đặt vòng ${s.stageNumber} về “Sắp diễn ra”?`)}>Dừng</Button>}
                      {s.status === 'UPCOMING' && s.stageNumber === next && <Button small variant="primary" onClick={() => act(s.stageNumber, 'activate', `Kích hoạt vòng ${s.stageNumber}? Vòng đang diễn ra (nếu có) sẽ chuyển thành “Đã xong”.`)}>Kích hoạt</Button>}
                      {canRollback && <Button small onClick={() => act(s.stageNumber, 'activate', `Mở lại vòng ${s.stageNumber}? Vòng ${live} sẽ trở về “Sắp diễn ra”.`)}>Mở lại</Button>}
                    </>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {editing && (
        <Modal title={editing.n === null ? 'Thêm vòng thi' : `Sửa vòng ${editing.n}`} onClose={() => setEditing(null)}>
          <div className="space-y-4">
            <Field label="Tên vòng *"><Input value={editing.form.title} onChange={(e) => set('title')(e.target.value)} /></Field>
            <Field label="Mô tả"><Textarea value={editing.form.description} onChange={(e) => set('description')(e.target.value)} /></Field>
            {editing.n === null && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Loại vòng">
                  <Select value={editing.form.stageType} onChange={(e) => { set('stageType')(e.target.value); set('isPublicScoring')(e.target.value !== 'TRAINING_EPISODE'); }}>
                    {Object.entries(STAGE_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </Field>
                <Field label="Khu vực" hint="Bỏ trống nếu áp dụng toàn giải">
                  <Select value={editing.form.region} onChange={(e) => set('region')(e.target.value)}>
                    <option value="">— Không —</option>
                    {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </Select>
                </Field>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ngày" hint="Để trống nếu chưa chốt — website sẽ hiện “Đang cập nhật”">
                <Input type="date" value={editing.form.stageDate} onChange={(e) => set('stageDate')(e.target.value)} />
              </Field>
              <Field label="Giờ"><Input placeholder="08:00" value={editing.form.stageTime} onChange={(e) => set('stageTime')(e.target.value)} /></Field>
            </div>
            <Check label="Công khai điểm và kết quả cho thí sinh" checked={editing.form.isPublicScoring} onChange={(v) => set('isPublicScoring')(v)} />
            <div className="flex justify-end gap-2">
              <Button onClick={() => setEditing(null)}>Huỷ</Button>
              <Button variant="primary" disabled={busy} onClick={save}>{busy ? 'Đang lưu…' : 'Lưu'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
