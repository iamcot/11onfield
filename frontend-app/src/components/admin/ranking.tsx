'use client';

import { useMemo } from 'react';
import { useApi } from '@/lib/admin/client';
import { Badge, Select } from '@/components/admin/ui';
import { POSITIONS, REGIONS } from '@/lib/admin/labels';

export interface RankComponent { key: string; label: string; type: string; raw: number | null; points: number | null; present: boolean }
export interface RankRow {
  rank: number; tied: boolean; participantId: number; sbd: number; fullName: string; region: string | null; positions: string | null;
  goalkeeper: boolean; total: number | null; complete: boolean; classification: string | null;
  components: RankComponent[] | null; medicalOut: boolean; lowPerformance: boolean; disciplineCount: number; greenCard: boolean; votes: number;
}

export type Group = 'ALL' | 'OUTFIELD' | 'GOALKEEPER';
export const GROUPS: { key: Group; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'OUTFIELD', label: 'Cầu thủ' },
  { key: 'GOALKEEPER', label: 'Thủ môn' },
];

/** The ranking of the whole competition (all regions, all stages). Ranks are always the combined ones the API gives. */
export function useRanking(id: string, region: string) {
  return useApi<RankRow[]>(`competitions/${id}/ranking${region ? `?region=${region}` : ''}`);
}

export const fmt = (n: number | null | undefined, digits = 1) => (n == null ? '—' : Number(n).toFixed(digits).replace('.', ','));
export const positionLabel = (p: string | null) => (p ? p.split(',').map((x) => POSITIONS[x.trim().toLowerCase()] || x.trim()).join(', ') : '—');

/** Group switch + region filter shared by the ranking and selection pages. */
export function RankFilters({ group, onGroup, region, onRegion }: { group: Group; onGroup: (g: Group) => void; region: string; onRegion: (r: string) => void }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <div role="tablist" className="flex rounded-lg bg-[#E6ECE8] p-0.5">
        {GROUPS.map((g) => (
          <button
            key={g.key}
            type="button"
            role="tab"
            aria-selected={group === g.key}
            onClick={() => onGroup(g.key)}
            className={`rounded-md px-3.5 py-1.5 text-[14px] ${group === g.key ? 'bg-white font-semibold shadow-sm' : 'text-[#46564D]'}`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <label className="flex items-center gap-2 text-[14px] text-[#46564D]">
        Khu vực
        <Select value={region} onChange={(e) => onRegion(e.target.value)} className="!w-auto">
          <option value="">Cả 3 khu vực</option>
          {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </label>
    </div>
  );
}

export const inGroup = (r: RankRow, g: Group) => g === 'ALL' || (g === 'GOALKEEPER' ? r.goalkeeper : !r.goalkeeper);

/** Component columns (label + key) in the order the rows give them. */
export function useColumns(rows: RankRow[] | null) {
  return useMemo(() => {
    const seen = new Map<string, string>();
    rows?.forEach((r) => r.components?.forEach((c) => seen.has(c.key) || seen.set(c.key, c.label)));
    return Array.from(seen, ([key, label]) => ({ key, label }));
  }, [rows]);
}

export function ComponentCell({ row, k }: { row: RankRow; k: string }) {
  const c = row.components?.find((x) => x.key === k);
  if (!c || !c.present) return <span className="text-[#9AA8A0]">—</span>;
  return <span className="tabular-nums">{fmt(c.points)}</span>;
}

export function TotalCell({ row }: { row: RankRow }) {
  if (!row.complete) return <Badge tone="gold">chưa đủ</Badge>;
  return <strong className="tabular-nums">{fmt(row.total)}</strong>;
}

export function FlagBadges({ row }: { row: RankRow }) {
  return (
    <span className="flex flex-wrap gap-1">
      {row.greenCard && <Badge tone="green">Green Card</Badge>}
      {row.medicalOut && <Badge tone="red">Y tế</Badge>}
      {row.lowPerformance && <Badge tone="gold">Low Performance</Badge>}
      {row.disciplineCount > 0 && <Badge tone="gold">Kỷ luật ×{row.disciplineCount}</Badge>}
    </span>
  );
}

export const RankCell = ({ row }: { row: RankRow }) => (
  <span className="flex items-center gap-1.5">
    <strong className="tabular-nums">{row.rank}</strong>
    {row.tied && <span title="Đồng hạng thật sau mọi tiêu chí: BGK quyết" className="rounded bg-[#F2C94C] px-1.5 text-[10px] font-semibold uppercase text-[#5C3D00]">đồng hạng</span>}
  </span>
);
