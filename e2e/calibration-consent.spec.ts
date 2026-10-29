import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('profile records explicit research consent and revocation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

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

  await page.goto('/profile');
  const status = page.getByTestId('research-consent-status');
  await expect(status).toContainText('Согласие не дано');

  await page.getByTestId('research-consent-toggle').click();
  await expect(status).toContainText('Согласие активно');
  await expect(status).toContainText('2026-10-29');
  await expect(page.getByTestId('research-consent-toggle')).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('research-consent-toggle').click();
  await expect(status).toContainText('Согласие не дано');
  await expect(page.getByTestId('research-consent-toggle')).toHaveAttribute('aria-pressed', 'false');

  expect(patches).toEqual([true, false]);
});

test('data policy explains voluntary calibration consent', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await page.goto('/privacy');

  const note = page.getByTestId('privacy-research-consent');
  await expect(note).toBeVisible();
  await expect(note).toContainText('обезличенные ответы');
  await expect(note).toContainText('отозвано');
});
