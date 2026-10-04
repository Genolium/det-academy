'use client';

import { TypingEngine } from '@/components/typing/TypingEngine';
import { PillBadge } from '@/components/ui/PillBadge';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';

export default function TypingPage() {
  const { locale } = useSettingsStore();
  const t = translations[locale].typing;

  return (
    <div className="min-h-screen py-12 ambient-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-6">
        <div className="inline-flex items-center gap-2 mb-4">
          <PillBadge variant="mint" prefixHash>
            {t.badge}
          </PillBadge>
          <span className="text-xs uppercase tracking-widest text-neutral-500 font-bold">
            {t.tag}
          </span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black uppercase text-[#0E1012] tracking-tight mb-4">
          {t.title}
        </h1>
        <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto">
          {t.subtitle}
        </p>
      </div>

      <TypingEngine />
    </div>
  );
}
