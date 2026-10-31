'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { useT } from '@/i18n/I18nProvider';
import { profileLink } from '@/lib/qr-links';
import './qr.css';

const X = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
const QR_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
    <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4v-3" />
  </svg>
);
const LINK_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
    <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
  </svg>
);

/** "Chia sẻ hồ sơ": a QR of the profile to show or save, or the link through the phone's share sheet. */
export default function ProfileShareSheet({ userid, name, onClose, onCopied }: { userid: string; name: string; onClose: () => void; onCopied: () => void }) {
  const t = useT();
  const [qr, setQr] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const url = profileLink(window.location.origin, userid);

  useEffect(() => {
    QRCode.toDataURL(url, { margin: 1, width: 640, errorCorrectionLevel: 'M', color: { dark: '#0b2412', light: '#ffffff' } })
      .then(setQr)
      .catch(() => setQr(null));
  }, [url]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const shareLink = async () => {
    try {
      if (navigator.share) await navigator.share({ title: name, url });
      else {
        await navigator.clipboard.writeText(url);
        onCopied();
      }
      onClose();
    } catch {
      // closed the share sheet
    }
  };

  return createPortal(
    <div className="qr-layer" onClick={onClose}>
      <div className="qr-sheet" role="dialog" aria-modal="true" aria-labelledby="qr-share-title" onClick={(e) => e.stopPropagation()}>
        <div className="qr-head">
          <div id="qr-share-title" className="qr-title">{showQr ? name : t('Chia sẻ hồ sơ')}</div>
          <button type="button" className="qr-x" onClick={onClose} aria-label={t('Đóng')}>{X}</button>
        </div>
        {showQr ? (
          <div className="qr-code">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr ? <img src={qr} alt={t('Mã QR hồ sơ của {name}', { name })} /> : <div className="qr-msg">{t('Đang tải...')}</div>}
            <p>{t('Quét bằng nút QR trong app để mở hồ sơ và theo dõi ngay.')}</p>
            <div className="qr-row">
              {qr && (
                <a className="qr-btn" href={qr} download={`11onfield-${userid}.png`}>
                  {t('Lưu ảnh QR')}
                </a>
              )}
              <button type="button" className="qr-btn qr-btn--ghost" onClick={() => setShowQr(false)}>
                {t('Quay lại')}
              </button>
            </div>
          </div>
        ) : (
          <div className="qr-opts">
            <button type="button" className="qr-opt" onClick={() => setShowQr(true)}>
              <i>{QR_ICON}</i>
              <span>
                <b>{t('Chia sẻ mã QR')}</b>
                <span>{t('Người khác quét để mở hồ sơ và theo dõi')}</span>
              </span>
            </button>
            <button type="button" className="qr-opt" onClick={shareLink}>
              <i>{LINK_ICON}</i>
              <span>
                <b>{t('Chia sẻ link')}</b>
                <span>{t('Gửi link hồ sơ qua tin nhắn, mạng xã hội')}</span>
              </span>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
