import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('advertising is paused on the public site', async ({ page }) => {
  await mockApi(page);
  // Even if the API returned banners, the flag must keep them off the page.
  await page.route('**/api/v1/banners**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 'b1', placement: 'HEADER', targetUrl: 'https://example.com', altText: 'Partner grant', isActive: true },
      ]),
    })
  );

  await page.goto('/');
  await expect(page.locator('aside[aria-label="Announcement"]')).toHaveCount(0);
  await expect(page.getByText(/Выиграй грант/i)).toHaveCount(0);
});

test('the arena is paused and hidden from the navigation', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: /^Арена$/ })).toHaveCount(0);

  await page.goto('/arena');
  await expect(page.getByRole('heading', { name: /Арена временно на паузе/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /К тренажёрам/i })).toBeVisible();
});
