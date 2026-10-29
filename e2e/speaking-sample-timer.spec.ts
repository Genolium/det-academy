import { test, expect } from '@playwright/test';
import { installFakeMedia, mockApi } from './mocks';

test('speaking sample keeps one 3:30 task countdown and allows an early check', async ({ page }) => {
  await page.clock.install();
  await installFakeMedia(page);
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  await page.goto('/practice?drill=speaking-sample');

  const countdown = page.getByTestId('task-countdown');
  await expect(countdown).toHaveText('3:30');

  // Preparation is part of the same countdown.
  await page.clock.fastForward(3_000);
  await expect(countdown).toHaveText('3:27');

  await page.getByRole('button', { name: /Начать говорить сейчас/ }).click();
  await page.clock.fastForward(61_000);

  await expect(countdown).toHaveText('2:26');
  await expect(page.getByTestId('speak-timer-hint')).toContainText('Ответ можно отправить');
  await expect(page.getByRole('button', { name: /Проверить ответ/ })).toBeEnabled();
});
