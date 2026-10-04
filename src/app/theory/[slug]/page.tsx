'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { lessonsData, LessonGuide } from '@/data/theoryContent';
import { directusCms } from '@/lib/directus';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { BentoCard } from '@/components/ui/BentoCard';
import { PillBadge } from '@/components/ui/PillBadge';
import { Button } from '@/components/ui/Button';
import { AuthRequiredGuard } from '@/components/auth/AuthRequiredGuard';
import { translations } from '@/lib/translations';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  FileCheck2,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

interface LessonPageProps {
  params: Promise<{ slug: string }>;
}

export default function LessonDetailsPage({ params }: LessonPageProps) {
  const resolvedParams = use(params);
  const staticLesson = lessonsData.find((l) => l.slug === resolvedParams.slug);
  const [lesson, setLesson] = useState<LessonGuide | null>(staticLesson || null);

  useEffect(() => {
    let isMounted = true;
    directusCms.getTheoryLessonBySlug(resolvedParams.slug).then((dLesson) => {
      if (isMounted && dLesson) {
        setLesson({
          slug: dLesson.slug,
          number: dLesson.number,
          titleRu: dLesson.title_ru,
          titleEn: dLesson.title_en,
          category: dLesson.category as any,
          categoryLabelRu: dLesson.category_label_ru,
          categoryLabelEn: dLesson.category_label_en,
          format: dLesson.format,
          scoring: dLesson.scoring,
          timeLimit: dLesson.time_limit,
          rules: dLesson.rules,
          strategySteps: dLesson.strategy_steps,
          formula: dLesson.formula,
          examples: dLesson.examples,
          pitfalls: dLesson.pitfalls,
        });
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [resolvedParams.slug]);

  const { completedLessons, toggleLessonCompleted } = useProgressStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].theory;

  if (!lesson) {
    notFound();
  }

  const isCompleted = completedLessons.includes(lesson.slug);
  const title = locale === 'ru' ? lesson.titleRu : lesson.titleEn;
  const categoryLabel = locale === 'ru' ? lesson.categoryLabelRu : lesson.categoryLabelEn;

  // Next and previous lesson links
  const currentIndex = lessonsData.findIndex((l) => l.slug === lesson.slug);
  const prevLesson = currentIndex > 0 ? lessonsData[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessonsData.length - 1 ? lessonsData[currentIndex + 1] : null;

  return (
    <AuthRequiredGuard
      title={t.guardTitle}
      subtitle={t.guardSubtitle}
      badge="DET Lesson Guide"
    >
      <div className="min-h-screen py-10 ambient-glow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {/* Back navigation */}
          <div className="flex items-center justify-between mb-8">
            <Link
              href="/theory"
              className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-black bg-white px-4 py-2 rounded-full border border-neutral-200 transition-colors shadow-sm"
            >
              <ArrowLeft className="w-4 h-4" /> {t.backToList}
            </Link>

            <PillBadge variant="mint" prefixHash>
              {categoryLabel}
            </PillBadge>
          </div>

          {/* Title Block */}
          <div className="bg-[#111315] text-white p-8 sm:p-10 rounded-3xl border border-neutral-800 shadow-xl mb-8">
            <div className="flex items-center gap-2 text-xs font-mono text-[#D2F544] mb-3">
              <span>{t.lessonPrefix.toUpperCase()} {lesson.number < 10 ? `0${lesson.number}` : lesson.number} / {lessonsData.length}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {lesson.timeLimit}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-4">
              {title}
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
              {lesson.format}
            </p>
          </div>

          {/* Content Modules */}
          <div className="space-y-8">
            {/* 1. Rules Section */}
            <BentoCard variant="light">
              <div className="flex items-center gap-2.5 mb-4 text-[#0E1012]">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold uppercase tracking-tight">{t.rulesTitle}</h2>
              </div>
              <ul className="space-y-3">
                {lesson.rules.map((rule, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-neutral-700">
                    <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </BentoCard>

            {/* 2. Strategy Steps */}
            <BentoCard variant="light" className="border-l-4 border-l-[#D2F544]">
              <div className="flex items-center gap-2.5 mb-4 text-[#0E1012]">
                <Lightbulb className="w-5 h-5 text-amber-500" />
                <h2 className="text-xl font-bold uppercase tracking-tight">{t.strategyTitle}</h2>
              </div>
              <div className="space-y-4">
                {lesson.strategySteps.map((step, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80">
                    <span className="text-xs font-bold text-[#0E1012] uppercase block mb-1">
                      {t.stepPrefix} {idx + 1}
                    </span>
                    <p className="text-sm text-neutral-700 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* 3. Golden Formula (if present) */}
            {lesson.formula && (
              <BentoCard variant="lime">
                <div className="flex items-center gap-2.5 mb-3 text-[#0C2418]">
                  <FileCheck2 className="w-5 h-5" />
                  <h2 className="text-xl font-black uppercase tracking-tight">{t.formulaTitle}</h2>
                </div>
                <div className="bg-[#0C2418] text-[#D2F544] p-5 rounded-2xl font-mono text-sm leading-relaxed whitespace-pre-line shadow-inner">
                  {lesson.formula}
                </div>
              </BentoCard>
            )}

            {/* 4. Practical Examples */}
            {lesson.examples && lesson.examples.length > 0 && (
              <div className="space-y-4">
                {lesson.examples.map((ex, idx) => (
                  <BentoCard key={idx} variant="dark">
                    <div className="text-xs font-mono uppercase text-[#D2F544] font-bold mb-2">
                      {t.exampleTitle} #{idx + 1}
                    </div>
                    {ex.question && (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4 font-mono text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
                        {ex.question}
                      </div>
                    )}
                    {ex.sampleText && (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-4 text-xs font-mono text-neutral-300">
                        {ex.sampleText}
                      </div>
                    )}
                    <div className="border-t border-neutral-800 pt-4 space-y-3">
                      <div>
                        <span className="text-xs font-bold uppercase text-emerald-400 block mb-1">
                          {t.modelAnswerLabel}:
                        </span>
                        <p className="text-sm text-neutral-200 leading-relaxed whitespace-pre-line bg-black/40 p-4 rounded-xl border border-neutral-800/80">
                          {ex.modelAnswer}
                        </p>
                      </div>
                      {ex.comment && (
                        <div>
                          <span className="text-xs font-bold uppercase text-neutral-400 block mb-1">
                            {t.expertCommentLabel}:
                          </span>
                          <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-line">
                            {ex.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </BentoCard>
                ))}
              </div>
            )}

            {/* 5. Pitfalls and Common Traps */}
            {lesson.pitfalls.length > 0 && (
              <BentoCard variant="light" className="border-red-200 bg-red-50/30">
                <div className="flex items-center gap-2.5 mb-4 text-red-900">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h2 className="text-xl font-bold uppercase tracking-tight">{t.pitfallsTitle}</h2>
                </div>
                <ul className="space-y-2">
                  {lesson.pitfalls.map((pitfall, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-red-800">
                      <span className="font-bold text-red-600">•</span>
                      <span>{pitfall}</span>
                    </li>
                  ))}
                </ul>
              </BentoCard>
            )}

            {/* Complete Lesson Action */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold text-[#0E1012]">
                  {t.completedQuestion}
                </div>
                <p className="text-xs text-neutral-500">
                  {t.completedNote}
                </p>
              </div>
              <Button
                variant={isCompleted ? 'mint' : 'primary'}
                size="md"
                onClick={() => toggleLessonCompleted(lesson.slug)}
                icon={<CheckCircle2 className="w-4 h-4" />}
              >
                {isCompleted ? t.markUndone : t.markDone}
              </Button>
            </div>

            {/* Bottom Lesson Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-neutral-200">
              {prevLesson ? (
                <Link
                  href={`/theory/${prevLesson.slug}`}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-black"
                >
                  <ArrowLeft className="w-4 h-4" /> {t.prevLesson}
                </Link>
              ) : <div />}

              {nextLesson && (
                <Link
                  href={`/theory/${nextLesson.slug}`}
                  className="flex items-center gap-2 text-xs font-bold text-neutral-600 hover:text-black"
                >
                  {t.nextLesson} <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthRequiredGuard>
  );
}
