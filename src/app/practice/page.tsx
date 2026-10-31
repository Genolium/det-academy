'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { BentoCard } from '@/components/ui/BentoCard';
import { Button } from '@/components/ui/Button';
import { PillBadge } from '@/components/ui/PillBadge';
import {
  Keyboard,
  FileText,
  CheckSquare,
  Volume2,
  Camera,
  ArrowRight,
  Sparkles,
  Layers,
  Play,
  Mic,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  RotateCcw,
} from 'lucide-react';
const InteractiveLessonDrill = dynamic(
  () => import('@/components/practice/InteractiveLessonDrill').then((mod) => mod.InteractiveLessonDrill),
  { ssr: false }
);
const SpeakAboutPhoto = dynamic(
  () => import('@/components/test-engine/questions/SpeakAboutPhoto').then((mod) => mod.SpeakAboutPhoto),
  { ssr: false }
);
const SpeakingSample = dynamic(
  () => import('@/components/test-engine/questions/SpeakingSample').then((mod) => mod.SpeakingSample),
  { ssr: false }
);
const WritingInspector = dynamic(
  () => import('@/components/practice/WritingInspector').then((mod) => mod.WritingInspector),
  { ssr: false }
);
const ErrorBankModal = dynamic(
  () => import('@/components/practice/ErrorBankModal').then((mod) => mod.ErrorBankModal),
  { ssr: false }
);
import { useErrorNotebookStore } from '@/store/useErrorNotebookStore';

import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { practiceCopy } from '@/lib/practiceCopy';

