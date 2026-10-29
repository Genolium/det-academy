import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);
});

test('test lobby offers equal consent choices without blocking the test', async ({ page }) => {
  let consent = false;
  const patches: boolean[] = [];
  await page.route('**/api/v1/user/research-consent', async (route) => {
    if (route.request().method() === 'PATCH') {
      const body = route.request().postDataJSON() as { consent: boolean };
      consent = Boolean(body.consent);
      patches.push(consent);
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ consent, version: '2026-10-29' }),
    });
  });

  await page.goto('/test');

  const card = page.getByTestId('calibration-consent-card');
  await expect(card).toBeVisible();
  await expect(card).toContainText('Помогите сделать оценку Speaking/Writing точнее');
  await expect(page.getByTestId('calibration-consent-grant')).toBeVisible();
  await expect(page.getByTestId('calibration-consent-decline')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Начать тестирование' })).toBeEnabled();

  await page.getByTestId('calibration-consent-grant').click();
  await expect(page.getByTestId('calibration-consent-saved')).toContainText('Согласие сохранено');
  expect(patches).toEqual([true]);

  await page.reload();
  await expect(page.getByTestId('calibration-consent-card')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Начать тестирование' })).toBeVisible();
});

test('declining hides the consent card for fourteen days', async ({ page }) => {
  await page.route('**/api/v1/user/research-consent', async (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ consent: false, version: '2026-10-29' }),
    })
  );

  await page.goto('/test');
  await expect(page.getByTestId('calibration-consent-card')).toBeVisible();

  await page.getByTestId('calibration-consent-decline').click();
  await expect(page.getByTestId('calibration-consent-card')).toHaveCount(0);

  const snoozedUntil = await page.evaluate(() =>
    Number(localStorage.getItem('det_calibration_consent_snoozed_until'))
  );
  expect(snoozedUntil).toBeGreaterThan(Date.now() + 13 * 86_400_000);

  await page.reload();
  await expect(page.getByTestId('calibration-consent-card')).toHaveCount(0);
});
