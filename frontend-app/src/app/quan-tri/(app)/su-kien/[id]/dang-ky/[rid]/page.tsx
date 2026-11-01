'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/admin/client';
import { REG_STATUS, fmtDate, fmtDateTime } from '@/lib/admin/labels';
import { Badge, Button, Loading, PageTitle, useUi } from '@/components/admin/ui';

interface Answer { id: string; type: string; label: string; value: string | null }
interface Registration {
  id: number;
  status: 'SUBMITTED' | 'FORWARDED';
  answers: Answer[];
  createdAt: string;
  updatedAt: string;
  forwardedAt: string | null;
  forwardedBy: string | null;
  event: { id: number; title: string; partnerName: string | null; startDate: string; endDate: string; location: string | null };
  user: { userid: string; fullName: string; avatar: string | null; phone: string | null; email: string | null };
}

const show = (a: Answer) => (a.type === 'date' && a.value ? fmtDate(a.value) : a.value || '');

/** One application on an A4 page, the way the recruiting unit receives it. */
function Sheet({ r }: { r: Registration }) {
  const photos = r.answers.filter((a) => a.type === 'image' && a.value);
  const rows = r.answers.filter((a) => a.type !== 'image');
  return (
    <article className="mx-auto max-w-[800px] bg-white p-8 shadow-sm print:max-w-none print:p-0 print:shadow-none [&:not(:last-child)]:break-after-page">
      <header className="flex items-start justify-between gap-4 border-b-2 border-[#1a5c2a] pb-3">
        <img src="/images/logo-color-full.png" alt="11 On Field" className="h-9 w-auto" />
        <div className="text-right text-[12px] text-[#46564D]">
          <div>Mã hồ sơ: <strong className="text-[#10231A]">#{String(r.id).padStart(6, '0')}</strong></div>
          <div>Nộp lúc: {fmtDateTime(r.updatedAt)}</div>
        </div>
      </header>

      <div className="mt-5 text-center">
        <h2 className="text-[20px] font-bold uppercase tracking-wide text-[#10231A]">Hồ sơ đăng ký tuyển sinh</h2>
        <div className="mt-1 text-[15px] font-semibold text-[#1a5c2a]">{r.event.title}</div>
        {r.event.partnerName && <div className="mt-0.5 text-[13px] text-[#46564D]">Kính gửi: {r.event.partnerName}</div>}
      </div>

      <div className="mt-6 flex gap-5">
        <table className="w-full flex-1 border-collapse text-[13px]">
          <tbody>
            {rows.map((a) =>
              a.type === 'heading' ? (
                <tr key={a.id} className="break-inside-avoid">
                  <td colSpan={2} className="bg-[#EEF3EF] px-2 py-1.5 text-[12px] font-bold uppercase tracking-wider text-[#1a5c2a] print:bg-[#EEF3EF]">{a.label}</td>
                </tr>
              ) : (
                <tr key={a.id} className="break-inside-avoid">
                  <td className="w-[38%] border border-[#B9C8BF] px-2 py-1.5 align-top text-[#46564D]">{a.label}</td>
                  <td className="whitespace-pre-wrap break-words border border-[#B9C8BF] px-2 py-1.5 align-top font-medium text-[#10231A]">
                    {a.type === 'link' && a.value ? <a href={a.value} className="text-[#1a5c2a] underline">{a.value}</a> : show(a) || '—'}
                  </td>
                </tr>
              ),
            )}
          </tbody>
        </table>
        {photos.length > 0 && (
          <div className="flex w-[150px] shrink-0 flex-col gap-3">
            {photos.map((p) => (
              <figure key={p.id} className="break-inside-avoid">
                <img src={p.value!} alt={p.label} className="w-full border border-[#B9C8BF] object-cover" />
                <figcaption className="mt-1 text-center text-[11px] text-[#66766D]">{p.label}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>

      <footer className="mt-8 border-t border-[#DCE5DF] pt-2 text-[11px] text-[#66766D]">
        Hồ sơ do cầu thủ tự khai trên nền tảng 11 On Field và được 11of chuyển tới đơn vị tuyển sinh. Xuất ngày {new Date().toLocaleDateString('vi-VN')}.
      </footer>
    </article>
  );
}

/**
 * Application page: "Tải PDF" prints it (choose "Lưu thành PDF"), then "Đánh dấu đã chuyển" emails the player.
 * `dang-ky/in?ids=1,2,3` prints several applications, one per page.
 */
export default function RegistrationPage() {
  const { id, rid } = useParams<{ id: string; rid: string }>();
  const search = useSearchParams();
  const { toast, confirm } = useUi();
  const ids = rid === 'in' ? (search.get('ids') || '').split(',').filter((x) => /^\d+$/.test(x)) : [rid];
  const key = ids.join(',');
  const [data, setData] = useState<Registration[] | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setData(await Promise.all(key.split(',').filter(Boolean).map((x) => api<Registration>(`event-registrations/${x}`))));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [key]);
  useEffect(() => { load(); }, [load]);

  const single = data && data.length === 1 ? data[0] : null;

  // the print dialog names the PDF after the page title
  useEffect(() => {
    if (!data || data.length === 0) return;
    const before = document.title;
    document.title = single ? `Ho so ${single.user.fullName} - ${single.event.title}` : `Ho so ${data[0].event.title} (${data.length})`;
    return () => { document.title = before; };
  }, [data, single]);

  async function forward() {
    if (!single) return;
    const partner = single.event.partnerName || 'đơn vị tuyển sinh';
    if (!(await confirm(`Xác nhận đã gửi hồ sơ của ${single.user.fullName} tới ${partner}? Cầu thủ sẽ nhận email báo hồ sơ đã được chuyển.`))) return;
    setBusy(true);
    try {
      setData([await api<Registration>(`event-registrations/${single.id}/forward`, { method: 'POST' })]);
      toast('Đã đánh dấu đã chuyển và gửi email cho cầu thủ');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  async function unforward() {
    if (!single) return;
    if (!(await confirm('Đưa hồ sơ về trạng thái chờ chuyển? Cầu thủ không được báo lại.'))) return;
    setBusy(true);
    try {
      setData([await api<Registration>(`event-registrations/${single.id}/unforward`, { method: 'POST' })]);
      toast('Hồ sơ đã về trạng thái chờ chuyển');
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <style>{'@page { size: A4; margin: 14mm; } @media print { * { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }'}</style>
      <div className="print:hidden">
        <PageTitle
          title={single ? `Hồ sơ của ${single.user.fullName}` : `In ${ids.length} hồ sơ`}
          back={{ href: `/quan-tri/su-kien/${id}/dang-ky`, label: 'Danh sách hồ sơ' }}
        >
          <Button onClick={() => window.print()} disabled={!data}>Tải PDF</Button>
          {single?.status === 'SUBMITTED' && <Button variant="primary" disabled={busy} onClick={forward}>Đánh dấu đã chuyển</Button>}
          {single?.status === 'FORWARDED' && <Button disabled={busy} onClick={unforward}>Hoàn tác</Button>}
        </PageTitle>
        {single && (
          <div className="mb-4 flex flex-wrap items-center gap-2 text-[13px] text-[#46564D]">
            <Badge tone={REG_STATUS[single.status].tone}>{REG_STATUS[single.status].label}</Badge>
            {single.status === 'FORWARDED'
              ? <span>lúc {fmtDateTime(single.forwardedAt)}{single.forwardedBy ? ` bởi ${single.forwardedBy}` : ''}</span>
              : <span>Bấm “Tải PDF”, chọn “Lưu thành PDF” trong hộp thoại in, gửi file cho đơn vị rồi đánh dấu đã chuyển.</span>}
          </div>
        )}
      </div>
      <Loading error={error} loading={!data && !error} />
      {data && <div className="space-y-6 print:space-y-0">{data.map((r) => <Sheet key={r.id} r={r} />)}</div>}
    </>
  );
}
