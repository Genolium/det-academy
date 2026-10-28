'use client';

import React from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';

export const SkipLink: React.FC = () => {
  const { locale } = useSettingsStore();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-[#D2F544] focus:px-4 focus:py-2 focus:text-sm focus:font-black focus:text-[#0C2418]"
    >
      {locale === 'ru' ? 'Перейти к основному содержимому' : 'Skip to main content'}
    </a>
  );
};
