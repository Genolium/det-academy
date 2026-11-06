'use client';

import React, { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';
  const queryToken = searchParams.get('token') || '';
  const [token, setToken] = useState(queryToken);
  const [tokenChecked, setTokenChecked] = useState(Boolean(queryToken));
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [invalidToken, setInvalidToken] = useState(false);

  // Email links put the token in the fragment so it never reaches access logs.
  // The query parameter stays supported for older links and manual testing.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (queryToken) {
      setToken(queryToken);
      setTokenChecked(true);
      return;
    }
    const hashToken = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('token') || '';
    if (hashToken) setToken(hashToken);
    setTokenChecked(true);
  }, [queryToken]);

  const missingToken = tokenChecked && !token;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    if (!token) {
      setInvalidToken(true);
      setStatus('error');
      return;
    }
    if (password.length < 8) {
      setStatus('error');
      setMessage(ru ? 'Пароль должен содержать минимум 8 символов.' : 'Password must contain at least 8 characters.');
      return;
    }
    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      setStatus('error');
      setMessage(
        ru
          ? 'Пароль должен содержать хотя бы одну букву и одну цифру.'
          : 'Password must contain at least one letter and one digit.'
      );
      return;
    }
    if (password !== confirm) {
      setStatus('error');
      setMessage(ru ? 'Пароли не совпадают.' : 'Passwords do not match.');
      return;
    }
    setStatus('loading');
    try {
      await api.resetPassword({ token, password });
      setStatus('success');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'invalid_reset_token') {
        setInvalidToken(true);
        setMessage(
          ru
            ? 'Ссылка сброса недействительна или истекла. Запросите новую.'
            : 'The reset link is invalid or expired. Request a new one.'
        );
      } else {
        setMessage(
          error instanceof Error
            ? error.message
            : ru
              ? 'Не удалось обновить пароль. Попробуйте ещё раз.'
              : 'Could not update the password. Please try again.'
        );
      }
      setStatus('error');
    }
  };

  const requestNewLink = (
    <Link href="/auth/forgot-password" className="font-bold underline underline-offset-2">
      {ru ? 'Запросить новую' : 'Request a new one'}
    </Link>
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-[#0E1012] p-8 text-white shadow-2xl">
        {status === 'success' ? (
          <div className="space-y-5 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <h1 className="text-xl font-black">{ru ? 'Пароль обновлён' : 'Password updated'}</h1>
            <p className="text-sm leading-relaxed text-neutral-400">
              {ru
                ? 'Старый пароль больше не действует, а другие сессии завершены. Войдите с новым паролем.'
                : 'The old password no longer works and other sessions were signed out. Sign in with your new password.'}
            </p>
            <Link
              href="/"
              className="inline-flex rounded-xl bg-[#D2F544] px-5 py-2.5 text-xs font-black text-[#0C2418]"
            >
              {ru ? 'Войти' : 'Sign in'}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D2F544]/30 bg-[#D2F544]/10 text-[#D2F544]">
                <Lock className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-black">{ru ? 'Новый пароль' : 'New password'}</h1>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {ru
                  ? 'Придумайте новый пароль. Ссылка одноразовая и действует 30 минут.'
                  : 'Choose a new password. The link is single-use and expires in 30 minutes.'}
              </p>
            </div>

            {missingToken ? (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-800 bg-red-950/80 p-3 text-xs text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  {ru
                    ? 'В ссылке нет токена сброса. Запросите новую ссылку.'
                    : 'The link does not contain a reset token. Request a new link.'}{' '}
                  {requestNewLink}
                </span>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label htmlFor="reset-password" className="mb-1.5 block text-xs font-semibold text-neutral-300">
                    {ru ? 'Новый пароль' : 'New password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                    <input
                      id="reset-password"
                      name="new-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-11 text-sm text-white placeholder-neutral-500 focus:border-[#D2F544] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      aria-label={showPassword ? (ru ? 'Скрыть пароль' : 'Hide password') : ru ? 'Показать пароль' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-neutral-500">
                    {ru ? 'Минимум 8 символов, хотя бы одна буква и одна цифра.' : 'At least 8 characters, one letter and one digit.'}
                  </p>
                </div>

                <div>
                  <label htmlFor="reset-password-confirm" className="mb-1.5 block text-xs font-semibold text-neutral-300">
                    {ru ? 'Повторите пароль' : 'Confirm password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                    <input
                      id="reset-password-confirm"
                      name="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      placeholder="••••••••"
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:border-[#D2F544] focus:outline-none"
                    />
                  </div>
                </div>

                {status === 'error' && (
                  <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-800 bg-red-950/80 p-3 text-xs text-red-300">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {invalidToken ? (
                        <>
                          {ru
                            ? 'Ссылка сброса недействительна или истекла.'
                            : 'The reset link is invalid or expired.'}{' '}
                          {requestNewLink}
                        </>
                      ) : (
                        message
                      )}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#D2F544] py-3 text-sm font-black text-[#0C2418] transition-colors hover:bg-[#bce336] disabled:opacity-50"
                >
                  {status === 'loading' && <Loader2 className="h-4 w-4 animate-spin" />}
                  {status === 'loading'
                    ? ru
                      ? 'Сохраняем...'
                      : 'Saving...'
                    : ru
                      ? 'Сохранить новый пароль'
                      : 'Save new password'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const { locale } = useSettingsStore();
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center text-sm text-neutral-400">
          {locale === 'ru' ? 'Загрузка...' : 'Loading...'}
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
