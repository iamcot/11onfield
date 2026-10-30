'use client';

import { useState } from 'react';
import { useT } from '@/i18n/I18nProvider';
import type { ApprovalStatus } from '@/services/user.service';

/** Review badge of a highlight or achievement, shown to its owner. */
export function ReviewFlag({ status, hidden }: { status?: ApprovalStatus; hidden?: boolean | null }) {
  const t = useT();
  return (
    <span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {status === 'PENDING' && <span className="pp-flag wait">{t('Chờ duyệt')}</span>}
      {status === 'REJECTED' && <span className="pp-flag bad">{t('Bị từ chối')}</span>}
      {hidden && <span className="pp-flag">{t('Đang ẩn')}</span>}
    </span>
  );
}

/** Hide / show and delete (asks once more before deleting); there is no edit on purpose: a new item goes through review again. */
export function ItemActions({ hidden, onHide, onDelete, busy }: { hidden?: boolean | null; onHide: () => void; onDelete: () => void; busy?: boolean }) {
  const t = useT();
  const [confirm, setConfirm] = useState(false);
  if (confirm) {
    return (
      <span className="pp-itemacts">
        <button type="button" className="del" onClick={() => { setConfirm(false); onDelete(); }} disabled={busy} style={{ color: 'var(--pp-red)' }}>
          {t('Xóa hẳn')}
        </button>
        <button type="button" onClick={() => setConfirm(false)}>
          {t('Hủy')}
        </button>
      </span>
    );
  }
  return (
    <span className="pp-itemacts">
      <button type="button" onClick={onHide} disabled={busy}>
        {hidden ? t('Hiện lại') : t('Ẩn')}
      </button>
      <button type="button" className="del" onClick={() => setConfirm(true)} disabled={busy}>
        {t('Xóa')}
      </button>
    </span>
  );
}
