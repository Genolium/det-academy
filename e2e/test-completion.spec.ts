import { test, expect } from '@playwright/test';
import { completedResult, mockApi, pendingSyncError, TEST_ATTEMPT_ID } from './mocks';

test.describe('trusted test completion', () => {
  test.beforeEach(async ({ page }) => {
    await page.clock.install();
    await page.addInitScript((attemptId) => {
      localStorage.setItem('det_auth_token', 'token-user-a');
      localStorage.removeItem('det_token');
      localStorage.setItem(
        'det_active_test_attempt_v2',
        JSON.stringify({ sessionId: attemptId, finalizing: false, updatedAt: Date.now() })
      );
      localStorage.setItem('det_active_test_session_id', attemptId);
      localStorage.setItem('det_cookie_consent', 'true');
    }, TEST_ATTEMPT_ID);
  });

  test('an API outage never creates a score; retry creates exactly one result', async ({ page }) => {
    const mock = await mockApi(page, {
      completionResponses: [
        pendingSyncError,
        { delayMs: 250, status: 200, body: completedResult },
      ],
    });

    await page.goto('/test/session');
    await expect(page.getByRole('heading', { name: 'Speaking Sample' })).toBeVisible();

    await page.getByRole('button', { name: /Начать говорить сейчас/ }).click();
    await page.clock.fastForward(61_000);
    await page.getByRole('button', { name: /Далее/ }).click();

    // The server rejected finalization: the UI must expose an unconfirmed state
    // instead of showing a score/certificate.
    await expect(page.getByText('Результат ожидает подтверждения')).toBeVisible();
    await expect(page.getByText('Тренировочная оценка (Overall Estimate)')).toHaveCount(0);
    await expect(page.locator('a[href^="/verify/"]')).toHaveCount(0);

    // A double click on retry must still produce one finalization call.
    const retry = page.getByRole('button', { name: /Повторить синхронизацию/ });
    await retry.dblclick();

    await expect(page.getByText('Тренировочная оценка (Overall Estimate)')).toBeVisible();
    await expect(page.getByText('Результат ожидает подтверждения')).toHaveCount(0);

    expect(mock.getCompletionCalls()).toBe(2);

    const storedResults = await page.evaluate(() => {
      const raw = localStorage.getItem('det_user_user-a_test_results');
      return raw ? JSON.parse(raw) : [];
    });
    expect(storedResults).toHaveLength(1);
    expect(storedResults[0].id).toBe(TEST_ATTEMPT_ID);

    const activeAttempt = await page.evaluate(() =>
      localStorage.getItem('det_active_test_attempt_v2')
    );
    expect(activeAttempt).toBeNull();
  });

  test('a completed attempt resumes through the idempotent endpoint', async ({ page }) => {
    const mock = await mockApi(page, {
      resumeCompleted: true,
      completionResponses: [{ status: 200, body: completedResult }],
    });

    await page.goto('/test/session');
    await expect(page.getByText('Тренировочная оценка (Overall Estimate)')).toBeVisible();
    expect(mock.getCompletionCalls()).toBe(1);
  });
});
