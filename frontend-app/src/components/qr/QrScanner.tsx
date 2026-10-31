'use client';

import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import jsQR from 'jsqr';
import { useT } from '@/i18n/I18nProvider';
import { parseScan } from '@/lib/qr-links';
import './qr.css';

type Status = 'starting' | 'scanning' | 'denied' | 'nocamera' | 'invalid';

/** Reads the QR inside an image or a video frame (the canvas is reused between frames). */
function decode(source: CanvasImageSource, w: number, h: number, canvas: HTMLCanvasElement): string | null {
  // a smaller frame decodes faster and QR codes stay readable
  const scale = Math.min(1, 720 / Math.max(w, h));
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' })?.data ?? null;
}

/**
 * Full-screen scanner for every QR of the app: a shared profile opens and is followed,
 * a stage check-in code checks the player in. A photo of a QR works when the camera is not allowed.
 */
export default function QrScanner({ onClose }: { onClose: () => void }) {
  const t = useT();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>('starting');
  const done = useRef(false);

  const handle = (text: string | null) => {
    if (!text || done.current) return false;
    const target = parseScan(text);
    if (!target) {
      setStatus('invalid');
      return false;
    }
    done.current = true;
    onClose();
    router.push(target.href);
    return true;
  };

  useEffect(() => {
    canvasRef.current = document.createElement('canvas');
    let stream: MediaStream | null = null;
    let raf = 0;
    let last = 0;
    let live = true;

    const tick = (now: number) => {
      if (!live) return;
      const v = videoRef.current;
      // ~8 reads a second is plenty and keeps the phone cool
      if (v && v.readyState >= 2 && now - last > 120 && canvasRef.current) {
        last = now;
        if (handle(decode(v, v.videoWidth, v.videoHeight, canvasRef.current))) return;
      }
      raf = requestAnimationFrame(tick);
    };

    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus('nocamera');
    } else {
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
        .then((s) => {
          if (!live) return s.getTracks().forEach((tr) => tr.stop());
          stream = s;
          const v = videoRef.current;
          if (!v) return;
          v.srcObject = s;
          v.play().catch(() => undefined);
          setStatus('scanning');
          raf = requestAnimationFrame(tick);
        })
        .catch((e: { name?: string }) => setStatus(e?.name === 'NotAllowedError' ? 'denied' : 'nocamera'));
    }

    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      live = false;
      cancelAnimationFrame(raf);
      stream?.getTracks().forEach((tr) => tr.stop());
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fromFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !canvasRef.current) return;
    try {
      const bmp = await createImageBitmap(file);
      const text = decode(bmp, bmp.width, bmp.height, canvasRef.current);
      if (!text) setStatus('invalid');
      else handle(text);
    } catch {
      setStatus('invalid');
    }
  };

  const msg: Record<Status, string> = {
    starting: t('Đang mở camera…'),
    scanning: t('Đưa mã QR vào khung: mã hồ sơ cầu thủ hoặc mã check-in.'),
    denied: t('Chưa được phép dùng camera. Hãy cho phép trong cài đặt trình duyệt, hoặc chọn ảnh có mã QR.'),
    nocamera: t('Không mở được camera trên thiết bị này. Bạn có thể chọn ảnh có mã QR.'),
    invalid: t('Mã QR này không phải của 11 On Field. Hãy thử mã khác.'),
  };

  return createPortal(
    <div className="qr-scan" role="dialog" aria-modal="true" aria-label={t('Quét mã QR')}>
      <video ref={videoRef} playsInline muted />
      <div className="qr-scan-top">
        <b>{t('Quét mã QR')}</b>
        <button type="button" className="qr-x" onClick={onClose} aria-label={t('Đóng')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} width={20} height={20} aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>
      <div className="qr-scan-box">
        <div className="qr-frame" />
      </div>
      <div className="qr-scan-bottom">
        <p className={`qr-msg ${status === 'invalid' || status === 'denied' || status === 'nocamera' ? 'is-err' : ''}`} role="status">
          {msg[status]}
        </p>
        <button type="button" className="qr-btn qr-btn--ghost" onClick={() => fileRef.current?.click()}>
          {t('Chọn ảnh có mã QR')}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={fromFile} />
      </div>
    </div>,
    document.body
  );
}
