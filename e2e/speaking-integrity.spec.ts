import { test, expect } from '@playwright/test';
import {
  installDeniedMedia,
  installFakeMedia,
  mockApi,
  TEST_ATTEMPT_ID,
} from './mocks';

async function seedAttempt(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript((attemptId) => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
    localStorage.setItem(
      'det_active_test_attempt_v2',
      JSON.stringify({ sessionId: attemptId, finalizing: false, updatedAt: Date.now() })
    );
  }, TEST_ATTEMPT_ID);
}

test('speaking sample does not complete without recorded audio', async ({ page }) => {
  await page.clock.install();
  await seedAttempt(page);
  await installDeniedMedia(page);
  await mockApi(page, {
    sessionStage: 'SPEAKING_SAMPLE',
    sessionQuestions: [
      {
        id: 'ss-integrity',
        type: 'SPEAKING_SAMPLE',
        difficultyBand: 'B2',
        contentPayload: { prompt: 'Describe a memorable journey.' },
        timeLimitSec: 180,
      },
    ],
  });

  await page.goto('/test/session');
  await expect(page.getByRole('heading', { name: 'Speaking Sample' })).toBeVisible();
  await page.getByRole('button', { name: /Начать говорить сейчас/ }).click();
  await page.clock.fastForward(61_000);
  await page.getByRole('button', { name: /Далее/ }).click();

  await expect(page.getByText('Аудио не записано')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Speaking Sample' })).toBeVisible();
  await expect(page.getByText('Тренировочная оценка (Overall Estimate)')).toHaveCount(0);
});

test('interactive speaking records the whole conversation with one recorder', async ({ page }) => {
  await page.clock.install();
  await seedAttempt(page);
  await installFakeMedia(page);
  let uploads = 0;
  await mockApi(page, {
    sessionStage: 'INTERACTIVE_SPEAKING',
    sessionQuestions: [
      {
        id: 'is-integrity',
        type: 'INTERACTIVE_SPEAKING',
        difficultyBand: 'B2',
        contentPayload: { scenario: 'Discuss your course schedule with an advisor.' },
        timeLimitSec: 210,
      },
    ],
  });
  await page.route('**/api/v1/test/sessions/*/audio', async (route) => {
    uploads += 1;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ asset: {}, url: '/api/v1/media/audio/test.webm', evaluation: {} }),
    });
  });

  await page.goto('/test/session');
  await expect(page.getByRole('heading', { name: 'Conversational Interaction' })).toBeVisible();
  const initialRecorderStarts = await page.evaluate(
    () => (window as unknown as { __mediaRecorderStartCount?: number }).__mediaRecorderStartCount || 0
  );
  expect(initialRecorderStarts).toBeGreaterThanOrEqual(1);

  for (let turn = 1; turn <= 5; turn += 1) {
    await page.clock.fastForward(36_000);
    await expect(page.getByText(`Turn ${turn + 1} Question`)).toBeVisible();
  }
  await page.clock.fastForward(36_000);

  await expect.poll(() => uploads).toBe(1);
  const recorderStarts = await page.evaluate(
    () => (window as unknown as { __mediaRecorderStartCount?: number }).__mediaRecorderStartCount || 0
  );
  expect(recorderStarts).toBe(initialRecorderStarts);
});
