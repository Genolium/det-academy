'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useAuthStore } from '@/store/useAuthStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { X, Lock, Mail, User, Info } from 'lucide-react';
import { generateRandomString, generateCodeChallenge } from '@/lib/pkce';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const { login, register, oauthLogin, isLoading, error, clearError } = useAuthStore();
  const { setCandidateName, syncWithBackend } = useProgressStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].auth;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    if (isRegister) {
      const ok = await register(email, password, name);
      if (ok) {
        setCandidateName(name);
        syncWithBackend();
        onClose();
      }
    } else {
      const ok = await login(email, password);
      if (ok) {
        const u = useAuthStore.getState().user;
        if (u) setCandidateName(u.name);
        syncWithBackend();
        onClose();
      }
    }
  };

  // Helper to parse JWT payload from real Google credential
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  const handleGoogleRealLogin = async () => {
    clearError();
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    if (!googleClientId) {
      alert('Google Client ID не настроен в файле .env');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (google && google.accounts && google.accounts.oauth2) {
      // Use Google OAuth2 Token Client for seamless popup
      const client = google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'openid email profile',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: async (tokenResponse: any) => {
          if (tokenResponse && tokenResponse.access_token) {
            try {
              // Fetch userinfo directly from Google
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });
              if (userInfoRes.ok) {
                const profile = await userInfoRes.json();
                const ok = await oauthLogin({
                  provider: 'google',
                  code: tokenResponse.access_token,
                  email: profile.email,
                  name: profile.name || profile.given_name || 'Google Student',
                  avatarUrl: profile.picture || '',
                });
                if (ok) {
                  const u = useAuthStore.getState().user;
                  if (u) setCandidateName(u.name);
                  syncWithBackend();
                  onClose();
                  return;
                }
              }
            } catch (err) {
              console.error('Google profile fetch error:', err);
            }
          }
        },
      });
      client.requestAccessToken();
      return;
    }

    if (google && google.accounts && google.accounts.id) {
      // Fallback to Google ID prompt
      google.accounts.id.initialize({
        client_id: googleClientId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callback: async (response: any) => {
          if (response && response.credential) {
            const payload = parseJwt(response.credential);
            if (payload) {
              const ok = await oauthLogin({
                provider: 'google',
                code: response.credential,
                email: payload.email,
                name: payload.name || payload.given_name || 'Google Student',
                avatarUrl: payload.picture || '',
              });
              if (ok) {
                const u = useAuthStore.getState().user;
                if (u) setCandidateName(u.name);
                syncWithBackend();
                onClose();
              }
            }
          }
        },
      });
      google.accounts.id.prompt();
      return;
    }

    // Direct Google OAuth 2.0 Web Redirect fallback
    const redirectUri = typeof window !== 'undefined' ? `${window.location.origin}` : 'http://localhost:3000';
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${googleClientId}&redirect_uri=${encodeURIComponent(
      redirectUri
    )}&response_type=token&scope=openid%20email%20profile`;
    window.location.href = authUrl;
  };

  const handleOAuthLogin = async (provider: 'google' | 'apple' | 'vk' | 'yandex') => {
    clearError();
    setNotice(null);

    if (provider === 'google') {
      await handleGoogleRealLogin();
      return;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://det-academy.ru';
    const callbackUri = `${origin}/auth/callback`;

    if (provider === 'vk') {
      const vkAppId = process.env.NEXT_PUBLIC_VK_CLIENT_ID || '54805089';
      if (vkAppId) {
        const codeVerifier = generateRandomString(64);
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('vk_code_verifier', codeVerifier);
          sessionStorage.setItem('vk_state', 'provider=vk&action=login');
        }

        const vkUrl = new URL('https://id.vk.ru/authorize');
        vkUrl.searchParams.set('response_type', 'code');
        vkUrl.searchParams.set('client_id', vkAppId);
        vkUrl.searchParams.set('redirect_uri', callbackUri);
        vkUrl.searchParams.set('state', 'provider=vk&action=login');
        vkUrl.searchParams.set('code_challenge', codeChallenge);
        vkUrl.searchParams.set('code_challenge_method', 's256');
        vkUrl.searchParams.set('scope', 'vkid.personal_info email');

        window.location.href = vkUrl.toString();
        return;
      }
      setNotice('Для входа через VK ID укажите NEXT_PUBLIC_VK_CLIENT_ID в .env на сервере. Войдите через Google или Email.');
      return;
    }

    if (provider === 'yandex') {
      const yandexId = process.env.NEXT_PUBLIC_YANDEX_CLIENT_ID;
      if (yandexId) {
        window.location.href = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${yandexId}&redirect_uri=${encodeURIComponent(
          callbackUri
        )}&state=provider%3Dyandex%26action%3Dlogin`;
        return;
      }
      setNotice('Для входа через Яндекс ID укажите NEXT_PUBLIC_YANDEX_CLIENT_ID в .env на сервере. Войдите через Google или Email.');
      return;
    }

    if (provider === 'apple') {
      const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID;
      if (appleClientId) {
        window.location.href = `https://appleid.apple.com/auth/authorize?client_id=${appleClientId}&redirect_uri=${encodeURIComponent(
          callbackUri
        )}&response_type=code%20id_token&scope=name%20email&response_mode=fragment&state=provider%3Dapple%26action%3Dlogin`;
        return;
      }
      setNotice('Для входа через Apple ID укажите NEXT_PUBLIC_APPLE_CLIENT_ID в .env на сервере. Войдите через Google или Email.');
      return;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-[#0E1012] border border-neutral-800 flex items-center justify-center p-1.5 shadow-sm shrink-0">
            <Image
              src="/logo.svg"
              alt="DET Academy"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {isRegister ? t.registerTitle : t.loginTitle}
            </h2>
            <p className="text-xs text-neutral-400">
              DET Academy • Duolingo English Test Prep
            </p>
          </div>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-neutral-900 p-1 rounded-2xl border border-neutral-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              clearError();
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              !isRegister ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t.loginTab}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              clearError();
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              isRegister ? 'bg-white text-black shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            {t.registerTab}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/80 border border-red-800 text-red-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        {notice && (
          <div className="mb-4 p-3 bg-blue-950/80 border border-blue-800 text-blue-300 text-xs rounded-xl flex items-start gap-2 animate-in fade-in duration-150">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
            <div className="flex-1 leading-relaxed">{notice}</div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="text-neutral-400 hover:text-white px-1 text-sm font-bold"
              title="Закрыть"
            >
              ×
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                {t.nameLabel}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  required
                  placeholder={t.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#D2F544]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.emailLabel}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                required
                placeholder={t.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#D2F544]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              {t.passwordLabel}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#D2F544]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 bg-[#D2F544] hover:bg-[#bce336] text-[#0C2418] font-black text-sm py-3 rounded-full transition-all shadow-md active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? t.loading : isRegister ? t.registerBtn : t.loginBtn}
          </button>
        </form>

        {/* OAuth Social Identity Providers */}
        <div className="mt-5 space-y-3">
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-neutral-800" />
            <span className="absolute bg-[#0E1012] px-3 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              {t.oauthDivider}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm group"
              title="Войти через Google"
            >
              <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* VK ID */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('vk')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm group"
              title="Войти через VK ID"
            >
              <svg className="w-4 h-4 shrink-0 rounded-sm transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none">
                <rect width="24" height="24" rx="5" fill="#0077FF" />
                <path d="M19.3 17.5h-1.8c-.7 0-.9-.5-2.1-1.8-1.1-1-1.5-1.2-1.8-1.2-.4 0-.5.1-.5.6v1.7c0 .4-.1.7-1.3.7-1.9 0-4-1.2-5.5-3.3-2.3-3.2-2.9-5.6-2.9-6.1 0-.3.1-.5.6-.5h1.8c.5 0 .6.2.8.7.9 2.6 2.4 4.9 3 4.9.2 0 .3-.1.3-.7V9.8c-.1-1.2-.7-1.3-.7-1.8 0-.2.2-.4.5-.4h2.8c.4 0 .5.2.5.7v3.6c0 .4.2.5.3.5.2 0 .4-.1.9-.6 1.3-1.5 2.3-3.7 2.3-3.7.1-.3.3-.5.8-.5h1.8c.5 0 .7.3.5.7-.2 1-2.3 3.8-2.3 3.8-.2.3-.3.5 0 .9.2.3.9.9 1.3 1.4.8 1 1.5 1.8 1.6 2.3.2.5-.1.8-.6.8z" fill="white" />
              </svg>
              <span>VK ID</span>
            </button>

            {/* Yandex ID */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('yandex')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-xs font-semibold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm group"
              title="Войти через Яндекс ID"
            >
              <svg className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="12" fill="#FC3F1D" />
                <path d="M14.5 19H12.2V13.8H10.5L8.2 19H5.7L8.6 12.8C7.1 12.3 6.2 11.1 6.2 9.5C6.2 6.8 8.1 5 11.8 5H14.5V19ZM12.2 7.1H11.5C9.7 7.1 8.6 8 8.6 9.4C8.6 10.9 9.7 11.8 11.5 11.8H12.2V7.1Z" fill="white" />
              </svg>
              <span>Яндекс</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
