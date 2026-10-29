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
import { InteractiveLessonDrill } from '@/components/practice/InteractiveLessonDrill';
import { InteractiveTheoryExample } from '@/components/theory/InteractiveTheoryExample';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Lightbulb,
  FileCheck2,
  ShieldCheck,
  ChevronRight,
  ArrowRight,
  Sparkles,
  UserCheck,
  Volume2,
} from 'lucide-react';
import { sound } from '@/lib/sound';

interface LessonPageProps {
  params: Promise<{ slug: string }>;
}

const PRACTICE_LINKS: Record<string, string> = {
  'start-here': '/diagnostic',
  'rules-and-technicalities': '/test',
  'subscores-and-cat-engine': '/dashboard',
  'read-and-select': '/practice?drill=read-and-select',
  'listen-and-select': '/practice',
  'fill-in-the-blanks': '/practice?drill=fill-in-the-blanks',
  'read-and-complete': '/practice?drill=read-and-complete',
  'listen-and-type': '/practice?drill=listen-and-type',
  'read-aloud': '/practice/pronunciation',
  'interactive-reading': '/practice?drill=read-and-complete',
  'interactive-listening': '/practice?drill=listen-and-type',
  'write-about-photo': '/practice?drill=write-about-the-photo',
  'interactive-writing': '/practice?drill=writing-inspector',
  'writing-sample': '/practice?drill=writing-inspector',
  'speak-about-photo': '/practice?drill=speak-about-photo',
  'read-listen-speak': '/practice?drill=speak-about-photo',
  'speaking-sample': '/practice?drill=speaking-sample',
};

const THEORY_SOURCES: Record<string, string> = {
  'start-here': 'THEORY.MD · DET Preparation Tips & Timetable.pdf',
  'rules-and-technicalities': 'THEORY.MD · Full Test 3 Duolingo English Test.pdf',
  'subscores-and-cat-engine': 'Subscores explained.pdf · Copy of Production Score.pdf',
  'read-and-select': '20 Vocabulary Tests.pdf · HEDWIG-VOCABULARY.pdf',
  'listen-and-select': 'Test Your Vocabulary Through Listening.pdf',
  'fill-in-the-blanks': '5 C test (easy) x 84.pdf · 5 C test (hard) x 92.pdf',
  'read-and-complete': '5 C test (easy) x 84.pdf · 5 C test (hard) x 92.pdf',
  'listen-and-type': 'Difficult Dictation 20 Tests.pdf · Dictation Tips.pdf',
  'read-aloud': 'Read-aloud Tips and Examples.pdf',
  'interactive-reading': 'Full Test 3 Duolingo English Test.pdf · Full test 4.pdf',
  'interactive-listening': '6 interview listen (speaking).pdf · Full test 5.pdf',
  'write-about-photo': 'Copy of Writing - Descrive a picture.pdf · 2 writing image.pdf',
  'interactive-writing': '3 Writing Interview.pdf · Copy of Writing- Tips _ Argument .pdf',
  'writing-sample': '5 writing tips.pdf · Copy of Writing  - Recount.pdf',
  'speak-about-photo': '7 speaking describe image.pdf · Duolingo-short description of image_.pdf',
  'read-listen-speak': '9 speaking interview read.pdf · 8 speaking free response.pdf',
  'speaking-sample': 'Speaking - 90 seconds about a topic.pdf · speaking and writing template.pdf',
};

