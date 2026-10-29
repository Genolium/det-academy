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

test('the arena is completely hidden while disabled', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  await page.goto('/dashboard');
  await expect(page.getByRole('link', { name: /^Арена$/ })).toHaveCount(0);
  await expect(page.getByText(/Silver|Gold|Bronze|Лига|League/i)).toHaveCount(0);

  const response = await page.goto('/arena');
  expect(response?.status()).toBe(404);
});
