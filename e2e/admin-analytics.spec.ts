import { test, expect, Page, Route } from '@playwright/test';

type Range = '24h' | '7d' | '30d' | '90d';
type Bucket = 'hour' | 'day';

const NEW_USERS: Record<Range, number> = { '24h': 18, '7d': 120, '30d': 480, '90d': 1240 };
const DAYS: Record<Range, number> = { '24h': 1, '7d': 7, '30d': 30, '90d': 90 };

const json = async (route: Route, status: number, body: unknown) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
    },
  });
};

function pointsFor(range: Range, bucket: Bucket) {
  const count = bucket === 'hour' ? 24 : DAYS[range];
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(2026, 9, 28, 12, 0, 0));
    if (bucket === 'hour') {
      date.setUTCHours(12 - (count - 1 - index));
      return {
        t: date.toISOString().replace(':00:00.000Z', ':00:00Z'),
        value: 40 + index * 3,
      };
    }
    date.setUTCDate(date.getUTCDate() - (count - 1 - index));
    return { t: date.toISOString().slice(0, 10), value: 1000 + index * 10 };
  });
}

async function mockAdminAnalytics(page: Page) {
  const calls: { overview: Range[]; series: { metric: string; range: Range; bucket: Bucket }[] } = {
    overview: [],
    series: [],
  };

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    if (request.method() === 'OPTIONS') return json(route, 204, {});

    if (path.endsWith('/auth/me')) {
      return json(route, 200, {
        id: 'admin-1',
        email: 'admin@det-academy.com',
        name: 'Admin',
        role: 'admin',
        locale: 'ru',
        createdAt: '2026-01-01T00:00:00Z',
      });
    }
    if (path.endsWith('/auth/refresh') || path.endsWith('/auth/logout')) {
      return json(route, 200, { status: 'ok' });
    }
    if (path.endsWith('/user/streak')) return json(route, 200, { streakDays: 0, lastActiveDate: '' });
    if (path.endsWith('/theory/progress')) {
      return json(route, 200, { completedLessons: [], totalLessons: 16, progressPercent: 0, isAllCompleted: false });
    }
    if (path.endsWith('/test/sessions/me')) return json(route, 200, { sessions: [] });
    if (path.endsWith('/user/errors')) return json(route, 200, { errors: [] });
    if (path.endsWith('/admin/stats')) {
      return json(route, 200, {
        totalUsers: 1284,
        totalSessions: 900,
        completedSessions: 640,
        averageScore: 118,
        totalCertificates: 120,
        activeBanners: 1,
        totalBannerClicks: 20,
        totalQuestions: 400,
        totalInstitutions: 50,
        scoreDistribution: {},
        recentRegistrations: [],
      });
    }
    if (path.endsWith('/admin/users')) return json(route, 200, { users: [], total: 0 });
    if (path.endsWith('/banners')) return json(route, 200, { banners: [] });

    if (path.endsWith('/admin/analytics/overview')) {
      const range = (url.searchParams.get('range') || '7d') as Range;
      calls.overview.push(range);
      return json(route, 200, {
        range,
        from: '2026-10-21T12:00:00Z',
        to: '2026-10-28T12:00:00Z',
        generatedAt: '2026-10-28T12:00:00Z',
        totalUsers: 1284,
        newUsers: NEW_USERS[range],
        activeUsers: { dau: 87, wau: 340, mau: 910 },
        sessions: 260,
        completedMocks: 94,
        evaluations: 512,
        speakingEvaluations: 318,
        writingEvaluations: 194,
        ttsCalls: 76,
        xpAwarded: 18420,
        errorCount: 7,
      });
    }

    if (path.endsWith('/admin/analytics/timeseries')) {
      const metric = url.searchParams.get('metric') || 'active';
      const range = (url.searchParams.get('range') || '7d') as Range;
      const bucket = (url.searchParams.get('bucket') || 'day') as Bucket;
      calls.series.push({ metric, range, bucket });
      const points = pointsFor(range, bucket).map((point) => ({
        ...point,
        value: metric === 'users' ? point.value : Math.max(1, Math.round(point.value / 12)),
      }));
      return json(route, 200, {
        metric,
        range,
        bucket,
        points,
        total: metric === 'users' ? 1284 : points.reduce((sum, point) => sum + point.value, 0),
        cumulative: metric === 'users',
      });
    }

    if (path.endsWith('/admin/analytics/features')) {
      return json(route, 200, {
        range: '7d',
        pageViewsAvailable: false,
        note: 'No page-view table exists yet.',
        items: [
          { source: 'learning_events', key: 'lesson_completed', count: 420, users: 180 },
          { source: 'practice_attempts', key: 'FILL_BLANKS', count: 310, users: 140 },
          { source: 'evaluations', key: 'SPEAK_PHOTO', count: 220, users: 96 },
          { source: 'learning_events', key: 'mock_completed', count: 94, users: 70 },
          { source: 'learning_events', key: 'srs_reviewed', count: 80, users: 42 },
        ],
      });
    }

    if (path.endsWith('/admin/analytics/retention')) {
      return json(route, 200, {
        range: '7d',
        note: 'Retention uses the server-owned user_activity ledger.',
        cohorts: [
          { cohort: '2026-10-20', size: 40, d1: 75, d7: 50, d30: null, d1Users: 30, d7Users: 20, d30Users: 0 },
          { cohort: '2026-10-21', size: 50, d1: 60, d7: 40, d30: null, d1Users: 30, d7Users: 20, d30Users: 0 },
          { cohort: '2026-10-22', size: 30, d1: 66.7, d7: null, d30: null, d1Users: 20, d7Users: 0, d30Users: 0 },
        ],
      });
    }

    // Everything else that a global store may probe on first paint.
    return json(route, 200, {});
  });

  return calls;
}

