'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CalendarRange,
  Clock,
  Info,
  Mic,
  RefreshCw,
  Sparkles,
  UserPlus,
  Users,
  Zap,
} from 'lucide-react';
import {
  api,
  AnalyticsBucket,
  AnalyticsFeature,
  AnalyticsFeatures,
  AnalyticsOverview,
  AnalyticsRange,
  AnalyticsRetention,
  AnalyticsSeries,
} from '@/lib/api';
import { useSettingsStore } from '@/store/useSettingsStore';
import { Locale } from '@/lib/translations';

type Tone = 'forest' | 'lime' | 'amber';

interface AnalyticsData {
  overview: AnalyticsOverview;
  users: AnalyticsSeries;
  active: AnalyticsSeries;
  mocks: AnalyticsSeries;
  evaluations: AnalyticsSeries;
  features: AnalyticsFeatures;
  retention: AnalyticsRetention;
}

const RANGES: AnalyticsRange[] = ['24h', '7d', '30d', '90d'];

function copyFor(locale: Locale) {
  const ru = locale === 'ru';
  return {
    eyebrow: 'Аналитика платформы',
    title: ru ? 'Что происходит в академии' : 'What is happening in the academy',
    subtitle: ru
      ? 'Агрегированные показатели без персональных данных. Все времена — UTC.'
      : 'Aggregated metrics with no personal data. All times are UTC.',
    range: ru ? 'Период' : 'Range',
    bucket: ru ? 'Детализация' : 'Bucket',
    hour: ru ? 'По часам' : 'Hourly',
    day: ru ? 'По дням' : 'Daily',
    refresh: ru ? 'Обновить' : 'Refresh',
    refreshing: ru ? 'Обновление…' : 'Refreshing…',
    loading: ru ? 'Собираем аналитику…' : 'Loading analytics…',
    errorTitle: ru ? 'Не удалось загрузить аналитику' : 'Analytics could not be loaded',
    errorBody: ru
      ? 'Сервер не ответил на запрос агрегатов. Повторите попытку через несколько секунд.'
      : 'The aggregation request failed. Try again in a few seconds.',
    retry: ru ? 'Повторить' : 'Try again',
    emptyTitle: ru ? 'Пока нет данных за этот период' : 'No data for this period yet',
    emptyBody: ru
      ? 'Выберите другой период или дождитесь первых учебных событий.'
      : 'Pick another range or wait for the first learning events.',
    noPoints: ru ? 'Нет данных за период' : 'No data in this range',
    showData: ru ? 'Показать данные таблицей' : 'Show data as a table',
    metric: ru ? 'Показатель' : 'Metric',
    value: ru ? 'Значение' : 'Value',
    featuresTitle: ru ? 'Где студенты проводят время' : 'Where students spend their time',
    featuresSubtitle: ru
      ? 'Топ действий по учебным событиям, практическим попыткам и AI-оценкам.'
      : 'Top actions from learning events, practice attempts and AI evaluations.',
    featuresEmpty: ru ? 'События ещё не записаны' : 'No events recorded yet',
    sourceLearning: ru ? 'Событие' : 'Event',
    sourcePractice: ru ? 'Практика' : 'Practice',
    sourceEvaluation: ru ? 'Оценка' : 'Evaluation',
    retentionTitle: ru ? 'Удержание по когортам' : 'Cohort retention',
    retentionSubtitle: ru
      ? 'Доля студентов из когорты регистрации, вернувшихся на 1-й, 7-й и 30-й день.'
      : 'Share of each signup cohort that returned on day 1, 7 and 30.',
    retentionEmpty: ru ? 'Когорт пока нет' : 'No cohorts yet',
    cohort: ru ? 'Когорта' : 'Cohort',
    cohortSize: ru ? 'Размер' : 'Size',
    notMeasurable: ru ? 'Ещё нельзя измерить' : 'Not measurable yet',
    totalUsers: ru ? 'Всего студентов' : 'Total users',
    allTime: ru ? 'За всё время' : 'All time',
    newUsers: ru ? 'Новые студенты' : 'New users',
    activeNow: ru ? 'Активность сейчас' : 'Active now',
    dau: ru ? 'DAU · сегодня' : 'DAU · today',
    wau: ru ? 'WAU · 7 дней' : 'WAU · 7 days',
    mau: ru ? 'MAU · 30 дней' : 'MAU · 30 days',
    sessions: ru ? 'Сессии тестов' : 'Test sessions',
    sessionsHint: ru ? 'Создано за период' : 'Created in range',
    mocks: ru ? 'Мок-тесты' : 'Completed mocks',
    mocksHint: ru ? 'Завершены за период' : 'Completed in range',
    evaluations: ru ? 'AI-оценки' : 'AI evaluations',
    speaking: ru ? 'говорение' : 'speaking',
    writing: ru ? 'письмо' : 'writing',
    tts: ru ? 'TTS-синтезы' : 'TTS calls',
    ttsHint: ru ? 'Только новые синтезы' : 'New syntheses only',
    xp: ru ? 'Начислено XP' : 'XP awarded',
    xpHint: ru ? 'За период' : 'In range',
    errors: ru ? 'Ошибки пайплайна' : 'Pipeline errors',
    errorsHint: ru ? 'Неудачные оценки и таймауты' : 'Failed evaluations and timeouts',
    usersChart: ru ? 'Рост базы' : 'User growth',
    usersChartHint: ru ? 'Накопительно, включая аккаунты до периода' : 'Cumulative, including accounts from before the range',
    activeChart: ru ? 'Активные студенты' : 'Active students',
    activeChartHint: ru ? 'Уникальные студенты с учебной активностью' : 'Unique students with learning activity',
    mocksChart: ru ? 'Пробные тесты' : 'Mock tests',
    mocksChartHint: ru ? 'Завершённые полные мок-тесты' : 'Completed full mock tests',
    aiChart: ru ? 'AI-оценки' : 'AI evaluations',
    aiChartHint: ru ? 'Оценки письма и речи за период' : 'Writing and speaking evaluations in range',
    last: ru ? 'последнее значение' : 'last value',
    total: ru ? 'всего' : 'total',
    limitations: ru
      ? 'Ограничения данных: отдельной таблицы просмотров страниц пока нет, поэтому «популярные разделы» выводятся из learning_events, practice_attempts и evaluations. TTS учитывает только новые синтезы (кэш бесплатен). Ошибки — это FAILED-оценки, отказы по дедлайну и таймауты этапов.'
      : 'Data limitations: there is no page-view table yet, so popular sections are derived from learning_events, practice_attempts and evaluations. TTS counts only new syntheses (cache hits are free). Errors are FAILED evaluations, deadline rejections and stage timeouts.',
    note: ru ? 'Примечание' : 'Note',
    rangeLabels: {
      '24h': ru ? '24 часа' : '24 hours',
      '7d': ru ? '7 дней' : '7 days',
      '30d': ru ? '30 дней' : '30 days',
      '90d': ru ? '90 дней' : '90 days',
    } as Record<AnalyticsRange, string>,
    featureLabels: {
      lesson_completed: ru ? 'Завершён урок теории' : 'Theory lesson completed',
      mock_completed: ru ? 'Завершён мок-тест' : 'Mock test completed',
      practice_submitted: ru ? 'Практика сдана' : 'Practice submitted',
      typing_submitted: ru ? 'Тест печати сдан' : 'Typing test submitted',
      srs_reviewed: ru ? 'Карточка SRS повторена' : 'SRS card reviewed',
      mock_test: ru ? 'Мок-тест' : 'Mock test',
    } as Record<string, string>,
  };
}

