import type { Metadata } from 'next';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { AdBanner } from '@/components/layout/AdBanner';
import { CookieConsent } from '@/components/ui/CookieConsent';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'DET Academy | Интерактивная платформа подготовки к Duolingo English Test',
  description: `Подготовка к Duolingo English Test по актуальным стандартам ${new Date().getFullYear()}. Симулятор экзамена, тренажер скоропечатания DET, карта мировых вузов, база знаний и сертификация.`,
  icons: {
    icon: [
      { url: '/logo.svg', type: 'image/svg+xml' },
      { url: '/logo.png', sizes: '1024x1024', type: 'image/png' },
    ],
    shortcut: '/logo.svg',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}>
        <AdBanner placement="HEADER" />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
        {/* Google Identity Services SDK for Real One-Tap & OAuth Popup */}
        <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      </body>
    </html>
  );
}
