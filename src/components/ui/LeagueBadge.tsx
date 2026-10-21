'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { getLeagueInfo, LeagueInfo } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Swords, Trophy, ChevronRight, Zap } from 'lucide-react';

interface LeagueBadgeProps {
  elo: number;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export const LeagueBadge: React.FC<LeagueBadgeProps> = ({
  elo,
  size = 'md',
  showTooltip = true,
  className = '',
}) => {
  const { locale } = useSettingsStore();
  const [isOpen, setIsOpen] = useState(false);
  const league: LeagueInfo = getLeagueInfo(elo);

  const eloToNext = Math.max(0, league.maxElo + 1 - elo);
  const nextLeague = getLeagueInfo(league.maxElo + 1);

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-black',
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => showTooltip && setIsOpen(true)}
        onMouseLeave={() => showTooltip && setIsOpen(false)}
        className={`rounded-full border font-extrabold flex items-center transition-all duration-200 hover:scale-105 cursor-pointer shadow-sm ${league.color} ${sizeClasses[size]}`}
      >
        <span className="shrink-0">{league.badge}</span>
        <span className="font-bold tracking-tight">{league.name}</span>
        <span className="text-[10px] font-mono opacity-80 hidden sm:inline">({elo})</span>
      </button>

      {/* Interactive Tooltip Popover */}
      {isOpen && (
        <div
          onMouseEnter={() => setIsOpen(true)}
          onMouseLeave={() => setIsOpen(false)}
          className="absolute right-0 top-full mt-2 w-64 p-3.5 bg-[#0E1012] border border-neutral-700/80 rounded-2xl shadow-2xl z-50 text-white animate-in fade-in slide-in-from-top-1 duration-150"
        >
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <div className="flex items-center gap-1.5">
              <span className="text-base">{league.badge}</span>
              <span className="text-xs font-black text-white">{league.name} League</span>
            </div>
            <span className="text-xs font-mono font-bold text-[#D2F544]">{elo} ELO</span>
          </div>

          <div className="py-2.5 space-y-1.5 text-[11px] text-neutral-300">
            <div className="flex items-center justify-between text-neutral-400">
              <span>{locale === 'ru' ? 'Диапазон лиги:' : 'League range:'}</span>
              <span className="font-mono">{league.minElo} – {league.maxElo >= 3000 ? '∞' : league.maxElo}</span>
            </div>

            {league.name !== 'Grandmaster' ? (
              <div className="flex items-center justify-between text-[#D2F544] font-bold">
                <span>{locale === 'ru' ? `До ${nextLeague.name}:` : `To ${nextLeague.name}:`}</span>
                <span>+{eloToNext} ELO</span>
              </div>
            ) : (
              <div className="text-emerald-400 font-bold">
                {locale === 'ru' ? '👑 Максимальный дивизион DET Арены!' : '👑 Top division of DET Arena!'}
              </div>
            )}
          </div>

          <Link
            href="/arena"
            className="w-full py-1.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <Swords className="w-3.5 h-3.5 text-[#D2F544]" />
            <span>{locale === 'ru' ? 'В дуэли 1v1' : '1v1 Arena Duels'}</span>
            <ChevronRight className="w-3 h-3 text-neutral-400" />
          </Link>
        </div>
      )}
    </div>
  );
};
