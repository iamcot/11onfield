'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/quan-tri/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message || 'Đăng nhập không thành công');
        return;
      }
      router.replace('/quan-tri');
      router.refresh();
    } catch {
      setError('Không kết nối được máy chủ. Thử lại sau ít phút.');
    } finally {
      setBusy(false);
    }
  }

  const input =
    'mt-1 w-full border border-white/20 bg-[#0B2419] px-3 py-2.5 text-[15px] text-white outline-none focus:border-[#A6E35A]';
  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-[12px] uppercase tracking-wider text-[#8FA597]">
        Số điện thoại / tài khoản
        <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="username" required />
      </label>
      <label className="block text-[12px] uppercase tracking-wider text-[#8FA597]">
        Mật khẩu
        <input
          className={input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
      </label>
      {error && (
        <p role="alert" className="border border-[rgba(255,138,128,0.5)] bg-[rgba(255,138,128,0.08)] px-3 py-2 text-[14px] text-[#FFD2CD]">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="w-full bg-[#A6E35A] px-4 py-3 font-semibold text-[#0B2419] transition-colors hover:bg-[#B8F26A] disabled:opacity-60"
      >
        {busy ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </button>
    </form>
  );
}