const num = (value: number, locale: Locale) =>
  new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US').format(value);

const pct = (value: number, locale: Locale) =>
  `${new Intl.NumberFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    maximumFractionDigits: 1,
  }).format(value)}%`;

function formatBucketLabel(t: string, bucket: AnalyticsBucket, locale: Locale) {
  const date = new Date(t.length === 10 ? `${t}T00:00:00Z` : t);
  if (Number.isNaN(date.getTime())) return t;
  const formatter = new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
    timeZone: 'UTC',
    ...(bucket === 'hour'
      ? { hour: '2-digit', minute: '2-digit', hour12: false }
      : { day: '2-digit', month: 'short' }),
  });
  return formatter.format(date);
}

function niceMax(value: number) {
  if (value <= 0) return 4;
  const padded = value * 1.15;
  const magnitude = Math.pow(10, Math.floor(Math.log10(padded)));
  const step = magnitude / 2;
  return Math.max(4, Math.ceil(padded / step) * step);
}

function TimeChart({
  points,
  bucket,
  tone,
  locale,
  title,
  subtitle,
  headline,
  headlineLabel,
}: {
  points: { t: string; value: number }[];
  bucket: AnalyticsBucket;
  tone: Tone;
  locale: Locale;
  title: string;
  subtitle: string;
  headline: string;
  headlineLabel: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const width = 520;
  const height = 260;
  const padding = { top: 18, right: 14, bottom: 30, left: 42 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const max = niceMax(Math.max(0, ...points.map((point) => point.value)));
  const baseline = padding.top + innerHeight;
  const xAt = (index: number) =>
    points.length <= 1
      ? padding.left + innerWidth / 2
      : padding.left + (index * innerWidth) / (points.length - 1);
  const yAt = (value: number) =>
    padding.top + innerHeight - (Math.max(0, value) / max) * innerHeight;

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${xAt(index).toFixed(2)},${yAt(point.value).toFixed(2)}`)
    .join(' ');
  const areaPath =
    points.length > 0
      ? `${linePath} L${xAt(points.length - 1).toFixed(2)},${baseline} L${xAt(0).toFixed(2)},${baseline} Z`
      : '';

  const colors = {
    forest: { stroke: '#0C2418', fill: 'rgba(12, 36, 24, 0.14)', accent: '#0C2418' },
    lime: { stroke: '#86a80c', fill: 'rgba(210, 245, 68, 0.35)', accent: '#d2f544' },
    amber: { stroke: '#b45309', fill: 'rgba(245, 158, 11, 0.16)', accent: '#f59e0b' },
  }[tone];

  const gradientId = React.useId().replace(/:/g, '');
  const hasData = points.some((point) => point.value > 0);
  const labelIndices = points.length > 1 ? [0, Math.floor((points.length - 1) / 2), points.length - 1] : [0];

  return (
    <figure className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-5 sm:p-6 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <figcaption className="text-sm font-black text-[#0E1012]">{title}</figcaption>
          <p className="mt-0.5 text-[11px] text-neutral-500 leading-relaxed">{subtitle}</p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-2xl font-black tabular-nums text-[#0E1012]">{headline}</div>
          <div className="text-[10px] font-bold uppercase tracking-wide text-neutral-400">
            {headlineLabel}
          </div>
        </div>
      </div>

      {hasData ? (
        <div className="relative mt-3">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto"
            role="img"
            aria-label={`${title}. ${headlineLabel}: ${headline}. ${
              points.length
            } ${
              bucket === 'hour'
                ? locale === 'ru'
                  ? 'часов'
                  : 'hours'
                : locale === 'ru'
                ? 'дней'
                : 'days'
            }.`}
            onMouseLeave={() => setHover(null)}
          >
            <title>
              {title}: {headline}
            </title>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colors.fill} />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>

            {[0, 0.5, 1].map((fraction) => {
              const y = padding.top + innerHeight * (1 - fraction);
              return (
                <g key={fraction}>
                  <line
                    x1={padding.left}
                    x2={width - padding.right}
                    y1={y}
                    y2={y}
                    stroke="#E5E7EB"
                    strokeDasharray={fraction === 0 ? undefined : '3 5'}
                  />
                  <text x={padding.left - 8} y={y + 4} textAnchor="end" fontSize="10" fill="#737373">
                    {num(Math.round(max * fraction), locale)}
                  </text>
                </g>
              );
            })}

            {areaPath && <path d={areaPath} fill={`url(#${gradientId})`} />}
            <path
              d={linePath}
              fill="none"
              stroke={colors.stroke}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {points.length <= 40 &&
              points.map((point, index) => (
                <g
                  key={point.t}
                  tabIndex={0}
                  role="img"
                  aria-label={`${formatBucketLabel(point.t, bucket, locale)}: ${num(point.value, locale)}`}
                  onMouseEnter={() => setHover(index)}
                  onFocus={() => setHover(index)}
                  onBlur={() => setHover(null)}
                  className="outline-none"
                >
                  <title>
                    {formatBucketLabel(point.t, bucket, locale)}: {num(point.value, locale)}
                  </title>
                  <circle
                    cx={xAt(index)}
                    cy={yAt(point.value)}
                    r={hover === index ? 5 : 2.5}
                    fill="#fff"
                    stroke={colors.stroke}
                    strokeWidth={2}
                  />
                </g>
              ))}

            {hover !== null && points[hover] && (
              <g pointerEvents="none">
                <line
                  x1={xAt(hover)}
                  x2={xAt(hover)}
                  y1={padding.top}
                  y2={baseline}
                  stroke="#0E1012"
                  strokeOpacity={0.25}
                  strokeDasharray="3 3"
                />
                <rect
                  x={Math.min(Math.max(xAt(hover) - 54, padding.left), width - padding.right - 108)}
                  y={Math.max(yAt(points[hover].value) - 38, 4)}
                  width={108}
                  height={26}
                  rx={8}
                  fill="#0E1012"
                  fillOpacity={0.94}
                />
                <text
                  x={Math.min(Math.max(xAt(hover), padding.left + 54), width - padding.right - 54)}
                  y={Math.max(yAt(points[hover].value) - 20, 22)}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#fff"
                >
                  {num(points[hover].value, locale)} · {formatBucketLabel(points[hover].t, bucket, locale)}
                </text>
              </g>
            )}

            {labelIndices.map((index) => (
              <text
                key={`label-${index}`}
                x={xAt(index)}
                y={height - 8}
                textAnchor={index === 0 ? 'start' : index === points.length - 1 ? 'end' : 'middle'}
                fontSize="10"
                fill="#737373"
              >
                {formatBucketLabel(points[index].t, bucket, locale)}
              </text>
            ))}
          </svg>
        </div>
      ) : (
        <div className="mt-3 flex h-[190px] items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
          {copyFor(locale).noPoints}
        </div>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer text-[11px] font-bold text-neutral-500 hover:text-[#0E1012] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86a80c] rounded-md w-fit">
          {copyFor(locale).showData}
        </summary>
        <div className="mt-2 max-h-44 overflow-auto rounded-xl border border-neutral-200">
          <table className="w-full text-left text-[11px]">
            <caption className="sr-only">{title}</caption>
            <thead className="sticky top-0 bg-neutral-50 text-neutral-500">
              <tr>
                <th scope="col" className="px-3 py-1.5 font-bold">
                  {copyFor(locale).metric}
                </th>
                <th scope="col" className="px-3 py-1.5 font-bold text-right">
                  {copyFor(locale).value}
                </th>
              </tr>
            </thead>
            <tbody>
              {points.map((point) => (
                <tr key={point.t} className="border-t border-neutral-100">
                  <td className="px-3 py-1.5 text-neutral-600">
                    {formatBucketLabel(point.t, bucket, locale)}
                  </td>
                  <td className="px-3 py-1.5 text-right font-bold tabular-nums text-[#0E1012]">
                    {num(point.value, locale)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
  accent,
  children,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: React.ReactNode;
  accent?: 'dark' | 'error';
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`rounded-3xl border p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 ${
        accent === 'dark'
          ? 'bg-[#0E1012] border-neutral-800 text-white'
          : 'bg-white border-neutral-200 text-[#0E1012]'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[10px] font-black uppercase tracking-[0.12em] ${
            accent === 'dark' ? 'text-neutral-400' : 'text-neutral-500'
          }`}
        >
          {label}
        </span>
        <span
          className={`inline-flex h-7 w-7 items-center justify-center rounded-xl ${
            accent === 'dark'
              ? 'bg-[#D2F544] text-[#0C2418]'
              : accent === 'error'
              ? 'bg-amber-50 text-amber-700'
              : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-black tabular-nums tracking-tight">{value}</div>
      {hint && (
        <div className={`mt-1 text-[11px] ${accent === 'dark' ? 'text-neutral-400' : 'text-neutral-500'}`}>
          {hint}
        </div>
      )}
      {children}
    </div>
  );
}

function FeatureBars({
  features,
  locale,
  labels,
}: {
  features: AnalyticsFeature[];
  locale: Locale;
  labels: ReturnType<typeof copyFor>;
}) {
  if (features.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-xs text-neutral-500">
        {labels.featuresEmpty}
      </div>
    );
  }
  const max = Math.max(...features.map((feature) => feature.count), 1);
  const sourceLabel = (source: AnalyticsFeature['source']) =>
    source === 'practice_attempts'
      ? labels.sourcePractice
      : source === 'evaluations'
      ? labels.sourceEvaluation
      : labels.sourceLearning;

  return (
    <ol className="mt-4 space-y-3">
      {features.map((feature, index) => {
        const label = labels.featureLabels[feature.key] || feature.key;
        return (
          <li key={`${feature.source}-${feature.key}`} className="group">
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="flex min-w-0 items-baseline gap-2">
                <span className="w-4 shrink-0 text-right font-mono text-[10px] text-neutral-400">
                  {index + 1}
                </span>
                <span className="truncate font-bold text-[#0E1012]">{label}</span>
                <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-neutral-500">
                  {sourceLabel(feature.source)}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[11px] font-bold tabular-nums text-neutral-600">
                {num(feature.count, locale)}
              </span>
            </div>
            <div
              className="mt-1.5 ml-6 h-2 overflow-hidden rounded-full bg-neutral-100"
              role="img"
              aria-label={`${label}: ${feature.count}. ${feature.users} ${
                locale === 'ru' ? 'студентов' : 'students'
              }.`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  index === 0 ? 'bg-[#0E1012]' : index < 3 ? 'bg-[#86a80c]' : 'bg-neutral-400'
                }`}
                style={{ width: `${Math.max((feature.count / max) * 100, 3)}%` }}
              />
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function RetentionTable({
  retention,
  locale,
  labels,
}: {
  retention: AnalyticsRetention;
  locale: Locale;
  labels: ReturnType<typeof copyFor>;
}) {
  const [expanded, setExpanded] = useState(false);
  const cohorts = expanded ? retention.cohorts : retention.cohorts.slice(-10);
  const hidden = retention.cohorts.length - cohorts.length;

  const cell = (rate: number | null, users: number, size: number) => {
    if (rate === null) {
      return (
        <span className="text-neutral-300" title={labels.notMeasurable} aria-label={labels.notMeasurable}>
          —
        </span>
      );
    }
    const intensity = Math.min(0.92, 0.08 + (rate / 100) * 0.84);
    return (
      <span
        className="inline-flex min-w-[54px] items-center justify-center rounded-lg px-2 py-1 font-mono text-[11px] font-bold tabular-nums"
        style={{
          backgroundColor: `rgba(12, 36, 24, ${intensity})`,
          color: intensity > 0.55 ? '#F8FAF3' : '#0C2418',
        }}
        title={`${users} / ${size}`}
        aria-label={`${pct(rate, locale)} (${users} / ${size})`}
      >
        {pct(rate, locale)}
      </span>
    );
  };

  if (retention.cohorts.length === 0) {
    return (
      <div className="mt-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-8 text-center text-xs text-neutral-500">
        {labels.retentionEmpty}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-separate border-spacing-y-1 text-left text-xs">
          <caption className="sr-only">{labels.retentionTitle}</caption>
          <thead>
            <tr className="text-[10px] font-black uppercase tracking-wide text-neutral-500">
              <th scope="col" className="px-3 py-1.5">
                {labels.cohort}
              </th>
              <th scope="col" className="px-3 py-1.5 text-right">
                {labels.cohortSize}
              </th>
              <th scope="col" className="px-3 py-1.5 text-center">
                D1
              </th>
              <th scope="col" className="px-3 py-1.5 text-center">
                D7
              </th>
              <th scope="col" className="px-3 py-1.5 text-center">
                D30
              </th>
            </tr>
          </thead>
          <tbody>
            {cohorts.map((cohort) => (
              <tr key={cohort.cohort} className="bg-neutral-50/70">
                <th scope="row" className="rounded-l-xl px-3 py-2 font-bold text-[#0E1012]">
                  {formatBucketLabel(cohort.cohort, 'day', locale)}
                </th>
                <td className="px-3 py-2 text-right font-mono tabular-nums text-neutral-600">
                  {num(cohort.size, locale)}
                </td>
                <td className="px-1 py-1.5 text-center">{cell(cohort.d1, cohort.d1Users, cohort.size)}</td>
                <td className="px-1 py-1.5 text-center">{cell(cohort.d7, cohort.d7Users, cohort.size)}</td>
                <td className="rounded-r-xl px-1 py-1.5 text-center">
                  {cell(cohort.d30, cohort.d30Users, cohort.size)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {retention.cohorts.length > 10 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 rounded-xl border border-neutral-200 px-3 py-1.5 text-[11px] font-bold text-neutral-600 hover:border-neutral-400 hover:text-[#0E1012] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86a80c]"
        >
          {expanded
            ? locale === 'ru'
              ? 'Показать последние 10'
              : 'Show latest 10'
            : locale === 'ru'
            ? `Показать все (${hidden} раньше)`
            : `Show all (${hidden} earlier)`}
        </button>
      )}
    </div>
  );
}

export const AdminAnalyticsDashboard: React.FC = () => {
  const locale = useSettingsStore((state) => state.locale);
  const labels = useMemo(() => copyFor(locale), [locale]);
  const [range, setRange] = useState<AnalyticsRange>('7d');
  const [bucket, setBucket] = useState<AnalyticsBucket>('day');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([
      api.getAdminAnalyticsOverview(range, controller.signal),
      api.getAdminAnalyticsTimeseries('users', range, bucket, controller.signal),
      api.getAdminAnalyticsTimeseries('active', range, bucket, controller.signal),
      api.getAdminAnalyticsTimeseries('mocks', range, bucket, controller.signal),
      api.getAdminAnalyticsTimeseries('evaluations', range, bucket, controller.signal),
      api.getAdminAnalyticsFeatures(range, controller.signal),
      api.getAdminAnalyticsRetention(range, controller.signal),
    ])
      .then(([overview, users, active, mocks, evaluations, features, retention]) => {
        if (cancelled) return;
        setData({ overview, users, active, mocks, evaluations, features, retention });
      })
      .catch((err: unknown) => {
        if (cancelled || (err instanceof DOMException && err.name === 'AbortError')) return;
        setError(err instanceof Error ? err.message : 'analytics request failed');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [range, bucket, reload]);

  const selectRange = (next: AnalyticsRange) => {
    setRange(next);
    if (next === '24h' && bucket === 'day') {
      setBucket('hour');
    }
    if ((next === '30d' || next === '90d') && bucket === 'hour') {
      setBucket('day');
    }
  };

  const hasData =
    data !== null &&
    (data.overview.totalUsers > 0 ||
      data.overview.sessions > 0 ||
      data.overview.evaluations > 0 ||
      data.overview.completedMocks > 0);

  const lastSeriesValue = (series: AnalyticsSeries) =>
    series.points.length ? series.points[series.points.length - 1].value : 0;

  const rangeLabel = data
    ? `${formatBucketLabel(
        data.overview.from.slice(0, 10),
        'day',
        locale
      )} — ${formatBucketLabel(data.overview.to.slice(0, 10), 'day', locale)}`
    : labels.loading;

  const generatedLabel = data
    ? new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(new Date(data.overview.generatedAt))
    : '';

  return (
    <section className="space-y-5" aria-labelledby="analytics-title" aria-busy={loading}>
      <div className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#6b8c0b]">
              <BarChart3 className="h-3.5 w-3.5" aria-hidden />
              <span>{labels.eyebrow}</span>
            </div>
            <h2 id="analytics-title" className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-[#0E1012]">
              {labels.title}
            </h2>
            <p className="mt-1.5 text-xs leading-relaxed text-neutral-500">{labels.subtitle}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-neutral-500">
                {labels.range}
              </div>
              <div
                role="group"
                aria-label={labels.range}
                className="inline-flex flex-wrap gap-1 rounded-2xl bg-neutral-100 p-1"
              >
                {RANGES.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => selectRange(value)}
                    aria-pressed={range === value}
                    className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86a80c] ${
                      range === value
                        ? 'bg-[#0E1012] text-[#D2F544]'
                        : 'text-neutral-600 hover:bg-white hover:text-[#0E1012]'
                    }`}
                  >
                    {labels.rangeLabels[value]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-1.5 text-[10px] font-black uppercase tracking-wide text-neutral-500">
                {labels.bucket}
              </div>
              <div
                role="group"
                aria-label={labels.bucket}
                className="inline-flex gap-1 rounded-2xl bg-neutral-100 p-1"
              >
                {(['hour', 'day'] as AnalyticsBucket[]).map((value) => {
                  const disabled = value === 'hour' && (range === '30d' || range === '90d');
                  return (
                    <button
                      key={value}
                      type="button"
                      disabled={disabled}
                      onClick={() => setBucket(value)}
                      aria-pressed={bucket === value}
                      className={`rounded-xl px-3 py-1.5 text-[11px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86a80c] disabled:cursor-not-allowed disabled:opacity-40 ${
                        bucket === value
                          ? 'bg-white text-[#0E1012] shadow-sm'
                          : 'text-neutral-600 hover:bg-white hover:text-[#0E1012]'
                      }`}
                    >
                      {value === 'hour' ? labels.hour : labels.day}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setReload((value) => value + 1)}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-3.5 py-2 text-[11px] font-bold text-neutral-700 hover:border-neutral-400 hover:text-[#0E1012] disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86a80c]"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} aria-hidden />
              {loading ? labels.refreshing : labels.refresh}
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-neutral-500">
          <span className="inline-flex items-center gap-1.5">
            <CalendarRange className="h-3 w-3" aria-hidden />
            {rangeLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#86a80c]" aria-hidden />
            {locale === 'ru' ? 'Обновлено' : 'Updated'} {generatedLabel} UTC
          </span>
        </div>
      </div>

      <div aria-live="polite" className="sr-only" role="status">
        {loading ? labels.loading : error ? labels.errorTitle : ''}
      </div>

      {error && !data && (
        <div className="rounded-3xl border border-amber-300 bg-amber-50 p-6 text-[#0E1012]">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-amber-100 p-2 text-amber-700">
              <AlertTriangle className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-black">{labels.errorTitle}</h3>
              <p className="mt-1 text-xs text-neutral-600">{labels.errorBody}</p>
              <button
                type="button"
                onClick={() => setReload((value) => value + 1)}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#0E1012] px-3.5 py-2 text-[11px] font-bold text-[#D2F544] hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86a80c]"
              >
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                {labels.retry}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && data && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-[11px] text-amber-900">
          <span className="inline-flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            {labels.errorBody}
          </span>
          <button
            type="button"
            onClick={() => setReload((value) => value + 1)}
            className="shrink-0 rounded-lg border border-amber-300 px-2.5 py-1 font-bold hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#86a80c]"
          >
            {labels.retry}
          </button>
        </div>
      )}

      {!data && loading && (
        <div className="space-y-4" aria-hidden>
          <div className="grid gap-3 md:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-32 animate-pulse rounded-3xl border border-neutral-200 bg-white" />
            ))}
          </div>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-5">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="h-28 animate-pulse rounded-3xl border border-neutral-200 bg-white" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div key={item} className="h-72 animate-pulse rounded-3xl border border-neutral-200 bg-white" />
            ))}
          </div>
        </div>
      )}

      {data && (
        <>
          {!hasData ? (
            <div className="rounded-3xl border border-dashed border-neutral-300 bg-white p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-500">
                <Activity className="h-6 w-6" aria-hidden />
              </div>
              <h3 className="mt-3 text-sm font-black text-[#0E1012]">{labels.emptyTitle}</h3>
              <p className="mx-auto mt-1 max-w-md text-xs text-neutral-500">{labels.emptyBody}</p>
            </div>
          ) : (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                <KpiCard
                  label={labels.totalUsers}
                  value={num(data.overview.totalUsers, locale)}
                  hint={labels.allTime}
                  accent="dark"
                  icon={<Users className="h-4 w-4" aria-hidden />}
                >
                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center">
                    {[
                      { key: 'dau', label: labels.dau, value: data.overview.activeUsers.dau },
                      { key: 'wau', label: labels.wau, value: data.overview.activeUsers.wau },
                      { key: 'mau', label: labels.mau, value: data.overview.activeUsers.mau },
                    ].map((item) => (
                      <div key={item.key}>
                        <dt className="text-[9px] font-bold uppercase tracking-wide text-neutral-500">
                          {item.label}
                        </dt>
                        <dd className="mt-0.5 text-lg font-black tabular-nums text-[#D2F544]">
                          {num(item.value, locale)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </KpiCard>

                <KpiCard
                  label={labels.newUsers}
                  value={num(data.overview.newUsers, locale)}
                  hint={labels.rangeLabels[range]}
                  icon={<UserPlus className="h-4 w-4" aria-hidden />}
                />
                <KpiCard
                  label={labels.sessions}
                  value={num(data.overview.sessions, locale)}
                  hint={labels.sessionsHint}
                  icon={<Clock className="h-4 w-4" aria-hidden />}
                />
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <KpiCard
                  label={labels.mocks}
                  value={num(data.overview.completedMocks, locale)}
                  hint={labels.mocksHint}
                  icon={<BarChart3 className="h-4 w-4" aria-hidden />}
                />
                <KpiCard
                  label={labels.evaluations}
                  value={num(data.overview.evaluations, locale)}
                  hint={`${num(data.overview.speakingEvaluations, locale)} ${labels.speaking} · ${num(
                    data.overview.writingEvaluations,
                    locale
                  )} ${labels.writing}`}
                  icon={<Sparkles className="h-4 w-4" aria-hidden />}
                />
                <KpiCard
                  label={labels.tts}
                  value={num(data.overview.ttsCalls, locale)}
                  hint={labels.ttsHint}
                  icon={<Mic className="h-4 w-4" aria-hidden />}
                />
                <KpiCard
                  label={labels.xp}
                  value={num(data.overview.xpAwarded, locale)}
                  hint={labels.xpHint}
                  icon={<Zap className="h-4 w-4" aria-hidden />}
                />
                <KpiCard
                  label={labels.errors}
                  value={num(data.overview.errorCount, locale)}
                  hint={labels.errorsHint}
                  accent={data.overview.errorCount > 0 ? 'error' : undefined}
                  icon={<AlertTriangle className="h-4 w-4" aria-hidden />}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                <TimeChart
                  points={data.users.points}
                  bucket={bucket}
                  tone="lime"
                  locale={locale}
                  title={labels.usersChart}
                  subtitle={labels.usersChartHint}
                  headline={num(data.users.total, locale)}
                  headlineLabel={labels.total}
                />
                <TimeChart
                  points={data.active.points}
                  bucket={bucket}
                  tone="forest"
                  locale={locale}
                  title={labels.activeChart}
                  subtitle={labels.activeChartHint}
                  headline={num(lastSeriesValue(data.active), locale)}
                  headlineLabel={labels.last}
                />
                <TimeChart
                  points={data.mocks.points}
                  bucket={bucket}
                  tone="forest"
                  locale={locale}
                  title={labels.mocksChart}
                  subtitle={labels.mocksChartHint}
                  headline={num(data.mocks.total, locale)}
                  headlineLabel={labels.total}
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-5">
                <div className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm lg:col-span-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-[#0E1012]">{labels.featuresTitle}</h3>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">
                        {labels.featuresSubtitle}
                      </p>
                    </div>
                    <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-neutral-500">
                      {labels.rangeLabels[range]}
                    </span>
                  </div>
                  <FeatureBars features={data.features.items} locale={locale} labels={labels} />
                </div>

                <div className="lg:col-span-2">
                  <TimeChart
                    points={data.evaluations.points}
                    bucket={bucket}
                    tone="amber"
                    locale={locale}
                    title={labels.aiChart}
                    subtitle={labels.aiChartHint}
                    headline={num(data.evaluations.total, locale)}
                    headlineLabel={labels.total}
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-black text-[#0E1012]">{labels.retentionTitle}</h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-neutral-500">
                      {labels.retentionSubtitle}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[#F1FCD6] px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-[#4d6505]">
                    D1 · D7 · D30
                  </span>
                </div>
                <RetentionTable retention={data.retention} locale={locale} labels={labels} />
              </div>
            </>
          )}

          <div className="flex items-start gap-2 rounded-2xl border border-neutral-200 bg-white/70 p-4 text-[11px] leading-relaxed text-neutral-500">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <p>
              <span className="font-bold text-neutral-700">{labels.note}: </span>
              {labels.limitations}
            </p>
          </div>
        </>
      )}
    </section>
  );
};
