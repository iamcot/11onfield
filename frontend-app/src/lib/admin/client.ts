'use client';

import { useCallback, useEffect, useState } from 'react';

/** Browser-side call to the Spring admin API through the Next proxy (the JWT stays in the httpOnly cookie). */
export async function api<T = any>(path: string, init: { method?: string; body?: unknown; form?: FormData } = {}): Promise<T> {
  const res = await fetch(`/quan-tri/api/proxy/${path}`, {
    method: init.method || (init.body !== undefined || init.form ? 'POST' : 'GET'),
    headers: init.body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: init.form ?? (init.body !== undefined ? JSON.stringify(init.body) : undefined),
  });
  if (res.status === 401) {
    window.location.href = '/quan-tri/dang-nhap';
    throw new Error('Phiên đăng nhập đã hết hạn');
  }
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }
  if (!res.ok) {
    throw new Error(data?.message || (res.status === 403 ? 'Bạn không có quyền thực hiện thao tác này' : `Lỗi ${res.status}`));
  }
  return data as T;
}

export async function uploadImage(type: 'event' | 'news' | 'sponsor', file: File): Promise<string> {
  const form = new FormData();
  form.append('file', file);
  const { url } = await api<{ url: string }>(`uploads?type=${type}`, { form });
  return url;
}

/** GET with loading/error state and a reload function. Pass null to skip. */
export function useApi<T = any>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(!!path);
  const load = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    setError('');
    try {
      setData(await api<T>(path));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [path]);
  useEffect(() => {
    load();
  }, [load]);
  return { data, error, loading, reload: load, setData };
}
