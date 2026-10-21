import { test, expect } from '@playwright/test';
import { mockApi, TEST_ATTEMPT_ID } from './mocks';

test('a 401 during answer sync refreshes the session and retries instead of dropping the answer', async ({ page }) => {
  await page.addInitScript((attemptId) => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
    localStorage.setItem(
      'det_active_test_attempt_v2',
      JSON.stringify({ sessionId: attemptId, finalizing: false, updatedAt: Date.now() })
    );
  }, TEST_ATTEMPT_ID);
  await mockApi(page, {
    sessionStage: 'READ_SELECT',
    sessionQuestions: [
      {
        id: 'rs-auth',
        type: 'READ_SELECT',
        difficultyBand: 'B1',
        contentPayload: { word: 'resilient' },
        timeLimitSec: 5,
      },
    ],
  });

  let respondCalls = 0;
  let refreshCalls = 0;
  await page.route('**/api/v1/test/sessions/*/respond', async (route) => {
    respondCalls += 1;
    if (respondCalls === 1) {
      await route.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"expired"}' });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"status":"recorded"}' });
  });
  await page.route('**/api/v1/auth/refresh', async (route) => {
    refreshCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'token-user-a-refreshed',
        user: {
          id: 'user-a',
          email: 'a@example.com',
          name: 'User A',
          role: 'student',
          locale: 'ru',
          createdAt: new Date().toISOString(),
        },
      }),
    });
  });

  await page.goto('/test/session');
  await expect(page.getByText('resilient')).toBeVisible();
  await page.getByRole('button', { name: /Да/ }).click();

  await expect.poll(() => respondCalls).toBeGreaterThanOrEqual(2);
  await expect.poll(() => refreshCalls).toBe(1);
  const queued = await page.evaluate(() => {
    const raw = localStorage.getItem('det_response_outbox_v1');
    return raw ? Object.keys(JSON.parse(raw)).length : 0;
  });
  expect(queued).toBe(0);
});

test('dashboard performs one concurrent auth bootstrap', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);
  let authMeCalls = 0;
  page.on('request', (request) => {
    if (request.url().includes('/api/v1/auth/me')) authMeCalls += 1;
  });

  await page.goto('/dashboard');
  await expect(page.getByText(/Готовность к экзамену/i)).toBeVisible();
  await page.waitForTimeout(500);
  expect(authMeCalls).toBe(1);
});
