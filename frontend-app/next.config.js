/** @type {import('next').NextConfig} */
const nextConfig = {
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
