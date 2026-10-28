import { test, expect } from '@playwright/test';
import { completedResult, installFakeMedia, mockApi, TEST_ATTEMPT_ID } from './mocks';

test('speaking result shows delivery metrics and pause markers', async ({ page }) => {
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
  await page.getByRole('button', { name: /Далее/ }).click();

  await expect(page.getByText('Разбор устной и письменной речи')).toBeVisible();
  await expect(page.getByText('Доля пауз')).toBeVisible();
  await expect(page.getByText('18%', { exact: true })).toBeVisible();
  await expect(page.getByText('Слова-заполнители')).toBeVisible();
  await expect(page.getByText('Стабильность подачи')).toBeVisible();
  await expect(page.getByRole('img', { name: /Речь с 4 паузами/ })).toBeVisible();
});
