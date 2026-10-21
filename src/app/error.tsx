'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { reportClientError } from '@/lib/error-reporter';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error.message || 'React route error', error.stack);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full rounded-3xl border border-red-900/60 bg-[#0E1012] p-8 sm:p-10 text-center text-white shadow-2xl">
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-red-400">runtime error</p>
        <h1 className="mt-3 text-2xl font-black tracking-tight">Что-то пошло не так</h1>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          Страница не загрузилась. Мы уже отправили диагностику. Попробуйте восстановить экран.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-full bg-[#D2F544] px-6 py-3 text-sm font-black text-[#0C2418]"
          >
            Попробовать снова
          </button>
          <Link
            href="/"
            className="rounded-full border border-neutral-700 px-6 py-3 text-sm font-bold text-neutral-200"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