const INTERACTIVE_EXAMPLE_SLUGS = new Set([
  'read-and-select',
  'listen-and-select',
  'fill-in-the-blanks',
  'listen-and-type',
]);

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
          category: dLesson.category as LessonGuide['category'],
          categoryLabelRu: dLesson.category_label_ru,
          categoryLabelEn: dLesson.category_label_en,
          format: dLesson.format,
          formatEn: staticLesson?.formatEn,
          timeLimitEn: staticLesson?.timeLimitEn,
          scoring: dLesson.scoring,
          timeLimit: dLesson.time_limit,
          mentorIntro: staticLesson?.mentorIntro,
          rules: dLesson.rules,
          strategySteps: dLesson.strategy_steps,
          formula: dLesson.formula,
          proTips: staticLesson?.proTips,
          examples: dLesson.examples,
          pitfalls: dLesson.pitfalls,
          problemSolutions: staticLesson?.problemSolutions,
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
  const format = locale === 'ru' ? lesson.format : (lesson.formatEn || lesson.format);
  const timeLimit = locale === 'ru' ? lesson.timeLimit : (lesson.timeLimitEn || lesson.timeLimit);

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

            <div className="flex items-center gap-3">
              {isCompleted ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {t.studiedBadge}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-500 border border-neutral-200">
                  {t.inProgressBadge}
                </span>
              )}
              <PillBadge variant="mint" prefixHash>
                {categoryLabel}
              </PillBadge>
            </div>
          </div>

          {/* Title Block */}
          <div className="bg-[#111315] text-white p-8 sm:p-10 rounded-3xl border border-neutral-800 shadow-xl mb-8">
            <div className="flex items-center gap-2 text-xs font-mono text-[#D2F544] mb-3">
              <span>{t.lessonPrefix.toUpperCase()} {lesson.number < 10 ? `0${lesson.number}` : lesson.number} / {lessonsData.length}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {timeLimit}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-white mb-4">
              {title}
            </h1>
            <p className="text-sm text-neutral-400 max-w-2xl leading-relaxed">
              {format}
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-[11px] text-neutral-500">
                <span className="font-bold uppercase tracking-wider text-neutral-400">
                  {locale === 'ru' ? 'Материалы курса' : 'Course source'}:
                </span>{' '}
                theory/{THEORY_SOURCES[lesson.slug] || 'THEORY.MD'}
              </p>
              {PRACTICE_LINKS[lesson.slug] ? (
                <Link
                  href={PRACTICE_LINKS[lesson.slug]}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D2F544] px-4 py-2.5 text-xs font-black text-[#0C2418] hover:bg-[#C4F22C]"
                >
                  {locale === 'ru' ? 'Практиковать этот тип' : 'Practice this task'}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              ) : null}
            </div>
          </div>

          {/* Content Modules */}
          <div className="space-y-8">
            {/* 0. Human Mentor Introduction (if present) */}
            {lesson.mentorIntro && (
              <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-900 to-black text-white p-7 sm:p-9 rounded-3xl border border-neutral-700/80 shadow-2xl">
                <div className="flex items-center gap-2.5 mb-3 text-[#D2F544]">
                  <UserCheck className="w-5 h-5" />
                  <span className="text-xs font-mono uppercase font-bold tracking-wider">
                    {t.mentorIntroTitle}
                  </span>
                </div>
                <p className="text-sm sm:text-base text-neutral-200 leading-relaxed font-normal">
                  {lesson.mentorIntro}
                </p>
              </div>
            )}

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

            {/* 3. Golden Formula / Summary Framework (if present) */}
            {lesson.formula && (
              <BentoCard variant="lime">
                <div className="flex items-center gap-2.5 mb-3 text-[#0C2418]">
                  <FileCheck2 className="w-5 h-5" />
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    {lesson.category === 'rules' ? t.formulaRulesTitle : t.formulaTitle}
                  </h2>
                </div>
                <div className="bg-[#0C2418] text-[#D2F544] p-5 rounded-2xl font-mono text-sm leading-relaxed whitespace-pre-line shadow-inner">
                  {lesson.formula}
                </div>
              </BentoCard>
            )}

            {/* 3.05 Exam problem -> platform solution map */}
            {lesson.problemSolutions && lesson.problemSolutions.length > 0 && (
              <BentoCard variant="dark">
                <div className="flex items-center gap-2.5 mb-1 text-white">
                  <ShieldCheck className="w-5 h-5 text-[#D2F544]" />
                  <h2 className="text-xl font-black uppercase tracking-tight">
                    {locale === 'ru' ? 'Проблема экзамена → решение на платформе' : 'Exam problem → platform solution'}
                  </h2>
                </div>
                <p className="text-xs text-neutral-400 mb-5">
                  {locale === 'ru'
                    ? 'Каждая строка ведёт в конкретный тренажёр.'
                    : 'Each row opens the exact trainer.'}
                </p>
                <ul className="space-y-2">
                  {lesson.problemSolutions.map((item, index) => {
                    const content = (
                      <>
                        <span className="text-xs text-neutral-400 leading-relaxed">{item.problem}</span>
                        <span className="mt-1 block text-sm font-bold text-white leading-snug">{item.solution}</span>
                      </>
                    );
                    return (
                      <li key={index} className="rounded-2xl border border-neutral-800 bg-neutral-900/70">
                        {item.href ? (
                          <Link
                            href={item.href}
                            className="flex items-start justify-between gap-4 rounded-2xl p-4 transition-colors hover:border-[#D2F544]/50 hover:bg-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D2F544]"
                          >
                            <span className="min-w-0">{content}</span>
                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[#D2F544]" />
                          </Link>
                        ) : (
                          <div className="p-4">{content}</div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </BentoCard>
            )}

            {/* 3.1 Pro Tips for 130+ (if present) */}
            {lesson.proTips && lesson.proTips.length > 0 && (
              <BentoCard variant="light" className="border-l-4 border-l-emerald-500 bg-emerald-50/20">
                <div className="flex items-center gap-2.5 mb-4 text-emerald-950">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-xl font-bold uppercase tracking-tight">{t.proTipsTitle}</h2>
                </div>
                <ul className="space-y-3">
                  {lesson.proTips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-neutral-800 leading-relaxed">
                      <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        ★
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </BentoCard>
            )}

            {/* 4. Practical Examples */}
            {lesson.examples && lesson.examples.length > 0 && (
              <div className="space-y-4">
                {lesson.examples.map((ex, idx) => (
                  <BentoCard key={idx} variant="dark">
                    <div className="text-xs font-mono uppercase text-[#D2F544] font-bold mb-2">
                      {lesson.category === 'rules' ? t.exampleScenarioTitle : t.exampleTitle} #{idx + 1}
                    </div>
                    {INTERACTIVE_EXAMPLE_SLUGS.has(lesson.slug) ? (
                      <InteractiveTheoryExample lessonSlug={lesson.slug} example={ex} />
                    ) : (
                      <>
                        {ex.question && (
                          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4 font-mono text-sm text-neutral-200 leading-relaxed whitespace-pre-line">
                            {ex.question}
                          </div>
                        )}
                        {ex.audioPrompt && (
                          <button
                            type="button"
                            onClick={() => void sound.speakEnglish(ex.audioPrompt || '')}
                            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D2F544]/40 bg-[#D2F544]/10 px-4 py-2 text-xs font-bold text-[#D2F544] hover:bg-[#D2F544]/20"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                            Прослушать реальный пример
                          </button>
                        )}
                        {ex.sampleText && (
                          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-4 text-xs font-mono text-neutral-300">
                            {ex.sampleText}
                          </div>
                        )}
                        {lesson.slug === 'read-aloud' && ex.question ? (
                          <Link
                            href={`/practice/pronunciation?sentence=${encodeURIComponent(
                              (ex.question.match(/'([^']+)'/) || [])[1] || ex.question
                            )}`}
                            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#D2F544]/40 bg-[#D2F544]/10 px-4 py-2 text-xs font-bold text-[#D2F544] hover:bg-[#D2F544]/20"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                            {locale === 'ru' ? 'Прочитать этот текст вслух' : 'Read this text aloud'}
                          </Link>
                        ) : null}
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
                      </>
                    )}
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

            {/* Interactive Dynamic Drill (for practical test modules) */}
            {lesson.category !== 'rules' && (
              <InteractiveLessonDrill
                lessonSlug={lesson.slug}
                category={lesson.category}
                onDrillCompleted={() => {
                  if (!isCompleted) {
                    toggleLessonCompleted(lesson.slug);
                  }
                }}
              />
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
            <div className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t border-neutral-200">
              {prevLesson ? (
                <Link
                  href={`/theory/${prevLesson.slug}`}
                  className="flex items-center justify-center sm:justify-start gap-2 px-4 py-3 sm:py-2 rounded-2xl bg-white border border-neutral-200/90 hover:border-black text-xs font-bold text-neutral-700 hover:text-black transition-all shadow-sm active:scale-98 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>{t.prevLesson}</span>
                </Link>
              ) : <div className="hidden sm:block" />}

              {nextLesson && (
                <Link
                  href={`/theory/${nextLesson.slug}`}
                  className="flex items-center justify-center sm:justify-end gap-2 px-5 py-3 sm:py-2.5 rounded-2xl bg-[#D2F544] hover:bg-[#C4F22C] text-[#0C2418] text-xs font-black transition-all shadow-sm active:scale-98 cursor-pointer border border-[#C4F22C]"
                >
                  <span>{t.nextLesson}</span>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthRequiredGuard>
  );
}
