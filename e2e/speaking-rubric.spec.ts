import { test, expect } from '@playwright/test';
import { completedResult, installFakeMedia, mockApi, TEST_ATTEMPT_ID } from './mocks';

test('speaking result explains four rubric criteria and the next action', async ({ page }) => {
  await page.clock.install();
  await installFakeMedia(page);
  await page.addInitScript((attemptId) => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
    localStorage.setItem(
      'det_active_test_attempt_v2',
      JSON.stringify({ sessionId: attemptId, finalizing: false, updatedAt: Date.now() })
    );
    localStorage.setItem('det_active_test_session_id', attemptId);
  }, TEST_ATTEMPT_ID);
  await mockApi(page, { completionResponses: [{ status: 200, body: completedResult }] });

  await page.goto('/test/session');
  await page.getByRole('button', { name: /Начать говорить сейчас/ }).click();
  await page.clock.fastForward(61_000);
  await page.getByRole('button', { name: /Проверить ответ|Далее/ }).click();

  const rubric = page.getByTestId('speaking-rubric');
  await expect(rubric).toBeVisible();
  await expect(rubric.getByText('Беглость и темп')).toBeVisible();
  await expect(rubric.getByText('Лексика')).toBeVisible();
  await expect(rubric.getByText('Соответствие заданию')).toBeVisible();
  await expect(rubric.getByText('Точность и структура')).toBeVisible();
  await expect(rubric.getByText('зона роста')).toBeVisible();
  await expect(page.getByTestId('speaking-next-action')).toContainText('110–160');
});
