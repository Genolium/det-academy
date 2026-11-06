'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Mail } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function ForgotPasswordPage() {
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setStatus('loading');
    setMessage('');
    try {
      await api.forgotPassword(email.trim());
      setStatus('success');
    } catch (error) {
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : ru
            ? 'Не удалось отправить письмо. Попробуйте позже.'
            : 'Could not send the email. Please try again.'
      );
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-neutral-800 bg-[#0E1012] p-8 text-white shadow-2xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-400 hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {ru ? 'На главную' : 'Back to home'}
        </Link>

        {status === 'success' ? (
          <div className="space-y-5 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <h1 className="text-xl font-black">{ru ? 'Проверьте почту' : 'Check your inbox'}</h1>
            <p className="text-sm leading-relaxed text-neutral-400">
              {ru
                ? 'Если аккаунт с таким email существует, мы отправили ссылку для сброса пароля. Она действует 30 минут. Проверьте «Входящие» и «Спам».'
                : 'If an account with that email exists, we sent a password reset link. It expires in 30 minutes. Check your inbox and spam folder.'}
            </p>
            <Link
              href="/"
              className="inline-flex rounded-xl bg-[#D2F544] px-5 py-2.5 text-xs font-black text-[#0C2418]"
            >
              {ru ? 'Вернуться ко входу' : 'Back to sign in'}
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#D2F544]/30 bg-[#D2F544]/10 text-[#D2F544]">
                <Mail className="h-5 w-5" />
              </div>
              <h1 className="text-xl font-black">{ru ? 'Сброс пароля' : 'Reset password'}</h1>
              <p className="mt-2 text-sm leading-relaxed text-neutral-400">
                {ru
                  ? 'Укажите email аккаунта — мы отправим одноразовую ссылку для нового пароля.'
                  : 'Enter your account email and we will send a one-time link to choose a new password.'}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="mb-1.5 block text-xs font-semibold text-neutral-300">
                  {ru ? 'Email' : 'Email'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-neutral-500" />
                  <input
                    id="forgot-email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    placeholder="student@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-900 py-2.5 pl-10 pr-4 text-sm text-white placeholder-neutral-500 focus:border-[#D2F544] focus:outline-none"
                  />
                </div>
              </div>

              {status === 'error' && (
                <div role="alert" className="flex items-start gap-2 rounded-xl border border-red-800 bg-red-950/80 p-3 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{message}</span>
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
                    ? 'Отправляем...'
                    : 'Sending...'
                  : ru
                    ? 'Отправить ссылку'
                    : 'Send reset link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
