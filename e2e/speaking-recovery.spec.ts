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

function readThenSpeakOptions() {
  return {
    sessionStage: 'READ_THEN_SPEAK',
    afterStage: 'INTERACTIVE_SPEAKING',
    sessionQuestions: [
      {
        id: 'rts-recovery',
        type: 'READ_THEN_SPEAK',
        difficultyBand: 'B1',
        contentPayload: { prompt: 'Read the statement and speak about city parks.' },
        timeLimitSec: 150,
      },
    ],
  };
}

test('expired audio deadline explains the reason and lets the learner continue', async ({ page }) => {
  await page.clock.install();
  await installFakeMedia(page);
  await seedAttempt(page);
  await mockApi(page, readThenSpeakOptions());
  await page.route('**/api/v1/test/sessions/*/audio', async (route) =>
    route.fulfill({
      status: 410,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'stage deadline exceeded: audio was not accepted',
        code: 'deadline_exceeded',
      }),
    })
  );

  await page.goto('/test/session');
  await page.getByRole('button', { name: /Начать говорить сейчас/ }).click();
  await page.clock.fastForward(31_000);
  await page.getByRole('button', { name: /Проверить ответ/ }).click();

  await expect(page.getByText(/Время задания истекло/)).toBeVisible();
  const continueButton = page.getByRole('button', { name: 'Продолжить без аудио' });
  await expect(continueButton).toBeVisible();
  await continueButton.click();

  await expect(page.getByRole('heading', { name: 'Conversational Interaction' })).toBeVisible();
});

test('an already stored audio response is treated as success', async ({ page }) => {
  await page.clock.install();
  await installFakeMedia(page);
  await seedAttempt(page);
  await mockApi(page, readThenSpeakOptions());
  await page.route('**/api/v1/test/sessions/*/audio', async (route) =>
    route.fulfill({
      status: 409,
      contentType: 'application/json',
      body: JSON.stringify({
        error: 'question has already been answered',
        code: 'already_answered',
      }),
    })
  );

  await page.goto('/test/session');
  await page.getByRole('button', { name: /Начать говорить сейчас/ }).click();
  await page.clock.fastForward(31_000);
  await page.getByRole('button', { name: /Проверить ответ/ }).click();

  await expect(page.getByText(/Не удалось сохранить аудио/)).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Conversational Interaction' })).toBeVisible();
});

test('a global skip escapes an empty stage', async ({ page }) => {
  await page.clock.install();
  await seedAttempt(page);
  await mockApi(page, { sessionStage: 'READ_SELECT', afterStage: 'FILL_BLANKS', sessionQuestions: [] });

  await page.goto('/test/session');
  await expect(page.getByText('Сервер не выдал задания Read & Select')).toBeVisible();

  page.on('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: /Пропустить этап/ }).click();

  await expect(page.getByText('Сервер не выдал задания Fill in the Blanks')).toBeVisible();
});
