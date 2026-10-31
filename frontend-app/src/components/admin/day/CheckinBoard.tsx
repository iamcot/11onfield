'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { api, useApi } from '@/lib/admin/client';
import { useIsManager } from '@/components/admin/me';
import { Badge, Button, Card, Loading, PageTitle, Select, Table, Td, useUi } from '@/components/admin/ui';
import { fmtDate, fmtDateTime, REGIONS } from '@/lib/admin/labels';

interface StageRow {
  id: number; stageNumber: number; title: string; stageType: string; region: string | null; stageDate: string | null;
  competitionId: number; competitionTitle: string; open: boolean | number; checkins: number;
}
interface Checkin { participantId: number; sbd: number; fullName: string; phone: string | null; checkedInAt: string; movedOn: boolean | number | null }
interface StageState { qr: { code: string; url: string; secondsLeft: number } | null; windowSeconds: number; checkins: Checkin[] }

const STORE_KEY = 'admin:checkin-stage';
const POLL_MS = 3000;

export default function CheckinBoard({ fixedStageId }: { fixedStageId?: number }) {
  const { toast, confirm } = useUi();
  const manager = useIsManager();
  const stages = useApi<StageRow[]>('checkin/stages');
  const [stageId, setStageId] = useState<number | null>(null);
  const state = useApi<StageState>(stageId ? `checkin/stages/${stageId}` : null);
  const [qrImage, setQrImage] = useState('');
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState<Set<number>>(new Set());
  const seen = useRef<Set<number> | null>(null);
  const qrBox = useRef<HTMLDivElement>(null);

  // Default stage: the one used last on this device, else an open one, else the first regional audition.
  useEffect(() => {
    if (fixedStageId) {
      if (stageId !== fixedStageId) setStageId(fixedStageId);
      return;
    }
    if (!stages.data || stageId) return;
    let saved: number | null = null;
    try { saved = Number(localStorage.getItem(STORE_KEY)) || null; } catch {}
    const pick = stages.data.find((s) => s.id === saved) || stages.data.find((s) => !!s.open) || stages.data[0];
    if (pick) setStageId(pick.id);
  }, [stages.data, stageId, fixedStageId]);

  const choose = (id: number) => {
    setStageId(id);
    state.setData(null);
    seen.current = null;
    try { localStorage.setItem(STORE_KEY, String(id)); } catch {}
  };

  // Poll the QR and the list.
  const { reload } = state;
  useEffect(() => {
    if (!stageId) return;
    const t = setInterval(reload, POLL_MS);
    return () => clearInterval(t);
  }, [stageId, reload]);

  // Built from the address the admin opened (e.g. an ngrok tunnel), so the phone reaches the same site;
  // the backend's url (FRONTEND_URL) is only a fallback.
  const code = state.data?.qr?.code;
  const url = code ? `${window.location.origin}/check-in?c=${encodeURIComponent(code)}` : state.data?.qr?.url;
  useEffect(() => {
    if (!url) return setQrImage('');
    QRCode.toDataURL(url, { margin: 1, width: 720, errorCorrectionLevel: 'M' }).then(setQrImage).catch(() => setQrImage(''));
  }, [url]);

  // Countdown until the code changes; the poll brings the next one.
  useEffect(() => {
    if (!state.data?.qr) return;
    setLeft(state.data.qr.secondsLeft);
    const t = setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => clearInterval(t);
  }, [state.data?.qr]);

  // Highlight people who just checked in.
  useEffect(() => {
    const list = state.data?.checkins;
    if (!list) return;
    const ids = new Set(list.map((c) => c.participantId));
    if (seen.current) {
      const added = list.filter((c) => !seen.current!.has(c.participantId)).map((c) => c.participantId);
      if (added.length) {
        setFresh(new Set(added));
        setTimeout(() => setFresh(new Set()), 4000);
      }
    }
    seen.current = ids;
  }, [state.data?.checkins]);

  const stage = useMemo(() => stages.data?.find((s) => s.id === stageId), [stages.data, stageId]);
  const open = !!state.data?.qr;

  async function toggle() {
    if (!stage) return;
    if (open && !(await confirm(`Đóng check-in cho ${stage.title}? Mã QR sẽ ngừng hoạt động.`))) return;
    setBusy(true);
    try {
      await api(`checkin/stages/${stage.id}/${open ? 'close' : 'open'}`, { method: 'POST' });
      toast(open ? 'Đã đóng check-in' : 'Đã mở check-in');
      await Promise.all([state.reload(), stages.reload()]);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
    }
  }

  const fullscreen = () => qrBox.current?.requestFullscreen?.().catch(() => {});
  const label = (s: StageRow) =>
    `Vòng ${s.stageNumber} · ${s.title}${s.region ? ` · ${REGIONS[s.region] || s.region}` : ''}${s.stageDate ? ` · ${fmtDate(s.stageDate)}` : ''}${s.open ? ' (đang mở)' : ''}`;
  const competitions = useMemo(() => Array.from(new Set((stages.data || []).map((s) => s.competitionTitle))), [stages.data]);

  return (
    <>
      {!fixedStageId && <PageTitle title="Check-in tuyển trạch">
        <Select className="!w-[420px] max-w-full" value={stageId ?? ''} onChange={(e) => choose(Number(e.target.value))} aria-label="Chọn vòng">
          {competitions.map((ct) => (
            <optgroup key={ct} label={ct}>
              {stages.data!.filter((s) => s.competitionTitle === ct).map((s) => <option key={s.id} value={s.id}>{label(s)}</option>)}
            </optgroup>
          ))}
        </Select>
      </PageTitle>}
      <Loading error={stages.error} loading={stages.loading && !stages.data} />
      {stages.data && stages.data.length === 0 && <p className="text-[#66766D]">Chưa có giải đấu nào đang diễn ra.</p>}

      {stage && (
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,460px)_1fr]">
          <Card>
            <div ref={qrBox} className="flex flex-col items-center bg-white text-center [&:fullscreen]:justify-center [&:fullscreen]:p-10">
              <div className="text-[13px] font-semibold uppercase tracking-wider text-[#46564D]">{stage.competitionTitle}</div>
              <div className="mt-1 text-[22px] font-bold leading-tight text-[#0F2A1C]">{stage.title}</div>
              {stage.region && <div className="text-[15px] text-[#46564D]">{REGIONS[stage.region] || stage.region}</div>}
              {open ? (
                <>
                  <div className="relative mt-4 aspect-square w-full max-w-[380px] [:fullscreen_&]:max-w-[min(70vh,70vw)]">
                    {qrImage ? <img src={qrImage} alt="Mã QR check-in" className="h-full w-full [image-rendering:pixelated]" /> : <div className="h-full w-full animate-pulse bg-[#F3F6F4]" />}
                  </div>
                  <div className="mt-3 h-1.5 w-full max-w-[380px] overflow-hidden rounded-full bg-[#E6ECE8]">
                    <div className="h-full bg-[#1F7A3A] transition-[width] duration-1000 ease-linear" style={{ width: `${(left / (state.data?.windowSeconds || 30)) * 100}%` }} />
                  </div>
                  <p className="mt-3 max-w-[380px] text-[15px] text-[#10231A]">
                    Mở camera điện thoại, quét mã và đăng nhập tài khoản 11 On Field để check-in.
                  </p>
                  <p className="mt-1 text-[12px] text-[#66766D]">Mã đổi sau {left} giây; ảnh chụp mã sẽ không dùng được.</p>
                </>
              ) : (
                <div className="mt-4 w-full max-w-[380px] border border-dashed border-[#C9D5CD] px-4 py-16 text-[15px] text-[#46564D]">
                  Check-in đang đóng.{manager ? ' Bấm “Mở check-in” để hiện mã QR.' : ' Nhờ quản trị viên mở check-in.'}
                </div>
              )}
            </div>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {manager && <Button variant={open ? 'danger' : 'primary'} disabled={busy} onClick={toggle}>{open ? 'Đóng check-in' : 'Mở check-in'}</Button>}
              {open && <Button onClick={fullscreen}>Toàn màn hình</Button>}
            </div>
          </Card>

          <div>
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="text-[16px] font-semibold text-[#0F2A1C]">Đã check-in: <span className="tabular-nums">{state.data?.checkins.length ?? stage.checkins}</span></h2>
              <span className="text-[12px] text-[#66766D]">Tự cập nhật mỗi {POLL_MS / 1000} giây</span>
            </div>
            <Loading error={state.error} loading={state.loading && !state.data} />
            {state.data && (
              <Table head={['SBD', 'Thí sinh', 'Điện thoại', 'Lúc']} empty="Chưa có ai check-in ở vòng này.">
                {state.data.checkins.map((c) => (
                  <tr key={c.participantId} className={`transition-colors duration-700 ${fresh.has(c.participantId) ? 'bg-[#E3F6D0]' : ''}`}>
                    <Td className="tabular-nums font-semibold">{c.sbd}</Td>
                    <Td>
                      <div className="font-medium">{c.fullName}</div>
                      {!!c.movedOn && <Badge tone="gold">Đã check-in vòng khác sau đó</Badge>}
                    </Td>
                    <Td className="tabular-nums">{c.phone}</Td>
                    <Td className="whitespace-nowrap text-[13px] text-[#46564D]">{fmtDateTime(c.checkedInAt)}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </div>
        </div>
      )}
    </>
  );
}
