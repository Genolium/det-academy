'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useProgressStore, TOTAL_LESSONS } from '@/store/useProgressStore';
import { lessonsData, LessonGuide } from '@/data/theoryContent';
import { SkillRadarChart } from '@/components/dashboard/SkillRadarChart';
import { SrsFlashcards } from '@/components/dashboard/SrsFlashcards';
import {
  GraduationCap,
  Sparkles,
  Trophy,
  CheckCircle2,
  Circle,
  ArrowRight,
  Clock,
  Keyboard,
  Target,
  Flame,
  Award,
  BookOpen,
  Layers,
  ChevronRight,
  TrendingUp,
  User,
  Settings,
  AlertCircle,
  Play,
  RotateCcw,
  Check,
  ShieldCheck,
  Zap,
  Edit2,
} from 'lucide-react';
import { EditProfileNameModal } from '@/components/profile/EditProfileNameModal';

const CATEGORY_NAMES: Record<string, string> = {
  all: 'Все разделы',
  rules: 'Регламент',
  vocab: 'Словарь',
  listening: 'Аудирование',
  interactive: 'Чтение',
  images: 'Фотографии',
  writing: 'Письмо и эссе',
  speaking: 'Устная речь',
};

function DashboardContent() {
  const router = useRouter();
  const { user, isAuthenticated, checkAuth } = useAuthStore();
  const {
    completedLessons,
    testResults,
    bestTypingWpm,
    targetScore,
    setTargetScore,
    toggleLessonCompleted,
    syncWithBackend,
    getBestMockScore,
    getReadinessPercentage,
    isEligibleForCertificate,
    candidateName,
  } = useProgressStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);

  useEffect(() => {
    checkAuth();
    syncWithBackend();
  }, [checkAuth, syncWithBackend]);

  const bestScore = getBestMockScore();
  const readiness = getReadinessPercentage();
  const latestTest = testResults.length > 0 ? testResults[0] : null;

  const remainingLessonsCount = Math.max(0, TOTAL_LESSONS - completedLessons.length);
  const estimatedHoursLeft = Math.ceil((remainingLessonsCount * 25) / 60);

  // Find next recommended lesson to study
  const nextLesson = useMemo(() => {
    return lessonsData.find((l) => !completedLessons.includes(l.slug)) || null;
  }, [completedLessons]);

  // Filter lessons
  const filteredLessons = useMemo(() => {
    if (selectedCategory === 'all') return lessonsData;
    return lessonsData.filter((l) => l.category === selectedCategory);
  }, [selectedCategory]);

  const hasTakenTest = testResults.length > 0;
  const currentSubscores = useMemo(() => {
    if (latestTest) {
      return {
        literacy: latestTest.literacy,
        comprehension: latestTest.comprehension,
        conversation: latestTest.conversation,
        production: latestTest.production,
      };
    }
    return null;
  }, [latestTest]);

  const handleToggle = async (e: React.MouseEvent, slug: string) => {
    e.preventDefault();
    e.stopPropagation();
    setToggleLoading(slug);
    try {
      await toggleLessonCompleted(slug);
    } finally {
      setToggleLoading(null);
    }
  };

  const getSubscoreLevel = (score: number) => {
    if (score >= 130) return { label: 'Advanced (C1-C2)', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' };
    if (score >= 105) return { label: 'Upper-Int (B2)', color: 'text-[#D2F544] bg-[#D2F544]/10 border-[#D2F544]/30' };
    if (score >= 80) return { label: 'Intermediate (B1)', color: 'text-amber-400 bg-amber-950/60 border-amber-800/60' };
    return { label: 'Elementary (A2)', color: 'text-neutral-400 bg-neutral-900 border-neutral-800' };
  };

  return (
    <div className="min-h-screen bg-[#070809] text-white">
      {/* Sub-header navigation tabs */}
      <div className="border-b border-neutral-800/80 bg-[#0E1012]/80 backdrop-blur-md sticky top-[61px] z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between min-h-[56px] py-2 sm:py-0 overflow-x-auto no-scrollbar gap-4">
          <div className="flex items-center gap-4 sm:gap-6 text-xs font-bold shrink-0">
            <span className="text-[#D2F544] flex items-center gap-2 border-b-2 border-[#D2F544] py-3 sm:py-4 whitespace-nowrap">
              <GraduationCap className="w-4 h-4" />
              <span>Дашборд подготовки</span>
            </span>
            <Link
              href="/profile"
              className="text-neutral-400 hover:text-white flex items-center gap-2 py-3 sm:py-4 transition-colors whitespace-nowrap"
            >
              <Settings className="w-4 h-4" />
              <span>Безопасность и профиль</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <label className="text-xs text-neutral-400 hidden md:inline-block whitespace-nowrap">
              Целевой балл DET:
            </label>
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-2 py-1 max-w-[155px] sm:max-w-none">
              <Target className="w-3.5 h-3.5 text-[#D2F544] mr-1.5 shrink-0" />
              <select
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="bg-transparent text-[11px] sm:text-xs font-bold text-white focus:outline-none cursor-pointer truncate"
              >
                <option value={105} className="bg-[#0E1012]">105+ (Foundation)</option>
                <option value={115} className="bg-[#0E1012]">115+ (Bachelor entry)</option>
                <option value={125} className="bg-[#0E1012]">125+ (Top-100 Global)</option>
                <option value={135} className="bg-[#0E1012]">135+ (Top-30 Ivy)</option>
                <option value={150} className="bg-[#0E1012]">150+ (Max Band)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* 1. Top Welcome & Progress Cockpit */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Hero Card: Student Readiness Meter */}
          <div className="lg:col-span-2 bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#D2F544]/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#D2F544]/20 text-[#D2F544] border border-[#D2F544]/30">
                  Личный план обучения
                </span>
                <span className="text-neutral-500 text-xs">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-300 text-xs font-bold">
                    {user?.name || candidateName || 'Кандидат DET'}
                  </span>
                  <button
                    onClick={() => setIsRenameModalOpen(true)}
                    className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-[#D2F544] rounded-lg transition-colors cursor-pointer"
                    title="Переименовать профиль"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Готовность к экзамену: <span className="text-[#D2F544]">{readiness}%</span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-xl leading-relaxed">
                Комплексная оценка на основе освоения 16 модулей академической теории, результатов адаптивного симулятора теста и скорости ввода ответов.
              </p>
            </div>

            {/* Visual Overall Progress Bar */}
            <div className="space-y-3 mt-6">
              <div className="w-full bg-neutral-900 rounded-full h-3 overflow-hidden border border-neutral-800/80 p-0.5">
                <div
                  className="bg-gradient-to-r from-[#8be320] to-[#D2F544] h-full rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(210,245,68,0.4)]"
                  style={{ width: `${Math.max(4, readiness)}%` }}
                />
              </div>

              {/* 3 Component Breakdown Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral-400 text-[11px] font-semibold">
                    <span>Теория (16 уроков)</span>
                    <span className="text-white font-bold">{completedLessons.length}/16</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-[#D2F544] h-full rounded-full"
                      style={{ width: `${Math.round((completedLessons.length / 16) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral-400 text-[11px] font-semibold">
                    <span>Симулятор теста</span>
                    <span className="text-white font-bold">
                      {bestScore > 0 ? `${bestScore}/${targetScore}` : '0/160'}
                    </span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-blue-400 h-full rounded-full"
                      style={{ width: `${bestScore > 0 ? Math.min(100, Math.round((bestScore / targetScore) * 100)) : 0}%` }}
                    />
                  </div>
                </div>

                <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral-400 text-[11px] font-semibold">
                    <span>Слепая печать</span>
                    <span className="text-white font-bold">{bestTypingWpm} / 50 WPM</span>
                  </div>
                  <div className="w-full bg-neutral-800 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-purple-400 h-full rounded-full"
                      style={{ width: `${Math.min(100, Math.round((bestTypingWpm / 50) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer */}
            <div className="flex flex-wrap items-center gap-3 pt-6 mt-6 border-t border-neutral-800/80">
              <Link
                href="/test"
                className="bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Запустить симулятор теста (60 мин)</span>
              </Link>
              <Link
                href="/practice/typing"
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Keyboard className="w-3.5 h-3.5 text-neutral-400" />
                <span>Тренировать печать</span>
              </Link>
            </div>
          </div>

          {/* Side Card: Remaining Work & Certificate Checklist */}
          <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D2F544]" />
                  <span>Сколько осталось</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-neutral-400 border border-neutral-800">
                  ~{estimatedHoursLeft} ч. до финиша
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#D2F544]/10 border border-[#D2F544]/20 flex items-center justify-center text-[#D2F544]">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Теоретические модули</p>
                      <p className="text-[11px] text-neutral-400">
                        Осталось изучить: <strong className="text-[#D2F544]">{remainingLessonsCount}</strong> из 16
                      </p>
                    </div>
                  </div>
                  {remainingLessonsCount === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-xs font-black text-white">{remainingLessonsCount} ур.</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Контрольный тест</p>
                      <p className="text-[11px] text-neutral-400">
                        {bestScore >= 105 ? 'Порог пройден (≥105 баллов)' : 'Требуется балл ≥ 105'}
                      </p>
                    </div>
                  </div>
                  {bestScore >= 105 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-xs font-bold text-amber-400">В процессе</span>
                  )}
                </div>
              </div>
            </div>

            {/* Certificate Status Widget */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-[#121614] border border-[#D2F544]/20">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#D2F544]/20 border border-[#D2F544]/40 flex items-center justify-center text-[#D2F544] shrink-0 mt-0.5">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Сертификат DET Academy</span>
                    {isEligibleForCertificate() && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-emerald-500 text-black">
                        ДОСТУПЕН
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    {isEligibleForCertificate()
                      ? 'Все нормативы выполнены! Ваш сертификат готов к выпуску и верификации.'
                      : 'Пройдите 16 уроков и сдайте тест от 105 баллов для подтверждения готовности.'}
                  </p>
                </div>
              </div>

              {isEligibleForCertificate() ? (
                <Link
                  href="/verify"
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-[#D2F544] hover:bg-[#c4f22c] text-[#0C2418] text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Посмотреть сертификат</span>
                </Link>
              ) : (
                <div className="mt-3 flex items-center gap-2 text-[10px] text-neutral-500">
                  <div className="flex items-center gap-1">
                    {completedLessons.length >= 16 ? <Check className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3" />}
                    <span>16 уроков</span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    {bestScore >= 105 ? <Check className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3" />}
                    <span>Тест 105+</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. Next Best Action Callout */}
        {nextLesson && (
          <div className="bg-gradient-to-r from-[#111913] via-[#0E1012] to-[#0E1012] border border-[#D2F544]/30 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D2F544] text-[#0C2418] font-black text-xl flex items-center justify-center shrink-0 shadow-md">
                {nextLesson.number}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D2F544]">
                    Рекомендуемый следующий шаг
                  </span>
                  <span className="text-neutral-500 text-xs">•</span>
                  <span className="text-xs text-neutral-400">{nextLesson.categoryLabelRu}</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {nextLesson.titleRu}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-2xl line-clamp-1">
                  {nextLesson.mentorIntro || 'Освойте структуру задания, типичные ловушки прокторов и победную стратегию.'}
                </p>
              </div>
            </div>

            <Link
              href={`/theory/${nextLesson.slug}`}
              className="w-full md:w-auto px-6 py-3 rounded-2xl bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0 active:scale-95"
            >
              <span>Перейти к уроку</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Interactive Skill Radar (Subscores vs Target University) */}
        <SkillRadarChart
          currentScores={currentSubscores}
          overallScore={latestTest ? latestTest.overallScore : null}
          hasTakenTest={hasTakenTest}
        />

        {/* 3. Subscores Diagnostics (DET 4 Pillars) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#D2F544]" />
                <span>Сабскоры Duolingo English Test</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {latestTest
                  ? `Показатели по результатам последней сессии (${latestTest.date})`
                  : 'Пройдите симулятор тестирования для расчета точных сабскоров'}
              </p>
            </div>
            {latestTest && (
              <span className="text-xs font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-xl">
                Итоговый балл: <strong className="text-[#D2F544]">{latestTest.overallScore}</strong> / 160
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Literacy */}
            <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">Literacy</span>
                  <span className="text-[10px] text-neutral-400 font-semibold">Чтение + Письмо</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {latestTest ? latestTest.literacy : '—'}
                  <span className="text-xs font-normal text-neutral-500"> / 160</span>
                </div>
                <div className="mt-2">
                  {latestTest ? (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      getSubscoreLevel(latestTest.literacy).color
                    }`}>
                      {getSubscoreLevel(latestTest.literacy).label}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border text-neutral-400 bg-neutral-900 border-neutral-800">
                      Ожидает теста
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-neutral-500">
                Read & Complete, Fill in Blanks, Writing Sample.
              </p>
            </div>

            {/* Comprehension */}
            <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">Comprehension</span>
                  <span className="text-[10px] text-neutral-400 font-semibold">Чтение + Аудио</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {latestTest ? latestTest.comprehension : '—'}
                  <span className="text-xs font-normal text-neutral-500"> / 160</span>
                </div>
                <div className="mt-2">
                  {latestTest ? (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      getSubscoreLevel(latestTest.comprehension).color
                    }`}>
                      {getSubscoreLevel(latestTest.comprehension).label}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border text-neutral-400 bg-neutral-900 border-neutral-800">
                      Ожидает теста
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-neutral-500">
                Interactive Reading, Listen & Type, Read Aloud.
              </p>
            </div>

            {/* Conversation */}
            <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">Conversation</span>
                  <span className="text-[10px] text-neutral-400 font-semibold">Аудио + Речь</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {latestTest ? latestTest.conversation : '—'}
                  <span className="text-xs font-normal text-neutral-500"> / 160</span>
                </div>
                <div className="mt-2">
                  {latestTest ? (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      getSubscoreLevel(latestTest.conversation).color
                    }`}>
                      {getSubscoreLevel(latestTest.conversation).label}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border text-neutral-400 bg-neutral-900 border-neutral-800">
                      Ожидает теста
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-neutral-500">
                Interactive Listening, Speak About Photo, Interview.
              </p>
            </div>

            {/* Production */}
            <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white">Production</span>
                  <span className="text-[10px] text-neutral-400 font-semibold">Письмо + Речь</span>
                </div>
                <div className="text-2xl font-black text-white">
                  {latestTest ? latestTest.production : '—'}
                  <span className="text-xs font-normal text-neutral-500"> / 160</span>
                </div>
                <div className="mt-2">
                  {latestTest ? (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      getSubscoreLevel(latestTest.production).color
                    }`}>
                      {getSubscoreLevel(latestTest.production).label}
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border text-neutral-400 bg-neutral-900 border-neutral-800">
                      Ожидает теста
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-neutral-500">
                Самый сложный блок: академический вокабуляр C1.
              </p>
            </div>
          </div>
        </div>

        {/* Academic Vocabulary Flashcards (Dedicated Tool Callout) */}
        <div className="bg-gradient-to-r from-[#111913] via-[#0E1012] to-[#0E1012] border border-[#D2F544]/20 rounded-3xl p-6 sm:p-7 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D2F544]/15 border border-[#D2F544]/30 text-[#D2F544] flex items-center justify-center shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#D2F544] bg-[#D2F544]/10 border border-[#D2F544]/20 px-2 py-0.5 rounded-full">
                  Тренажер лексики
                </span>
                <span className="text-neutral-500 text-xs">•</span>
                <span className="text-xs text-neutral-400">Алгоритм SuperMemo SM-2</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Академический словарь C1/C2 (SRS Flashcards)
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
                Карточки 1,500 высокочастотных лексем Academic Word List (AWL) с озвучкой, дефинициями и академическими коллокациями для секций Writing и Speaking.
              </p>
            </div>
          </div>

          <Link
            href="/practice/flashcards"
            className="w-full md:w-auto px-6 py-3 rounded-2xl bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0 active:scale-95"
          >
            <span>Открыть тренажер слов</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4. Complete 16-Lesson Roadmap & Checklist */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#D2F544]" />
                <span>Программа обучения (16 модулей)</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Изучено: <strong className="text-[#D2F544]">{completedLessons.length}</strong> из 16.
                Отмечайте пройденные уроки прямо в списке.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {Object.entries(CATEGORY_NAMES).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === key
                      ? 'bg-[#D2F544] text-[#0C2418] shadow-sm'
                      : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredLessons.map((lesson) => {
              const isCompleted = completedLessons.includes(lesson.slug);
              const isLoading = toggleLoading === lesson.slug;

              return (
                <div
                  key={lesson.slug}
                  className={`group rounded-2xl p-4 border transition-all flex items-center justify-between gap-4 ${
                    isCompleted
                      ? 'bg-[#0E1012]/90 border-neutral-800/80 hover:border-neutral-700'
                      : 'bg-[#0E1012] border-neutral-800 hover:border-[#D2F544]/50'
                  }`}
                >
                  {/* Left: Checkbox & Info */}
                  <div className="flex items-start gap-3.5 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => handleToggle(e, lesson.slug)}
                      disabled={isLoading}
                      className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                        isCompleted
                          ? 'bg-[#D2F544] text-[#0C2418]'
                          : 'border-2 border-neutral-700 hover:border-[#D2F544] text-transparent'
                      }`}
                      title={isCompleted ? 'Отметить как не пройденный' : 'Отметить как пройденный'}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-neutral-500">
                          #{lesson.number}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
                          {lesson.categoryLabelRu}
                        </span>
                        <span className="text-[10px] text-neutral-500 hidden sm:inline">
                          ~15 мин
                        </span>
                      </div>

                      <Link
                        href={`/theory/${lesson.slug}`}
                        className="block text-sm font-bold text-white hover:text-[#D2F544] transition-colors mt-0.5 truncate"
                      >
                        {lesson.titleRu}
                      </Link>

                      <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                        {lesson.format}
                      </p>
                    </div>
                  </div>

                  {/* Right: Action Link */}
                  <Link
                    href={`/theory/${lesson.slug}`}
                    className="p-2 rounded-xl text-neutral-400 hover:text-[#D2F544] hover:bg-neutral-900 transition-colors shrink-0"
                    title="Открыть урок"
                  >
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Mock Tests History Archive */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#D2F544]" />
                <span>История пробных тестирований</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Все сессии в симуляторе с детальным расчетом сабскоров и валидацией.
              </p>
            </div>

            <Link
              href="/test"
              className="text-xs font-bold text-[#D2F544] hover:underline flex items-center gap-1"
            >
              <span>Сдать новый тест</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {testResults.length === 0 ? (
            <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D2F544]/10 border border-[#D2F544]/30 text-[#D2F544] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Вы еще не проходили симулятор теста</h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                  Симулятор DET Academy повторяет адаптивный алгоритм Duolingo English Test (Item Response Theory) и оценивает ваш реальный уровень.
                </p>
              </div>
              <Link
                href="/test"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] text-xs font-black transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Пройти первый тест (60 минут)</span>
              </Link>
            </div>
          ) : (
            <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/60 border-b border-neutral-800 text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Дата сессии</th>
                      <th className="py-3 px-4">Итоговый балл</th>
                      <th className="py-3 px-4">Literacy</th>
                      <th className="py-3 px-4">Comprehension</th>
                      <th className="py-3 px-4">Conversation</th>
                      <th className="py-3 px-4">Production</th>
                      <th className="py-3 px-4">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {testResults.map((t, idx) => (
                      <tr key={t.id || idx} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-neutral-300">
                          {t.date ? new Date(t.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Недавно'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-sm font-black text-[#D2F544]">
                            {t.overallScore}
                          </span>
                          <span className="text-neutral-500 text-[10px]"> / 160</span>
                        </td>
                        <td className="py-3.5 px-4 text-neutral-300 font-semibold">{t.literacy}</td>
                        <td className="py-3.5 px-4 text-neutral-300 font-semibold">{t.comprehension}</td>
                        <td className="py-3.5 px-4 text-neutral-300 font-semibold">{t.conversation}</td>
                        <td className="py-3.5 px-4 text-neutral-300 font-semibold">{t.production}</td>
                        <td className="py-3.5 px-4">
                          {t.overallScore >= 105 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                              Certified Level
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-neutral-400 border border-neutral-800">
                              Practice
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      <EditProfileNameModal
        isOpen={isRenameModalOpen}
        onClose={() => setIsRenameModalOpen(false)}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070809] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-[#D2F544] border-t-transparent animate-spin" />
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
