'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { Locale } from '@/lib/translations';

export const LocaleSync: React.FC = () => {
  const { locale, setLocale } = useSettingsStore();

  useEffect(() => {
    try {
      const stored = localStorage.getItem('det_locale');
      if ((stored === 'ru' || stored === 'en') && stored !== locale) {
        setLocale(stored as Locale);
      }
    } catch {
      // Storage may be unavailable in restricted contexts.
    }
  }, [locale, setLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
};
