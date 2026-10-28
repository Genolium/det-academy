'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { reportClientError } from '@/lib/error-reporter';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';

  useEffect(() => {
    reportClientError(error.message || 'React route error', error.stack);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full rounded-3xl border border-red-900/60 bg-[#0E1012] p-8 sm:p-10 text-center text-white shadow-2xl">
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-red-400">runtime error</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight">{ru ? 'Что-то пошло не так' : 'Something went wrong'}</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          {ru
            ? 'Страница не загрузилась. Мы уже отправили диагностику. Попробуйте восстановить экран.'
            : 'The page did not load. Diagnostics have been reported. Try restoring the screen.'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[#D2F544] px-6 py-3 text-sm font-black text-[#0C2418]"
          >
            {ru ? 'Попробовать снова' : 'Try again'}
          </button>
          <Link
            href="/"
            className="rounded-full border border-neutral-700 px-6 py-3 text-sm font-bold text-neutral-200"
          >
            {ru ? 'На главную' : 'Home'}
          </Link>
        </div>
      </div>
    </div>
  );
}
