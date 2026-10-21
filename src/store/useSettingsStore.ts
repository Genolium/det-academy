import { create } from 'zustand';
import { Locale } from '@/lib/translations';

interface SettingsState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  cookieConsentAccepted: boolean;
  setCookieConsentAccepted: (accepted: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  strictMode: boolean;
  setStrictMode: (enabled: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  locale: 'ru',
  setLocale: (locale) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('det_locale', locale);
    }
    set({ locale });
  },
  cookieConsentAccepted: false,
  setCookieConsentAccepted: (accepted) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('det_cookie_consent', accepted ? 'true' : 'false');
    }
    set({ cookieConsentAccepted: accepted });
  },
  soundEnabled: true,
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  strictMode: false,
  setStrictMode: (enabled) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('det_strict_mode', enabled ? 'true' : 'false');
    }
    set({ strictMode: enabled });
  },
}));
