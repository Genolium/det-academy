'use client';

import React from 'react';
import Link from 'next/link';
import { SrsFlashcards } from '@/components/dashboard/SrsFlashcards';
import { ArrowLeft, Sparkles, BookOpen, Layers, Flame, CheckCircle2 } from 'lucide-react';
import { PillBadge } from '@/components/ui/PillBadge';

export default function FlashcardsPracticePage() {
  return (
    <div className="min-h-screen bg-[#070809] text-white py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            href="/practice"
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Все тренажеры DET</span>
          </Link>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[#D2F544]/10 text-[#D2F544] border border-[#D2F544]/25 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              SuperMemo SM-2 Spaced Repetition
            </span>
          </div>
        </div>

        {/* Page Title & Context */}
        <div className="bg-[#0E1012] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-3">
          <div className="flex items-center gap-2">
            <PillBadge variant="lime" prefixHash>
              Academic Vocabulary
            </PillBadge>
            <span className="text-xs text-neutral-400 font-semibold">1,500 Academic Words</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Карточки академического словаря C1/C2
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed max-w-2xl">
            Интервальное повторение по научному алгоритму SuperMemo SM-2. Тренируйте высокочастотные академические лексемы (Academic Word List), дефиниции, транскрипции и устойчивые академические коллокации для максимизации сабскоров Production и Literacy.
          </p>

          {/* Quick Shortcuts Hints */}
          <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-neutral-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-[10px] text-neutral-200">Space</kbd>
              <span>Перевернуть</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 font-mono text-[10px] text-neutral-200">1..4</kbd>
              <span>Оценка ответа</span>
            </span>
            <span>•</span>
            <span className="text-neutral-500">Автоматический расчет интервала памяти</span>
          </div>
        </div>

        {/* The SRS Flashcard Interactive Component */}
        <SrsFlashcards />

        {/* Bottom Educational Tips */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#0E1012] border border-neutral-800 space-y-1.5">
            <div className="text-[#D2F544] font-black text-xs flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Зачем это нужно?</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Экзамен DET оценивает лексическую плотность и редкие академические слова уровня C1-C2 в Writing и Speaking.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0E1012] border border-neutral-800 space-y-1.5">
            <div className="text-purple-400 font-black text-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Алгоритм SM-2</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Слова, вызывающие трудности, возвращаются чаще. Легкие слова отодвигаются на 6, 15 и 30 дней.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#0E1012] border border-neutral-800 space-y-1.5">
            <div className="text-emerald-400 font-black text-xs flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Коллокации</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Учите слова не изолированно, а в устойчивых связках (substantiate claims, empirical evidence).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
