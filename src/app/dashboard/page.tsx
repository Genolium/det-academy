'use client';

import React, { useEffect, useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/useAuthStore';
import { useProgressStore, TOTAL_LESSONS } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { lessonsData, LessonGuide } from '@/data/theoryContent';
import { SkillRadarChart } from '@/components/dashboard/SkillRadarChart';
import { SrsFlashcards } from '@/components/dashboard/SrsFlashcards';
import { ErrorNotebookWidget } from '@/components/dashboard/ErrorNotebookWidget';
import { WeeklyReportCard } from '@/components/dashboard/WeeklyReportCard';
import { EmailVerificationBanner } from '@/components/dashboard/EmailVerificationBanner';
import { GoalOnboarding } from '@/components/dashboard/GoalOnboarding';
import { XpLeagueCard } from '@/components/dashboard/XpLeagueCard';
import { DailyLimitsCard } from '@/components/dashboard/DailyLimitsCard';
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
  Calendar,
} from 'lucide-react';
import { EditProfileNameModal } from '@/components/profile/EditProfileNameModal';
import { useErrorNotebookStore } from '@/store/useErrorNotebookStore';
import { AuthRequiredGuard } from '@/components/auth/AuthRequiredGuard';
import { translations } from '@/lib/translations';

const CATEGORY_NAMES: Record<'ru' | 'en', Record<string, string>> = {
  ru: {
    all: 'Все разделы',
    rules: 'Регламент',
    vocab: 'Словарь',
    listening: 'Аудирование',
    interactive: 'Чтение',
    images: 'Фотографии',
    writing: 'Письмо и эссе',
    speaking: 'Устная речь',
  },
  en: {
    all: 'All sections',
    rules: 'Rules',
    vocab: 'Vocabulary',
    listening: 'Listening',
    interactive: 'Reading',
    images: 'Photos',
    writing: 'Writing',
    speaking: 'Speaking',
  },
};

