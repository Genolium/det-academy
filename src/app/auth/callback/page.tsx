'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useProgressStore } from '@/store/useProgressStore';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { oauthLogin } = useAuthStore();
  const { syncWithBackend } = useProgressStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>('Выполняется обработка авторизации...');

  useEffect(() => {
    const processOAuth = async () => {
      // 1. Check for error from provider
      const err = searchParams.get('error') || searchParams.get('error_description');
      if (err) {
        setStatus('error');
        setMessage(`Провайдер отклонил авторизацию: ${err}`);
        return;
      }

      const code = searchParams.get('code');
      const state = searchParams.get('state') || '';

      // 2. Extract provider (from query param or state)
      let providerParam = searchParams.get('provider') as 'google' | 'apple' | 'vk' | 'yandex' | null;
      if (!providerParam && state) {
        if (state.includes('yandex')) providerParam = 'yandex';
        else if (state.includes('vk')) providerParam = 'vk';
        else if (state.includes('apple')) providerParam = 'apple';
        else if (state.includes('google')) providerParam = 'google';
      }
      if (!providerParam) {
        providerParam = 'google';
      }

      // Check URL hash if tokens were returned directly (e.g. token flow)
      let accessToken = '';
      if (typeof window !== 'undefined' && window.location.hash) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        accessToken = hashParams.get('access_token') || '';
      }

      const authCodeOrToken = code || accessToken;
      if (!authCodeOrToken) {
        setStatus('error');
        setMessage('Код авторизации или токен не был получен от сервиса');
        return;
      }

      try {
        const isLinking = state.includes('action=link') || state.includes('link');

        if (isLinking) {
          // Action: Link account in cabinet
          setMessage('Привязываем социальный аккаунт к вашему профилю...');
          await api.linkProvider({
            provider: providerParam,
            code: authCodeOrToken,
          });
          setStatus('success');
          setMessage('Аккаунт успешно привязан! Перенаправление в личный кабинет...');
          setTimeout(() => {
            router.push('/profile?tab=security&linked=success');
          }, 1200);
        } else {
          // Action: Login or Register
          setMessage('Входим в аккаунт DET Academy...');
          const ok = await oauthLogin({
            provider: providerParam,
            code: authCodeOrToken,
          });

          if (ok) {
            syncWithBackend();
            setStatus('success');
            setMessage('Вы успешно авторизованы! Перенаправление...');
            setTimeout(() => {
              router.push('/profile');
            }, 1000);
          } else {
            setStatus('error');
            setMessage('Ошибка входа через социальный аккаунт');
          }
        }
      } catch (e: unknown) {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : 'Неизвестная ошибка при авторизации');
      }
    };

    processOAuth();
  }, [router, searchParams, oauthLogin, syncWithBackend]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0E1012] border border-neutral-800 rounded-3xl p-8 text-center text-white shadow-2xl">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-[#D2F544] animate-spin" />
            <h2 className="text-lg font-bold">Авторизация</h2>
            <p className="text-xs text-neutral-400 max-w-xs">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#D2F544]/20 border border-[#D2F544]/40 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-[#D2F544]" />
            </div>
            <h2 className="text-lg font-bold text-white">Успешно!</h2>
            <p className="text-xs text-neutral-300 max-w-xs">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-red-400">Ошибка авторизации</h2>
            <p className="text-xs text-neutral-400 max-w-xs">{message}</p>
            <div className="pt-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Вернуться
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#D2F544] animate-spin" />
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}
