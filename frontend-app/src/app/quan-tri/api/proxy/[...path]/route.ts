import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, backendUrl, readToken } from '@/lib/admin/session';

// Browser -> /quan-tri/api/proxy/<path> -> Spring /api/admin/<path>, with the JWT taken from the httpOnly cookie.
async function forward(req: NextRequest, { params }: { params: { path: string[] } }) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!readToken(token)) {
    return NextResponse.json({ message: 'Phiên đăng nhập đã hết hạn' }, { status: 401 });
  }

  const url = `${backendUrl()}/admin/${params.path.map(encodeURIComponent).join('/')}${req.nextUrl.search}`;
  const headers: Record<string, string> = { Authorization: `Bearer ${token}` };
  const type = req.headers.get('content-type');
  if (type) headers['Content-Type'] = type;

  const hasBody = !['GET', 'HEAD'].includes(req.method);
  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: req.method,
      headers,
      body: hasBody ? await req.arrayBuffer() : undefined,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ message: 'Không kết nối được máy chủ' }, { status: 502 });
  }

  const out = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { 'Content-Type': upstream.headers.get('content-type') || 'application/json' },
  });
  if (upstream.status === 401) out.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/quan-tri', maxAge: 0 });
  return out;
}

export { forward as GET, forward as POST, forward as PUT, forward as PATCH, forward as DELETE };
