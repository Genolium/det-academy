'use client';

import React, { useEffect, useState } from 'react';
import { Trophy, Zap, Info } from 'lucide-react';
import { api, XPProfile } from '@/lib/api';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';

const ARENA_ENABLED = process.env.NEXT_PUBLIC_ARENA_ENABLED === 'true';

export const XpLeagueCard: React.FC = () => {
  const { locale } = useSettingsStore();
  const copy = translations[locale].dashboard;
  const [profile, setProfile] = useState<XPProfile | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');

  useEffect(() => {
    if (!ARENA_ENABLED) return;
    let mounted = true;
    api
      .getXPProfile()
      .then((data) => {
        if (!mounted) return;
        if (!data) {
          setStatus('empty');
          return;
        }
        setProfile(data);
        setStatus('ready');
      })
      .catch(() => {
        if (mounted) setStatus('error');
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (!ARENA_ENABLED) return null;

  if (status === 'loading') {
    return (
      <div className="bg-brand-obsidian border border-neutral-800 rounded-3xl p-5 sm:p-6">
        <p className="text-xs text-neutral-400">{copy.leagueLoading}</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-brand-obsidian border border-neutral-800 rounded-3xl p-5 sm:p-6">
        <p className="text-xs text-red-300">{copy.leagueError}</p>
      </div>
    );
  }

  if (status === 'empty' || !profile) {
    return (
      <div className="bg-brand-obsidian border border-neutral-800 rounded-3xl p-5 sm:p-6">
        <p className="text-xs text-neutral-400">{copy.leagueEmpty}</p>
      </div>
    );
  }

  const ru = locale === 'ru';
  const remaining = profile.nextAt ? Math.max(0, profile.nextAt - profile.weekly) : 0;

  return (
    <div className="bg-brand-obsidian border border-neutral-800 rounded-3xl p-5 sm:p-6 shadow-xl">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-xs font-bold tracking-wider text-white flex items-center gap-2">
          <Trophy className="w-4 h-4 text-brand-lime" />
          {ru ? 'Лига недели' : 'Weekly league'}
        </h3>
        <span className="text-[10px] font-bold text-neutral-500">{profile.weekStart}</span>
      </div>

      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="text-2xl font-semibold text-brand-lime">{profile.league}</div>
          <div className="text-[11px] text-neutral-400">
            {profile.weekly} XP {ru ? 'за неделю' : 'this week'} · {profile.total} XP {ru ? 'всего' : 'total'}
          </div>
        </div>
        {profile.nextLeague && (
          <div className="text-right">
            <div className="text-[10px] font-bold text-neutral-500">
              {ru ? 'До' : 'To'} {profile.nextLeague}
            </div>
            <div className="text-sm font-semibold text-white flex items-center gap-1 justify-end">
              <Zap className="w-3.5 h-3.5 text-brand-lime" />
              {remaining} XP
            </div>
          </div>
        )}
      </div>

      <p className="text-[10px] text-neutral-500 mt-3 flex items-start gap-1.5 leading-relaxed">
        <Info className="w-3 h-3 mt-0.5 shrink-0" />
        {ru ? profile.leagueBasis : 'League is based on XP for the current week (from Monday 00:00 UTC). A repeated event with the same key does not award XP twice.'}
      </p>
    </div>
  );
};
