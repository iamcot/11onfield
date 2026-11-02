'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '@/i18n/I18nProvider';
import { dragBox, initialBox, outputSize, type CropBox, type Handle } from '@/lib/media/crop';

export type CropKind = 'avatar' | 'full';

/** Avatar = square, full body = free box. Long side sent to the server: the background removal works at 1280 px max. */
const PRESET: Record<CropKind, { aspect: number | null; maxEdge: number }> = {
  avatar: { aspect: 1, maxEdge: 800 },
  full: { aspect: null, maxEdge: 1280 },
};

/**
 * Full-screen step between picking a photo and uploading it: the person keeps only themselves in the box,
 * so the background removal gets a small picture with one person in it.
 * onDone gets the cropped file (PNG when the source is PNG, to keep transparency, else JPEG);
 * when the browser cannot show the picture (HEIC on some phones) it offers to send the original.
 */
export default function PhotoCropper({ file, kind, onDone, onCancel }: { file: File; kind: CropKind; onDone: (file: File) => void; onCancel: () => void }) {
  const t = useT();
  const { aspect, maxEdge } = PRESET[kind];
  const [url, setUrl] = useState<string | null>(null);
  const [nat, setNat] = useState<{ w: number; h: number } | null>(null);
  const [box, setBox] = useState<CropBox | null>(null);
  const [broken, setBroken] = useState(false);
  const [busy, setBusy] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ handle: Handle; px: number; py: number; start: CropBox; dw: number; dh: number } | null>(null);

  useEffect(() => {
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  // Escape closes, the page behind does not scroll while the cropper is open
  useEffect(() => {
    const key = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onCancel();
    window.addEventListener('keydown', key);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', key);
      document.body.style.overflow = overflow;
    };
  }, [busy, onCancel]);

  const onLoad = () => {
    const img = imgRef.current;
    if (!img || !img.naturalWidth) return setBroken(true);
    setNat({ w: img.naturalWidth, h: img.naturalHeight });
    setBox(initialBox(img.naturalWidth, img.naturalHeight, aspect));
  };

  const down = (handle: Handle) => (e: ReactPointerEvent) => {
    if (!box || !imgRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
    const r = imgRef.current.getBoundingClientRect();
    drag.current = { handle, px: e.clientX, py: e.clientY, start: box, dw: r.width, dh: r.height };
  };

  const move = useCallback(
    (e: ReactPointerEvent) => {
      const d = drag.current;
      if (!d || !nat) return;
      setBox(dragBox(d.start, d.handle, (e.clientX - d.px) / d.dw, (e.clientY - d.py) / d.dh, nat.w, nat.h, aspect));
    },
    [nat, aspect],
  );

  const up = () => {
    drag.current = null;
  };

  const confirm = async () => {
    const img = imgRef.current;
    if (!img || !box || !nat) return;
    setBusy(true);
    try {
      const o = outputSize(box, nat.w, nat.h, maxEdge);
      const canvas = document.createElement('canvas');
      canvas.width = o.ow;
      canvas.height = o.oh;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('canvas');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, o.sx, o.sy, o.sw, o.sh, 0, 0, o.ow, o.oh);
      const png = file.type === 'image/png';
      const type = png ? 'image/png' : 'image/jpeg';
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, type, 0.9));
      if (!blob) throw new Error('blob');
      const base = file.name.replace(/\.[^.]+$/, '') || 'photo';
      onDone(new File([blob], `${base}-crop.${png ? 'png' : 'jpg'}`, { type, lastModified: Date.now() }));
    } catch {
      // the picture could not be cut in this browser: send it whole, the server still shrinks it
      onDone(file);
    } finally {
      setBusy(false);
    }
  };

  if (typeof document === 'undefined') return null;

  const pct = (v: number) => `${v * 100}%`;
  const corner = (h: Exclude<Handle, 'move'>) => {
    const pos = { nw: 'left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize', ne: 'right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize', sw: 'left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize', se: 'right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize' }[h];
    return (
      <span key={h} onPointerDown={down(h)} className={`absolute ${pos} flex h-11 w-11 items-center justify-center`} style={{ touchAction: 'none' }} aria-hidden>
        <span className="block h-4 w-4 rounded-full border-2 border-[#0b2412] bg-[#9fd65a] shadow" />
      </span>
    );
  };

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex flex-col bg-[#05140b]/95 text-white" role="dialog" aria-modal="true" aria-label={t('Cắt ảnh')}>
      <div className="px-4 pb-2 pt-4 text-center">
        <div className="text-[15px] font-bold uppercase tracking-wider">{kind === 'avatar' ? t('Cắt ảnh đại diện') : t('Cắt ảnh toàn thân')}</div>
        <p className="mx-auto mt-1 max-w-md text-[13px] text-white/70">
          {kind === 'avatar' ? t('Kéo khung cho vừa mặt và vai của bạn, chỉ một mình bạn trong khung.') : t('Kéo khung ôm sát người bạn từ đầu đến chân, bỏ người và cảnh xung quanh.')}
        </p>
      </div>

      <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-2" onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
        {broken ? (
          <p className="max-w-sm text-center text-[14px] text-white/80">{t('Không xem trước được ảnh này để cắt. Bạn có thể tải ảnh gốc lên.')}</p>
        ) : (
          url && (
            <div className="relative inline-block select-none" style={{ touchAction: 'none' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img ref={imgRef} src={url} alt="" onLoad={onLoad} onError={() => setBroken(true)} draggable={false} className="block max-h-[calc(100dvh-210px)] max-w-[calc(100vw-32px)] object-contain" />
              {box && (
                <div className="absolute inset-0 overflow-hidden">
                  <div
                    onPointerDown={down('move')}
                    className="absolute cursor-move border-2 border-[#9fd65a]"
                    style={{ left: pct(box.x), top: pct(box.y), width: pct(box.w), height: pct(box.h), boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)', touchAction: 'none' }}
                  >
                    <span className="pointer-events-none absolute inset-y-0 left-1/3 border-l border-white/30" />
                    <span className="pointer-events-none absolute inset-y-0 left-2/3 border-l border-white/30" />
                    <span className="pointer-events-none absolute inset-x-0 top-1/3 border-t border-white/30" />
                    <span className="pointer-events-none absolute inset-x-0 top-2/3 border-t border-white/30" />
                  </div>
                </div>
              )}
              {box && (
                <div className="pointer-events-none absolute inset-0">
                  <div className="pointer-events-none absolute" style={{ left: pct(box.x), top: pct(box.y), width: pct(box.w), height: pct(box.h) }}>
                    <div className="pointer-events-auto">{(['nw', 'ne', 'sw', 'se'] as const).map(corner)}</div>
                  </div>
                </div>
              )}
            </div>
          )
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-2">
        <button type="button" onClick={onCancel} disabled={busy} className="min-h-[44px] rounded-md border border-white/25 bg-white/5 px-5 text-[13px] font-bold uppercase tracking-wider">
          {t('Hủy')}
        </button>
        {broken ? (
          <button type="button" onClick={() => onDone(file)} className="min-h-[44px] rounded-md bg-gradient-to-b from-[#9fd65a] to-[#7fb83c] px-5 text-[13px] font-bold uppercase tracking-wider text-[#0b2412]">
            {t('Tải ảnh gốc')}
          </button>
        ) : (
          <button type="button" onClick={confirm} disabled={busy || !box} className="min-h-[44px] rounded-md bg-gradient-to-b from-[#9fd65a] to-[#7fb83c] px-5 text-[13px] font-bold uppercase tracking-wider text-[#0b2412] disabled:opacity-60">
            {t('Cắt và tải lên')}
          </button>
        )}
      </div>
    </div>,
    document.body,
  );
}
