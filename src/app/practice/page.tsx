'use client';

import React, { useState } from 'react';
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
import { InteractiveLessonDrill } from '@/components/practice/InteractiveLessonDrill';
import { SpeakAboutPhoto } from '@/components/test-engine/questions/SpeakAboutPhoto';
import { SpeakingSample } from '@/components/test-engine/questions/SpeakingSample';
import { WritingInspector } from '@/components/practice/WritingInspector';
import { ErrorBankModal } from '@/components/practice/ErrorBankModal';
import { useErrorBankStore } from '@/store/useErrorBankStore';

import { useAuthStore } from '@/store/useAuthStore';

export default function PracticeHubPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [activeDrillSlug, setActiveDrillSlug] = useState<string | null>(null);
  const [drillCounter, setDrillCounter] = useState(0);
  const [isErrorBankOpen, setIsErrorBankOpen] = useState(false);
  const [inspectorText, setInspectorText] = useState(
    'In my opinion, higher education represents a pivotal catalyst for modern socioeconomic mobility. This is primarily because university curricula foster advanced critical thinking and empirical inquiry. For instance, recent studies demonstrate that graduates adapt substantially faster to automated digital environments. Ultimately, governments must prioritize equitable access to tertiary learning.'
  );

  const { errors, getUnmasteredCount } = useErrorBankStore();
  const unmasteredErrors = getUnmasteredCount();

  // Strict requested order:
  // 1. скоропечатание, 2. read and complete, 3. словарный блиц, 4. fill in blanks, 5. аудио-диктанты, 6. академический словарь, потом всё остальное
  const practiceCategories = [
    {
      id: 'typing',
      title: 'DET Typing Trainer (Скоропечатание)',
      description: 'Тренажер скоропечатания вслепую на английском с академическим словарем DET.',
      icon: <Keyboard className="w-6 h-6 text-[#0C2418]" />,
      badge: 'Speed Drill',
      href: '/practice/typing',
      actionText: 'Открыть тренажер печати',
    },
    {
      id: 'c-test',
      slug: 'read-and-complete',
      title: 'Read and Complete (C-Test)',
      description: 'Интерактивное восстановление текста: допишите недостающие буквы в словах, опираясь на контекст.',
      icon: <FileText className="w-6 h-6 text-[#0C2418]" />,
      badge: 'C-Test Practice',
      actionText: 'Тренировать C-Test онлайн',
    },
    {
      id: 'read-select',
      slug: 'read-and-select',
      title: 'Словарный блиц (Read and Select)',
      description: 'Распознавание реальных академических C2 слов и выявление коварных псевдослов (трапов DET).',
      icon: <CheckSquare className="w-6 h-6 text-[#0C2418]" />,
      badge: '5s Per Word',
      actionText: 'Тренировать Read & Select',
    },
    {
      id: 'fill-blanks',
      slug: 'fill-in-the-blanks',
      title: 'Fill in the Blanks Sprint',
      description: 'Контекстная вставка пропущенных частей слов. Только американский спеллинг и грамматика.',
      icon: <Layers className="w-6 h-6 text-[#0C2418]" />,
      badge: '20s Time Limit',
      actionText: 'Тренировать Fill in Blanks',
    },
    {
      id: 'dictation',
      slug: 'listen-and-type',
      title: 'Аудио-диктанты (Listen and Type)',
      description: 'Восприятие связной речи с американским акцентом. Правило 3 воспроизведений и пунктуация.',
      icon: <Volume2 className="w-6 h-6 text-[#0C2418]" />,
      badge: 'Audio Speech Engine',
      actionText: 'Тренировать диктанты',
    },
    {
      id: 'flashcards',
      title: 'Академический словарь (SRS Flashcards)',
      description: 'Карточки 1,500 слов Academic Word List с алгоритмом интервального повторения SuperMemo SM-2, озвучкой и коллокациями.',
      icon: <Sparkles className="w-6 h-6 text-[#0C2418]" />,
      badge: 'SuperMemo SM-2',
      href: '/practice/flashcards',
      actionText: 'Учить слова C1/C2',
    },
    // Потом всё остальное:
    {
      id: 'speak-photo',
      slug: 'speak-about-photo',
      title: 'AI Speaking Studio (Speak About Photo)',
      description: 'Живая осциллограмма голоса, замер WPM, распознавание речевых пауз и анализ лексики C1/C2 при описании фото за 90 секунд.',
      icon: <Mic className="w-6 h-6 text-[#0C2418]" />,
      badge: 'Live Audio Waveform',
      actionText: 'Запустить Speaking Studio',
    },
    {
      id: 'speaking-sample',
      slug: 'speaking-sample',
      title: 'Speaking Sample (Академический монолог)',
      description: 'Устный видеомонолог 1–3 минуты на дискуссионную тему с live спектрограммой, таймером подготовки и скорингом беглости.',
      icon: <MessageSquare className="w-6 h-6 text-[#0C2418]" />,
      badge: '1-3 Min Monologue',
      actionText: 'Тренировать устный монолог',
    },
    {
      id: 'writing-inspector',
      slug: 'writing-inspector',
      title: 'AI Writing Diagnostic Inspector',
      description: 'Интерактивная подсветка CEFR уровней (A1–C2), экспресс-замена слабых слов на C1/C2 (Vocab Upgrades) и OREO чек-лист.',
      icon: <TrendingUp className="w-6 h-6 text-[#0C2418]" />,
      badge: 'CEFR + OREO Diagnostic',
      actionText: 'Открыть Writing Inspector',
    },
    {
      id: 'photo-writing',
      slug: 'write-about-the-photo',
      title: 'Writing Lab & Photo Studio',
      description: 'Отработка 4-шаговой формулы описания фото и академических эссе с проверкой C1/C2 лексики.',
      icon: <Camera className="w-6 h-6 text-[#0C2418]" />,
      badge: 'Production 60s/300s',
      actionText: 'Тренировать письмо',
    },
    // Банк ошибок появляется ТОЛЬКО для авторизованных пользователей
    ...(isAuthenticated && user
      ? [
          {
            id: 'error-bank',
            title: 'Smart Error Bank (Банк ошибок)',
            description: `Автоматический сбор всех ваших ошибок из C-Test, Dictations, Fill Blanks и Read & Select. Отрабатывайте слабые места в изолированном режиме.`,
            icon: <AlertCircle className="w-6 h-6 text-[#0C2418]" />,
            badge: unmasteredErrors > 0 ? `${unmasteredErrors} на повтор` : 'Ошибок: 0',
            isErrorModal: true,
            actionText: 'Открыть банк ошибок',
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen py-12 ambient-glow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <PillBadge variant="mint" prefixHash className="mb-4">
            Тренажеры DET
          </PillBadge>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0E1012] tracking-tight mb-4">
            Тренажеры свободной практики
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            Отрабатывайте все типы заданий Duolingo English Test в изолированном интерактивном режиме с таймерами и детальной диагностикой.
          </p>
        </div>

        {/* Modal / Live Drill Window if active */}
        {activeDrillSlug && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-3 bg-neutral-900 text-white px-6 py-3 rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D2F544]" /> Активный тренажер: {activeDrillSlug}
              </span>
              <button
                onClick={() => setActiveDrillSlug(null)}
                className="text-xs text-neutral-400 hover:text-white font-bold cursor-pointer"
              >
                ✕ Закрыть тренажер
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
                    Интерактивное поле ввода эссе:
                  </span>
                  <textarea
                    rows={5}
                    value={inspectorText}
                    onChange={(e) => setInspectorText(e.target.value)}
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

                <h3 className="text-lg font-black text-neutral-900 mb-2">
                  {cat.title}
                </h3>
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
            <h2 className="text-2xl font-black text-white mb-2">
              Готовы проверить себя в боевых условиях?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
              Пройдите полный 60-минутный адаптивный симулятор DET со сквозным скорингом (10–160), расчетом всех 4 сабскоров и выдачей верифицируемого сертификата.
            </p>
          </div>
          <Link href="/test/session">
            <Button size="lg" className="bg-[#D2F544] text-neutral-900 font-black hover:bg-[#c3e839] whitespace-nowrap">
              Начать полный экзамен
            </Button>
          </Link>
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
