import { test, expect } from '@playwright/test';
import { installFakeMedia, mockApi, TEST_ATTEMPT_ID } from './mocks';

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

test('a failed speaking upload survives reload and can be retried', async ({ page }) => {
  await page.clock.install();
  await installFakeMedia(page);
  await seedAttempt(page);
  await mockApi(page, {
    sessionStage: 'READ_THEN_SPEAK',
    afterStage: 'INTERACTIVE_SPEAKING',
    sessionQuestions: [
      {
        id: 'rts-draft',
        type: 'READ_THEN_SPEAK',
        difficultyBand: 'B1',
        contentPayload: { prompt: 'Read the statement and speak about city parks.' },
        timeLimitSec: 150,
      },
    ],
  });

  let uploads = 0;
  await page.route('**/api/v1/test/sessions/*/audio', async (route) => {
    uploads += 1;
    if (uploads === 1) {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'temporary outage', code: 'audio_save_failed' }),
      });
    }
    return route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ asset: { id: 'asset' }, url: '/audio', evaluation: {} }),
    });
  });

  await page.goto('/test/session');
  await page.getByRole('button', { name: /Начать говорить сейчас/ }).click();
  await page.clock.fastForward(31_000);
  await page.getByRole('button', { name: /Проверить ответ/ }).click();
  await expect(page.getByText('Есть сохранённая запись с прошлой попытки')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Есть сохранённая запись с прошлой попытки')).toBeVisible();
  await page.getByRole('button', { name: 'Отправить сохранённую запись' }).click();

  await expect(page.getByRole('heading', { name: 'Conversational Interaction' })).toBeVisible();
  expect(uploads).toBe(2);
});
