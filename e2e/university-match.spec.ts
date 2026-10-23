import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('the matcher uses the shared catalogue and never invents a threshold', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  await page.route('**/registry/institutions-map', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        institutions: [
          {
            id: 'known',
            name: 'Known University',
            country: 'USA',
            state: 'New York',
            minScore: 120,
            category: 'Top Global',
            websiteUrl: 'https://example.edu',
            requirementSource: 'https://englishtest.duolingo.com/institutions',
            requirementCheckedAt: '2026-10-21',
            requirementVerified: false,
          },
          {
            id: 'unknown',
            name: 'Unknown University',
            country: 'USA',
            minScore: 0,
            category: 'Official DET',
            websiteUrl: 'https://unknown.edu',
            requirementSource: 'https://englishtest.duolingo.com/institutions',
            requirementCheckedAt: '2026-10-21',
            requirementVerified: false,
          },
        ],
        stats: {},
      }),
    });
  });

  await page.goto('/profile');

  await expect(page.getByRole('heading', { name: 'Known University', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Unknown University', exact: true })).toBeVisible();
  await expect(page.getByText(/Ориентировочный порог платформы/)).toBeVisible();
  await expect(page.getByText('неизвестно').first()).toBeVisible();
  await expect(page.getByText(/порог неизвестен/)).toBeVisible();
});
