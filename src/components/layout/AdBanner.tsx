'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ExternalLink, X } from 'lucide-react';
import { api, AdBannerData } from '@/lib/api';
import { directusCms } from '@/lib/directus';

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
    // 1. Try Directus CMS first, fallback to Go backend API
    directusCms.getBanners(placement)
      .then((directusBanners) => {
        if (isMounted && directusBanners && directusBanners.length > 0) {
          const b = directusBanners[0];
          setBanner({
            id: b.id,
            placement: b.placement,
            imageUrl: b.image_url || '',
            targetUrl: b.target_url,
            altText: b.alt_text,
            isActive: b.is_active,
            impressions: b.impressions,
            clicks: b.clicks,
          });
          return;
        }
        // Fallback to backend API
        return api.getActiveBanners(placement);
      })
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

  // Strict constraint from MAIN.MD: Ad banners MUST be hidden during adaptive test sessions!
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
      <div className="w-full bg-[#0E1012] text-white py-2 px-4 border-b border-neutral-800 text-xs flex items-center justify-between">
        <div className="max-w-7xl mx-auto flex items-center gap-2 flex-1 justify-center">
          <span className="bg-[#D2F544] text-[#0C2418] text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
            {t.partner}
          </span>
          <span className="text-neutral-300 font-medium">
            {text}
          </span>
          <a
            href={targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleBannerClick}
            className="text-[#D2F544] hover:underline inline-flex items-center gap-1 font-semibold ml-2"
          >
            {t.learnMore} <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-neutral-400 hover:text-white p-1"
          aria-label="Close banner"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  const footerText = banner?.altText || t.footerDefaultText;
  const footerTarget = banner?.targetUrl || '#mentor';

  return (
    <div className="w-full py-4 px-4 bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border-t border-b border-neutral-800">
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
          className="bg-white hover:bg-neutral-200 text-black px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap"
        >
          {t.learnMore}
        </a>
      </div>
    </div>
  );
};
