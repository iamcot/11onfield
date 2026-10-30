// The old Thymeleaf admin lives on the Spring server. In production nginx routes /admin/ to it; on a
// developer machine only Next.js is on :7070, so forward /admin/* to Spring when it is configured
// (LEGACY_ADMIN_ORIGIN) or when running `next dev` (default http://localhost:7071).
const legacyAdminOrigin =
  process.env.LEGACY_ADMIN_ORIGIN || (process.env.NODE_ENV === 'development' ? 'http://localhost:7071' : '');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return legacyAdminOrigin ? [{ source: '/admin/:path*', destination: `${legacyAdminOrigin}/admin/:path*` }] : [];
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
