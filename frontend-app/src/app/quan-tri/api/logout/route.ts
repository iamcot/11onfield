import { NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin/session';

export async function POST() {
  const out = NextResponse.json({ ok: true });
  out.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/quan-tri', maxAge: 0 });
  return out;
}
