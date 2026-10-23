'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Zap, Info } from 'lucide-react';
import { api, XPProfile } from '@/lib/api';
import { useSettingsStore } from '@/store/useSettingsStore';

/**
 * Weekly league derived on the server from the XP ledger. The card explains
 * the rule instead of showing an unexplained badge.
 */
export const XpLeagueCard: React.FC = () => {
  const { locale } = useSettingsStore();
  const [profile, setProfile] = useState<XPProfile | null>(null);

  useEffect(() => {
    let mounted = true;
    api
      .getXPProfile()
      .then((data) => {
        if (mounted) setProfile(data);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!profile) return null;

  const ru = locale === 'ru';
  const remaining = profile.nextAt ? Math.max(0, profile.nextAt - profile.weekly) : 0;

  return (
    <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-xs font-black uppercase tracking-wider text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#D2F544]" />
          {ru ? 'Лига недели' : 'Weekly league'}
        </h3>
        <span className="text-[10px] uppercase font-bold text-neutral-500">
          {profile.weekStart}
        </span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-black text-[#D2F544]">{profile.league}</div>
          <div className="text-[11px] text-neutral-400">
            {profile.weekly} XP {ru ? 'за неделю' : 'this week'} · {profile.total} XP {ru ? 'всего' : 'total'}
          </div>
        </div>
        {profile.nextLeague && (
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-neutral-500">
              {ru ? 'До' : 'To'} {profile.nextLeague}
            </div>
            <div className="text-sm font-black text-white flex items-center gap-1 justify-end">
              <Zap className="w-3.5 h-3.5 text-[#D2F544]" />
              {remaining} XP
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-neutral-500 mt-3 flex items-start gap-1.5 leading-relaxed">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        {profile.leagueBasis}
      </p>
    </div>
  );
};
