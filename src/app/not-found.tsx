'use client';

import Link from 'next/link';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function NotFound() {
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full rounded-3xl border border-neutral-800 bg-[#0E1012] p-8 sm:p-10 text-center text-white shadow-2xl">
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-[#D2F544]">404</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight">{ru ? 'Страница не найдена' : 'Page not found'}</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          {ru
            ? 'Такой страницы нет или она была перемещена. Вернитесь на главную и продолжите подготовку.'
            : 'This page does not exist or has been moved. Return home and continue your preparation.'}
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-[#D2F544] px-6 py-3 text-sm font-black text-[#0C2418] transition-transform hover:scale-[1.02]"
        >
          {ru ? 'На главную' : 'Home'}
        </Link>
      </div>
    </div>
  );
}
