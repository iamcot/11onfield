'use client';

import { createContext, useCallback, useContext, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import Link from 'next/link';

// ---- layout ----
export function PageTitle({ title, children, back }: { title: string; children?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-5">
      {back && (
        <Link href={back.href} className="text-[13px] text-[#66766D] hover:text-[#1F7A3A]">
          ← {back.label}
        </Link>
      )}
      <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[24px] font-semibold tracking-tight text-[#0F2A1C]">{title}</h1>
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      </div>
    </div>
  );
}

export function Card({ title, children, className = '' }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-lg border border-[#DCE5DF] bg-white p-4 shadow-[0_1px_2px_rgba(16,35,26,0.06)] lg:p-5 ${className}`}>
      {title && <h2 className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#46564D]">{title}</h2>}
      {children}
    </section>
  );
}

// ---- controls ----
const BTN = {
  primary: 'bg-[#0F3324] text-[#D6FA9E] hover:bg-[#18522F]',
  ghost: 'border border-[#C9D5CD] bg-white text-[#10231A] hover:border-[#1F7A3A] hover:text-[#1F6B32]',
  danger: 'border border-[#E8958B] text-[#B42318] hover:bg-[#FDE4E1]',
} as const;

export function Button({
  variant = 'ghost',
  small,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: keyof typeof BTN; small?: boolean }) {
  return (
    <button
      type="button"
      {...rest}
      className={`${BTN[variant]} ${small ? 'px-2.5 py-1 text-[12px]' : 'px-4 py-2 text-[14px]'} rounded-md font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    />
  );
}

export function LinkButton({ href, children, variant = 'ghost', small }: { href: string; children: ReactNode; variant?: keyof typeof BTN; small?: boolean }) {
  return (
    <Link href={href} className={`${BTN[variant]} ${small ? 'px-2.5 py-1 text-[12px]' : 'px-4 py-2 text-[14px]'} inline-block rounded-md font-medium transition-colors`}>
      {children}
    </Link>
  );
}

const FIELD = 'w-full rounded-md border border-[#C9D5CD] bg-white px-3 py-2 text-[14px] text-[#10231A] outline-none focus:border-[#1F7A3A] focus:ring-2 focus:ring-[#1F7A3A]/20 disabled:opacity-60';

export function Field({ label, hint, children, className = '' }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-[12px] uppercase tracking-wider text-[#66766D]">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[12px] text-[#66766D]">{hint}</span>}
    </label>
  );
}
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={`${FIELD} ${p.className || ''}`} />;
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={`${FIELD} ${p.className || ''}`} />;
export const Select = (p: SelectHTMLAttributes<HTMLSelectElement>) => <select {...p} className={`${FIELD} ${p.className || ''}`} />;

export function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[14px]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#1F7A3A]" />
      {label}
    </label>
  );
}

// ---- data display ----
const TONES = {
  green: 'bg-[#E4F3D6] text-[#1F6B32]',
  gold: 'bg-[#FBEFD5] text-[#8A5A00]',
  red: 'bg-[#FDE4E1] text-[#B42318]',
  gray: 'bg-[#EEF2EF] text-[#46564D]',
} as const;
export function Badge({ tone = 'gray', children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${TONES[tone]}`}>{children}</span>;
}

export function Table({ head, children, empty }: { head: string[]; children: ReactNode; empty?: string }) {
  const rows = Array.isArray(children) ? children.length : children ? 1 : 0;
  return (
    <div className="overflow-x-auto rounded-lg border border-[#DCE5DF] bg-white shadow-[0_1px_2px_rgba(16,35,26,0.06)]">
      <table className="w-full min-w-[640px] text-left text-[14px]">
        <thead className="bg-[#F3F6F4] text-[11px] uppercase tracking-wider text-[#56665D]">
          <tr>
            {head.map((h) => (
              <th key={h} className="px-3 py-2.5 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E6ECE8]">{children}</tbody>
      </table>
      {rows === 0 && <p className="px-3 py-6 text-center text-[#66766D]">{empty || 'Chưa có dữ liệu.'}</p>}
    </div>
  );
}
export const Td = ({ children, className = '' }: { children?: ReactNode; className?: string }) => <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;

export function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="mt-3 flex items-center justify-end gap-2 text-[13px]">
      <Button small disabled={page <= 0} onClick={() => onPage(page - 1)}>‹ Trước</Button>
      <span className="text-[#46564D]">Trang {page + 1} / {totalPages}</span>
      <Button small disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>Sau ›</Button>
    </div>
  );
}

export function Loading({ error, loading }: { error?: string; loading?: boolean }) {
  if (error) return <p role="alert" className="border border-[#F3B4AD] bg-[#FEF1EF] px-3 py-2 text-[14px] text-[#B42318]">{error}</p>;
  if (loading) return <p className="text-[#66766D]">Đang tải…</p>;
  return null;
}

// ---- toasts + confirm ----
type ToastTone = 'ok' | 'error';
interface Ctx {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (message: string) => Promise<boolean>;
}
const UiCtx = createContext<Ctx>({ toast: () => {}, confirm: async () => false });
export const useUi = () => useContext(UiCtx);

export function UiProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<{ id: number; message: string; tone: ToastTone }[]>([]);
  const [ask, setAsk] = useState<{ message: string; done: (v: boolean) => void } | null>(null);

  const toast = useCallback((message: string, tone: ToastTone = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, message, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  const confirm = useCallback((message: string) => new Promise<boolean>((done) => setAsk({ message, done })), []);

  return (
    <UiCtx.Provider value={{ toast, confirm }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[60] flex max-w-[calc(100vw-2rem)] flex-col gap-2" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`border px-4 py-2.5 text-[14px] shadow-lg ${t.tone === 'ok' ? 'border-[#2F6B45] bg-[#0F3324] text-[#E2F5CF]' : 'border-[#7A1E14] bg-[#9B2C20] text-white'}`}>
            {t.message}
          </div>
        ))}
      </div>
      {ask && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4">
          <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-lg border border-[#D2DDD6] bg-white p-5 shadow-xl">
            <p className="text-[15px]">{ask.message}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button onClick={() => { ask.done(false); setAsk(null); }}>Huỷ</Button>
              <Button variant="primary" onClick={() => { ask.done(true); setAsk(null); }}>Đồng ý</Button>
            </div>
          </div>
        </div>
      )}
    </UiCtx.Provider>
  );
}

export function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-[55] flex items-start justify-center overflow-y-auto bg-black/60 p-4">
      <div role="dialog" aria-modal="true" className={`my-8 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} rounded-lg border border-[#D2DDD6] bg-white shadow-xl`}>
        <div className="flex items-center justify-between border-b border-[#DCE5DF] px-5 py-3">
          <h2 className="text-[16px] font-semibold">{title}</h2>
          <button type="button" aria-label="Đóng" className="text-[22px] leading-none text-[#46564D] hover:text-[#10231A]" onClick={onClose}>×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
