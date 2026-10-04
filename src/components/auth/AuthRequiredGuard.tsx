'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { AuthModal } from '@/components/auth/AuthModal';
import { Lock, Sparkles, CheckCircle2, ArrowRight, UserCheck, Shield } from 'lucide-react';
import { PillBadge } from '@/components/ui/PillBadge';

interface AuthRequiredGuardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: string;
}

export const AuthRequiredGuard: React.FC<AuthRequiredGuardProps> = ({
  children,
  title,
  subtitle,
  badge = 'Private Educational Area',
}) => {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].auth;

  const [mounted, setMounted] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkAuth();
  }, [checkAuth]);

  if (!mounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-[#0C2418] rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <>{children}</>;
  }

  const displayTitle = title || t.guardTitle;
  const displaySubtitle = subtitle || t.guardSubtitle;

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-16 ambient-glow">
      <div className="w-full max-w-2xl bg-[#0E1012] border border-neutral-800 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden text-center">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-[#D2F544]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-2xl bg-[#D2F544]/20 border border-[#D2F544]/40 flex items-center justify-center text-[#D2F544] shadow-lg shadow-[#D2F544]/10">
              <Lock className="w-8 h-8" />
            </div>
          </div>

          <div className="space-y-2">
            <PillBadge variant="lime" prefixHash className="mx-auto mb-2">
              {badge}
            </PillBadge>
            <h2 className="text-2xl sm:text-3xl font-black uppercase text-white tracking-tight">
              {displayTitle}
            </h2>
            <p className="text-sm text-neutral-400 max-w-lg mx-auto leading-relaxed">
              {displaySubtitle}
            </p>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left py-2">
            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{t.guardSyncTitle}</h4>
              <p className="text-[11px] text-neutral-400">{t.guardSyncDesc}</p>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4">
              <div className="w-7 h-7 rounded-lg bg-[#D2F544]/20 text-[#D2F544] flex items-center justify-center mb-2">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{t.guardCatTitle}</h4>
              <p className="text-[11px] text-neutral-400">{t.guardCatDesc}</p>
            </div>

            <div className="bg-neutral-900/80 border border-neutral-800 rounded-2xl p-4">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
                <Shield className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-white mb-1">{t.guardCertTitle}</h4>
              <p className="text-[11px] text-neutral-400">{t.guardCertDesc}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setAuthModalOpen(true)}
              className="w-full sm:w-auto bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-[#D2F544]/20 cursor-pointer"
            >
              <UserCheck className="w-4 h-4" />
              {t.guardActionBtn}
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};
