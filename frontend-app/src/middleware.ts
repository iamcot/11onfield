import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, readToken } from '@/lib/admin/session';

// Partner page holds competitive information: keep it behind HTTP Basic Auth.
// Credentials come from PARTNER_PAGE_USER / PARTNER_PAGE_PASSWORD (GitHub secrets,
// written to .env.production by the deploy workflows). Unset = page stays locked.
const USER = process.env.PARTNER_PAGE_USER || '';
const PASSWORD = process.env.PARTNER_PAGE_PASSWORD || '';

// Admin area: send visitors without a valid staff token to the admin login page.
// The backend still checks the role on every API call; this only keeps the pages private.
function guardAdmin(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/quan-tri/api/')) return NextResponse.next(); // route handlers answer 401 themselves
  const session = readToken(req.cookies.get(ADMIN_COOKIE)?.value);
  const isLogin = pathname === '/quan-tri/dang-nhap';
  if (!session && !isLogin) return NextResponse.redirect(new URL('/quan-tri/dang-nhap', req.url));
  if (session && isLogin) return NextResponse.redirect(new URL('/quan-tri', req.url));
  const res = NextResponse.next();
  res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  res.headers.set('Cache-Control', 'no-store');
  return res;
}

export function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/quan-tri')) return guardAdmin(req);

  const header = req.headers.get('authorization');
  if (USER && PASSWORD && header?.startsWith('Basic ')) {
    try {
      const decoded = atob(header.slice(6));
      const i = decoded.indexOf(':');
      if (decoded.slice(0, i) === USER && decoded.slice(i + 1) === PASSWORD) {
        const res = NextResponse.next();
        res.headers.set('X-Robots-Tag', 'noindex, nofollow');
        return res;
      }
    } catch {
      // malformed header: fall through to the challenge
    }
  }
  // i18n-ignore
  return new NextResponse('Cần đăng nhập để xem trang đối tác.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="11 On Field - Doi tac", charset="UTF-8"', 'Content-Type': 'text/plain; charset=utf-8' },
  });
}

export const config = {
  // the page's JS chunk carries the copy too, so guard it as well
  matcher: ['/quan-tri', '/quan-tri/:path*', '/doi-tac', '/doi-tac/:path*', '/_next/static/chunks/app/doi-tac/:path*'],
};
