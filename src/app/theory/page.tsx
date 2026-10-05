'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { lessonsData, LessonGuide } from '@/data/theoryContent';
import { directusCms } from '@/lib/directus';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { BentoCard } from '@/components/ui/BentoCard';
import { PillBadge } from '@/components/ui/PillBadge';
import { AuthRequiredGuard } from '@/components/auth/AuthRequiredGuard';
import { CheckCircle2, Circle, ArrowUpRight } from 'lucide-react';
import { translations } from '@/lib/translations';

export default function TheoryCatalogPage() {
  const { completedLessons } = useProgressStore();
  const { locale } = useSettingsStore();
  const [lessons, setLessons] = useState<LessonGuide[]>(lessonsData);
  const t = translations[locale].theory;

  useEffect(() => {
    let isMounted = true;
    directusCms.getTheoryLessons().then((dLessons) => {
      if (isMounted && dLessons && dLessons.length > 0) {
        const mapped: LessonGuide[] = dLessons.map((d) => ({
          slug: d.slug,
          number: d.number,
          titleRu: d.title_ru,
          titleEn: d.title_en,
          category: d.category as any,
          categoryLabelRu: d.category_label_ru,
          categoryLabelEn: d.category_label_en,
          format: d.format,
          scoring: d.scoring,
          timeLimit: d.time_limit,
          rules: d.rules,
          strategySteps: d.strategy_steps,
          formula: d.formula,
          examples: d.examples,
          pitfalls: d.pitfalls,
        }));
        setLessons(mapped);
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const totalLessons = lessons.length;
  // Count only completed lessons that actually match existing course modules
  const validCompletedCount = completedLessons.filter((slug) =>
    lessons.some((l) => l.slug === slug)
  ).length;
  const progressPercent = totalLessons > 0 ? Math.round((validCompletedCount / totalLessons) * 100) : 0;

  return (
    <AuthRequiredGuard
      title={t.guardTitle}
      subtitle={t.guardSubtitle}
      badge="DET Theory & Curriculum"
    >
      <div className="min-h-screen py-12 ambient-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 mb-3">
                <PillBadge variant="mint" prefixHash>
                  {t.curriculumBadge}
                </PillBadge>
                <span className="text-xs uppercase font-bold text-neutral-500">
                  {t.lessonsCount}
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black uppercase text-[#0E1012] tracking-tight">
                {t.title}
              </h1>
            </div>

            {/* Progress Card */}
            <div className="bg-white p-5 rounded-3xl border border-neutral-200 shadow-sm max-w-sm w-full">
              <div className="flex items-center justify-between text-xs font-bold mb-2">
                <span className="text-neutral-500">{t.progressCardLabel}:</span>
                <span className="text-[#0E1012] font-mono text-sm">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-[#D2F544] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] text-neutral-400">
                {validCompletedCount} / {totalLessons} {t.progressCardStatus}
              </span>
            </div>
          </div>

          {/* Lessons List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => {
              const isDone = completedLessons.includes(lesson.slug);
              const title = locale === 'ru' ? lesson.titleRu : lesson.titleEn;
              const categoryLabel = locale === 'ru' ? lesson.categoryLabelRu : lesson.categoryLabelEn;

              return (
                <BentoCard
                  key={lesson.slug}
                  variant="light"
                  className="flex flex-col justify-between group hover:border-[#0E1012] transition-colors relative"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <PillBadge
                        variant={isDone ? 'mint' : 'slate'}
                        prefixHash
                        className="text-[10px]"
                      >
                        {categoryLabel}
                      </PillBadge>
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        {isDone ? (
                          <span className="text-emerald-600 flex items-center gap-1 font-bold">
                            <CheckCircle2 className="w-4 h-4" /> {t.studiedBadge}
                          </span>
                        ) : (
                          <span className="text-neutral-400 flex items-center gap-1">
                            <Circle className="w-3.5 h-3.5" /> {t.inProgressBadge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs font-mono text-neutral-400 mb-1">
                      {t.lessonPrefix} {lesson.number < 10 ? `0${lesson.number}` : lesson.number}
                    </div>
                    <h3 className="text-lg font-bold text-[#0E1012] group-hover:text-emerald-700 transition-colors line-clamp-2 mb-3">
                      {title}
                    </h3>
                    <p className="text-xs text-neutral-500 mb-4 line-clamp-2">
                      {lesson.format}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                    <span className="text-xs font-medium text-neutral-400">
                      {t.timingLabel}: {lesson.timeLimit}
                    </span>
                    <Link
                      href={`/theory/${lesson.slug}`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0E1012] bg-[#D2F544] hover:bg-[#C4F22C] px-3.5 py-1.5 rounded-full transition-transform active:scale-95 shadow-sm"
                    >
                      {t.openGuide} <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </BentoCard>
              );
            })}
          </div>
        </div>
      </div>
    </AuthRequiredGuard>
  );
}
