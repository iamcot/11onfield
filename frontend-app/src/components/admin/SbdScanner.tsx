'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

/** The bib sheet QR: `11OF:SBD:<competitionId>:<sbd>` (no personal data). */
export function parseSbdQr(text: string): { competitionId: string; sbd: string } | null {
  const m = text.trim().match(/^11OF:SBD:(\d+):(\d+)$/);
  return m ? { competitionId: m[1], sbd: m[2] } : null;
}

/** Full-screen camera that reads one bib QR and hands back its competition and SBD. */
export default function SbdScanner({ onScan, onClose }: { onScan: (v: { competitionId: string; sbd: string }) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');
  const [wrong, setWrong] = useState(false);

  useEffect(() => {
    let live = true;
    let raf = 0;
    let last = 0;
    let stream: MediaStream | null = null;
    const canvas = document.createElement('canvas');
    const tick = (now: number) => {
      if (!live) return;
      const v = videoRef.current;
      if (v && v.readyState >= 2 && now - last > 120) {
        last = now;
        const scale = Math.min(1, 720 / Math.max(v.videoWidth, v.videoHeight));
        canvas.width = Math.round(v.videoWidth * scale);
        canvas.height = Math.round(v.videoHeight * scale);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const text = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data;
          if (text) {
            const parsed = parseSbdQr(text);
            if (parsed) { onScan(parsed); return; }
            setWrong(true);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    if (!navigator.mediaDevices?.getUserMedia) setError('Thiết bị không hỗ trợ camera. Nhập SBD bằng bàn phím số.');
    else {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        .then((s) => {
          if (!live) return s.getTracks().forEach((t) => t.stop());
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
          raf = requestAnimationFrame(tick);
        })
        .catch(() => setError('Chưa cấp quyền camera. Nhập SBD bằng bàn phím số.'));
    }
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4" role="dialog" aria-label="Quét QR số báo danh">
      <div className="mx-auto flex w-full max-w-[720px] flex-1 flex-col gap-4">
        <div className="relative flex-1 overflow-hidden rounded-2xl bg-black">
          <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          <div className="pointer-events-none absolute inset-[18%] rounded-2xl border-4 border-[#A6E35A]/80" />
        </div>
        <p role="status" className={`text-center text-[19px] font-semibold ${error || wrong ? 'text-[#FFB4AB]' : 'text-white'}`}>
          {error || (wrong ? 'Đây không phải mã QR số báo danh. Quét lại phiếu SBD.' : 'Đưa mã QR trên phiếu SBD vào khung')}
        </p>
        <button type="button" onClick={onClose} className="min-h-[64px] rounded-xl bg-white text-[20px] font-bold text-[#06140D]">Đóng</button>
      </div>
    </div>
  );
}
