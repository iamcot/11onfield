import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_COOKIE, backendUrl, readToken, type AdminRole } from './session';

export interface AdminMe {
  userid: string;
  fullName: string | null;
  role: AdminRole;
}

/** GET /api/admin/<path> with the cookie token. A 401 sends the user back to the login page. */
export async function adminGet<T>(path: string): Promise<{ status: number; data: T | null }> {
  const token = cookies().get(ADMIN_COOKIE)?.value;
  if (!readToken(token)) redirect('/quan-tri/dang-nhap');
  const res = await fetch(`${backendUrl()}/admin/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (res.status === 401) redirect('/quan-tri/dang-nhap');
  return { status: res.status, data: res.ok ? ((await res.json()) as T) : null };
}

export async function getMe(): Promise<AdminMe> {
  const { data } = await adminGet<AdminMe>('me');
  if (!data) redirect('/quan-tri/dang-nhap');
  return data;
}
