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
  let res: Response;
  try {
    res = await fetch(`${backendUrl()}/admin/${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch (e) {
    // Backend down or restarting: app/quan-tri/error.tsx shows a retry screen.
    console.error(`[admin] cannot reach ${backendUrl()}:`, (e as Error).message);
    throw new Error('Không kết nối được máy chủ');
  }
  if (res.status === 401) redirect('/quan-tri/dang-nhap');
  return { status: res.status, data: res.ok ? ((await res.json()) as T) : null };
}

export async function getMe(): Promise<AdminMe> {
  const { data } = await adminGet<AdminMe>('me');
  if (!data) redirect('/quan-tri/dang-nhap');
  return data;
}
