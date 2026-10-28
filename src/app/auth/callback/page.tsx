'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { oauthLogin } = useAuthStore();
  const { syncWithBackend } = useProgressStore();
  const { locale } = useSettingsStore();
  const t = (ruText: string, enText: string) => (locale === 'ru' ? ruText : enText);

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState<string>(t('Выполняется обработка авторизации...', 'Processing authorization...'));

  useEffect(() => {
    const processOAuth = async () => {
      // 1. Check for error from provider
      const err = searchParams.get('error') || searchParams.get('error_description');
      if (err) {
        setStatus('error');
        setMessage(t(`Провайдер отклонил авторизацию: ${err}`, `The provider rejected authorization: ${err}`));
        return;
      }

      const code = searchParams.get('code');
      const deviceId = searchParams.get('device_id') || undefined;
      const codeVerifier = typeof window !== 'undefined' ? sessionStorage.getItem('vk_code_verifier') || undefined : undefined;
      const nonce = typeof window !== 'undefined' ? sessionStorage.getItem('oauth_nonce') || undefined : undefined;
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://det-academy.ru';
      const redirectUri = `${origin}/auth/callback`;

      // OIDC providers return tokens/state in the fragment.
      let hashParams: URLSearchParams | null = null;
      if (typeof window !== 'undefined' && window.location.hash) {
        hashParams = new URLSearchParams(window.location.hash.substring(1));
      }
      const state = searchParams.get('state') || hashParams?.get('state') || '';

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

      const idToken = hashParams?.get('id_token') || '';
      const accessToken = hashParams?.get('access_token') || '';
      const authCodeOrToken = code || idToken || accessToken;
      if (!authCodeOrToken) {
        setStatus('error');
        setMessage(t('Код авторизации или токен не был получен от сервиса', 'No authorization code or token was returned by the provider'));
        return;
      }

      try {
        const isLinking = state.includes('action=link') || state.includes('link');

        if (isLinking) {
          // Action: Link account in cabinet
          setMessage(t('Привязываем социальный аккаунт к вашему профилю...', 'Linking the social account to your profile...'));
          await api.linkProvider({
            provider: providerParam,
            code: authCodeOrToken,
            deviceId,
            codeVerifier,
            redirectUri,
            nonce,
            state,
          });
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('vk_code_verifier');
            sessionStorage.removeItem('oauth_nonce');
          }
          setStatus('success');
          setMessage(t('Аккаунт успешно привязан! Перенаправление в личный кабинет...', 'Account linked. Redirecting to your profile...'));
          setTimeout(() => {
            router.push('/profile?tab=security&linked=success');
          }, 1200);
        } else {
          // Action: Login or Register
          setMessage(t('Входим в аккаунт DET Academy...', 'Signing in to DET Academy...'));
          const ok = await oauthLogin({
            provider: providerParam,
            code: authCodeOrToken,
            deviceId,
            codeVerifier,
            redirectUri,
            nonce,
            state,
          });
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem('vk_code_verifier');
            sessionStorage.removeItem('oauth_nonce');
          }

          if (ok) {
            syncWithBackend();
            setStatus('success');
            setMessage(t('Вы успешно авторизованы! Перенаправление...', 'Signed in successfully. Redirecting...'));
            setTimeout(() => {
              router.push('/dashboard');
            }, 1000);
          } else {
            setStatus('error');
            setMessage(t('Ошибка входа через социальный аккаунт', 'Could not sign in with the social account'));
          }
        }
      } catch (e: unknown) {
        setStatus('error');
        setMessage(e instanceof Error ? e.message : t('Неизвестная ошибка при авторизации', 'Unknown authorization error'));
      }
    };

    processOAuth();
  }, [router, searchParams, oauthLogin, syncWithBackend, locale]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0E1012] border border-neutral-800 rounded-3xl p-8 text-center text-white shadow-2xl">
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-10 h-10 text-[#D2F544] animate-spin" />
            <h2 className="text-lg font-bold">{t('Авторизация', 'Authorization')}</h2>
            <p className="text-xs text-neutral-400 max-w-xs">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-[#D2F544]/20 border border-[#D2F544]/40 flex items-center justify-center">
              <CheckCircle2 className="w-7 h-7 text-[#D2F544]" />
            </div>
            <h2 className="text-lg font-bold text-white">{t('Успешно!', 'Success!')}</h2>
            <p className="text-xs text-neutral-300 max-w-xs">{message}</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-950/60 border border-red-800/80 flex items-center justify-center">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-lg font-bold text-red-400">{t('Ошибка авторизации', 'Authorization error')}</h2>
            <p className="text-xs text-neutral-400 max-w-xs">{message}</p>
            <div className="pt-3">
              <Link
                href="/profile"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white transition-all"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t('Вернуться', 'Go back')}
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