export default function PracticeHubPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { locale, strictMode, setStrictMode } = useSettingsStore();
  const hub = translations[locale].practiceHub;
  const copy = practiceCopy[locale];
  const [activeDrillSlug, setActiveDrillSlug] = useState<string | null>(null);
  const [drillCounter, setDrillCounter] = useState(0);
  const [isErrorBankOpen, setIsErrorBankOpen] = useState(false);
  const [inspectorText, setInspectorText] = useState('');

  const { errors } = useErrorNotebookStore();
  const unmasteredErrors = errors.filter((error) => !error.mastered).length;

  useEffect(() => {
    try {
      const stored = localStorage.getItem('det_strict_mode');
      if (stored === 'true') setStrictMode(true);
    } catch {}
  }, [setStrictMode]);

  // A recommendation elsewhere in the dashboard can open a specific drill.
  useEffect(() => {
    const drill = new URLSearchParams(window.location.search).get('drill');
    const valid = new Set([
      'read-and-complete', 'read-and-select', 'fill-in-the-blanks', 'listen-and-type',
      'speak-about-photo', 'speaking-sample', 'writing-inspector', 'write-about-the-photo',
    ]);
    if (drill && valid.has(drill)) setActiveDrillSlug(drill);
  }, []);

  // Strict requested order:
  // 1. скоропечатание, 2. read and complete, 3. словарный блиц, 4. fill in blanks, 5. аудио-диктанты, 6. академический словарь, потом всё остальное
  const practiceCategories = [
    {
      id: 'typing',
      title: copy.categories.typing.title,
      description: copy.categories.typing.description,
      icon: <Keyboard className="w-6 h-6 text-[#0C2418]" />,
      badge: 'Speed Drill',
      href: '/practice/typing',
      actionText: copy.categories.typing.actionText,
    },
    {
      id: 'c-test',
      slug: 'read-and-complete',
      title: 'Read and Complete (C-Test)',
      description: copy.categories['c-test'].description,
      icon: <FileText className="w-6 h-6 text-[#0C2418]" />,
      badge: 'C-Test Practice',
      actionText: copy.categories['c-test'].actionText,
    },
    {
      id: 'read-select',
      slug: 'read-and-select',
      title: copy.categories['read-select'].title,
      description: copy.categories['read-select'].description,
      icon: <CheckSquare className="w-6 h-6 text-[#0C2418]" />,
      badge: '5s Per Word',
      actionText: copy.categories['read-select'].actionText,
    },
    {
      id: 'fill-blanks',
      slug: 'fill-in-the-blanks',
      title: 'Fill in the Blanks Sprint',
      description: copy.categories['fill-blanks'].description,
      icon: <Layers className="w-6 h-6 text-[#0C2418]" />,
      badge: '20s Time Limit',
      actionText: copy.categories['fill-blanks'].actionText,
    },
    {
      id: 'dictation',
      slug: 'listen-and-type',
      title: copy.categories.dictation.title,
      description: copy.categories.dictation.description,
      icon: <Volume2 className="w-6 h-6 text-[#0C2418]" />,
      badge: 'Audio Speech Engine',
      actionText: copy.categories.dictation.actionText,
    },
    {
      id: 'flashcards',
      title: copy.categories.flashcards.title,
      description: copy.categories.flashcards.description,
      icon: <Sparkles className="w-6 h-6 text-[#0C2418]" />,
      badge: 'SuperMemo SM-2',
      href: '/practice/flashcards',
      actionText: copy.categories.flashcards.actionText,
    },
    // Потом всё остальное:
    {
      id: 'speak-photo',
      slug: 'speak-about-photo',
      title: 'AI Speaking Studio (Speak About Photo)',
      description: copy.categories['speak-photo'].description,
      icon: <Mic className="w-6 h-6 text-[#0C2418]" />,
      badge: 'Live Audio Waveform',
      actionText: copy.categories['speak-photo'].actionText,
    },
    {
      id: 'speaking-sample',
      slug: 'speaking-sample',
      title: copy.categories['speaking-sample'].title,
      description: copy.categories['speaking-sample'].description,
      icon: <MessageSquare className="w-6 h-6 text-[#0C2418]" />,
      badge: '1-3 Min Monologue',
      actionText: copy.categories['speaking-sample'].actionText,
    },
    {
      id: 'pronunciation',
      href: '/practice/pronunciation',
      title: locale === 'ru' ? 'Фонемная практика' : 'Phoneme Practice',
      description:
        locale === 'ru'
          ? 'Прочитайте предложение вслух и сравните услышанные фонемы с эталоном.'
          : 'Read a sentence aloud and compare the recognised phonemes with the reference.',
      icon: <Mic className="w-6 h-6 text-[#0C2418]" />,
      badge: 'G2P + IPA',
      actionText: locale === 'ru' ? 'Начать разбор' : 'Start analysis',
    },
    {
      id: 'writing-inspector',
      slug: 'writing-inspector',
      title: 'AI Writing Diagnostic Inspector',
      description: copy.categories['writing-inspector'].description,
      icon: <TrendingUp className="w-6 h-6 text-[#0C2418]" />,
      badge: 'CEFR + OREO Diagnostic',
      actionText: copy.categories['writing-inspector'].actionText,
    },
    {
      id: 'photo-writing',
      slug: 'write-about-the-photo',
      title: 'Writing Lab & Photo Studio',
      description: copy.categories['photo-writing'].description,
      icon: <Camera className="w-6 h-6 text-[#0C2418]" />,
      badge: 'Production 60s/300s',
      actionText: copy.categories['photo-writing'].actionText,
    },
    // Банк ошибок появляется ТОЛЬКО для авторизованных пользователей
    ...(isAuthenticated && user
      ? [
          {
            id: 'error-bank',
            title: copy.categories['error-bank'].title,
            description: copy.categories['error-bank'].description,
            icon: <AlertCircle className="w-6 h-6 text-[#0C2418]" />,
            badge: unmasteredErrors > 0 ? `${unmasteredErrors} ${copy.toReview}` : copy.noErrors,
            isErrorModal: true,
            actionText: copy.categories['error-bank'].actionText,
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen py-12 ambient-glow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <PillBadge variant="mint" className="mb-4">
            {hub.badge}
          </PillBadge>
          <h1 className="text-3xl sm:text-5xl font-semibold text-brand-obsidian tracking-tight mb-4">
            {hub.title}
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            {hub.subtitle}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setStrictMode(!strictMode)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all ${
              strictMode
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-neutral-300 bg-white text-neutral-600 hover:border-neutral-400'
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${strictMode ? 'bg-red-500 animate-pulse' : 'bg-neutral-300'}`} />
            {strictMode ? 'Strict mode: ON' : 'Strict mode: OFF'}
          </button>
          <span className="text-[11px] text-neutral-500 max-w-md text-center">
            {copy.strictNote}
          </span>
        </div>

        {strictMode && <PracticeStrictTimer />}

        {/* Modal / Live Drill Window if active */}
        {activeDrillSlug && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-3 bg-neutral-900 text-white px-6 py-3 rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D2F544]" /> {copy.activeDrill}: {activeDrillSlug}
              </span>
              <button
                onClick={() => setActiveDrillSlug(null)}
                className="text-xs text-neutral-400 hover:text-white font-bold cursor-pointer"
              >
                ✕ {copy.closeDrill}
              </button>
            </div>

            {activeDrillSlug === 'speak-about-photo' ? (
              <SpeakAboutPhoto
                key={`photo-speak-${drillCounter}`}
                isStandaloneDrill
                onComplete={() => setActiveDrillSlug(null)}
              />
            ) : activeDrillSlug === 'speaking-sample' ? (
              <SpeakingSample
                key={`sample-speak-${drillCounter}`}
                isStandaloneDrill
                onComplete={() => setActiveDrillSlug(null)}
              />
            ) : activeDrillSlug === 'writing-inspector' ? (
              <div className="space-y-4">
                <div className="bg-[#0E1012] p-4 rounded-2xl border border-neutral-800">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block mb-2">
                    {copy.essayField}:
                  </span>
                  <textarea
                    rows={5}
                    value={inspectorText}
                    onChange={(e) => setInspectorText(e.target.value)}
                    placeholder={copy.draftPlaceholder}
                    className="w-full bg-neutral-950 border border-neutral-700 focus:border-[#D2F544] rounded-xl p-3.5 text-white text-xs outline-none leading-relaxed"
                  />
                </div>
                <WritingInspector
                  text={inspectorText}
                  onTextChange={setInspectorText}
                  minWords={80}
                  showOreoTracker={true}
                />
              </div>
            ) : (
              <InteractiveLessonDrill
                key={`${activeDrillSlug}-${drillCounter}`}
                lessonSlug={activeDrillSlug}
                category="drill"
              />
            )}
          </div>
        )}

        {/* Grid of drills */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {practiceCategories.map((cat) => (
            <BentoCard
              key={cat.id}
              variant="light"
              className="p-6 rounded-3xl flex flex-col justify-between hover:shadow-xl transition-all border border-neutral-200/80 bg-white"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#D2F544] flex items-center justify-center shadow-sm">
                    {cat.icon}
                  </div>
                  <PillBadge variant="outline" className="text-[10px]">
                    {cat.badge}
                  </PillBadge>
                </div>

                <h2 className="text-lg font-black text-neutral-900 mb-2">
                  {cat.title}
                </h2>
                <p className="text-xs text-neutral-600 leading-relaxed mb-6">
                  {cat.description}
                </p>
              </div>

              {cat.href ? (
                <Link href={cat.href}>
                  <Button className="w-full bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
                    {cat.actionText} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : cat.isErrorModal ? (
                <Button
                  onClick={() => setIsErrorBankOpen(true)}
                  className="w-full bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  {cat.actionText} <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setActiveDrillSlug(cat.slug || null);
                    setDrillCounter((prev) => prev + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                >
                  {cat.actionText} <Play className="w-3.5 h-3.5 fill-current" />
                </Button>
              )}
            </BentoCard>
          ))}
        </div>

        {/* Bottom Banner to CAT Simulator */}
        <div className="mt-12 bg-neutral-950 text-white rounded-3xl p-8 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div>
            <PillBadge variant="mint" className="mb-3">
              Full Computer Adaptive Test
            </PillBadge>
            <h2 className="text-2xl font-semibold text-white mb-2">
              {hub.mockBanner}
            </h2>
          </div>
          <Button href="/test" size="lg" className="whitespace-nowrap">
            {hub.mockCta}
          </Button>
        </div>

        {/* Error Bank Modal */}
        <ErrorBankModal
          isOpen={isErrorBankOpen}
          onClose={() => setIsErrorBankOpen(false)}
        />
      </div>
    </div>
  );
}

const PracticeStrictTimer: React.FC = () => {
  const { locale } = useSettingsStore();
  const copy = practiceCopy[locale];
  const [secondsLeft, setSecondsLeft] = useState(10 * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const expired = secondsLeft === 0;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <div
      className={`mb-8 rounded-2xl border px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 ${
        expired
          ? 'border-red-300 bg-red-50 text-red-800'
          : secondsLeft <= 60
          ? 'border-amber-300 bg-amber-50 text-amber-800'
          : 'border-neutral-200 bg-white text-[#0E1012]'
      }`}
    >
      <div>
        <p className="text-[10px] font-black uppercase tracking-wider">Strict practice timer</p>
        <p className="text-xs text-neutral-500">
          {expired
            ? copy.timeUp
            : copy.paceNote}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="font-mono text-2xl font-black tabular-nums">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
        <button
          onClick={() => setSecondsLeft(10 * 60)}
          className="rounded-xl border border-neutral-300 bg-white px-3 py-1.5 text-xs font-bold text-neutral-600 hover:border-neutral-400"
        >
          {copy.reset}
        </button>
      </div>
    </div>
  );
};
