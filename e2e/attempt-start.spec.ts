import { test, expect } from '@playwright/test';
import { mockApi, TEST_ATTEMPT_ID } from './mocks';

test('starting a new test clears the previous attempt instead of resuming it', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
    localStorage.setItem(
      'det_active_test_attempt_v2',
      JSON.stringify({ sessionId: 'old-session-id', finalizing: false, updatedAt: Date.now() })
    );
  });
  const mock = await mockApi(page, {
    sessionStage: 'READ_SELECT',
    sessionQuestions: [
      {
        id: 'rs-new',
        type: 'READ_SELECT',
        difficultyBand: 'B1',
        contentPayload: { word: 'new-attempt' },
        timeLimitSec: 5,
      },
    ],
  });

  await page.goto('/test');
  await page.getByRole('button', { name: /Начать/ }).click();

  await expect.poll(() => mock.getStartSessionBodies().length).toBe(1);
  const storedAttempt = await page.evaluate(() => {
    const raw = localStorage.getItem('det_active_test_attempt_v2');
    return raw ? JSON.parse(raw) : null;
  });
  expect(storedAttempt?.sessionId).not.toBe('old-session-id');
});
