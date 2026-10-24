'use client';

import React, { useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useAuthStore } from '@/store/useAuthStore';
import { translations } from '@/lib/translations';
import { PillBadge } from '@/components/ui/PillBadge';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';
import { AuthModal } from '@/components/auth/AuthModal';

export const HeroSection: React.FC = () => {
  const { locale } = useSettingsStore();
  const { isAuthenticated } = useAuthStore();
  const t = translations[locale].hero;
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <section className="relative pt-12 pb-20 md:pt-16 md:pb-28 overflow-hidden ambient-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 mb-6">
          <PillBadge variant="mint">
            DET Academy {new Date().getFullYear()}
          </PillBadge>
          <span className="text-xs font-semibold text-neutral-500 tracking-wide hidden sm:inline">
            {t.badge}
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-6xl font-semibold tracking-tight text-brand-obsidian max-w-4xl mx-auto leading-[1.15] mb-6">
          {t.titlePart1}{' '}
          <span className="inline-block align-middle my-1 px-4 py-1 sm:px-5 sm:py-1.5 rounded-full bg-brand-lime text-brand-forest text-3xl sm:text-5xl font-semibold border border-[#BCE828]">
            {t.titlePill}
          </span>{' '}
          {t.titlePart2}
        </h1>

        <p className="text-base sm:text-lg text-neutral-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          {t.subtitle}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          {isAuthenticated ? (
            <Button href="/diagnostic" variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />}>
              {t.ctaLoggedIn}
            </Button>
          ) : (
            <Button variant="primary" size="lg" icon={<ArrowRight className="w-5 h-5" />} onClick={() => setAuthOpen(true)}>
              {t.ctaPrimary}
            </Button>
          )}
          <Button href="/theory" variant="outline" size="lg">
            {t.ctaSecondary}
          </Button>
        </div>
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </section>
  );
};
