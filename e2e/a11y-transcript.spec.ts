import { test, expect } from '@playwright/test';
import { mockApi, TEST_ATTEMPT_ID } from './mocks';

test('listening dictation exposes an accessible transcript', async ({ page }) => {
  await page.addInitScript((attemptId) => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
    localStorage.setItem(
      'det_active_test_attempt_v2',
      JSON.stringify({ sessionId: attemptId, finalizing: false, updatedAt: Date.now() })
    );
  }, TEST_ATTEMPT_ID);
  await mockApi(page, {
    sessionStage: 'LISTEN_TYPE',
    sessionQuestions: [
      {
        id: 'lt-1',
        type: 'LISTEN_TYPE',
        difficultyBand: 'B1',
        contentPayload: { audioSentence: 'The library closes at nine.', playsAllowed: 3 },
        timeLimitSec: 60,
      },
    ],
  });

  await page.goto('/test/session');
  const transcript = page.getByText('Показать транскрипт (для доступности)');
  await expect(transcript).toBeVisible();
  await transcript.click();
  await expect(page.getByText('The library closes at nine.')).toBeVisible();
});
