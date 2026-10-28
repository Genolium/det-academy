import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  poweredByHeader: false,
  async headers() {
    // Security headers are set by the application as well as by nginx, so they
    // are present even on a deployment where the nginx server block has not
    // been installed yet. HSTS is ignored by browsers over plain HTTP.
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://accounts.google.com https://www.gstatic.com https://mc.yandex.ru",
      "connect-src 'self' https://api.dictionaryapi.dev https://accounts.google.com https://www.gstatic.com https://mc.yandex.ru wss://det-academy.ru http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*",
      "img-src 'self' data: https: https://mc.yandex.ru",
      "style-src 'self' 'unsafe-inline'",
      'frame-src https://accounts.google.com',
      "font-src 'self' data:",
      "media-src 'self' blob:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'",
    ].join('; ');

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), display-capture=(self), geolocation=(), payment=()',
          },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
        ],
      },
    ];
  },
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
