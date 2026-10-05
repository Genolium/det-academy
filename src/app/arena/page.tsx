'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  Swords,
  Trophy,
  Zap,
  Timer,
  Award,
  Users,
  Flame,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Shield,
  Sparkles,
} from 'lucide-react';
import { PillBadge } from '@/components/ui/PillBadge';

type ArenaState = 'LOBBY' | 'SEARCHING' | 'COUNTDOWN' | 'DUELING' | 'RESULT';

interface OpponentData {
  name: string;
  elo: number;
  progressPct: number;
  currentWpm: number;
  accuracy: number;
  isBot?: boolean;
}

interface Challenge {
  title: string;
  passage: string;
  blanks: string[];
  durationSec: number;
}

const LEADERBOARD_PRESET = [
  { rank: 1, name: 'Sultan_KZ', elo: 1845, league: 'Grandmaster', winRate: '78%' },
  { rank: 2, name: 'Elena_DET', elo: 1720, league: 'Master', winRate: '72%' },
  { rank: 3, name: 'Max_PiedPiper', elo: 1690, league: 'Diamond', winRate: '69%' },
  { rank: 4, name: 'Ilya Vasiunin (Вы)', elo: 1420, league: 'Gold', winRate: '65%' },
  { rank: 5, name: 'Sarah_Toronto', elo: 1380, league: 'Gold', winRate: '58%' },
];

