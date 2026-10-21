'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Проверяем ссылку...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('В ссылке нет токена подтверждения.');
      return;
    }
    api
      .verifyEmail(token)
      .then(() => {
        setStatus('success');
        setMessage('Email подтверждён. Теперь прогресс и отчёты будут сохраняться.');
      })
      .catch((error: unknown) => {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Ссылка недействительна или истекла.');
      });
  }, [token]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-[#0E1012] p-8 text-center text-white space-y-5">
        {status === 'loading' && <Loader2 className="w-10 h-10 text-[#D2F544] animate-spin mx-auto" />}
        {status === 'success' && <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />}
        {status === 'error' && <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />}
        <h1 className="text-xl font-black">
          {status === 'success' ? 'Email подтверждён' : status === 'error' ? 'Не удалось подтвердить' : 'Подтверждение email'}
        </h1>
        <p className="text-sm text-neutral-400">{message}</p>
        <Link
          href="/dashboard"
          className="inline-flex rounded-xl bg-[#D2F544] px-5 py-2.5 text-xs font-black text-[#0C2418]"
        >
          Перейти в кабинет
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-[70vh] flex items-center justify-center text-sm text-neutral-400">Загрузка...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
