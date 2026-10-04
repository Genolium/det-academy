import { TestController } from '@/components/test-engine/TestController';
import { AuthRequiredGuard } from '@/components/auth/AuthRequiredGuard';

export default function TestSessionPage() {
  return (
    <AuthRequiredGuard
      title="Симулятор теста доступен только после регистрации"
      subtitle="Для прохождения адаптивного CAT-тестирования войдите или зарегистрируйтесь."
      badge="DET Simulation Session"
    >
      <TestController />
    </AuthRequiredGuard>
  );
}
