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
  errors: [],
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
});

test('the dashboard falls back to legacy endpoints when the aggregate is missing', async ({ page }) => {
  await mockApi(page);
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });

  let aggregateCalls = 0;
  let legacyStreakCalls = 0;
  await page.route('**/api/v1/user/dashboard**', (route) => {
    aggregateCalls += 1;
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{"error":"not found"}' });
  });
  page.on('request', (request) => {
    if (new URL(request.url()).pathname === '/api/v1/user/streak') legacyStreakCalls += 1;
  });

  await page.goto('/dashboard');
  await expect(page.getByText('Дашборд подготовки').first()).toBeVisible();
  await expect.poll(() => aggregateCalls).toBeGreaterThan(0);
  await expect.poll(() => legacyStreakCalls).toBeGreaterThan(0);
  await expect(page.getByText(/0 \/ 13/).first()).toBeVisible();
});
