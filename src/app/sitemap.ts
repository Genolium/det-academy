import type { MetadataRoute } from 'next';

const baseUrl = 'https://det-academy.ru';

export default function sitemap(): MetadataRoute.Sitemap {
  const publicRoutes = ['', '/theory', '/practice', '/practice/flashcards', '/practice/typing', '/vocabulary', '/institutions', '/test', '/diagnostic', '/verify'];
  return publicRoutes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1 : 0.7,
  }));
}
