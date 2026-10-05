'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { X, Lock, Mail, User, Sparkles, Shield } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

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
    if (provider === 'google') {
      await handleGoogleRealLogin();
      return;
    }

    clearError();
    // For Apple, VK and Yandex:
    if (provider === 'vk') {
      alert('Для входа через VK ID требуется указать зарегистрированный ID приложения VK в настройках.');
    } else if (provider === 'yandex') {
      alert('Для входа через Яндекс ID требуется указать Client ID приложения в консоли Яндекс OAuth.');
    } else if (provider === 'apple') {
      alert('Для входа через Apple ID требуется Service ID Apple Developer.');
    }
  };

  const handleQuickDemoLogin = async () => {
    clearError();
    const ok = await login('alex@det-academy.com', 'password123');
    if (ok) {
      setCandidateName('Alex Rivera');
      syncWithBackend();
      onClose();
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
          <div className="w-10 h-10 rounded-2xl bg-[#D2F544] text-[#0C2418] flex items-center justify-center font-black text-xl">
            D
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

          <div className="grid grid-cols-2 gap-2 pt-1">
            {/* Google */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
              title="Google Sign In"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
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

            {/* Apple */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('apple')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-xs font-bold text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
              title="Apple Sign In"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.79-11.97-14.24-6.3-9.47-11.18-20.2-14.63-32.19-3.46-11.99-5.19-23.3-5.19-33.93 0-14.6 3.69-26.68 11.07-36.25 7.38-9.57 16.66-14.42 27.84-14.56 5.34 0 11.17 1.34 17.5 4.02 6.33 2.68 10.23 4.08 11.71 4.19 1.7.11 5.92-1.34 12.67-4.35 6.74-3.02 12.62-4.38 17.63-4.08 13.06.74 23.49 5.71 31.28 14.92-11.43 6.94-17.02 16.32-16.78 28.14.24 9.47 3.84 17.38 10.81 23.72 6.97 6.34 15.22 10.02 24.75 11.04-2.11 6.53-4.76 13.12-7.93 19.78zM119.22 33.15c0-7.38 2.64-14.16 7.92-20.35 5.28-6.19 11.78-10.45 19.5-12.8-1.05 7.6-3.9 14.53-8.56 20.8-4.66 6.27-10.96 10.39-18.86 12.35z" />
              </svg>
              <span>Apple</span>
            </button>

            {/* VK ID */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('vk')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#0077FF]/15 hover:bg-[#0077FF]/25 border border-[#0077FF]/50 text-xs font-bold text-[#4B9CFF] transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
              title="VK ID Sign In"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M13.162 18.994c.609 0 .858-.406.851-.915-.072-1.428.643-2.138 1.455-2.138.813 0 1.547.781 2.378 1.956.845 1.196 1.488 1.097 2.155 1.097h2.894c1.196 0 1.62-.647 1.105-1.745-.631-1.348-2.613-3.649-3.235-4.463-.623-.814-.52-1.171 0-1.996.52-.825 2.29-3.266 2.628-4.442.227-.791-.252-1.344-1.258-1.344h-2.894c-.812 0-1.184.431-1.387.904-.766 1.785-2.029 4.195-2.576 4.417-.547.222-.728-.106-.728-.799V7.954c0-.987-.286-1.432-1.106-1.432h-4.545c-.623 0-.999.462-.999.897 0 .935 1.392 1.151 1.535 3.784v4.062c0 .889-.16 1.05-.512 1.05-.945 0-3.245-3.486-4.606-7.469-.364-1.066-.733-1.498-1.554-1.498H1.057C.244 8.799 0 9.177 0 9.734c0 .878 1.127 5.253 5.253 11.026 2.75 3.849 6.626 5.86 10.134 5.86l-2.225-7.626z" />
              </svg>
              <span>VK ID</span>
            </button>

            {/* Yandex ID */}
            <button
              type="button"
              onClick={() => handleOAuthLogin('yandex')}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-[#FC3F1D]/15 hover:bg-[#FC3F1D]/25 border border-[#FC3F1D]/50 text-xs font-bold text-[#FC3F1D] transition-all active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
              title="Yandex ID Sign In"
            >
              <div className="w-4 h-4 rounded-full bg-[#FC3F1D] text-white flex items-center justify-center font-black text-[10px] leading-none">
                Я
              </div>
              <span>Яндекс</span>
            </button>
          </div>
        </div>

        {/* Quick Demo Login Options */}
        <div className="mt-5 pt-4 border-t border-neutral-800/80 space-y-2">
          <p className="text-[11px] text-neutral-400 mb-2 text-center">
            {t.quickDemoHeading}
          </p>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={isLoading}
            className="w-full py-2 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-[#D2F544] flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {t.demoStudentBtn}
          </button>
          <button
            type="button"
            onClick={async () => {
              clearError();
              const ok = await login('admin@det-academy.com', 'admin123');
              if (ok) {
                setCandidateName('Super Admin');
                syncWithBackend();
                onClose();
              }
            }}
            disabled={isLoading}
            className="w-full py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 border border-purple-800/60 text-xs font-bold text-purple-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-purple-400" />
            {t.demoAdminBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
