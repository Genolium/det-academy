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

  const { login, register, isLoading, error, clearError } = useAuthStore();
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

        {/* Quick Demo Login Options */}
        <div className="mt-6 pt-5 border-t border-neutral-800/80 space-y-2">
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
