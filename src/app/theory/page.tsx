'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { lessonsData, LessonGuide } from '@/data/theoryContent';
import { api } from '@/lib/api';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { BentoCard } from '@/components/ui/BentoCard';
import { PillBadge } from '@/components/ui/PillBadge';
import { CheckCircle2, Circle, ArrowUpRight } from 'lucide-react';
import { translations } from '@/lib/translations';
import { THEORY_TASK_COUNT, isTheoryTaskSlug } from '@/data/theoryTaxonomy';

export default function TheoryCatalogPage() {
  const { completedLessons } = useProgressStore();
  const { locale } = useSettingsStore();
  const [lessons, setLessons] = useState<LessonGuide[]>(lessonsData);
  const [catalogSource, setCatalogSource] = useState<'backend' | 'fallback'>('fallback');
  const [catalogVersion, setCatalogVersion] = useState<string>('');
  const t = translations[locale].theory;

  useEffect(() => {
    let isMounted = true;
    api.getTheoryCatalog().then((catalog) => {
      const dLessons = catalog?.lessons;
      if (catalog?.version) setCatalogVersion(catalog.version);
      if (isMounted && dLessons && dLessons.length > 0) {
        const mapped: LessonGuide[] = dLessons.map((d) => ({
          slug: d.slug,
          number: d.number,
          titleRu: d.title_ru,
          titleEn: d.title_en,
          category: d.category as LessonGuide['category'],
          categoryLabelRu: d.category_label_ru,
          categoryLabelEn: d.category_label_en,
          isTrackable: d.is_trackable !== false,
          format: d.format,
          scoring: d.scoring,
          timeLimit: d.time_limit,
          rules: d.rules,
          strategySteps: d.strategy_steps,
          formula: d.formula,
          examples: d.examples,
          pitfalls: d.pitfalls,
        }));
        const mappedTaskCount = mapped.filter(
          (lesson) => lesson.slug !== 'start-here' && lesson.isTrackable !== false
        ).length;
        if (mappedTaskCount !== THEORY_TASK_COUNT) {
          // A partial or stale catalogue must not lower the denominator or
          // silently remove lessons. Keep the explicit local fallback.
          return;
        }
        const intro = lessonsData.find((lesson) => lesson.slug === 'start-here');
        if (intro && !mapped.some((lesson) => lesson.slug === intro.slug)) {
          mapped.unshift(intro);
        }
        setLessons(mapped);
        setCatalogSource('backend');
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // The local intro and the two orientation guides are useful reading, but
  // only the 13 DET task lessons count toward progress and certificates.
  const introLesson = lessons.find((lesson) => lesson.slug === 'start-here') || null;
  const trackableLessons = lessons.filter(
    (lesson) => lesson.slug !== 'start-here' && lesson.isTrackable !== false
  );
  const referenceLessons = lessons.filter(
    (lesson) => lesson.slug !== 'start-here' && lesson.isTrackable === false
  );
  const mainLessons = introLesson ? [introLesson, ...trackableLessons] : trackableLessons;
  const totalLessons = THEORY_TASK_COUNT;
  const validCompletedCount = completedLessons.filter(isTheoryTaskSlug).length;
  const progressPercent = totalLessons > 0 ? Math.round((validCompletedCount / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen py-12 ambient-glow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {catalogSource === 'fallback' ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900" data-testid="theory-source-status">
              {locale === 'ru'
                ? 'Показана локальная копия курса: серверный каталог временно недоступен. Это не означает, что материал обновлён.'
                : 'Showing the local course copy: the server catalogue is temporarily unavailable. This does not mean the material is fresh.'}
            </div>
          ) : (
            <p className="mb-4 text-[11px] text-neutral-500" data-testid="theory-catalog-version">
              {locale === 'ru' ? 'Версия каталога' : 'Catalogue version'}: {catalogVersion || '—'}
            </p>
          )}

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
            {mainLessons.map((lesson) => {
              const isReference = lesson.slug === 'start-here' || lesson.isTrackable === false;
              const isDone = !isReference && completedLessons.includes(lesson.slug);
              const title = locale === 'ru' ? lesson.titleRu : lesson.titleEn;
              const categoryLabel = locale === 'ru' ? lesson.categoryLabelRu : lesson.categoryLabelEn;
              const format = locale === 'ru' ? lesson.format : (lesson.formatEn || lesson.format);
              const timeLimit = locale === 'ru' ? lesson.timeLimit : (lesson.timeLimitEn || lesson.timeLimit);

              return (
                <BentoCard
                  key={lesson.slug}
                  data-testid={isReference ? 'theory-reference-card' : 'theory-task-card'}
                  variant="light"
                  className="flex flex-col justify-between group hover:border-[#0E1012] hover:shadow-lg transition-all relative cursor-pointer"
                >
                  <Link
                    href={`/theory/${lesson.slug}`}
                    className="absolute inset-0 z-0 rounded-3xl"
                    aria-label={title}
                  />

                  <div className="relative z-10 pointer-events-none">
                    <div className="flex items-center justify-between mb-4">
                      <PillBadge
                        variant={isDone ? 'mint' : 'slate'}
                        prefixHash
                        className="text-[10px]"
                      >
                        {categoryLabel}
                      </PillBadge>
                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        {isReference ? (
                          <span className="text-neutral-400 flex items-center gap-1 font-bold">
                            {t.referenceBadge}
                          </span>
                        ) : isDone ? (
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
                      {isReference
                        ? t.referenceBadge
                        : `${t.lessonPrefix} ${lesson.number < 10 ? `0${lesson.number}` : lesson.number}`}
                    </div>
                    <h2 className="text-lg font-bold text-[#0E1012] group-hover:text-emerald-700 transition-colors line-clamp-2 mb-3">
                      {title}
                    </h2>
                    <p className="text-xs text-neutral-500 mb-4 line-clamp-2">
                      {format}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-3 relative z-10">
                    <span className="text-xs font-medium text-neutral-400 line-clamp-1 pr-1 pointer-events-none">
                      <span className="font-semibold text-neutral-500">{t.timingLabel}</span> {timeLimit}
                    </span>
                    <Link
                      href={`/theory/${lesson.slug}`}
                      className="inline-flex items-center justify-center gap-1 text-xs font-bold text-[#0E1012] bg-[#D2F544] group-hover:bg-[#C4F22C] px-3.5 py-1.5 h-8 min-w-[125px] rounded-full transition-transform active:scale-95 shadow-sm shrink-0 whitespace-nowrap cursor-pointer z-10"
                    >
                      <span>{t.openGuide}</span> <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </BentoCard>
              );
            })}
          </div>

          {referenceLessons.length > 0 && (
            <section className="mt-16" aria-labelledby="theory-reference-title">
              <div className="mb-6">
                <h2 id="theory-reference-title" className="text-2xl font-black uppercase text-[#0E1012] tracking-tight">
                  {t.referenceTitle}
                </h2>
                <p className="mt-2 max-w-2xl text-sm text-neutral-500">
                  {t.referenceSubtitle}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {referenceLessons.map((lesson) => {
                  const title = locale === 'ru' ? lesson.titleRu : lesson.titleEn;
                  const format = locale === 'ru' ? lesson.format : (lesson.formatEn || lesson.format);
                  return (
                    <BentoCard
                      key={lesson.slug}
                      data-testid="theory-reference-card"
                      variant="sage"
                      className="relative flex flex-col justify-between gap-4"
                    >
                      <Link
                        href={`/theory/${lesson.slug}`}
                        className="absolute inset-0 z-0 rounded-3xl"
                        aria-label={title}
                      />
                      <div className="relative z-10 pointer-events-none">
                        <PillBadge variant="slate" prefixHash className="mb-3 text-[10px]">
                          {t.referenceBadge}
                        </PillBadge>
                        <h3 className="text-lg font-bold text-[#0E1012] mb-2">{title}</h3>
                        <p className="text-xs leading-relaxed text-neutral-600 line-clamp-2">{format}</p>
                      </div>
                      <div className="relative z-10 flex justify-end">
                        <Link
                          href={`/theory/${lesson.slug}`}
                          className="inline-flex items-center justify-center gap-1 text-xs font-bold text-[#0E1012] bg-[#D2F544] px-3.5 py-1.5 rounded-full"
                        >
                          {t.openGuide} <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </BentoCard>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
  );
}
