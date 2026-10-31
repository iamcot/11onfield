'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api, useApi } from '@/lib/admin/client';
import CompetitionTabs from '@/components/admin/CompetitionTabs';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, Card, Loading, Select, Table, Td, Toggle, useUi } from '@/components/admin/ui';

interface Policy { dataGroup: string; maxLevel: string; ownerCanHide: boolean; locked: boolean; canOwnerHide: boolean; gated: boolean; defaultLevel: string }
interface StageRow { id: number; stageNumber: number; title: string; resultsReleaseAt: string | null }
interface Visibility { policies: Policy[]; stages: StageRow[] }

const GROUPS: Record<string, { label: string; hint: string }> = {
  IDENTITY: { label: 'Danh tính', hint: 'Tên, ảnh, vị trí, vùng, SBD' },
  BODY_BASIC: { label: 'Chiều cao, cân nặng', hint: '' },
  BODY_COMPOSITION: { label: 'Thành phần cơ thể', hint: 'InBody' },
  MEDICAL: { label: 'Y tế', hint: 'Khoá ở "Chỉ BTC"' },
  TEST_RESULTS: { label: 'Số đo gốc từng bài', hint: 'Kèm màu từng bài' },
  COMBINE_HEX: { label: 'Hexagon 6 trục', hint: '' },
  SCORE_TOTAL: { label: 'Điểm tổng, xếp loại', hint: '' },
  RANK: { label: 'Thứ hạng theo điểm', hint: 'Khoá: chỉ BTC/BGK, không bao giờ ra ngoài admin' },
  JUDGE_NOTES: { label: 'Ghi nhận của BGK', hint: '' },
  MATCH_STATS: { label: 'Thống kê trận, heatmap', hint: '' },
  GREEN_CARD: { label: 'Green Card', hint: '' },
  DISCIPLINE: { label: 'Kỷ luật', hint: '' },
};
const LEVELS = [
  { value: 'HIDDEN', label: 'Chỉ BTC' },
  { value: 'PRIVATE', label: 'Chính chủ + BTC' },
  { value: 'PUBLIC', label: 'Công khai' },
];
const ORDER = ['HIDDEN', 'PRIVATE', 'PUBLIC'];

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('vi-VN') : null);
const released = (iso: string | null) => !!iso && new Date(iso).getTime() <= Date.now();

export default function VisibilityPage() {
  const { id } = useParams<{ id: string }>();
  const manager = useIsManager();
  const { toast, confirm } = useUi();
  const [stageId, setStageId] = useState('');
  const data = useApi<Visibility>(`competitions/${id}/visibility${stageId ? `?stageId=${stageId}` : ''}`);
  const [busy, setBusy] = useState('');

  async function save(p: Policy, patch: Partial<Policy>) {
    const next = { ...p, ...patch };
    setBusy(p.dataGroup);
    try {
      await api(`competitions/${id}/visibility${stageId ? `?stageId=${stageId}` : ''}`, { method: 'PUT', body: { dataGroup: next.dataGroup, maxLevel: next.maxLevel, ownerCanHide: next.ownerCanHide } });
      data.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy('');
    }
  }

  async function release(s: StageRow, action: 'now' | 'undo') {
    if (action === 'now' && !(await confirm(`Phát hành kết quả "${s.title}" ngay bây giờ? Hexagon và điểm tổng sẽ công khai theo bảng bên trên.`))) return;
    try {
      await api(`competitions/${id}/stages/${s.stageNumber}/release`, { body: action === 'undo' ? { release: false } : {} });
      toast(action === 'undo' ? 'Đã thu hồi' : 'Đã phát hành');
      data.reload();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <>
      <CompetitionTabs id={id} />
      <p className="mb-4 max-w-3xl text-[13px] text-[#46564D]">
        Chọn mức công khai tối đa cho từng nhóm dữ liệu trên trang cầu thủ. Cầu thủ chỉ hạ mức xuống được, không nâng lên. Nhóm hexagon, điểm tổng và số đo
        gốc chỉ ra ngoài sau khi vòng được phát hành; trước đó chỉ chính chủ và BTC thấy.
      </p>
      <Loading error={data.error} loading={data.loading && !data.data} />
      {data.data && (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <Card title="Nhóm dữ liệu × mức xem">
            <div className="mb-3 max-w-xs">
              <Select value={stageId} onChange={(e) => setStageId(e.target.value)} aria-label="Phạm vi áp dụng">
                <option value="">Cả giải (mặc định)</option>
                {data.data.stages.map((s) => (
                  <option key={s.id} value={s.id}>Riêng {s.title}</option>
                ))}
              </Select>
            </div>
            <Table head={['Nhóm', 'Mức tối đa', 'Cầu thủ tự ẩn']}>
              {data.data.policies.map((p) => {
                const g = GROUPS[p.dataGroup] ?? { label: p.dataGroup, hint: '' };
                return (
                  <tr key={p.dataGroup}>
                    <Td>
                      <div className="font-medium">{g.label}</div>
                      {g.hint && <div className="text-[12px] text-[#66766D]">{g.hint}</div>}
                      {p.gated && <Badge tone="gold">Sau phát hành</Badge>}
                    </Td>
                    <Td>
                      <Select
                        value={p.maxLevel}
                        disabled={!manager || busy === p.dataGroup || (p.locked && p.defaultLevel === 'HIDDEN')}
                        onChange={(e) => save(p, { maxLevel: e.target.value })}
                        aria-label={`Mức tối đa: ${g.label}`}
                      >
                        {LEVELS.filter((l) => !p.locked || ORDER.indexOf(l.value) <= ORDER.indexOf(p.defaultLevel)).map((l) => (
                          <option key={l.value} value={l.value}>{l.label}</option>
                        ))}
                      </Select>
                    </Td>
                    <Td>
                      {p.canOwnerHide ? (
                        <Toggle checked={p.ownerCanHide} disabled={!manager || busy === p.dataGroup} label={`Cho cầu thủ tự ẩn: ${g.label}`} onChange={(v) => save(p, { ownerCanHide: v })} />
                      ) : (
                        <span className="text-[12px] text-[#66766D]">Không</span>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </Table>
          </Card>

          <Card title="Phát hành kết quả theo vòng">
            <ul className="divide-y divide-[#E6ECE8]">
              {data.data.stages.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 py-3 text-[14px]">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-[12px] text-[#66766D]">
                      {s.resultsReleaseAt ? (released(s.resultsReleaseAt) ? `Đã phát hành ${fmt(s.resultsReleaseAt)}` : `Hẹn phát hành ${fmt(s.resultsReleaseAt)}`) : 'Chưa phát hành'}
                    </div>
                  </div>
                  <Badge tone={released(s.resultsReleaseAt) ? 'green' : 'gray'}>{released(s.resultsReleaseAt) ? 'Công khai' : 'Đang giữ'}</Badge>
                  {manager && (s.resultsReleaseAt ? (
                    <Button small variant="danger" onClick={() => release(s, 'undo')}>Thu hồi</Button>
                  ) : (
                    <Button small variant="primary" onClick={() => release(s, 'now')}>Phát hành ngay</Button>
                  ))}
                </li>
              ))}
              {data.data.stages.length === 0 && <li className="py-4 text-[#66766D]">Giải chưa có vòng nào.</li>}
            </ul>
          </Card>
        </div>
      )}
    </>
  );
}
