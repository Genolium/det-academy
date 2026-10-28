import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/dashboard',
          '/profile',
          '/test/session',
          '/auth',
          '/api/',
          '/directus',
        ],
      },
    ],
    sitemap: 'https://det-academy.ru/sitemap.xml',
    host: 'https://det-academy.ru',
  };
}
