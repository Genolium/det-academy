import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DET Academy — подготовка к Duolingo English Test',
    short_name: 'DET Academy',
    description:
      'Диагностика, персональный план, практика и пробные тесты DET с серверной проверкой.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0E1012',
    theme_color: '#D2F544',
    lang: 'ru',
    icons: [
      { src: '/det-owl-v2.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/det-icon-v2-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/det-icon-v2-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
