'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useProgressStore } from '@/store/useProgressStore';
import { translations } from '@/lib/translations';
import { 
  Globe, 
  GraduationCap, 
  Keyboard, 
  PlayCircle, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard, 
  Layers, 
  Sparkles,
  Menu,
  X,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { locale, setLocale } = useSettingsStore();
  const { user, isAuthenticated, checkAuth, logout } = useAuthStore();
  const { syncWithBackend } = useProgressStore();
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    checkAuth();
    syncWithBackend();

    // Catch OAuth redirect token in URL hash if popup redirected
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token=')) {
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        if (accessToken) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
          })
            .then((res) => res.json())
            .then(async (profile) => {
              if (profile && profile.email) {
                const ok = await useAuthStore.getState().oauthLogin({
                  provider: 'google',
                  code: accessToken,
                  email: profile.email,
                  name: profile.name || profile.given_name || 'Google Student',
                  avatarUrl: profile.picture || '',
                });
                if (ok) {
                  const u = useAuthStore.getState().user;
                  if (u) useProgressStore.getState().setCandidateName(u.name);
                  useProgressStore.getState().syncWithBackend();
                }
              }
            })
            .catch((err) => console.error('OAuth redirect processing error:', err));
        }
      }
    }
  }, [checkAuth, syncWithBackend]);

  // Modern scroll-state detection for sticky header elevation
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change or click outside
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [pathname]);

  const t = translations[locale].navbar;

  // Do not render navbar in focused test mode
  if (pathname.startsWith('/test/session')) {
    return null;
  }

  const isAdmin = user?.role === 'admin';

  const navLinks = [
    {
      href: '/theory',
      label: t.theory,
      icon: GraduationCap,
      isActive: pathname.startsWith('/theory'),
    },
    {
      href: '/practice',
      label: t.drills,
      icon: Layers,
      isActive: pathname === '/practice',
    },
    {
      href: '/institutions',
      label: t.institutions,
      icon: MapPin,
      isActive: pathname.startsWith('/institutions'),
    },
  ];

  return (
    <>
      <header 
        className={`sticky top-0 z-40 w-full transition-all duration-300 ${
          isScrolled 
            ? 'navbar-glass-scrolled border-b border-neutral-200/90 py-2.5' 
            : 'navbar-glass border-b border-neutral-200/60 py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          
          {/* LEFT: Clean Brand Identity */}
          <Link 
            href="/" 
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D2F544] rounded-xl shrink-0"
          >
            <div className="w-9 h-9 rounded-xl bg-[#0E1012] flex items-center justify-center text-[#D2F544] font-black text-base shadow-sm group-hover:scale-105 transition-transform duration-200 border border-neutral-800">
              D
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-[#0E1012] flex items-center gap-1.5 leading-none">
                DET <span className="bg-[#D2F544] text-[#0C2418] text-[10px] px-1.5 py-0.5 rounded-full font-black tracking-normal">ACADEMY</span>
              </span>
              <span className="text-[9px] uppercase font-semibold text-neutral-400 tracking-wider mt-0.5">
                Prep Platform
              </span>
            </div>
          </Link>

          {/* CENTER: Floating Segmented Navigation (Apple / Linear aesthetic) */}
          <nav className="hidden md:flex items-center gap-1 bg-neutral-100/80 p-1 rounded-full border border-neutral-200/80 shadow-inner backdrop-blur-sm">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
                    item.isActive
                      ? 'bg-white text-[#0E1012] shadow-sm font-bold scale-[1.02]'
                      : 'text-neutral-600 hover:text-black hover:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${item.isActive ? 'text-emerald-600' : 'text-neutral-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* RIGHT: Consolidated User & Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Language Switcher */}
            <button
              onClick={() => setLocale(locale === 'ru' ? 'en' : 'ru')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-neutral-200 bg-white/80 text-[11px] font-bold text-neutral-700 hover:border-black hover:text-black transition-all shadow-sm cursor-pointer"
              title="Toggle language"
            >
              <Globe className="w-3.5 h-3.5 text-neutral-400" />
              <span className="uppercase">{locale}</span>
            </button>

            {/* User Profile Dropdown / Sign In */}
            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1 pr-2.5 rounded-full bg-white border border-neutral-200 hover:border-neutral-300 transition-all shadow-sm cursor-pointer"
                >
                  <div className="w-6 h-6 rounded-full bg-[#0E1012] text-[#D2F544] flex items-center justify-center text-[10px] font-black">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-bold text-neutral-800 max-w-[80px] sm:max-w-[100px] truncate hidden sm:inline">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {/* Popover Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-neutral-100 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-neutral-100">
                      <p className="text-xs font-bold text-neutral-900 truncate">{user.name}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{user.email}</p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-black"
                    >
                      <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                      <span>{locale === 'ru' ? 'Личный кабинет' : 'My Profile'}</span>
                    </Link>

                    {isAdmin && (
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 hover:text-black"
                      >
                        <LayoutDashboard className="w-3.5 h-3.5 text-neutral-500" />
                        <span>{t.admin}</span>
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 text-left cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full border border-neutral-200 bg-white text-xs font-bold text-neutral-800 hover:border-black hover:bg-neutral-50 transition-all shadow-sm cursor-pointer"
              >
                <UserIcon className="w-3.5 h-3.5 text-neutral-500" />
                <span>{t.login}</span>
              </button>
            )}

            {/* Primary Action Button */}
            <Link
              href="/test"
              className="inline-flex items-center gap-1.5 bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-black tracking-wide uppercase transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] shadow-sm border border-[#C4F22C]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0C2418]" />
              <span className="hidden sm:inline">{t.freeMock}</span>
              <span className="sm:hidden">Тест</span>
            </Link>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 rounded-full border border-neutral-200 bg-white text-neutral-700 hover:text-black hover:border-black transition-colors cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-200/80 bg-white/95 backdrop-blur-xl px-4 py-3.5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all ${
                      item.isActive
                        ? 'bg-[#0E1012] text-[#D2F544] shadow-sm'
                        : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};
