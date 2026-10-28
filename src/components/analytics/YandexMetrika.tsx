'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Yandex Metrika counter for the public site.
 *
 * Loading rules (see docs/metrika.md):
 *  - never in development/CI unless NEXT_PUBLIC_YM_ENABLED=true;
 *  - by default only after the visitor accepted analytics cookies
 *    (localStorage `det_cookie_consent === 'true'`);
 *  - NEXT_PUBLIC_YM_CONSENT_MODE=always is the explicit legal escape hatch for
 *    jurisdictions where the counter may load without prior consent.
 *
 * The tag is injected exactly once per document. Client-side navigations are
 * tracked with an explicit `ym(..., 'hit', ...)` because the App Router never
 * reloads the document.
 */

const DEFAULT_COUNTER_ID = '113844701';
const CONSENT_STORAGE_KEY = 'det_cookie_consent';
const TAG_URL = 'https://mc.yandex.ru/metrika/tag.js';

export const YANDEX_METRIKA_ID =
  (process.env.NEXT_PUBLIC_YM_ID || DEFAULT_COUNTER_ID).replace(/\D/g, '') || DEFAULT_COUNTER_ID;

const COUNTER_ENABLED =
  process.env.NEXT_PUBLIC_YM_ENABLED === 'false'
    ? false
    : process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_YM_ENABLED === 'true';

const CONSENT_MODE: 'required' | 'always' =
  process.env.NEXT_PUBLIC_YM_CONSENT_MODE === 'always' ? 'always' : 'required';

declare global {
  interface Window {
    ym?: ((...args: unknown[]) => void) & { a?: unknown[]; l?: number };
    __detYandexMetrikaLoaded?: boolean;
  }
}

function buildCounterSnippet(counterId: string): string {
  // Same loader as the official snippet, wrapped in an idempotency guard so a
  // React remount (StrictMode, error boundary recovery) never injects twice.
  return `
(function () {
  if (window.__detYandexMetrikaLoaded) return;
  window.__detYandexMetrikaLoaded = true;
  (function (m, e, t, r, i, k, a) {
    m[i] = m[i] || function () { (m[i].a = m[i].a || []).push(arguments); };
    m[i].l = 1 * new Date();
    for (var j = 0; j < document.scripts.length; j++) {
      if (document.scripts[j].src === r) { return; }
    }
    k = e.createElement(t);
    a = e.getElementsByTagName(t)[0];
    k.async = 1;
    k.src = r;
    a.parentNode.insertBefore(k, a);
  })(window, document, 'script', ${JSON.stringify(TAG_URL)}, 'ym');
  ym(${JSON.stringify(counterId)}, 'init', {
    ssr: true,
    webvisor: true,
    clickmap: true,
    ecommerce: 'dataLayer',
    referrer: document.referrer,
    url: location.href,
    accurateTrackBounce: true,
    trackLinks: true
  });
})();
`;
}

export function YandexMetrika() {
  const pathname = usePathname();
  const storeConsent = useSettingsStore((state) => state.cookieConsentAccepted);
  const [storedConsent, setStoredConsent] = useState(false);
  const [mounted, setMounted] = useState(false);
  const lastTrackedPathname = useRef(pathname);

  useEffect(() => {
    const readConsent = () => {
      try {
        return window.localStorage.getItem(CONSENT_STORAGE_KEY) === 'true';
      } catch {
        return false;
      }
    };
    const sync = () => setStoredConsent(readConsent());

    sync();
    setMounted(true);
    window.addEventListener('storage', sync);
    // Allows a future consent UI (or a consent manager) to notify us directly.
    window.addEventListener('det:cookie-consent', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('det:cookie-consent', sync);
    };
  }, []);

  const consentGranted = CONSENT_MODE === 'always' || storeConsent || (mounted && storedConsent);
  const active = COUNTER_ENABLED && consentGranted;

  // App Router navigations do not reload the document, so the initial `init`
  // pageview must be followed by manual hits. The first render is skipped: the
  // counter already counted it (ssr: true / url at init time).
  useEffect(() => {
    if (!active || lastTrackedPathname.current === pathname) return;
    if (typeof window.ym !== 'function') return;
    lastTrackedPathname.current = pathname;
    window.ym(YANDEX_METRIKA_ID, 'hit', window.location.href, {
      title: document.title,
      referrer: document.referrer,
    });
  }, [active, pathname]);

  if (!active) return null;

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {buildCounterSnippet(YANDEX_METRIKA_ID)}
      </Script>
      {/*
        The pixel only works without JavaScript, where the consent banner cannot
        be shown. It is therefore rendered only in the explicit always-on mode.
      */}
      {CONSENT_MODE === 'always' ? (
        <noscript>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- tracking pixel, next/image cannot render inside noscript */}
            <img
              src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`}
              style={{ position: 'absolute', left: '-9999px' }}
              alt=""
            />
          </div>
        </noscript>
      ) : null}
    </>
  );
}

export default YandexMetrika;
