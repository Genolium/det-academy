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
    </AuthRequiredGuard>
  );
}
