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

test('speak about photo shows the task first and hides coaching hints', async ({ page }) => {
  await page.clock.install();
  await installFakeMedia(page);
  await seedAttempt(page);
  await mockApi(page, {
    sessionStage: 'SPEAK_PHOTO',
    sessionQuestions: [
      {
        id: 'sp-hints',
        type: 'SPEAK_PHOTO',
        difficultyBand: 'B2',
        contentPayload: {
          imageUrl: '/images/practice/engineering-workshop.jpg',
          prompt:
            'Describe the image in detail (Offshore & Onshore Wind Energy Engineering). Mention the people, the setting and the atmosphere. Key ideas: wind turbine technician; industrial rope access; renewable maintenance; extreme environments.',
        },
        timeLimitSec: 90,
      },
    ],
  });

  await page.goto('/test/session');

  const prompt = page.getByTestId('task-prompt');
  await expect(prompt).toContainText('Describe the image in detail.');
  await expect(prompt).toContainText('Offshore & Onshore Wind Energy Engineering');
  await expect(prompt).not.toContainText('Mention the people');
  await expect(page.getByTestId('task-hints')).toHaveCount(0);

  await page.getByRole('button', { name: /Подсказка/ }).click();
  const hints = page.getByTestId('task-hints');
  await expect(hints).toContainText('Mention the people, the setting and the atmosphere.');
  await expect(hints).toContainText('wind turbine technician');
  await expect(hints).toContainText('extreme environments');

  await page.getByRole('button', { name: /Скрыть подсказку/ }).click();
  await expect(page.getByTestId('task-hints')).toHaveCount(0);
});

test('read then speak uses structured hints behind the button', async ({ page }) => {
  await page.clock.install();
  await installFakeMedia(page);
  await seedAttempt(page);
  await mockApi(page, {
    sessionStage: 'READ_THEN_SPEAK',
    sessionQuestions: [
      {
        id: 'rts-hints',
        type: 'READ_THEN_SPEAK',
        difficultyBand: 'B1',
        contentPayload: {
          prompt: 'Read the statement and speak about the role of parks in a modern city.',
          hints: ['Why parks matter for health', 'Who pays for them', 'How to keep them safe'],
        },
        timeLimitSec: 90,
      },
    ],
  });

  await page.goto('/test/session');

  const prompt = page.getByTestId('task-prompt');
  await expect(prompt).toContainText('Read the statement and speak about the role of parks in a modern city.');
  await expect(prompt).not.toContainText('Why parks matter');

  await page.getByRole('button', { name: /Подсказка/ }).click();
  await expect(page.getByTestId('task-hints')).toContainText('Why parks matter for health');
  await expect(page.getByTestId('task-hints')).toContainText('How to keep them safe');
});

test('write about photo hides the context hint and keeps the task', async ({ page }) => {
  await page.clock.install();
  await seedAttempt(page);
  await mockApi(page, {
    sessionStage: 'WRITE_PHOTO',
    sessionQuestions: [
      {
        id: 'wp-hints',
        type: 'WRITE_PHOTO',
        difficultyBand: 'B1',
        contentPayload: {
          imageUrl: '/images/practice/engineering-workshop.jpg',
          prompt:
            'Describe this image in 3–4 sentences: the foreground, the background and the atmosphere. Context: A focused biochemical researcher manipulating micro-pipettes inside a sterile laboratory.',
        },
        timeLimitSec: 60,
      },
    ],
  });

  await page.goto('/test/session');

  const prompt = page.getByTestId('task-prompt');
  await expect(prompt).toContainText('Describe this image in 3–4 sentences');
  await expect(prompt).not.toContainText('Context:');

  await page.getByRole('button', { name: /Подсказка/ }).click();
  await expect(page.getByTestId('task-hints')).toContainText('Context: A focused biochemical researcher');
});
