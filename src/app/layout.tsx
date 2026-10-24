import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AdBanner } from '@/components/layout/AdBanner';
import { CookieConsent } from '@/components/ui/CookieConsent';
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
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/logo.png', sizes: '1024x1024', type: 'image/png' },
    ],
    shortcut: '/logo.svg',
    apple: '/apple-touch-icon.png',
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
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[#D2F544] focus:px-4 focus:py-2 focus:text-sm focus:font-black focus:text-[#0C2418]">
          Перейти к основному содержимому
        </a>
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
