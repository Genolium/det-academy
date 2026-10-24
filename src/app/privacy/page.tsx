'use client';

import Link from 'next/link';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function PrivacyPage() {
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';

  return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-6">
      <p className="text-xs font-semibold text-neutral-500">
        <Link href="/" className="underline">
          DET Academy
        </Link>
      </p>
      <h1 className="text-3xl font-semibold text-brand-obsidian">
        {ru ? 'Политика данных' : 'Data policy'}
      </h1>
      <div className="space-y-4 text-sm text-neutral-700 leading-relaxed">
        <p>
          {ru
            ? 'DET Academy хранит аккаунт, цели, ответы на задания и аудио устных попыток, чтобы показывать прогресс и тренировочную оценку. Это учебная платформа, не официальный тест Duolingo.'
            : 'DET Academy stores your account, goals, item responses, and speaking audio so we can show progress and a training estimate. This is a study platform, not the official Duolingo test.'}
        </p>
        <p>
          {ru
            ? 'Необходимые cookie нужны только для сессии входа. Прогресс также может сохраняться в localStorage этого браузера для офлайн-очереди. Отказ от необязательных cookie не отключает вход и учебные данные аккаунта.'
            : 'Essential cookies keep you signed in. Progress may also sit in this browser’s localStorage for an offline queue. Declining optional cookies does not disable sign-in or account learning data.'}
        </p>
        <p>
          {ru
            ? 'Аудио и тексты ответов используются для обратной связи по заданию. Они не отправляются в продуктовую рекламную аналитику.'
            : 'Audio and written answers are used for task feedback. They are not sent to advertising analytics.'}
        </p>
      </div>
    </div>
  );
}
