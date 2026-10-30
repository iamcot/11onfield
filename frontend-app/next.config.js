// The old Thymeleaf admin lives on the Spring server. In production nginx routes /admin/ to it; on a
// developer machine only Next.js is on :7070, so forward /admin/* to Spring when it is configured
// (LEGACY_ADMIN_ORIGIN) or when running `next dev` (default http://localhost:7071).
const legacyAdminOrigin =
  process.env.LEGACY_ADMIN_ORIGIN || (process.env.NODE_ENV === 'development' ? 'http://localhost:7071' : '');

// NEXT_PUBLIC_API_URL may be a path on this site (e.g. "/api"). The browser then calls the API on the same
// origin, which is what makes a tunnel (ngrok) or a phone on the LAN work, and Next.js forwards the calls to
// the Spring API at API_PROXY_TARGET (default ADMIN_API_URL, else http://localhost:7071/api).
const publicApi = process.env.NEXT_PUBLIC_API_URL || '';
const apiProxyTarget = publicApi.startsWith('/')
  ? (process.env.API_PROXY_TARGET || process.env.ADMIN_API_URL || 'http://localhost:7071/api').replace(/\/+$/, '')
  : '';

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    const rules = legacyAdminOrigin ? [{ source: '/admin/:path*', destination: `${legacyAdminOrigin}/admin/:path*` }] : [];
    if (apiProxyTarget) rules.push({ source: `${publicApi.replace(/\/+$/, '')}/:path*`, destination: `${apiProxyTarget}/:path*` });
    return rules;
  },
  reactStrictMode: true,
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '11of.s3.ap-southeast-1.amazonaws.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
