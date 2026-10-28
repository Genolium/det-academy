import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('dashboard renders the four DET subscores from the latest attempt', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
    localStorage.setItem(
      'det_user_user-a_test_results',
      JSON.stringify([
        {
          id: 'result-1',
          date: new Date().toISOString(),
          overallScore: 125,
          reading: 130,
          listening: 120,
          writing: 118,
          speaking: 127,
          literacy: 124,
          comprehension: 121,
          production: 119,
          conversation: 128,
          candidateName: 'E2E Student',
        },
      ])
    );
  });
  await mockApi(page);
  await page.goto('/dashboard');

  await expect(page.getByText('Literacy').first()).toBeVisible();
  await expect(page.getByText('Comprehension').first()).toBeVisible();
  await expect(page.getByText('Production').first()).toBeVisible();
  await expect(page.getByText('Conversation').first()).toBeVisible();

  await expect(page.getByText('124').first()).toBeVisible();
  await expect(page.getByText('121').first()).toBeVisible();
  await expect(page.getByText('119').first()).toBeVisible();
  await expect(page.getByText('128').first()).toBeVisible();
});
