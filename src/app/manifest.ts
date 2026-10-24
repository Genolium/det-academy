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
      { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/logo.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
    ],
  };
}