export default function MultiplayerArenaPage() {
  const [state, setState] = useState<ArenaState>('LOBBY');
  const [userElo, setUserElo] = useState<number>(1420);
  const [countdown, setCountdown] = useState<number>(3);
  const [timeLeft, setTimeLeft] = useState<number>(60);

  // Match details
  const [challenge, setChallenge] = useState<Challenge>({
    title: 'Academic Research & Marine Ecosystems (C-Test)',
    passage:
      'Marine biolog___ have discov___ that coral re___ are adapt___ to ris___ ocean temperat___ faster than previou___ estimated by laborat___ models.',
    blanks: ['ists', 'ered', 'efs', 'ing', 'ing', 'ures', 'sly', 'ory'],
    durationSec: 60,
  });

  const [opponent, setOpponent] = useState<OpponentData>({
    name: 'Alex (Oxford)',
    elo: 1410,
    progressPct: 0,
    currentWpm: 0,
    accuracy: 100,
  });

  // User input answers
  const [inputs, setInputs] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [userWpm, setUserWpm] = useState<number>(0);
  const [userAccuracy, setUserAccuracy] = useState<number>(100);

  // Result
  const [won, setWon] = useState<boolean>(false);
  const [deltaElo, setDeltaElo] = useState<number>(0);

  const socketRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Start finding match
  const handleFindMatch = () => {
    setState('SEARCHING');

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost' ? 'localhost:18080' : window.location.host;
    const wsUrl = `${protocol}//${host}/api/v1/arena/ws`;

    try {
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        ws.send(
          JSON.stringify({
            type: 'join_queue',
            payload: {
              playerName: 'Ilya Vasiunin',
              playerElo: userElo,
            },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'match_found') {
            setOpponent({
              name: msg.payload.opponentName || 'Competitor',
              elo: msg.payload.opponentElo || 1400,
              progressPct: 0,
              currentWpm: 0,
              accuracy: 100,
              isBot: msg.payload.isBot,
            });
            if (msg.payload.challenge) {
              setChallenge(msg.payload.challenge);
              setInputs(new Array(msg.payload.challenge.blanks.length).fill(''));
            }
            startCountdown();
          } else if (msg.type === 'opponent_progress') {
            setOpponent((prev) => ({
              ...prev,
              progressPct: msg.payload.progressPct,
              currentWpm: msg.payload.currentWpm,
              accuracy: Math.round(msg.payload.accuracy * 100),
            }));
          } else if (msg.type === 'match_result') {
            setWon(msg.payload.won);
            setDeltaElo(msg.payload.deltaElo);
            setUserElo(msg.payload.yourElo);
            setState('RESULT');
            if (timerRef.current) clearInterval(timerRef.current);
          }
        } catch {
          // ignore
        }
      };

      ws.onerror = () => {
        // Fallback simulation if backend offline
        fallbackSimulatedMatch();
      };
    } catch {
      fallbackSimulatedMatch();
    }
  };

  const fallbackSimulatedMatch = () => {
    setTimeout(() => {
      setOpponent({
        name: 'Marcus (Stanford)',
        elo: 1435,
        progressPct: 0,
        currentWpm: 48,
        accuracy: 94,
        isBot: true,
      });
      setInputs(new Array(challenge.blanks.length).fill(''));
      startCountdown();
    }, 1500);
  };

  const startCountdown = () => {
    setState('COUNTDOWN');
    setCountdown(3);

    let count = 3;
    const interval = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
      } else {
        clearInterval(interval);
        startDuel();
      }
    }, 1000);
  };

  const startDuel = () => {
    setState('DUELING');
    setTimeLeft(60);
    setStartTime(Date.now());

    // Timer countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          finishDuel();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleInputChange = (index: number, val: string) => {
    const updated = [...inputs];
    updated[index] = val;
    setInputs(updated);

    // Calculate progress
    let correctCount = 0;
    let filledCount = 0;
    updated.forEach((ans, i) => {
      if (ans.trim() !== '') {
        filledCount++;
        if (ans.trim().toLowerCase() === challenge.blanks[i].toLowerCase()) {
          correctCount++;
        }
      }
    });

    const progressPct = Math.round((filledCount / challenge.blanks.length) * 100);
    const accuracy = filledCount > 0 ? (correctCount / filledCount) * 100 : 100;

    const elapsedMin = Math.max(0.1, (Date.now() - startTime) / 60000);
    const totalChars = updated.join('').length;
    const wpm = Math.round(totalChars / 5 / elapsedMin);

    setUserWpm(wpm);
    setUserAccuracy(Math.round(accuracy));

    // Send to WebSocket
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'player_progress',
          payload: {
            progressPct,
            currentWpm: wpm,
            accuracy: accuracy / 100,
          },
        })
      );
    }

    // If all filled correctly, finish early!
    if (correctCount === challenge.blanks.length) {
      finishDuel();
    }
  };

  const finishDuel = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    const elapsedSec = (Date.now() - startTime) / 1000;
    let correctCount = 0;
    inputs.forEach((ans, i) => {
      if (ans.trim().toLowerCase() === challenge.blanks[i].toLowerCase()) {
        correctCount++;
      }
    });
    const accuracy = correctCount / challenge.blanks.length;

    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: 'player_finished',
          payload: {
            timeTakenSec: elapsedSec,
            accuracy: accuracy,
            wordsCorrect: correctCount,
          },
        })
      );
    } else {
      // Local fallback calculation
      const isWinner = accuracy >= 0.75;
      setWon(isWinner);
      setDeltaElo(isWinner ? 32 : -18);
      setUserElo((prev) => prev + (isWinner ? 32 : -18));
      setState('RESULT');
    }
  };

  const handleRematch = () => {
    setState('LOBBY');
    setInputs([]);
    setOpponent((prev) => ({ ...prev, progressPct: 0, currentWpm: 0 }));
  };

  const userProgressPct = Math.round(
    (inputs.filter((x) => x.trim().length > 0).length / challenge.blanks.length) * 100
  );

  return (
    <div className="min-h-screen bg-[#070809] text-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <PillBadge variant="lime" prefixHash>
                DET Multiplayer Arena
              </PillBadge>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
                <Flame className="w-3 h-3 fill-current text-rose-500" />
                Live 1v1 PvP
              </span>
            </div>
            <h1 className="text-3xl font-black uppercase text-white tracking-tight flex items-center gap-3">
              <span>Арена скоростных дуэлей</span>
            </h1>
            <p className="text-xs text-neutral-400 mt-1">
              Сразитесь с соперником в реальном времени на скорость и точность прохождения C-Test. Зарабатывайте очки рейтинга ELO!
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="px-4 py-2 rounded-2xl bg-neutral-900 border border-neutral-800 text-right">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block">Ваш рейтинг ELO</span>
              <span className="text-xl font-black text-[#D2F544] flex items-center gap-1">
                <Shield className="w-4 h-4" /> {userElo}
              </span>
            </div>
          </div>
        </div>

        {/* 1. LOBBY VIEW */}
        {state === 'LOBBY' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-[#0E1012] border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#D2F544]/5 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-3">
                <span className="text-xs font-bold text-[#D2F544] uppercase tracking-wider">
                  Правила дуэли
                </span>
                <h2 className="text-2xl font-black text-white">Быстрый матч 1-на-1 (60 сек)</h2>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Вам и оппоненту одновременно выдается одинаковый академический текст с пропусками (C-Test). Побеждает тот, кто быстрее заполнит все пропущенные окончания слов с максимальной точностью.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
                  <Timer className="w-5 h-5 text-[#D2F544] mx-auto mb-1" />
                  <div className="text-sm font-black text-white">60 сек</div>
                  <div className="text-[10px] text-neutral-500">Лимит времени</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
                  <Zap className="w-5 h-5 text-amber-400 mx-auto mb-1" />
                  <div className="text-sm font-black text-white">WPM + %</div>
                  <div className="text-[10px] text-neutral-500">Скорость и точность</div>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
                  <Trophy className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                  <div className="text-sm font-black text-white">±32 ELO</div>
                  <div className="text-[10px] text-neutral-500">Ставка за победу</div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleFindMatch}
                  className="w-full py-4 rounded-2xl bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] font-black text-sm uppercase tracking-wider transition-all shadow-xl active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Swords className="w-5 h-5" />
                  <span>Найти соперника (Вступить в бой)</span>
                </button>
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="lg:col-span-5 bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#D2F544]" />
                  <span>Топ дуэлянтов Академии</span>
                </h3>
                <span className="text-[10px] uppercase font-bold text-neutral-500">Сезон 2026</span>
              </div>

              <div className="space-y-2">
                {LEADERBOARD_PRESET.map((p) => (
                  <div
                    key={p.rank}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-all ${
                      p.name.includes('(Вы)')
                        ? 'bg-[#D2F544]/10 border-[#D2F544]/30 text-white'
                        : 'bg-neutral-900/40 border-neutral-800/80 text-neutral-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                          p.rank === 1
                            ? 'bg-amber-400 text-black'
                            : p.rank === 2
                            ? 'bg-neutral-300 text-black'
                            : p.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-neutral-800 text-neutral-400'
                        }`}
                      >
                        {p.rank}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-white">{p.name}</div>
                        <div className="text-[10px] text-neutral-500">Винрейт: {p.winRate}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-black text-[#D2F544]">{p.elo}</div>
                      <div className="text-[10px] text-neutral-500">{p.league}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. SEARCHING MATCH STATE */}
        {state === 'SEARCHING' && (
          <div className="max-w-lg mx-auto bg-[#0E1012] border border-neutral-800 rounded-3xl p-12 text-center space-y-6 shadow-2xl">
            <div className="relative w-20 h-20 mx-auto">
              <div className="w-20 h-20 border-4 border-neutral-800 border-t-[#D2F544] rounded-full animate-spin" />
              <Swords className="w-8 h-8 text-[#D2F544] absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">Поиск равного соперника...</h3>
              <p className="text-xs text-neutral-400 mt-1">
                Подбираем кандидата с рейтингом {userElo} ± 50 ELO по всему миру
              </p>
            </div>

            <button
              onClick={() => setState('LOBBY')}
              className="px-6 py-2.5 rounded-xl border border-neutral-800 hover:border-neutral-700 text-xs font-bold text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              Отмена
            </button>
          </div>
        )}

        {/* 3. COUNTDOWN STATE */}
        {state === 'COUNTDOWN' && (
          <div className="max-w-lg mx-auto bg-[#0E1012] border border-neutral-800 rounded-3xl p-12 text-center space-y-6 shadow-2xl animate-in fade-in zoom-in duration-300">
            <span className="text-xs font-extrabold uppercase tracking-widest text-[#D2F544]">
              Соперник найден!
            </span>
            <div className="flex items-center justify-center gap-6">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-[#D2F544] text-[#0C2418] font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                  🦉
                </div>
                <div className="text-xs font-black text-white">Вы ({userElo})</div>
              </div>

              <div className="text-2xl font-black text-neutral-600">VS</div>

              <div>
                <div className="w-16 h-16 rounded-2xl bg-purple-500 text-white font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-lg">
                  🦅
                </div>
                <div className="text-xs font-black text-white">
                  {opponent.name} ({opponent.elo})
                </div>
              </div>
            </div>

            <div className="text-6xl font-black text-white animate-bounce tracking-tight">
              {countdown}
            </div>
            <p className="text-xs text-neutral-400">Приготовьтесь к вводу пропущенных букв!</p>
          </div>
        )}

        {/* 4. DUELING LIVE VIEW */}
        {state === 'DUELING' && (
          <div className="space-y-6">
            {/* Top Live Race Track Bar */}
            <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-2 text-white">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  Битва в прямом эфире
                </span>

                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-sm font-black border ${
                    timeLeft <= 10
                      ? 'bg-rose-950/60 border-rose-700 text-rose-300 animate-pulse'
                      : 'bg-neutral-900 border-neutral-800 text-[#D2F544]'
                  }`}
                >
                  <Timer className="w-4 h-4" />
                  <span>00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}</span>
                </div>
              </div>

              {/* Player 1 (You) Track */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-[#D2F544]">
                    Вы: {userProgressPct}% ({userWpm} WPM • {userAccuracy}% точность)
                  </span>
                  <span className="text-neutral-500 text-[11px]">Финиш</span>
                </div>
                <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden p-0.5 border border-neutral-800">
                  <div
                    className="bg-gradient-to-r from-lime-500 to-[#D2F544] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(210,245,68,0.5)]"
                    style={{ width: `${Math.max(4, userProgressPct)}%` }}
                  />
                </div>
              </div>

              {/* Player 2 (Opponent) Track */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-purple-400">
                    {opponent.name}: {opponent.progressPct}% ({opponent.currentWpm} WPM • {opponent.accuracy}%)
                  </span>
                  <span className="text-neutral-500 text-[11px]">Финиш</span>
                </div>
                <div className="w-full bg-neutral-900 h-3 rounded-full overflow-hidden p-0.5 border border-neutral-800">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-purple-400 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    style={{ width: `${Math.max(4, opponent.progressPct)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Interactive C-Test Workstation */}
            <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-8 space-y-6 shadow-2xl">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D2F544]">
                  Задание раунда
                </span>
                <h3 className="text-xl font-black text-white mt-1">{challenge.title}</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Заполните пропущенные части слов. Для перехода между полями используйте клавишу Tab или Enter.
                </p>
              </div>

              {/* Passage with inputs */}
              <div className="p-6 rounded-2xl bg-neutral-950/80 border border-neutral-800/80 text-base sm:text-lg leading-loose font-medium text-neutral-200">
                Marine biolog
                <input
                  type="text"
                  maxLength={4}
                  value={inputs[0] || ''}
                  onChange={(e) => handleInputChange(0, e.target.value)}
                  placeholder="____"
                  className="mx-1 px-2 py-0.5 bg-neutral-900 border border-neutral-700 rounded-lg text-[#D2F544] font-mono font-bold w-16 text-center focus:outline-none focus:ring-2 focus:ring-[#D2F544]"
                />
                have discov
                <input
                  type="text"
                  maxLength={4}
                  value={inputs[1] || ''}
                  onChange={(e) => handleInputChange(1, e.target.value)}
                  placeholder="____"
                  className="mx-1 px-2 py-0.5 bg-neutral-900 border border-neutral-700 rounded-lg text-[#D2F544] font-mono font-bold w-16 text-center focus:outline-none focus:ring-2 focus:ring-[#D2F544]"
                />
                that coral re
                <input
                  type="text"
                  maxLength={3}
                  value={inputs[2] || ''}
                  onChange={(e) => handleInputChange(2, e.target.value)}
                  placeholder="___"
                  className="mx-1 px-2 py-0.5 bg-neutral-900 border border-neutral-700 rounded-lg text-[#D2F544] font-mono font-bold w-14 text-center focus:outline-none focus:ring-2 focus:ring-[#D2F544]"
                />
                are adapt
                <input
                  type="text"
                  maxLength={3}
                  value={inputs[3] || ''}
                  onChange={(e) => handleInputChange(3, e.target.value)}
                  placeholder="___"
                  className="mx-1 px-2 py-0.5 bg-neutral-900 border border-neutral-700 rounded-lg text-[#D2F544] font-mono font-bold w-14 text-center focus:outline-none focus:ring-2 focus:ring-[#D2F544]"
                />
                to ris
                <input
                  type="text"
                  maxLength={3}
                  value={inputs[4] || ''}
                  onChange={(e) => handleInputChange(4, e.target.value)}
                  placeholder="___"
                  className="mx-1 px-2 py-0.5 bg-neutral-900 border border-neutral-700 rounded-lg text-[#D2F544] font-mono font-bold w-14 text-center focus:outline-none focus:ring-2 focus:ring-[#D2F544]"
                />
                ocean temperat
                <input
                  type="text"
                  maxLength={4}
                  value={inputs[5] || ''}
                  onChange={(e) => handleInputChange(5, e.target.value)}
                  placeholder="____"
                  className="mx-1 px-2 py-0.5 bg-neutral-900 border border-neutral-700 rounded-lg text-[#D2F544] font-mono font-bold w-16 text-center focus:outline-none focus:ring-2 focus:ring-[#D2F544]"
                />
                faster than previou
                <input
                  type="text"
                  maxLength={3}
                  value={inputs[6] || ''}
                  onChange={(e) => handleInputChange(6, e.target.value)}
                  placeholder="___"
                  className="mx-1 px-2 py-0.5 bg-neutral-900 border border-neutral-700 rounded-lg text-[#D2F544] font-mono font-bold w-14 text-center focus:outline-none focus:ring-2 focus:ring-[#D2F544]"
                />
                estimated by laborat
                <input
                  type="text"
                  maxLength={3}
                  value={inputs[7] || ''}
                  onChange={(e) => handleInputChange(7, e.target.value)}
                  placeholder="___"
                  className="mx-1 px-2 py-0.5 bg-neutral-900 border border-neutral-700 rounded-lg text-[#D2F544] font-mono font-bold w-14 text-center focus:outline-none focus:ring-2 focus:ring-[#D2F544]"
                />
                models.
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-neutral-400">
                  Заполнено: {inputs.filter((x) => x.trim().length > 0).length} из {challenge.blanks.length}
                </span>

                <button
                  onClick={finishDuel}
                  className="px-6 py-2.5 rounded-xl bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Завершить досрочно
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 5. MATCH RESULT MODAL */}
        {state === 'RESULT' && (
          <div className="max-w-xl mx-auto bg-[#0E1012] border border-neutral-800 rounded-3xl p-8 sm:p-10 text-center space-y-6 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300">
            <div
              className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full blur-3xl pointer-events-none ${
                won ? 'bg-emerald-500/15' : 'bg-rose-500/15'
              }`}
            />

            <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl">
              {won ? '🏆' : '💀'}
            </div>

            <div>
              <span
                className={`text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full border ${
                  won
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
                    : 'text-rose-400 bg-rose-950/60 border-rose-800/60'
                }`}
              >
                {won ? 'Блестящая победа!' : 'Поражение'}
              </span>
              <h2 className="text-3xl font-black text-white mt-3 tracking-tight">
                {won ? 'Вы обошли соперника!' : 'Соперник оказался быстрее'}
              </h2>
            </div>

            {/* ELO Delta Banner */}
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-around">
              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500">Дельта ELO</span>
                <div
                  className={`text-2xl font-black ${
                    deltaElo >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {deltaElo >= 0 ? `+${deltaElo}` : deltaElo}
                </div>
              </div>

              <div className="w-px h-10 bg-neutral-800" />

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500">Новый рейтинг</span>
                <div className="text-2xl font-black text-[#D2F544]">{userElo}</div>
              </div>

              <div className="w-px h-10 bg-neutral-800" />

              <div>
                <span className="text-[10px] uppercase font-bold text-neutral-500">Ваша скорость</span>
                <div className="text-2xl font-black text-white">{userWpm} WPM</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={handleRematch}
                className="px-6 py-3 rounded-2xl bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Сыграть еще раз</span>
              </button>

              <Link
                href="/dashboard"
                className="px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-bold text-neutral-300 hover:text-white transition-all cursor-pointer"
              >
                Вернуться на Дашборд
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
