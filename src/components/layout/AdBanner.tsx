'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ArrowUpRight, X } from 'lucide-react';
import { api, AdBannerData } from '@/lib/api';
import { translations } from '@/lib/translations';
import { useSettingsStore } from '@/store/useSettingsStore';

interface AdBannerProps {
  placement: 'HEADER' | 'FOOTER';
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement }) => {
  const pathname = usePathname();
  const { locale } = useSettingsStore();
  const t = translations[locale].adBanner;
  const [dismissed, setDismissed] = useState(false);
  const [banner, setBanner] = useState<AdBannerData | null>(null);

  useEffect(() => {
    let isMounted = true;
    api.getActiveBanners(placement)
      .then((banners) => {
        if (isMounted && banners && banners.length > 0) {
          setBanner(banners[0]);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [placement]);

  // Strict constraint: Ad banners MUST be hidden during adaptive test sessions or once dismissed
  if (pathname.startsWith('/test/session') || dismissed) {
    return null;
  }

  const handleBannerClick = () => {
    if (banner?.id) {
      api.recordBannerClick(banner.id);
    }
  };

  if (placement === 'HEADER') {
    const text = banner?.altText || t.headerDefaultText;
    const targetUrl = banner?.targetUrl || 'https://so-called-spark.ru';

    return (
      <aside aria-label="Announcement" className="w-full bg-[#0E1012] text-white border-b border-neutral-800/80 text-[11px] leading-tight transition-all">
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 justify-center truncate">
            <span className="bg-[#D2F544] text-[#0C2418] text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
              {t.partner}
            </span>
            <span className="text-neutral-300 font-normal truncate">
              {text}
            </span>
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleBannerClick}
              className="text-[#D2F544] hover:text-[#C4F22C] inline-flex items-center gap-0.5 font-bold shrink-0 ml-1 hover:underline transition-colors"
            >
              <span>{t.learnMore}</span>
              <ArrowUpRight className="w-3 h-3" />
            </a>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-neutral-400 hover:text-white p-0.5 rounded hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close announcement banner"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    );
  }

  const footerText = banner?.altText || t.footerDefaultText;
  const footerTarget = banner?.targetUrl || '#mentor';

  return (
    <aside aria-label="Partner sponsorship" className="w-full py-4 px-4 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-t border-b border-neutral-800">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 bg-neutral-900/60 p-4 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D2F544]/20 border border-[#D2F544]/40 flex items-center justify-center text-[#D2F544] font-black text-sm">
            AD
          </div>
          <div>
            <div className="text-white text-xs font-bold flex items-center gap-2">
              {footerText}
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded-full">
                {t.openEnrollment}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400">
              {t.footerSubtext}
            </p>
          </div>
        </div>
        <a
          href={footerTarget}
          onClick={handleBannerClick}
          className="bg-white hover:bg-neutral-200 text-black px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer"
        >
          {t.learnMore}
        </a>
      </div>
    </aside>
  );
};
