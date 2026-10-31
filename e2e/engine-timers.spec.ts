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

test('c-test countdown reaches zero and advances the stage', async ({ page }) => {
  await page.clock.install();
  await seedAttempt(page);
  await mockApi(page, {
    sessionStage: 'C_TEST',
    afterStage: 'FILL_BLANKS',
    sessionQuestions: [
      {
        id: 'ct-timer',
        type: 'C_TEST',
        difficultyBand: 'B1',
        contentPayload: {
          title: 'Timer test',
          firstSentence: 'The first part of the text is intact.',
          lastSentence: 'The last part is also intact.',
          damagedTokens: [{ prefix: 'an', missingLength: 2 }],
          segments: [
            { text: 'The first part of the text is intact. ' },
            { prefix: 'an', missingLength: 2 },
            { text: ' The last part is also intact.' },
          ],
        },
        timeLimitSec: 180,
      },
    ],
  });

  await page.goto('/test/session');
  const countdown = page.getByTestId('task-countdown');
  await expect(countdown).toHaveText('3:00');

  await page.clock.fastForward(62_000);
  await expect(countdown).toHaveText('1:58');

  // The stage deadline must actually fire, not reset on every render.
  await page.clock.fastForward(125_000);
  await expect(page.getByText('Read and Complete (C-Test)')).toHaveCount(0);
});
