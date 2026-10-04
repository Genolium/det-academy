'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProgressStore } from '@/store/useProgressStore';
import { translations } from '@/lib/translations';
import { Globe, GraduationCap, Keyboard, PlayCircle, User as UserIcon, LogOut, LayoutDashboard } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { locale, setLocale } = useSettingsStore();
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore();
  const { syncWithBackend } = useProgressStore();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    syncWithBackend();
  }, [checkAuth, syncWithBackend]);

  const t = translations[locale].navbar;

  // Do not render navbar in focused test mode
  if (pathname.startsWith('/test/session')) {
    return null;
  }

  const isAdmin = user?.role === 'admin';

  return (
    <>
      <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-white/80 border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-2xl bg-[#0E1012] flex items-center justify-center text-[#D2F544] font-black text-xl shadow-md group-hover:rotate-6 transition-transform">
              D
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight text-[#0E1012] flex items-center gap-1.5">
                DET <span className="bg-[#D2F544] text-[#0C2418] text-xs px-2 py-0.5 rounded-full font-bold">ACADEMY</span>
              </span>
              <span className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                Duolingo English Test Prep
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 bg-neutral-100 p-1.5 rounded-full border border-neutral-200">
            <Link
              href="/theory"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                pathname.startsWith('/theory')
                  ? 'bg-white text-[#0E1012] shadow-sm'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              {t.theory}
            </Link>
            <Link
              href="/practice/typing"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                pathname.startsWith('/practice')
                  ? 'bg-white text-[#0E1012] shadow-sm'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5 text-amber-500" />
              {t.typing}
            </Link>
            <Link
              href="/test"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                pathname.startsWith('/test')
                  ? 'bg-white text-[#0E1012] shadow-sm'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5 text-lime-600" />
              {t.practice}
            </Link>
          </nav>

          {/* Right side controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-neutral-200 text-xs font-bold text-neutral-700 hover:border-black transition-colors"
              title="Toggle language"
            >
              <Globe className="w-3.5 h-3.5 text-neutral-500" />
              <span className="uppercase">{locale}</span>
            </button>

            {/* Auth Profile / Login Button */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-xs font-bold text-neutral-900">
                  <div className="w-5 h-5 rounded-full bg-[#0E1012] text-[#D2F544] flex items-center justify-center text-[10px] font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="max-w-[80px] sm:max-w-[110px] truncate">{user.name}</span>
                </div>
                {isAdmin && (
                  <Link
                    href="/admin"
                    title={t.admin}
                    className="p-1.5 sm:p-2 rounded-full bg-[#0E1012] text-[#D2F544] hover:bg-black transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                  </Link>
                )}
                <button
                  onClick={() => logout()}
                  title={t.logout}
                  className="p-1.5 sm:p-2 rounded-full text-neutral-400 hover:text-red-600 hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full border border-neutral-300 text-xs font-bold text-neutral-800 hover:border-black hover:bg-neutral-50 transition-all cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-neutral-600" />
                <span>{t.login}</span>
              </button>
            )}

            {/* Action CTA */}
            <Link
              href="/test"
              className="hidden sm:inline-flex items-center gap-2 bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] px-4 sm:px-5 py-2.5 rounded-full text-xs font-black tracking-wide uppercase transition-transform hover:scale-105 active:scale-95 shadow-sm"
            >
              {t.freeMock}
            </Link>
          </div>
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};
