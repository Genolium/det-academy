import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

const dashboardPayload = {
  streak: { streakDays: 3, lastActiveDate: '2026-11-06' },
  theory: {
    completedLessons: [],
    totalLessons: 13,
    progressPercent: 0,
    isAllCompleted: false,
  },
  sessions: [],
  studyPlan: null,
  goalsConfigured: false,
  bestWpm: 44,
  errors: [
    {
      id: 'err-1',
      userId: 'user-a',
      type: 'READ_SELECT',
      prompt: 'Is "blorf" a real English word?',
      userAnswer: 'yes',
      correctAnswer: 'no',
      explanation: 'blorf is a pseudoword',
      errorCategory: 'vocabulary',
      errorRule: '',
      contextVariants: [],
      consecutiveSuccesses: 0,
      attemptsCount: 1,
      mastered: false,
      createdAt: new Date().toISOString(),
    },
  ],
};

test('the authenticated dashboard uses one aggregate request', async ({ page }) => {
  await mockApi(page);
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });

  const calls = {
    aggregate: 0,
    legacy: 0,
  };
  await page.route('**/api/v1/user/dashboard**', (route) => {
    calls.aggregate += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(dashboardPayload),
    });
  });

  page.on('request', (request) => {
    const path = new URL(request.url()).pathname;
    const legacy = [
      '/api/v1/user/streak',
      '/api/v1/theory/progress',
      '/api/v1/test/sessions/me',
      '/api/v1/user/plan',
      '/api/v1/user/typing/history',
      '/api/v1/user/errors',
    ];
    if (legacy.some((item) => path === item)) calls.legacy += 1;
  });

  await page.goto('/dashboard');
  await expect(page.getByText('Дашборд подготовки').first()).toBeVisible();
  await expect.poll(() => calls.aggregate).toBe(1);
  expect(calls.legacy).toBe(0);
  await expect(page.getByText(/0 \/ 13/).first()).toBeVisible();
  await expect(page.getByText(/44 \/ 50 WPM/).first()).toBeVisible();
  await expect(page.getByText(/Is "blorf" a real English word\?/).first()).toBeVisible();
});

test('the dashboard falls back to legacy endpoints when the aggregate is missing', async ({ page }) => {
  await mockApi(page);
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });

  let aggregateCalls = 0;
  const legacyCalls = new Set<string>();
  await page.route('**/api/v1/user/dashboard**', (route) => {
    aggregateCalls += 1;
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"not found"}' });
  });
  page.on('request', (request) => {
    legacyCalls.add(new URL(request.url()).pathname);
  });

  await page.goto('/dashboard');
  await expect(page.getByText('Дашборд подготовки').first()).toBeVisible();
  await expect.poll(() => aggregateCalls).toBeGreaterThan(0);
  const required = [
    '/api/v1/user/streak',
    '/api/v1/theory/progress',
    '/api/v1/test/sessions/me',
    '/api/v1/user/plan',
    '/api/v1/user/typing/history',
    '/api/v1/user/errors',
  ];
  await expect.poll(() => required.every((path) => legacyCalls.has(path))).toBe(true);
  for (const path of required) {
    expect(legacyCalls.has(path), `missing fallback request ${path}`).toBe(true);
  }
  await expect(page.getByText(/0 \/ 13/).first()).toBeVisible();
});

test('login followed by dashboard load reuses the aggregate result', async ({ page }) => {
  await mockApi(page);
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'token-user-a',
        user: {
          id: 'user-a',
          email: 'a@example.com',
          name: 'User A',
          role: 'student',
          locale: 'ru',
          createdAt: new Date().toISOString(),
        },
      }),
    })
  );
  let aggregateCalls = 0;
  await page.route('**/api/v1/user/dashboard**', (route) => {
    aggregateCalls += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(dashboardPayload),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Войти' }).first().click();
  await page.getByLabel('Email').fill('a@example.com');
  await page.getByLabel('Пароль', { exact: true }).fill('password123');
  await page.getByRole('button', { name: 'Войти в аккаунт' }).click();

  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText('Дашборд подготовки').first()).toBeVisible();
  await page.waitForTimeout(700);
  expect(aggregateCalls).toBe(1);
});