function DashboardContent() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const locale = useSettingsStore((state) => state.locale);
  const d = translations[locale].dashboard;
  const {
    completedLessons,
    testResults,
    bestTypingWpm,
    targetScore,
    targetDate,
    dailyMinutes,
    studyPlan,
    goalsConfigured,
    setTargetScore,
    setTargetDate,
    setDailyMinutes,
    loadStudyPlan,
    toggleLessonCompleted,
    syncWithBackend,
    getBestMockScore,
    getReadinessPercentage,
    candidateName,
  } = useProgressStore();

  const { loadForUser: loadErrorsForUser } = useErrorNotebookStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [subscoresViewMode, setSubscoresViewMode] = useState<'subscores' | 'modalities'>('subscores');

  useEffect(() => {
    if (!user?.id) return;
    syncWithBackend(user.id);
    loadErrorsForUser(user.id);
  }, [syncWithBackend, loadErrorsForUser, user?.id]);

  const bestScore = getBestMockScore();
  const readinessAvailable = Boolean(studyPlan?.readinessAvailable);
  const readiness = readinessAvailable ? (studyPlan?.readinessPercent ?? 0) : 0;
  const readinessBasis =
    studyPlan?.readinessBasis ||
    (locale === 'ru'
      ? 'Недостаточно данных: нужен минимум 2 завершённых mock-теста.'
      : 'Not enough data: at least two completed mock tests are required.');
  const latestTest = testResults.length > 0 ? testResults[0] : null;

  const remainingLessonsCount = Math.max(0, TOTAL_LESSONS - completedLessons.length);
  const estimatedHoursLeft = Math.ceil((remainingLessonsCount * 25) / 60);

  // Countdown to exam
  const daysUntilExam = useMemo(() => {
    if (studyPlan?.daysRemaining) return studyPlan.daysRemaining;
    if (!targetDate) return 30;
    const target = new Date(targetDate).getTime();
    const now = new Date().getTime();
    const diff = Math.ceil((target - now) / (1000 * 3600 * 24));
    return diff > 0 ? diff : 1;
  }, [studyPlan?.daysRemaining, targetDate]);

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

  const currentModalities = useMemo(() => {
    if (latestTest) {
      return {
        reading: latestTest.reading || 0,
        listening: latestTest.listening || 0,
        writing: latestTest.writing || 0,
        speaking: latestTest.speaking || 0,
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
              <span>{d.badgePrep}</span>
            </span>
            <Link
              href="/profile"
              className="text-neutral-400 hover:text-white flex items-center gap-2 py-3 sm:py-4 transition-colors whitespace-nowrap"
            >
              <Settings className="w-4 h-4" />
              <span>{d.badgeSecurity}</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0 flex-wrap">
            {/* Target Score */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1">
              <Target className="w-3.5 h-3.5 text-[#D2F544] mr-1.5 shrink-0" />
              <span className="text-[10px] text-neutral-400 mr-1 hidden sm:inline">{d.goalLabel}</span>
              <select
                aria-label={d.goalLabel}
                value={targetScore}
                onChange={(e) => setTargetScore(Number(e.target.value))}
                className="bg-transparent text-[11px] sm:text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value={105} className="bg-[#0E1012]">105+ (Foundation)</option>
                <option value={115} className="bg-[#0E1012]">115+ (Bachelor entry)</option>
                <option value={125} className="bg-[#0E1012]">125+ (Top-100 Global)</option>
                <option value={135} className="bg-[#0E1012]">135+ (Top-30 Ivy)</option>
                <option value={150} className="bg-[#0E1012]">150+ (Max Band)</option>
              </select>
            </div>

            {/* Target Date */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1">
              <Calendar className="w-3.5 h-3.5 text-blue-400 mr-1.5 shrink-0" />
              <span className="text-[10px] text-neutral-400 mr-1 hidden sm:inline">Дата:</span>
              <input
                type="date"
                aria-label="Дата экзамена"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="bg-transparent text-[11px] sm:text-xs font-bold text-white focus:outline-none cursor-pointer"
              />
            </div>

            {/* Daily Minutes */}
            <div className="flex items-center bg-neutral-900 border border-neutral-800 rounded-xl px-2.5 py-1">
              <Flame className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
              <select
                aria-label="Время занятий в день"
                value={dailyMinutes}
                onChange={(e) => setDailyMinutes(Number(e.target.value))}
                className="bg-transparent text-[11px] sm:text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value={30} className="bg-[#0E1012]">30 {d.minPerDay}</option>
                <option value={45} className="bg-[#0E1012]">45 {d.minPerDay}</option>
                <option value={60} className="bg-[#0E1012]">60 {d.minPerDay}</option>
                <option value={90} className="bg-[#0E1012]">90 {d.minPerDay}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!goalsConfigured && <GoalOnboarding />}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <XpLeagueCard />
          <DailyLimitsCard />
        </div>

        {/* 1. Top Welcome & Progress Cockpit */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Hero Card: Student Readiness Meter */}
          <div className="lg:col-span-2 bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden flex flex-col justify-between shadow-xl">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#D2F544]/5 rounded-full blur-3xl pointer-events-none" />

            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-[#D2F544]/20 text-[#D2F544] border border-[#D2F544]/30">
                  {d.personalPlan}
                </span>
                <span className="text-neutral-500 text-xs">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-neutral-300 text-xs font-bold" suppressHydrationWarning>
                    {user?.name || candidateName || d.candidateFallback}
                  </span>
                  <button
                    onClick={() => setIsRenameModalOpen(true)}
                    className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-[#D2F544] rounded-lg transition-colors cursor-pointer"
                    title={d.renameProfile}
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {d.examReadiness}
                <span className="text-[#D2F544]">
                  {readinessAvailable ? `${readiness}%` : d.noData}
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-neutral-400 mt-2 max-w-xl leading-relaxed">
                {readinessBasis}
              </p>
            </div>

            {/* Visual Overall Progress Bar */}
            <div className="space-y-3 mt-6">
              <div className="w-full bg-neutral-900 rounded-full h-3 overflow-hidden border border-neutral-800/80 p-0.5">
                <div
                  className="bg-gradient-to-r from-[#8be320] to-[#D2F544] h-full rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(210,245,68,0.4)]"
                  style={{ width: `${readinessAvailable ? Math.max(4, readiness) : 0}%` }}
                />
              </div>

              {/* 3 Component Breakdown Pills */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-neutral-900/70 border border-neutral-800/80 rounded-2xl p-3 flex flex-col justify-between">
                  <div className="flex items-center justify-between text-neutral-400 text-[11px] font-semibold">
                    <span>{d.theoryLabel}</span>
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
                    <span>{d.mockLabel}</span>
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
                    <span>{d.typingLabel}</span>
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

            {/* Dynamic Daily Plan Tasks */}
            {studyPlan?.tasksToday && studyPlan.tasksToday.length > 0 && (
              <div className="mt-5 p-4 rounded-2xl bg-neutral-950/70 border border-neutral-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#D2F544]" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-white">
                      {d.todayTitle} ({studyPlan.daysRemaining} {d.daysLeft})
                    </h3>
                  </div>
                  <span className="text-[11px] text-neutral-400">
                    {d.budget}: <strong>{dailyMinutes} {d.minutesShort}</strong>
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {studyPlan.tasksToday.map((task) => (
                    <div
                      key={task.id}
                      className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                        task.completed
                          ? 'bg-emerald-950/20 border-emerald-900/50'
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <Link href={task.actionUrl} className="flex items-center gap-2.5 min-w-0 flex-1 group" title={d.openTask}>
                        <div
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            task.completed
                              ? 'bg-emerald-400'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-[#D2F544]'
                          }`}
                        />
                        <div className="min-w-0">
                          <p
                            className={`text-xs font-bold truncate transition-colors ${
                              task.completed ? 'text-emerald-200 line-through' : 'text-white group-hover:text-[#D2F544]'
                            }`}
                          >
                            {task.title}
                          </p>
                          <p className="text-[10px] text-neutral-400 truncate max-w-[240px]">
                            {task.description}
                          </p>
                          {task.reason && (
                            <p className="text-[10px] text-neutral-500 truncate max-w-[240px]">
                              {task.reason}
                              {task.estimatedMinutes ? ` · ${task.estimatedMinutes} ${d.minutesShort}` : ''}
                            </p>
                          )}
                        </div>
                      </Link>
                      <span
                        className={`shrink-0 rounded-lg p-1.5 ${
                          task.completed ? 'text-emerald-400' : 'text-neutral-600'
                        }`}
                        title={task.completed ? d.taskCompleted : d.openTask}
                      >
                        {task.completed ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions Footer */}
            <div className="flex flex-wrap items-center gap-3 pt-6 mt-6 border-t border-neutral-800/80">
              <Link
                href="/diagnostic"
                className="bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{d.diagnosticCta}</span>
              </Link>
              <Link
                href="/test"
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 text-neutral-400" />
                <span>{d.mockCta}</span>
              </Link>
              <Link
                href="/practice/typing"
                className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <Keyboard className="w-3.5 h-3.5 text-neutral-400" />
                <span>{d.typingCta}</span>
              </Link>
            </div>
          </div>

          {/* Side Card: Remaining Work & Certificate Checklist */}
          <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-6 shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#D2F544]" />
                  <span>{d.remainingTitle}</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-900 text-neutral-400 border border-neutral-800">
                  ~{estimatedHoursLeft} {d.hoursLeft}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-[#D2F544]/10 border border-[#D2F544]/20 flex items-center justify-center text-[#D2F544]">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{d.theoryModules}</p>
                      <p className="text-[11px] text-neutral-400">
                        {d.remainingLessons}: <strong className="text-[#D2F544]">{remainingLessonsCount}</strong> / 16
                      </p>
                    </div>
                  </div>
                  {remainingLessonsCount === 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-xs font-black text-white">{remainingLessonsCount} {d.lessonsShort}</span>
                  )}
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-neutral-900/60 border border-neutral-800/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{d.controlTest}</p>
                      <p className="text-[11px] text-neutral-400">
                        {bestScore >= 105 ? d.scoreMet : d.scoreNeeded}
                      </p>
                    </div>
                  </div>
                  {bestScore >= 105 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  ) : (
                    <span className="text-xs font-bold text-amber-400">{d.inProgress}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Server registry widget */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-neutral-900 to-[#121614] border border-[#D2F544]/20">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#D2F544]/20 border border-[#D2F544]/40 flex items-center justify-center text-[#D2F544] shrink-0 mt-0.5">
                  <Award className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xs font-bold text-white">{d.reportsTitle}</h2>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    {d.reportsHint}
                  </p>
                </div>
              </div>

              <Link
                href="/verify"
                className="mt-3 w-full py-2 px-3 rounded-xl bg-neutral-900 border border-neutral-700 hover:border-[#D2F544]/60 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-[#D2F544]" />
                <span>{d.verifyById}</span>
              </Link>

              <div className="mt-3 flex items-center gap-2 text-[10px] text-neutral-500">
                <div className="flex items-center gap-1">
                  {completedLessons.length >= 16 ? <Check className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3" />}
                  <span>{d.lessons16}</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1">
                  {bestScore >= 105 ? <Check className="w-3 h-3 text-emerald-400" /> : <Circle className="w-3 h-3" />}
                  <span>{d.test105}</span>
                </div>
              </div>
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
                    {d.nextStep}
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
              <span>{d.goToLesson}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Interactive Skill Radar (Subscores vs Target University / Modalities) */}
        <SkillRadarChart
          currentScores={currentSubscores}
          currentModalities={currentModalities}
          overallScore={latestTest ? latestTest.overallScore : null}
          targetScore={targetScore}
          hasTakenTest={hasTakenTest}
        />

        {user && user.emailVerified === false && (
          <EmailVerificationBanner email={user.email} />
        )}

        {/* Weekly report */}
        <WeeklyReportCard />

        {/* Weak Spots & Error Notebook */}
        <ErrorNotebookWidget />

        {/* 3. Subscores Diagnostics (DET 4 Pillars + 4 Modalities) */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-[#D2F544]" />
                  <span>
                    {subscoresViewMode === 'subscores'
                      ? d.radarSubscores
                      : d.radarSkills}
                  </span>
                </h2>
                <div className="flex bg-neutral-900 border border-neutral-800 rounded-xl p-0.5 text-[11px] font-bold">
                  <button
                    onClick={() => setSubscoresViewMode('subscores')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      subscoresViewMode === 'subscores'
                        ? 'bg-neutral-800 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Сабскоры (4)
                  </button>
                  <button
                    onClick={() => setSubscoresViewMode('modalities')}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      subscoresViewMode === 'modalities'
                        ? 'bg-neutral-800 text-white shadow-sm'
                        : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Модальности (4)
                  </button>
                </div>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {latestTest
                  ? `${d.fromLastSession} (${latestTest.date})`
                  : d.takeTestForScores}
              </p>
            </div>
            {latestTest && (
              <span className="text-xs font-bold text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-xl">
                {d.overallScore}: <strong className="text-[#D2F544]">{latestTest.overallScore}</strong> / 160
              </span>
            )}
          </div>

          {subscoresViewMode === 'subscores' ? (
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
                        {d.awaitingTest}
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
                        {d.awaitingTest}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Interactive Reading, Listen & Type, Read & Select.
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
                        {d.awaitingTest}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Interactive Listening, Speak About Photo, Interactive Speaking.
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
                        {d.awaitingTest}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Самый требовательный блок: академический вокабуляр C1.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Reading */}
              <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Reading</span>
                    <span className="text-[10px] text-neutral-400 font-semibold">Чтение</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {latestTest && latestTest.reading && latestTest.reading > 0 ? latestTest.reading : '—'}
                    <span className="text-xs font-normal text-neutral-500"> / 160</span>
                  </div>
                  <div className="mt-2">
                    {latestTest && latestTest.reading && latestTest.reading > 0 ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        getSubscoreLevel(latestTest.reading).color
                      }`}>
                        {getSubscoreLevel(latestTest.reading).label}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border text-neutral-400 bg-neutral-900 border-neutral-800">
                        {d.awaitingTest}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Read & Select, Fill in Blanks, Read & Complete, Interactive Reading.
                </p>
              </div>

              {/* Listening */}
              <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Listening</span>
                    <span className="text-[10px] text-neutral-400 font-semibold">Аудирование</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {latestTest && latestTest.listening && latestTest.listening > 0 ? latestTest.listening : '—'}
                    <span className="text-xs font-normal text-neutral-500"> / 160</span>
                  </div>
                  <div className="mt-2">
                    {latestTest && latestTest.listening && latestTest.listening > 0 ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        getSubscoreLevel(latestTest.listening).color
                      }`}>
                        {getSubscoreLevel(latestTest.listening).label}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border text-neutral-400 bg-neutral-900 border-neutral-800">
                        {d.awaitingTest}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Listen & Type, Interactive Listening (диалог и резюме).
                </p>
              </div>

              {/* Writing */}
              <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Writing</span>
                    <span className="text-[10px] text-neutral-400 font-semibold">Письмо</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {latestTest && latestTest.writing && latestTest.writing > 0 ? latestTest.writing : '—'}
                    <span className="text-xs font-normal text-neutral-500"> / 160</span>
                  </div>
                  <div className="mt-2">
                    {latestTest && latestTest.writing && latestTest.writing > 0 ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        getSubscoreLevel(latestTest.writing).color
                      }`}>
                        {getSubscoreLevel(latestTest.writing).label}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border text-neutral-400 bg-neutral-900 border-neutral-800">
                        {d.awaitingTest}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Write About Photo, Interactive Writing, Writing Sample.
                </p>
              </div>

              {/* Speaking */}
              <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 flex flex-col justify-between space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white">Speaking</span>
                    <span className="text-[10px] text-neutral-400 font-semibold">Устная речь</span>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {latestTest && latestTest.speaking && latestTest.speaking > 0 ? latestTest.speaking : '—'}
                    <span className="text-xs font-normal text-neutral-500"> / 160</span>
                  </div>
                  <div className="mt-2">
                    {latestTest && latestTest.speaking && latestTest.speaking > 0 ? (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        getSubscoreLevel(latestTest.speaking).color
                      }`}>
                        {getSubscoreLevel(latestTest.speaking).label}
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border text-neutral-400 bg-neutral-900 border-neutral-800">
                        {d.awaitingTest}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-neutral-500">
                  Speak About Photo, Read Then Speak, Interactive Speaking, Speaking Sample.
                </p>
              </div>
            </div>
          )}
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
                  {d.vocabTrainer}
                </span>
                <span className="text-neutral-500 text-xs">•</span>
                <span className="text-xs text-neutral-400">Алгоритм SuperMemo SM-2</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                {d.srsTitle}
              </h3>
              <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
                {d.srsDesc}
              </p>
            </div>
          </div>

          <Link
            href="/practice/flashcards"
            className="w-full md:w-auto px-6 py-3 rounded-2xl bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] font-black text-xs flex items-center justify-center gap-2 transition-all shadow-md shrink-0 active:scale-95"
          >
            <span>{d.openVocab}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 4. Complete 16-Lesson Roadmap & Checklist */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#D2F544]" />
                <span>{d.curriculum}</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {d.studiedOf}: <strong className="text-[#D2F544]">{completedLessons.length}</strong> / 16.
              </p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {Object.entries(CATEGORY_NAMES[locale]).map(([key, label]) => (
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
                      title={isCompleted ? d.markUndone : d.markDone}
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
                          ~15 {d.minutesShort}
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
                    title={d.openLesson}
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
                <span>{d.historyTitle}</span>
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                {d.historyHint}
              </p>
            </div>

            <Link
              href="/test"
              className="text-xs font-bold text-[#D2F544] hover:underline flex items-center gap-1"
            >
              <span>{d.newTest}</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {testResults.length === 0 ? (
            <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-8 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#D2F544]/10 border border-[#D2F544]/30 text-[#D2F544] flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {d.emptyHistory}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 max-w-md mx-auto">
                  {d.emptyHistoryHint}
                </p>
              </div>
              <Link
                href="/test"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] text-xs font-black transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{d.mockCta}</span>
              </Link>
            </div>
          ) : (
            <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/60 border-b border-neutral-800 text-neutral-400 font-semibold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">{d.colDate}</th>
                      <th className="py-3 px-4">{d.colScore}</th>
                      <th className="py-3 px-4">Literacy</th>
                      <th className="py-3 px-4">Comprehension</th>
                      <th className="py-3 px-4">Conversation</th>
                      <th className="py-3 px-4">Production</th>
                      <th className="py-3 px-4">{d.colStatus}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60">
                    {testResults.map((t, idx) => (
                      <tr key={t.id || idx} className="hover:bg-neutral-900/40 transition-colors">
                        <td className="py-3.5 px-4 font-medium text-neutral-300">
                          {t.date ? new Date(t.date).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : d.recently}
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
                              {d.trainingLevel}
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
    <AuthRequiredGuard badge="Learning Dashboard">
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#070809] flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-[#D2F544] border-t-transparent animate-spin" />
          </div>
        }
      >
        <DashboardContent />
      </Suspense>
    </AuthRequiredGuard>
  );
}
