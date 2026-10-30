'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import ThemeShell from '@/components/shell/ThemeShell';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';
import { storage } from '@/lib/storage';
import { useT } from '@/i18n/I18nProvider';

interface Result { competitionTitle: string; stageTitle: string; region: string | null; checkedInAt: string; again: boolean }

/** Opened by scanning the QR shown on the admin check-in screen at a regional audition. */
function CheckinView() {
  const t = useT();
  const router = useRouter();
  const code = useSearchParams().get('c');
  const { isAuthenticated, isLoading } = useAuth();
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const sent = useRef(false);

  useEffect(() => {
    if (isLoading || sent.current) return;
    if (!code) return setError(t('Thiếu mã check-in. Hãy quét mã QR tại khu vực check-in.'));
    if (!isAuthenticated) {
      router.replace(`/auth/login?redirect=${encodeURIComponent(`/check-in?c=${code}`)}`);
      return;
    }
    sent.current = true;
    apiClient
      .post<Result>('/competitions/checkin', { code }, { headers: { Authorization: `Bearer ${storage.getToken()}` } })
      .then(setResult)
      .catch((e: { message?: string; status?: number }) => {
        if (e.status === 401) {
          router.replace(`/auth/login?redirect=${encodeURIComponent(`/check-in?c=${code}`)}`);
          return;
        }
        setError(e.message ? t(e.message) : t('Có lỗi xảy ra. Vui lòng thử lại.'));
      });
  }, [code, isAuthenticated, isLoading, router, t]);

  const time = result ? new Date(result.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';

  return (
    <div className="mx-auto flex min-h-[calc(100svh-var(--header-h))] max-w-[520px] items-center px-4 py-10">
      <div className="of-glass of-cut of-cut--lg relative w-full p-7 text-center">
        <div className="of-brackets" />
        <div className="of-hud text-[11px] text-[color:var(--lime)]">{t('Check-in tuyển trạch')}</div>
        {result ? (
          <>
            <div className="mx-auto mt-5 flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--lime)] text-[44px] font-bold text-[#0B2419]" aria-hidden="true">✓</div>
            <h1 className="of-display mt-4 text-[40px] leading-none">{result.again ? t('Đã cập nhật check-in') : t('Check-in thành công')}</h1>
            <p className="mt-3 text-[17px] text-white">{result.stageTitle}</p>
            <p className="text-[14px] text-[#CBD6CF]">{result.competitionTitle} · {t('Lúc {time}', { time })}</p>
            <p className="mt-5 text-[14px] text-[#CBD6CF]">{t('Đưa màn hình này cho ban tổ chức nếu được hỏi.')}</p>
            <Link href="/competitions" className="of-navlink mt-6 inline-block" style={{ color: 'var(--gold-2)' }}>{t('Xem giải đấu')} ›</Link>
          </>
        ) : error ? (
          <>
            <h1 className="of-display mt-4 text-[36px] leading-none">{t('Không check-in được')}</h1>
            <p role="alert" className="mt-4 border border-[rgba(255,138,128,0.5)] bg-[rgba(255,138,128,0.08)] px-4 py-3 text-[15px] text-[#FFD2CD]">{error}</p>
            <p className="mt-4 text-[14px] text-[#CBD6CF]">{t('Hãy quét lại mã QR đang hiển thị tại khu vực check-in.')}</p>
          </>
        ) : (
          <p className="mt-6 text-[16px] text-[#CBD6CF]">{t('Đang check-in…')}</p>
        )}
      </div>
    </div>
  );
}

export default function CheckinPage() {
  return (
    <ThemeShell footer={false}>
      <Suspense fallback={null}>
        <CheckinView />
      </Suspense>
    </ThemeShell>
  );
}
