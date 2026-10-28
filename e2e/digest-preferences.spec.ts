import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('profile lets the learner turn the weekly digest off and back on', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  let enabled = true;
  await page.route('**/api/v1/user/email-preferences', async (route) => {
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON() as { digestEnabled: boolean };
      enabled = Boolean(body.digestEnabled);
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ digestEnabled: enabled }),
    });
  });

  await page.goto('/profile');
  const status = page.getByTestId('digest-status');
  await expect(status).toHaveText('Включён');

  await page.getByRole('button', { name: 'Отключить' }).click();
  await expect(status).toHaveText('Отключён');
  await expect(page.getByRole('button', { name: 'Включить' })).toBeVisible();

  await page.getByRole('button', { name: 'Включить' }).click();
  await expect(status).toHaveText('Включён');
});
