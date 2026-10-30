'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** Shown when a staff page cannot load, usually because the backend is down or restarting. */
export default function AdminError({ reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  function retry() {
    setBusy(true);
    router.refresh();
    reset();
    setTimeout(() => setBusy(false), 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F6F3] px-4 text-[#10231A]">
      <div className="w-full max-w-md rounded-lg border border-[#DCE5DF] bg-white p-8 text-center shadow-sm">
        <h1 className="text-xl font-bold">Không kết nối được máy chủ</h1>
        <p className="mt-2 text-[15px] text-[#46564D]">
          Máy chủ có thể đang khởi động lại. Chờ vài giây rồi thử lại.
        </p>
        <button
          type="button"
          onClick={retry}
          disabled={busy}
          className="mt-6 rounded-md bg-[#0B2419] px-5 py-2.5 font-semibold text-white hover:bg-[#143A29] disabled:opacity-60"
        >
          {busy ? 'Đang thử lại…' : 'Thử lại'}
        </button>
      </div>
    </div>
  );
}
