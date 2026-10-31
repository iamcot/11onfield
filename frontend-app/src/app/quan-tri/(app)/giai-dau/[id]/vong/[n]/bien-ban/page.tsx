'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useApi } from '@/lib/admin/client';
import { Button, Loading } from '@/components/admin/ui';

interface Contestant { id: number; sbd: number; userId: number; fullName: string; status: string }
interface Result { userId: number; score: number | null; rankPosition: number | null; performanceNotes: string | null }

const SIGNERS = ['Trưởng ban giám khảo', 'Thư ký', 'Đại diện Ban tổ chức'];

/** Printable ranking minutes of one stage; "Lưu thành PDF" in the print dialog gives the PDF. */
export default function StageMinutesPage() {
  const { id, n } = useParams<{ id: string; n: string }>();
  const results = useApi<Result[]>(`competitions/${id}/stages/${n}/results`);
  const contestants = useApi<Contestant[]>(`competitions/${id}/contestants`);
  const comps = useApi<{ id: number; title: string }[]>('competitions');

  const rows = useMemo(() => {
    const byUser = new Map((results.data || []).map((r) => [r.userId, r]));
    return (contestants.data || [])
      .map((c) => ({ c, r: byUser.get(c.userId) }))
      .filter(({ c, r }) => c.status !== 'WITHDRAWN' && r && (r.score != null || r.rankPosition != null))
      .sort((a, b) => (a.r?.rankPosition ?? 1e9) - (b.r?.rankPosition ?? 1e9) || (b.r?.score ?? 0) - (a.r?.score ?? 0) || a.c.sbd - b.c.sbd);
  }, [results.data, contestants.data]);

  const title = comps.data?.find((c) => String(c.id) === id)?.title || '';
  const today = new Date().toLocaleDateString('vi-VN');

  return (
    <>
      <div className="mb-4 flex items-center justify-between print:hidden">
        <h1 className="text-[22px] font-semibold text-[#0F2A1C]">Biên bản vòng {n}</h1>
        <Button variant="primary" onClick={() => window.print()}>In / Lưu thành PDF</Button>
      </div>
      <Loading error={results.error || contestants.error} loading={(results.loading || contestants.loading) && !results.data} />
      <style>{'@page { size: A4; margin: 15mm; }'}</style>
      {results.data && contestants.data && (
        <div className="bg-white p-6 print:p-0">
          <div className="text-center">
            <div className="text-[13px] uppercase tracking-wider text-[#46564D]">{title}</div>
            <h2 className="mt-1 text-[22px] font-bold uppercase">Biên bản kết quả vòng {n}</h2>
            <div className="mt-1 text-[13px] text-[#46564D]">Ngày lập: {today} · Tổng {rows.length} thí sinh có kết quả</div>
          </div>
          <table className="mt-5 w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-[#EEF3EF] print:bg-transparent">
                {['Hạng', 'SBD', 'Thí sinh', 'Điểm', 'Nhận xét'].map((h) => <th key={h} className="border border-[#8FA597] px-2 py-1.5 text-left">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(({ c, r }) => (
                <tr key={c.id} className="break-inside-avoid">
                  <td className="border border-[#8FA597] px-2 py-1 tabular-nums">{r?.rankPosition ?? '—'}</td>
                  <td className="border border-[#8FA597] px-2 py-1 tabular-nums">{c.sbd}</td>
                  <td className="border border-[#8FA597] px-2 py-1">{c.fullName}</td>
                  <td className="border border-[#8FA597] px-2 py-1 tabular-nums">{r?.score != null ? Number(r.score).toFixed(2) : '—'}</td>
                  <td className="border border-[#8FA597] px-2 py-1">{r?.performanceNotes || ''}</td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={5} className="border border-[#8FA597] px-2 py-4 text-center text-[#46564D]">Chưa có kết quả.</td></tr>}
            </tbody>
          </table>
          <div className="mt-8 grid grid-cols-3 gap-4 break-inside-avoid text-center text-[13px]">
            {SIGNERS.map((s) => (
              <div key={s}>
                <div className="font-semibold">{s}</div>
                <div className="text-[11px] text-[#46564D]">(Ký, ghi rõ họ tên)</div>
                <div className="h-24" />
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
