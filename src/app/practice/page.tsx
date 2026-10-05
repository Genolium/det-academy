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
  PenTool, 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Play
} from 'lucide-react';
import { InteractiveLessonDrill } from '@/components/practice/InteractiveLessonDrill';

export default function PracticeHubPage() {
  const [activeDrillSlug, setActiveDrillSlug] = useState<string | null>(null);
  const [drillCounter, setDrillCounter] = useState(0);

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
      title: 'Read and Complete (Академическое чтение)',
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
      id: 'photo-writing',
      slug: 'write-about-the-photo',
      title: 'Writing Lab & Photo Studio',
      description: 'Отработка 4-шаговой формулы описания фото и академических эссе с проверкой C1/C2 лексики.',
      icon: <Camera className="w-6 h-6 text-[#0C2418]" />,
      badge: 'Production 60s/300s',
      actionText: 'Тренировать письмо',
    },
  ];

  return (
    <div className="min-h-screen py-12 ambient-glow">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <PillBadge variant="mint" prefixHash className="mb-4">
            Practice & Drill Hub
          </PillBadge>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0E1012] tracking-tight mb-4">
            Тренажеры свободной практики
          </h1>
          <p className="text-sm sm:text-base text-neutral-600 leading-relaxed">
            Тренируйте любые типы заданий DET изолированно в бесконечном режиме с мгновенной динамической генерацией без необходимости сдавать полный часовой тест.
          </p>
        </div>

        {/* Modal / Live Drill Window if active */}
        {activeDrillSlug && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-3 bg-neutral-900 text-white px-6 py-3 rounded-2xl">
              <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D2F544]" /> Активный динамический дрилл
              </span>
              <button
                onClick={() => setActiveDrillSlug(null)}
                className="text-xs text-neutral-400 hover:text-white font-bold"
              >
                ✕ Закрыть тренажер
              </button>
            </div>
            <InteractiveLessonDrill 
              key={`${activeDrillSlug}-${drillCounter}`} 
              lessonSlug={activeDrillSlug} 
              category="drill" 
            />
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
                  <Button className="w-full bg-[#0C2418] text-white hover:bg-black font-bold text-xs flex items-center justify-center gap-2">
                    {cat.actionText} <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={() => {
                    setActiveDrillSlug(cat.slug || null);
                    setDrillCounter((prev) => prev + 1);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="w-full bg-[#0C2418] text-white hover:bg-black font-bold text-xs flex items-center justify-center gap-2"
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
      </div>
    </div>
  );
}
