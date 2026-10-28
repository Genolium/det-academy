import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AdBanner } from '@/components/layout/AdBanner';
import { CookieConsent } from '@/components/ui/CookieConsent';
import { SkipLink } from '@/components/layout/SkipLink';
import { ServiceWorkerRegister } from '@/components/system/ServiceWorkerRegister';
import { OfflineIndicator } from '@/components/system/OfflineIndicator';
import { ErrorReporter } from '@/components/system/ErrorReporter';
import { AuthBootstrap } from '@/components/system/AuthBootstrap';
import { LocaleSync } from '@/components/system/LocaleSync';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'cyrillic'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'cyrillic'],
});

export const metadata: Metadata = {
  title: 'DET Academy | Интерактивная платформа подготовки к Duolingo English Test',
  description: `Подготовка к Duolingo English Test по актуальным стандартам ${new Date().getFullYear()}. Диагностика, персональный план, тренажёры, пробные тесты и разбор ошибок.`,
  metadataBase: new URL('https://det-academy.ru'),
  openGraph: {
    title: 'DET Academy',
    description: 'Диагностика, план на сегодня и тренировочный пробный тест DET. Оценка платформы, не официальный балл Duolingo.',
    url: 'https://det-academy.ru',
    siteName: 'DET Academy',
    locale: 'ru_RU',
    type: 'website',
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/det-owl-v2.svg', type: 'image/svg+xml' },
      { url: '/det-icon-v2-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/det-owl-v2.svg',
    apple: '/det-apple-icon-v2.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#D2F544',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <SkipLink />
        <AdBanner placement="HEADER" />
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</main>
        <Footer />
        <CookieConsent />
        <OfflineIndicator />
        <ErrorReporter />
        <AuthBootstrap />
        <LocaleSync />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
