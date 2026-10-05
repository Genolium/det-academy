'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { useAuthStore } from '@/store/useAuthStore';
import { ShieldCheck, Award, Terminal, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  const pathname = usePathname();
  const { locale } = useSettingsStore();
  const { user } = useAuthStore();
  const t = translations[locale].footer;

  if (pathname.startsWith('/test/session')) {
    return null;
  }

  return (
    <footer className="w-full bg-[#111315] text-neutral-400 border-t border-neutral-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Col 1 */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#0E1012] border border-neutral-800 flex items-center justify-center p-1.5 shadow-sm shrink-0">
                <Image
                  src="/logo.svg"
                  alt="DET Academy"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="font-extrabold text-lg text-white">
                DET <span className="text-[#D2F544]">ACADEMY</span>
              </span>
            </div>
            <p className="text-sm text-neutral-400 max-w-md leading-relaxed">
              {t.tagline}
            </p>
            <div className="flex items-center gap-2 text-xs text-[#D2F544] font-medium bg-neutral-900 px-3 py-1.5 rounded-full w-fit border border-neutral-800">
              <ShieldCheck className="w-4 h-4" />
              {t.rules}
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.modulesTitle}</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/theory" className="hover:text-white transition-colors flex items-center gap-1">
                  {t.theoryLink} <ArrowUpRight className="w-3 h-3 text-[#D2F544]" />
                </Link>
              </li>
              <li>
                <Link href="/practice/typing" className="hover:text-white transition-colors flex items-center gap-1">
                  {t.typingLink} <ArrowUpRight className="w-3 h-3 text-[#D2F544]" />
                </Link>
              </li>
              <li>
                <Link href="/institutions" className="hover:text-white transition-colors flex items-center gap-1">
                  {t.institutionsLink} <ArrowUpRight className="w-3 h-3 text-[#D2F544]" />
                </Link>
              </li>
              <li>
                <Link href="/test" className="hover:text-white transition-colors flex items-center gap-1">
                  {t.testLink} <ArrowUpRight className="w-3 h-3 text-[#D2F544]" />
                </Link>
              </li>
              <li>
                <Link href="/verify/det-cert-8f921a4" className="hover:text-white transition-colors flex items-center gap-1">
                  {t.verifyLink} <ArrowUpRight className="w-3 h-3 text-[#D2F544]" />
                </Link>
              </li>
              {user?.role === 'admin' && (
                <li>
                  <Link href="/admin" className="hover:text-white transition-colors flex items-center gap-1">
                    {t.crmLink} <ArrowUpRight className="w-3 h-3 text-[#D2F544]" />
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-3">
            <h4 className="text-white text-xs font-bold uppercase tracking-wider">{t.examTitle}</h4>
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span>{t.scoreScaleLabel}</span>
                <span className="text-white font-bold">{t.scoreScaleVal}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.scoreStepLabel}</span>
                <span className="text-[#D2F544] font-bold">{t.scoreStepVal}</span>
              </div>
              <div className="flex justify-between">
                <span>{t.passScoreLabel}</span>
                <span className="text-white font-bold">{t.passScoreVal}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-neutral-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 gap-4">
          <p>© {new Date().getFullYear()} DET Academy. {t.rights}</p>
          <p className="text-[11px] max-w-xl text-center sm:text-right">{t.disclaimer}</p>
        </div>
      </div>
    </footer>
  );
};
