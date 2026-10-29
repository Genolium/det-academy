import { test, expect } from '@playwright/test';
import { installFakeMedia, mockApi } from './mocks';

test('speak about photo keeps one live task countdown and allows an early check', async ({ page }) => {
  await page.clock.install();
  await installFakeMedia(page);
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  const failedImages: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400 && response.url().includes('engineering-workshop')) {
      failedImages.push(response.url());
    }
  });

  await page.goto('/practice?drill=speak-about-photo');

  const countdown = page.getByTestId('task-countdown');
  await expect(countdown).toHaveText('1:50');

  // The countdown must tick even before speaking starts. It used to reset on
  // every recorder update and stay at its initial value.
  await page.clock.fastForward(3_000);
  await expect(countdown).toHaveText('1:47');

  await page.getByRole('button', { name: /Начать говорить сейчас/ }).click();
  await page.clock.fastForward(31_000);

  const check = page.getByRole('button', { name: /Проверить ответ/ });
  await expect(check).toBeEnabled();
  await expect(page.getByTestId('speak-timer-hint')).toContainText('Ответ можно отправить');
  await expect(countdown).toHaveText('1:16');
  expect(failedImages).toEqual([]);
});