test.describe('admin analytics', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('det_auth_token', 'token-admin');
      localStorage.setItem('det_cookie_consent', 'true');
    });
  });

  test('renders KPIs, charts, feature bars and retention', async ({ page }) => {
    await mockAdminAnalytics(page);
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Аналитика', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Что происходит в академии' })).toBeVisible();
    await expect(page.getByText(/1\s*284/).first()).toBeVisible();
    await expect(page.getByText('120', { exact: true })).toBeVisible();
    await expect(page.getByText('94', { exact: true }).first()).toBeVisible();
    await expect(page.getByText(/318\s*говорение/)).toBeVisible();

    await expect(page.locator('figure')).toHaveCount(4);
    await expect(page.getByRole('img', { name: /Рост базы. всего: 1\s*284/ })).toBeVisible();
    await expect(page.getByRole('img', { name: /Активные студенты/ })).toBeVisible();
    await expect(page.getByRole('img', { name: /Пробные тесты/ })).toBeVisible();

    await expect(page.getByText('Завершён урок теории')).toBeVisible();
    await expect(page.getByRole('img', { name: /Завершён урок теории: 420/ })).toBeVisible();

    await expect(page.getByRole('heading', { name: 'Удержание по когортам' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'D1' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'D30' })).toBeVisible();
    await expect(page.getByText('75%')).toBeVisible();

    await expect(page.getByText(/Ограничения данных/).first()).toBeVisible();
  });

  test('range switch refetches overview and series with the new range', async ({ page }) => {
    const calls = await mockAdminAnalytics(page);
    await page.goto('/admin');
    await page.getByRole('button', { name: 'Аналитика', exact: true }).click();
    await expect(page.getByText('120', { exact: true })).toBeVisible();

    await page.getByRole('button', { name: '30 дней' }).click();

    await expect
      .poll(() => calls.overview.includes('30d'))
      .toBe(true);
    await expect
      .poll(() => calls.series.some((call) => call.range === '30d' && call.bucket === 'day'))
      .toBe(true);
    await expect(page.getByText('480', { exact: true })).toBeVisible();

    const hourButton = page.getByRole('button', { name: 'По часам' });
    await expect(hourButton).toBeDisabled();

    await page.getByRole('button', { name: '7 дней' }).click();
    await hourButton.click();
    await expect
      .poll(() => calls.series.some((call) => call.range === '7d' && call.bucket === 'hour'))
      .toBe(true);
    await expect(page.getByRole('button', { name: 'По часам' })).toHaveAttribute('aria-pressed', 'true');
  });
});
