'use client';

import { useRef, useState } from 'react';
import { uploadImage } from '@/lib/admin/client';
import { Button, useUi } from './ui';

/** Image URL with preview; picking a file uploads it to S3 right away and stores the returned URL. */
export default function ImageField({
  value,
  onChange,
  type,
  label = 'Ảnh',
}: {
  value: string;
  onChange: (url: string) => void;
  type: 'event' | 'news' | 'sponsor';
  label?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useUi();

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      onChange(await uploadImage(type, file));
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <div>
      <span className="mb-1 block text-[12px] uppercase tracking-wider text-[#8FA597]">{label}</span>
      <div className="flex items-start gap-3">
        <div className="flex h-24 w-36 shrink-0 items-center justify-center overflow-hidden border border-white/15 bg-[#0B2419]">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <span className="text-[12px] text-[#8FA597]">Chưa có ảnh</span>}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={input} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0])} />
          <Button small disabled={busy} onClick={() => input.current?.click()}>{busy ? 'Đang tải lên…' : 'Chọn ảnh'}</Button>
          {value && <Button small variant="danger" onClick={() => onChange('')}>Bỏ ảnh</Button>}
        </div>
      </div>
    </div>
  );
}
