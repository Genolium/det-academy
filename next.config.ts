import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  async rewrites() {
    const apiTarget = process.env.API_PROXY_TARGET || 'http://localhost:18080';
    // The CMS is reached through the same origin. The proxy target points at
    // the backend container, so the browser never needs a separate hostname.
    // The CMS itself is proxied by the route handler in app/directus, which
    // reads DIRECTUS_INTERNAL_URL at request time.
    return [{ source: '/api/v1/:path*', destination: `${apiTarget}/api/v1/:path*` }];
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
