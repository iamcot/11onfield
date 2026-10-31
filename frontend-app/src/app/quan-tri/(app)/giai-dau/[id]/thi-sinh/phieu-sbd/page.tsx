'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';
import { useApi } from '@/lib/admin/client';
import { Button, Loading, Select } from '@/components/admin/ui';
import { REGIONS } from '@/lib/admin/labels';

interface Contestant { id: number; sbd: number; fullName: string; status: string; region: string | null }

/** The QR holds the competition and the number only, never personal data. */
const sbdQrText = (competitionId: string, sbd: number) => `11OF:SBD:${competitionId}:${sbd}`;

export default function BibSheetsPage() {
  const { id } = useParams<{ id: string }>();
  const only = useSearchParams().get('sbd');
  const list = useApi<Contestant[]>(`competitions/${id}/contestants`);
  const comps = useApi<{ id: number; title: string }[]>('competitions');
  const [region, setRegion] = useState('');
  const [qr, setQr] = useState<Record<number, string>>({});

  const rows = useMemo(
    () => (list.data || []).filter((c) => c.status !== 'WITHDRAWN' && (!only || String(c.sbd) === only) && (!region || c.region === region)),
    [list.data, only, region],
  );

  useEffect(() => {
    let alive = true;
    Promise.all(rows.map((c) => QRCode.toDataURL(sbdQrText(id, c.sbd), { margin: 1, width: 240, errorCorrectionLevel: 'M' }).then((u) => [c.sbd, u] as const)))
      .then((pairs) => alive && setQr(Object.fromEntries(pairs)))
      .catch(() => alive && setQr({}));
    return () => { alive = false; };
  }, [rows, id]);

  const title = comps.data?.find((c) => String(c.id) === id)?.title || '';

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3 print:hidden">
        <h1 className="text-[22px] font-semibold text-[#0F2A1C]">Phiếu số báo danh</h1>
        <span className="text-[13px] text-[#46564D]">{rows.length} phiếu · 8 phiếu mỗi tờ A4</span>
        <div className="ml-auto flex items-center gap-2">
          {!only && (
            <Select value={region} onChange={(e) => setRegion(e.target.value)}>
              <option value="">Mọi khu vực</option>
              {Object.entries(REGIONS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          )}
          <Button variant="primary" onClick={() => window.print()}>In phiếu</Button>
        </div>
      </div>
      <Loading error={list.error} loading={list.loading && !list.data} />
      <style>{'@page { size: A4; margin: 8mm; }'}</style>
      <div className="grid grid-cols-2 gap-3 print:gap-0">
        {rows.map((c) => (
          <div key={c.id} className="flex h-[66mm] break-inside-avoid items-center gap-4 border border-dashed border-[#8FA597] bg-white p-4">
            {qr[c.sbd] ? <img src={qr[c.sbd]} alt={`QR SBD ${c.sbd}`} className="h-[42mm] w-[42mm] shrink-0" /> : <div className="h-[42mm] w-[42mm] shrink-0" />}
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#46564D]">{title}</div>
              <div className="mt-1 text-[11px] uppercase tracking-wider text-[#46564D]">Số báo danh</div>
              <div className="text-[64px] font-bold leading-none tabular-nums text-[#0F2A1C]">{c.sbd}</div>
              <div className="mt-2 truncate text-[15px] font-medium">{c.fullName}</div>
              {c.region && <div className="text-[12px] text-[#46564D]">{REGIONS[c.region] || c.region}</div>}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
