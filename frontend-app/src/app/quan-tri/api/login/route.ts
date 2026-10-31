import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, ADMIN_ROLES, ADMIN_SESSION_SECONDS, backendUrl, readToken } from '@/lib/admin/session';

export async function POST(req: NextRequest) {
  const { phone, password } = await req.json().catch(() => ({}));
  if (!phone || !password) {
    return NextResponse.json({ message: 'Vui lòng nhập tài khoản và mật khẩu' }, { status: 400 });
  }

  let res: Response;
  try {
    res = await fetch(`${backendUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password }),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'Không kết nối được máy chủ' }, { status: 502 });
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return NextResponse.json({ message: data.message || 'Tài khoản hoặc mật khẩu không đúng' }, { status: res.status });
  }
  // A coach or scout gets in only while on a competition's scouting panel (the token's `panel` claim).
  const session = readToken(data.tokens?.accessToken);
  if (!session || !ADMIN_ROLES.includes(session.role)) {
    const websiteRole = data.user?.role;
    const message = websiteRole === 'COACH' || websiteRole === 'SCOUTER'
      ? 'Tài khoản HLV / tuyển trạch viên này chưa ở hội đồng tuyển trạch của giải nào. Admin vào Giải đấu, tab Hội đồng để thêm, rồi đăng nhập lại.'
      : 'Tài khoản này không có quyền vào trang quản trị';
    return NextResponse.json({ message }, { status: 403 });
  }

  const out = NextResponse.json({ role: session.role, fullName: data.user.fullName });
  out.cookies.set(ADMIN_COOKIE, data.tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/quan-tri',
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return out;
}
