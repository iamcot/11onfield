import { NextRequest, NextResponse } from 'next/server';

// Partner page holds competitive information: keep it behind HTTP Basic Auth.
// Credentials come from PARTNER_PAGE_USER / PARTNER_PAGE_PASSWORD (GitHub secrets,
// written to .env.production by the deploy workflows). Unset = page stays locked.
const USER = process.env.PARTNER_PAGE_USER || '';
const PASSWORD = process.env.PARTNER_PAGE_PASSWORD || '';

export function middleware(req: NextRequest) {
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
  matcher: ['/doi-tac', '/doi-tac/:path*', '/_next/static/chunks/app/doi-tac/:path*'],
};
