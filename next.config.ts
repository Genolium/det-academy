import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async rewrites() {
    const target = process.env.API_PROXY_TARGET || 'http://localhost:18080';
    return [{ source: '/api/v1/:path*', destination: `${target}/api/v1/:path*` }];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'directus.det-academy.ru',
      },
    ],
  },
};

export default nextConfig;
