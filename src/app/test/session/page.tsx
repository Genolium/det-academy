'use client';

import { TestController } from '@/components/test-engine/TestController';
import { AuthRequiredGuard } from '@/components/auth/AuthRequiredGuard';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function TestSessionPage() {
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';
  return (
    <AuthRequiredGuard
      title={ru ? 'Симулятор теста доступен только после регистрации' : 'The test simulator requires an account'}
      subtitle={ru ? 'Для прохождения адаптивного CAT-тестирования войдите или зарегистрируйтесь.' : 'Sign in or create an account to take the adaptive CAT test.'}
      badge="DET Simulation Session"
    >
      <TestController />
      <div className="pb-8 px-4 text-center text-[11px] text-neutral-500">
        <span>{ru ? 'Нашли баг или есть идея по тренажёру? ' : 'Found a bug or have an idea? '}</span>
        <a
          href="https://t.me/ilyan_vas"
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-300 underline decoration-neutral-600 underline-offset-2 hover:text-[#D2F544] transition-colors"
        >
          {ru ? 'Напишите в Telegram: t.me/ilyan_vas' : 'Message on Telegram: t.me/ilyan_vas'}
        </a>
      </div>
    </AuthRequiredGuard>
  );
}
