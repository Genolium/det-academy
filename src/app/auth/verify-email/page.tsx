'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const { locale } = useSettingsStore();
  const t = (ruText: string, enText: string) => (locale === 'ru' ? ruText : enText);
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState(t('Проверяем ссылку...', 'Verifying the link...'));

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage(t('В ссылке нет токена подтверждения.', 'The link does not contain a verification token.'));
      return;
    }
    api
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage(t('Email подтверждён. Теперь прогресс и отчёты будут сохраняться.', 'Email verified. Your progress and reports will now be saved.'));
      })
      .catch((error: unknown) => {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : t('Ссылка недействительна или истекла.', 'The link is invalid or has expired.'));
      });
  }, [token, locale]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-[#0E1012] p-8 text-center text-white space-y-5">
        {status === 'loading' && <Loader2 className="w-10 h-10 text-[#D2F544] animate-spin mx-auto" />}
        {status === 'success' && <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />}
        {status === 'error' && <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />}
        <h1 className="text-xl font-black">
          {status === 'success' ? t('Email подтверждён', 'Email verified') : status === 'error' ? t('Не удалось подтвердить', 'Could not verify') : t('Подтверждение email', 'Email verification')}
        </h1>
        <p className="text-sm text-neutral-400">{message}</p>
        <Link
          href="/dashboard"
          className="inline-flex rounded-xl bg-[#D2F544] px-5 py-2.5 text-xs font-black text-[#0C2418]"
        >
          {t('Перейти в кабинет', 'Go to dashboard')}
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  const { locale } = useSettingsStore();
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-sm text-neutral-400">{locale === 'ru' ? 'Загрузка...' : 'Loading...'}</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
