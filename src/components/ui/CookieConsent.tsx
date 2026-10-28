'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { Cookie } from 'lucide-react';

/**
 * Consent notice. Deliberately a single compact row on desktop: it must not
 * cover the hero, and the copy is limited to what actually happens (sign-in and
 * local progress) instead of a paragraph of policy.
 */
export const CookieConsent: React.FC = () => {
  const { locale, cookieConsentAccepted, setCookieConsentAccepted } = useSettingsStore();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const t = translations[locale].cookie;

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('det_cookie_consent');
    if (stored === 'true') {
      setCookieConsentAccepted(true);
    }
    if (stored === 'true' || stored === 'rejected') {
      setDismissed(true);
    }
  }, [setCookieConsentAccepted]);

  // The exam must stay distraction-free and its controls must never be
  // covered by a consent banner.
  if (!mounted || dismissed || cookieConsentAccepted || pathname?.startsWith('/test/session')) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(12px,env(safe-area-inset-bottom))] sm:px-6 sm:pb-5">
      <div
        role="region"
        aria-label={t.label}
        className="pointer-events-auto mx-auto flex max-w-[840px] flex-col gap-2.5 rounded-2xl border border-white/10 bg-[#111315]/95 px-4 py-3 text-white shadow-[0_18px_50px_-12px_rgba(0,0,0,0.55)] backdrop-blur-md sm:flex-row sm:items-center sm:gap-4 sm:rounded-full sm:py-2 sm:pl-5 sm:pr-2"
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#D2F544]/15 text-[#D2F544]">
            <Cookie className="h-3.5 w-3.5" aria-hidden="true" />
          </span>
          <p className="text-[12.5px] leading-snug text-neutral-300 sm:text-[13px]">
            {t.text}{' '}
            <a
              href="/privacy"
              className="whitespace-nowrap text-white/90 underline decoration-white/30 underline-offset-2 hover:text-white hover:decoration-white"
            >
              {t.privacy}
            </a>
          </p>
        </div>
        <div className="flex shrink-0 items-center justify-end gap-1.5 self-stretch sm:gap-2 sm:self-auto">
          <button
            onClick={() => {
              localStorage.setItem('det_cookie_consent', 'rejected');
              setDismissed(true);
            }}
            className="h-11 shrink-0 cursor-pointer whitespace-nowrap rounded-full px-2.5 text-[12.5px] font-semibold text-neutral-400 transition-colors hover:bg-white/5 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2F544] sm:h-9 sm:px-3"
          >
            {t.decline}
          </button>
          <button
            onClick={() => {
              setCookieConsentAccepted(true);
              setDismissed(true);
            }}
            className="h-11 shrink-0 cursor-pointer whitespace-nowrap rounded-full bg-[#D2F544] px-4 text-[12.5px] font-bold text-[#0C2418] transition-colors hover:bg-[#C4F22C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2F544] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] active:scale-[0.98] sm:h-9"
          >
            {t.accept}
          </button>
        </div>
      </div>
    </div>
  );
};
