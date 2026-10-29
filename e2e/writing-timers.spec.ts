import { test, expect } from '@playwright/test';
import { mockApi, TEST_ATTEMPT_ID } from './mocks';

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

test('writing sample counts down from five minutes', async ({ page }) => {
  await page.clock.install();
  await seedAttempt(page);
  await mockApi(page, {
    sessionStage: 'WRITING_SAMPLE',
    sessionQuestions: [
      {
        id: 'ws-timer',
        type: 'WRITING_SAMPLE',
        difficultyBand: 'B2',
        contentPayload: { prompt: 'Describe a time you learned something difficult.' },
        timeLimitSec: 300,
      },
    ],
  });

  await page.goto('/test/session');
  const countdown = page.getByTestId('task-countdown');
  await expect(countdown).toHaveText('5:00');
  await page.clock.fastForward(3_000);
  await expect(countdown).toHaveText('4:57');
});

test('write about photo counts down per photo', async ({ page }) => {
  await page.clock.install();
  await seedAttempt(page);
  await mockApi(page, {
    sessionStage: 'WRITE_PHOTO',
    sessionQuestions: [
      {
        id: 'wp-timer',
        type: 'WRITE_PHOTO',
        difficultyBand: 'B1',
        contentPayload: {
          imageUrl: '/images/practice/engineering-workshop.jpg',
          prompt: 'Describe the workshop.',
        },
        timeLimitSec: 60,
      },
    ],
  });

  await page.goto('/test/session');
  const countdown = page.getByTestId('task-countdown');
  await expect(countdown).toHaveText('60s');
  await page.clock.fastForward(3_000);
  await expect(countdown).toHaveText('57s');
});

test('interactive writing keeps separate official part timers', async ({ page }) => {
  await page.clock.install();
  await seedAttempt(page);
  await mockApi(page, {
    sessionStage: 'INTERACTIVE_WRITING',
    sessionQuestions: [
      {
        id: 'iw-timer',
        type: 'INTERACTIVE_WRITING',
        difficultyBand: 'B2',
        contentPayload: {
          part1Prompt: 'Describe a change in your city.',
          part2Prompt: 'Why does this change matter?',
        },
        timeLimitSec: 300,
      },
    ],
  });

  await page.goto('/test/session');
  const countdown = page.getByTestId('task-countdown');
  await expect(countdown).toHaveText('5:00');
  await page.clock.fastForward(3_000);
  await expect(countdown).toHaveText('4:57');

  await page.getByRole('button', { name: /Перейти к Части 2/ }).click();
  await expect(countdown).toHaveText('3:00');
  await page.clock.fastForward(3_000);
  await expect(countdown).toHaveText('2:57');
});
