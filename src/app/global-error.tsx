'use client';

import { useEffect } from 'react';
import { reportClientError } from '@/lib/error-reporter';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error.message || 'Global React error', error.stack);
  }, [error]);

  return (
    <html lang="ru">
      <body style={{ margin: 0, background: '#0E1012', color: '#fff', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ maxWidth: 520, textAlign: 'center' }}>
            <p style={{ color: '#D2F544', fontSize: 12, letterSpacing: 3, textTransform: 'uppercase' }}>
              critical error
            </p>
            <h1 style={{ margin: '12px 0', fontSize: 28 }}>Приложение не загрузилось</h1>
            <p style={{ color: '#a3a3a3', lineHeight: 1.6 }}>
              Обновите страницу. Если ошибка повторяется, попробуйте позже — диагностика уже отправлена.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{ marginTop: 20, padding: '12px 24px', borderRadius: 999, border: 0, background: '#D2F544', color: '#0C2418', fontWeight: 900 }}
            >
              Перезагрузить
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
