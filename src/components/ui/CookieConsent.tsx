'use client';

import React, { useEffect, useState } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { Cookie } from 'lucide-react';

export const CookieConsent: React.FC = () => {
  const { locale, cookieConsentAccepted, setCookieConsentAccepted } = useSettingsStore();
  const [mounted, setMounted] = useState(false);
  const t = translations[locale].cookie;

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('det_cookie_consent');
    if (stored === 'true') {
      setCookieConsentAccepted(true);
    }
  }, [setCookieConsentAccepted]);

  if (!mounted || cookieConsentAccepted) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md bg-[#111315] text-white p-5 rounded-3xl border border-neutral-700 shadow-2xl flex flex-col sm:flex-row items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-[#D2F544]/20 text-[#D2F544]">
          <Cookie className="w-5 h-5" />
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">
          {t.text}
        </p>
      </div>
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <button
          onClick={() => setCookieConsentAccepted(true)}
          className="bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] text-xs font-bold px-4 py-2 rounded-full transition-transform active:scale-95 whitespace-nowrap"
        >
          {t.accept}
        </button>
      </div>
    </div>
  );
};
