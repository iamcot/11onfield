'use client';

import type { ReactNode } from 'react';
import { useT } from '@/i18n/I18nProvider';

/**
 * Upload guide shared by the avatar and the full-body photo: plain white background or a picture already cut out,
 * the background is removed on our server either way.
 */
export function PhotoGuide({ kind, children }: { kind: 'avatar' | 'full'; children: ReactNode }) {
  const t = useT();
  return (
    <div className="pp-guide">
      <b>{kind === 'avatar' ? t('Ảnh đại diện không nền') : t('Ảnh toàn thân không nền')}</b>
      <ul>
        <li>{t('Chụp trên nền trắng hoặc nền trơn, hoặc tải ảnh đã tách nền (PNG trong suốt).')}</li>
        {kind === 'avatar' ? (
          <li>{t('Thấy rõ mặt và vai, nhìn thẳng, mặc áo đấu nếu có.')}</li>
        ) : (
          <li>{t('Đứng thẳng, thấy từ đầu đến chân, mặc áo đấu nếu có. Ảnh dọc là đẹp nhất.')}</li>
        )}
        <li>{kind === 'avatar' ? t('Hệ thống tự xóa nền rồi hiện cạnh tên bạn.') : t('Hệ thống tự xóa nền rồi đưa bạn lên sân khấu 3D.')}</li>
        <li>{t('Ảnh tối đa 20MB: JPEG, PNG hoặc WebP.')}</li>
      </ul>
      <div className="ex">
        <div>
          <span className="ok">✓</span>
          {t('Nền trắng')}
        </div>
        <div>
          <span className="ok2">✓</span>
          {t('Đã tách nền')}
        </div>
        <div>
          <span className="no">✕</span>
          {t('Nền lẫn cảnh')}
        </div>
      </div>
      {children}
    </div>
  );
}

/** Size and shape advice for highlight videos. */
export function VideoGuide({ maxMb }: { maxMb: number }) {
  const t = useT();
  return (
    <ul className="pp-mute" style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, listStyle: 'disc' }}>
      <li>{t('Video dưới {n}MB, định dạng MP4 hoặc MOV.', { n: maxMb })}</li>
      <li>{t('Nên quay dọc 9:16 (1080×1920 hoặc 720×1280), dài 15 đến 60 giây.')}</li>
      <li>{t('Ban tổ chức duyệt trước khi video hiện cho mọi người.')}</li>
    </ul>
  );
}
