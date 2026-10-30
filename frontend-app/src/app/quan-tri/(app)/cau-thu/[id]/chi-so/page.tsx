'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import { fmtDateTime } from '@/lib/admin/labels';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, Card, Input, Loading, PageTitle, Table, Td, useUi } from '@/components/admin/ui';

interface Row { typeId: number; key: string; name: string; group: string | null; value: number; generatedAt?: string }
interface Type { id: number; attributeKey: string; attributeName: string; isHexagon: boolean; isGoalKeeper: boolean; attributeGroup: string | null }

export default function PlayerAttributesPage() {
  const { id } = useParams<{ id: string }>();
  const { toast, confirm } = useUi();
  const manager = useIsManager();
  const data = useApi<{
    fullName: string; hasSynthetic: boolean; hasReal: boolean; generationTimestamp: string | null;
    real: Row[]; synthetic: Row[]; types: Type[];
  }>(`players/${id}/attributes`);
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data.data) return;
    const v: Record<number, string> = {};
    data.data.real.forEach((r) => (v[r.typeId] = String(r.value)));
    setValues(v);
  }, [data.data]);

  async function act(path: string, ok: string, ask?: string) {
    if (ask && !(await confirm(ask))) return;
    setBusy(true);
    try {
      await api(`players/${id}/attributes/${path}`, { method: 'POST' });
      toast(ok);
      data.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    const body: Record<number, number> = {};
    for (const [k, v] of Object.entries(values)) if (v !== '') body[Number(k)] = Number(v);
    setBusy(true);
    try {
      await api(`players/${id}/attributes`, { method: 'PUT', body: { values: body } });
      toast('Đã lưu chỉ số thật');
      setEditing(false);
      data.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const d = data.data;
  return (
    <>
      <PageTitle title={`Chỉ số${d ? ` – ${d.fullName}` : ''}`} back={{ href: `/quan-tri/cau-thu/${id}`, label: 'Hồ sơ cầu thủ' }} />
      <Loading error={data.error} loading={data.loading && !d} />
      {d && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Chỉ số thật (nhập tay)">
            <div className="mb-3 flex items-center gap-2">
              <Badge tone={d.hasReal ? 'green' : 'gray'}>{d.hasReal ? 'Đã có' : 'Chưa có'}</Badge>
              {manager && !editing && <Button small onClick={() => setEditing(true)}>{d.hasReal ? 'Chỉnh sửa' : 'Nhập chỉ số'}</Button>}
            </div>
            {editing ? (
              <div className="space-y-2">
                {d.types.map((t) => (
                  <label key={t.id} className="flex items-center justify-between gap-3 text-[14px]">
                    <span>{t.attributeName} <span className="text-[11px] text-[#8FA597]">{t.attributeKey}{t.isGoalKeeper ? ' · thủ môn' : ''}</span></span>
                    <Input className="!w-24" type="number" min={0} max={100} value={values[t.id] ?? ''} onChange={(e) => setValues((v) => ({ ...v, [t.id]: e.target.value }))} />
                  </label>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button variant="primary" disabled={busy} onClick={save}>Lưu</Button>
                  <Button onClick={() => setEditing(false)}>Huỷ</Button>
                </div>
              </div>
            ) : d.hasReal ? (
              <Table head={['Chỉ số', 'Nhóm', 'Giá trị']}>
                {d.real.map((r) => (
                  <tr key={r.typeId}><Td>{r.name}</Td><Td className="text-[#8FA597]">{r.group || '—'}</Td><Td className="tabular-nums text-[#D6FA9E]">{r.value}</Td></tr>
                ))}
              </Table>
            ) : <p className="text-[14px] text-[#8FA597]">Chưa có chỉ số thật.</p>}
            {manager && d.hasReal && d.hasSynthetic && !editing && (
              <div className="mt-3"><Button small disabled={busy} onClick={() => act('switch-to-real', 'Đã xoá chỉ số giả lập', 'Xoá chỉ số giả lập và dùng chỉ số thật?')}>Dùng chỉ số thật (xoá giả lập)</Button></div>
            )}
          </Card>

          <Card title="Chỉ số giả lập (tự sinh)">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[13px]">
              <Badge tone={d.hasSynthetic ? 'green' : 'gray'}>{d.hasSynthetic ? 'Đã có' : 'Chưa có'}</Badge>
              {d.generationTimestamp && <span className="text-[#8FA597]">Tạo lúc {fmtDateTime(d.generationTimestamp)}</span>}
            </div>
            {d.hasSynthetic ? (
              <Table head={['Chỉ số', 'Giá trị']}>
                {d.synthetic.map((r) => (
                  <tr key={r.typeId}><Td>{r.name}</Td><Td className="tabular-nums text-[#D6FA9E]">{r.value}</Td></tr>
                ))}
              </Table>
            ) : <p className="text-[14px] text-[#8FA597]">Chưa có chỉ số giả lập.</p>}
            {manager && (
              <div className="mt-3 flex flex-wrap gap-2">
                <Button variant="primary" disabled={busy} onClick={() => act('generate', 'Đã tạo chỉ số giả lập', d.hasSynthetic ? 'Tạo lại chỉ số giả lập? Giá trị hiện tại sẽ bị thay.' : undefined)}>
                  {d.hasSynthetic ? 'Tạo lại' : 'Tạo chỉ số giả lập'}
                </Button>
                {d.hasReal && d.hasSynthetic && (
                  <Button disabled={busy} onClick={() => act('switch-to-synthetic', 'Đã chuyển sang chỉ số giả lập')}>Dùng chỉ số giả lập</Button>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
    </>
  );
}
