'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/useAuthStore';
import { useProgressStore } from '@/store/useProgressStore';
import { api, LinkedProvidersResponse } from '@/lib/api';
import {
  User as UserIcon,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  Sparkles,
  LogOut,
  Loader2,
  Trash2,
  Plus,
  Award,
  ChevronRight,
  Clock,
  Keyboard,
} from 'lucide-react';

function ProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const { completedLessons, bestTypingWpm, testResults, candidateName } = useProgressStore();

  const [providerData, setProviderData] = useState<LinkedProvidersResponse | null>(null);
  const [isLoadingProviders, setIsLoadingProviders] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Status messages
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Check auth and redirect if not logged in
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Load linked providers
  const loadProviders = useCallback(async () => {
    setIsLoadingProviders(true);
    try {
      const data = await api.getLinkedProviders();
      setProviderData(data);
    } catch (err) {
      console.error('Failed to load linked providers:', err);
    } finally {
      setIsLoadingProviders(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadProviders();
    }
  }, [isAuthenticated, loadProviders]);

  // Catch query param notifications
  useEffect(() => {
    if (searchParams.get('linked') === 'success') {
      setSuccessMsg('Социальный аккаунт успешно привязан!');
      loadProviders();
    }
  }, [searchParams, loadProviders]);

  const handleUnlink = async (provider: 'google' | 'apple' | 'vk' | 'yandex') => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const providerNameMap = {
      google: 'Google',
      apple: 'Apple ID',
      vk: 'VK ID',
      yandex: 'Яндекс ID',
    };

    if (!confirm(`Вы действительно хотите отвязать ${providerNameMap[provider]}?`)) {
      return;
    }

    setActionLoading(provider);
    try {
      await api.unlinkProvider(provider);
      setSuccessMsg(`${providerNameMap[provider]} успешно отвязан`);
      await loadProviders();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Ошибка при отвязке аккаунта');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLink = (provider: 'google' | 'apple' | 'vk' | 'yandex') => {
    setErrorMsg(null);
    setSuccessMsg(null);

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://det-academy.ru';
    const redirectUri = `${origin}/auth/callback`;

    if (provider === 'google') {
      const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
      if (!googleClientId) {
        setErrorMsg('Google Client ID не настроен в .env');
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const google = (window as any).google;
      if (google && google.accounts && google.accounts.oauth2) {
        const client = google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: 'openid email profile',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          callback: async (tokenResponse: any) => {
            if (tokenResponse && tokenResponse.access_token) {
              try {
                setActionLoading('google');
                const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                if (userInfoRes.ok) {
                  const profile = await userInfoRes.json();
                  await api.linkProvider({
                    provider: 'google',
                    code: tokenResponse.access_token,
                    email: profile.email,
                    providerUserId: profile.sub || profile.id,
                  });
                  setSuccessMsg('Google аккаунт успешно привязан!');
                  await loadProviders();
                }
              } catch (e: unknown) {
                setErrorMsg(e instanceof Error ? e.message : 'Ошибка привязки Google');
              } finally {
                setActionLoading(null);
              }
            }
          },
        });
        client.requestAccessToken();
        return;
      }

      // Fallback: redirect
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=openid%20email%20profile&state=provider%3Dgoogle%26action%3Dlink`;
      window.location.href = authUrl;
      return;
    }

    if (provider === 'vk') {
      const vkClientId = process.env.NEXT_PUBLIC_VK_CLIENT_ID || '';
      if (!vkClientId) {
        setErrorMsg('Для привязки VK ID укажите NEXT_PUBLIC_VK_CLIENT_ID в файле конфигурации .env на сервере.');
        return;
      }
      const authUrl = `https://id.vk.com/auth?app_id=${vkClientId}&response_type=code&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=provider%3Dvk%26action%3Dlink`;
      window.location.href = authUrl;
      return;
    }

    if (provider === 'yandex') {
      const yandexClientId = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID || '';
      if (!yandexClientId) {
        setErrorMsg('Для привязки Яндекс ID укажите NEXT_PUBLIC_YANDEX_CLIENT_ID в файле конфигурации .env на сервере.');
        return;
      }
      const authUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${yandexClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&state=provider%3Dyandex%26action%3Dlink`;
      window.location.href = authUrl;
      return;
    }

    if (provider === 'apple') {
      const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID || '';
      if (!appleClientId) {
        setErrorMsg('Привязка Apple ID находится в процессе верификации или требует NEXT_PUBLIC_APPLE_CLIENT_ID в .env.');
        return;
      }
      const authUrl = `https://appleid.apple.com/auth/authorize?client_id=${appleClientId}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=code%20id_token&scope=name%20email&response_mode=fragment&state=provider%3Dapple%26action%3Dlink`;
      window.location.href = authUrl;
      return;
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 6) {
      setErrorMsg('Новый пароль должен содержать не менее 6 символов');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Пароли не совпадают');
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await api.setPassword({
        oldPassword: providerData?.hasPassword ? oldPassword : '',
        newPassword,
      });
      setSuccessMsg(res.message || 'Пароль успешно обновлен!');
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await loadProviders();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Ошибка при сохранении пароля');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-3xl bg-neutral-900 border border-neutral-800 text-neutral-400 mx-auto flex items-center justify-center">
            <UserIcon className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white">Требуется авторизация</h1>
          <p className="text-xs text-neutral-400">
            Войдите в свой аккаунт, чтобы управлять настройками безопасности и привязанными соцсетями.
          </p>
          <div className="pt-2">
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2.5 rounded-full bg-[#D2F544] text-[#0C2418] text-xs font-black hover:bg-[#bce336] transition-all cursor-pointer"
            >
              На главную
            </button>
          </div>
        </div>
      </div>
    );
  }

  const linkedList = providerData?.providers || [];
  const isGoogleLinked = linkedList.some((p) => p.provider === 'google');
  const isVkLinked = linkedList.some((p) => p.provider === 'vk');
  const isYandexLinked = linkedList.some((p) => p.provider === 'yandex');
  const isAppleLinked = linkedList.some((p) => p.provider === 'apple');

  const bestScore = testResults.length > 0 ? Math.max(...testResults.map((r) => r.overallScore)) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
      {/* 1. Header Card */}
      <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#D2F544]/10 via-emerald-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-neutral-900 border border-neutral-800 text-[#D2F544] flex items-center justify-center font-black text-2xl sm:text-3xl shadow-lg shrink-0">
              {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {user.name || 'Студент DET'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#D2F544]/15 border border-[#D2F544]/40 text-[#D2F544]">
                  {user.role === 'admin' ? 'Администратор' : 'Студент'}
                </span>
              </div>
              <p className="text-xs text-neutral-400 font-mono">{user.email}</p>
              <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-500">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Аккаунт создан: {new Date(user.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={async () => {
                await logout();
                router.push('/');
              }}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-300 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5 text-neutral-400" />
              <span>Выйти</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Alerts */}
      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl text-emerald-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-white font-bold px-1">
            ×
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-950/60 border border-red-800/80 rounded-2xl text-red-300 text-xs flex items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white font-bold px-1">
            ×
          </button>
        </div>
      )}

      {/* 2. Security & Connected Accounts Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#D2F544]" />
            <span>Безопасность и способы входа</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Управляйте паролем учетной записи и связывайте социальные профили для быстрого входа в 1 клик.
          </p>
        </div>

        {/* Email & Password Card */}
        <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 text-white space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-300">
                <KeyRound className="w-5 h-5 text-[#D2F544]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white">Вход по Email и паролю</h3>
                  {providerData?.hasPassword ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                      Пароль установлен
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                      Вход только через соцсети
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Основной Email: <span className="text-neutral-300 font-mono">{user.email}</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPasswordForm(!showPasswordForm);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-white transition-all cursor-pointer self-start sm:self-auto"
            >
              {showPasswordForm ? 'Отмена' : providerData?.hasPassword ? 'Сменить пароль' : 'Создать пароль'}
            </button>
          </div>

          {showPasswordForm && (
            <form onSubmit={handlePasswordSubmit} className="pt-4 border-t border-neutral-800 space-y-3.5 max-w-md animate-in fade-in duration-150">
              {providerData?.hasPassword && (
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Текущий пароль
                  </label>
                  <input
                    type="password"
                    required
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D2F544]"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  {providerData?.hasPassword ? 'Новый пароль' : 'Придумайте пароль (минимум 6 символов)'}
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D2F544]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Подтвердите новый пароль
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#D2F544]"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="px-5 py-2.5 rounded-xl bg-[#D2F544] hover:bg-[#bce336] text-[#0C2418] text-xs font-black transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {passwordLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Сохранить пароль</span>
              </button>
            </form>
          )}
        </div>

        {/* Connected Social Accounts 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Google */}
          <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Google</h4>
                  <p className="text-[11px] text-neutral-400">
                    {isGoogleLinked ? 'Привязано' : 'Не подключено'}
                  </p>
                </div>
              </div>

              {isGoogleLinked ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Подключено
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-neutral-500 border border-neutral-800">
                  Не активно
                </span>
              )}
            </div>

            <div>
              {isGoogleLinked ? (
                <button
                  onClick={() => handleUnlink('google')}
                  disabled={actionLoading === 'google'}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 hover:border-red-800 text-xs font-semibold text-neutral-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {actionLoading === 'google' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Отвязать Google</span>
                </button>
              ) : (
                <button
                  onClick={() => handleLink('google')}
                  disabled={actionLoading === 'google'}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {actionLoading === 'google' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 text-[#D2F544]" />}
                  <span>Привязать Google</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. VK ID */}
          <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 rounded-sm" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="5" fill="#0077FF" />
                    <path d="M19.3 17.5h-1.8c-.7 0-.9-.5-2.1-1.8-1.1-1-1.5-1.2-1.8-1.2-.4 0-.5.1-.5.6v1.7c0 .4-.1.7-1.3.7-1.9 0-4-1.2-5.5-3.3-2.3-3.2-2.9-5.6-2.9-6.1 0-.3.1-.5.6-.5h1.8c.5 0 .6.2.8.7.9 2.6 2.4 4.9 3 4.9.2 0 .3-.1.3-.7V9.8c-.1-1.2-.7-1.3-.7-1.8 0-.2.2-.4.5-.4h2.8c.4 0 .5.2.5.7v3.6c0 .4.2.5.3.5.2 0 .4-.1.9-.6 1.3-1.5 2.3-3.7 2.3-3.7.1-.3.3-.5.8-.5h1.8c.5 0 .7.3.5.7-.2 1-2.3 3.8-2.3 3.8-.2.3-.3.5 0 .9.2.3.9.9 1.3 1.4.8 1 1.5 1.8 1.6 2.3.2.5-.1.8-.6.8z" fill="white" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">VK ID</h4>
                  <p className="text-[11px] text-neutral-400">
                    {isVkLinked ? 'Привязано' : 'Не подключено'}
                  </p>
                </div>
              </div>

              {isVkLinked ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Подключено
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-neutral-500 border border-neutral-800">
                  Не активно
                </span>
              )}
            </div>

            <div>
              {isVkLinked ? (
                <button
                  onClick={() => handleUnlink('vk')}
                  disabled={actionLoading === 'vk'}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 hover:border-red-800 text-xs font-semibold text-neutral-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {actionLoading === 'vk' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Отвязать VK ID</span>
                </button>
              ) : (
                <button
                  onClick={() => handleLink('vk')}
                  disabled={actionLoading === 'vk'}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {actionLoading === 'vk' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 text-[#0077FF]" />}
                  <span>Привязать VK ID</span>
                </button>
              )}
            </div>
          </div>

          {/* 3. Яндекс ID */}
          <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="12" fill="#FC3F1D" />
                    <path d="M14.5 19H12.2V13.8H10.5L8.2 19H5.7L8.6 12.8C7.1 12.3 6.2 11.1 6.2 9.5C6.2 6.8 8.1 5 11.8 5H14.5V19ZM12.2 7.1H11.5C9.7 7.1 8.6 8 8.6 9.4C8.6 10.9 9.7 11.8 11.5 11.8H12.2V7.1Z" fill="white" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Яндекс ID</h4>
                  <p className="text-[11px] text-neutral-400">
                    {isYandexLinked ? 'Привязано' : 'Не подключено'}
                  </p>
                </div>
              </div>

              {isYandexLinked ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Подключено
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-neutral-500 border border-neutral-800">
                  Не активно
                </span>
              )}
            </div>

            <div>
              {isYandexLinked ? (
                <button
                  onClick={() => handleUnlink('yandex')}
                  disabled={actionLoading === 'yandex'}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 hover:border-red-800 text-xs font-semibold text-neutral-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {actionLoading === 'yandex' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Отвязать Яндекс</span>
                </button>
              ) : (
                <button
                  onClick={() => handleLink('yandex')}
                  disabled={actionLoading === 'yandex'}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {actionLoading === 'yandex' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 text-[#FC3F1D]" />}
                  <span>Привязать Яндекс</span>
                </button>
              )}
            </div>
          </div>

          {/* 4. Apple ID */}
          <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 fill-current text-white" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.79-11.97-14.24-6.3-9.47-11.18-20.2-14.63-32.19-3.46-11.99-5.19-23.3-5.19-33.93 0-14.6 3.69-26.68 11.07-36.25 7.38-9.57 16.66-14.42 27.84-14.56 5.34 0 11.17 1.34 17.5 4.02 6.33 2.68 10.23 4.08 11.71 4.19 1.7.11 5.92-1.34 12.67-4.35 6.74-3.02 12.62-4.38 17.63-4.08 13.06.74 23.49 5.71 31.28 14.92-11.43 6.94-17.02 16.32-16.78 28.14.24 9.47 3.84 17.38 10.81 23.72 6.97 6.34 15.22 10.02 24.75 11.04-2.11 6.53-4.76 13.12-7.93 19.78zM119.22 33.15c0-7.38 2.64-14.16 7.92-20.35 5.28-6.19 11.78-10.45 19.5-12.8-1.05 7.6-3.9 14.53-8.56 20.8-4.66 6.27-10.96 10.39-18.86 12.35z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Apple ID</h4>
                  <p className="text-[11px] text-neutral-400">
                    {isAppleLinked ? 'Привязано' : 'Не подключено'}
                  </p>
                </div>
              </div>

              {isAppleLinked ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Подключено
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-neutral-500 border border-neutral-800">
                  Не активно
                </span>
              )}
            </div>

            <div>
              {isAppleLinked ? (
                <button
                  onClick={() => handleUnlink('apple')}
                  disabled={actionLoading === 'apple'}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-red-950/40 border border-neutral-800 hover:border-red-800 text-xs font-semibold text-neutral-400 hover:text-red-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {actionLoading === 'apple' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Отвязать Apple ID</span>
                </button>
              ) : (
                <button
                  onClick={() => handleLink('apple')}
                  disabled={actionLoading === 'apple'}
                  className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {actionLoading === 'apple' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Привязать Apple ID</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Academic Progress & Quick Launch Section */}
      <div className="space-y-6 pt-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-[#D2F544]" />
            <span>Учебный прогресс и результаты</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Текущие показатели освоения программы Duolingo English Test на платформе.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Lessons completed */}
          <Link
            href="/theory"
            className="group bg-[#0E1012] border border-neutral-800 hover:border-neutral-700 rounded-3xl p-5 transition-all"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-semibold">Теория</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
            <div className="text-2xl font-black text-white">
              {completedLessons.length} <span className="text-sm font-normal text-neutral-500">/ 16 уроков</span>
            </div>
            <div className="mt-3 w-full bg-neutral-900 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-[#D2F544] h-full rounded-full transition-all"
                style={{ width: `${Math.round((completedLessons.length / 16) * 100)}%` }}
              />
            </div>
          </Link>

          {/* Test best score */}
          <Link
            href="/test"
            className="group bg-[#0E1012] border border-neutral-800 hover:border-neutral-700 rounded-3xl p-5 transition-all"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-semibold">Симулятор теста</span>
              <Sparkles className="w-4 h-4 text-[#D2F544]" />
            </div>
            <div className="text-2xl font-black text-white">
              {bestScore !== null ? bestScore : '—'} <span className="text-sm font-normal text-neutral-500">/ 160 баллов</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-3">
              {testResults.length > 0 ? `Пройдено тестов: ${testResults.length}` : 'Тест еще не пройден'}
            </p>
          </Link>

          {/* Typing WPM */}
          <Link
            href="/practice/typing"
            className="group bg-[#0E1012] border border-neutral-800 hover:border-neutral-700 rounded-3xl p-5 transition-all"
          >
            <div className="flex items-center justify-between text-neutral-400 mb-2">
              <span className="text-xs font-semibold">Тренажер печати</span>
              <Keyboard className="w-4 h-4 group-hover:text-white transition-colors" />
            </div>
            <div className="text-2xl font-black text-white">
              {bestTypingWpm > 0 ? bestTypingWpm : '—'} <span className="text-sm font-normal text-neutral-500">WPM</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-3">
              Рекомендуемый порог: 50+ WPM
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[80vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#D2F544] animate-spin" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
