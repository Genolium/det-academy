import { test, expect } from '@playwright/test';

test('cookie banner can be declined and stays dismissed', async ({ page }) => {
  const googleRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('accounts.google.com/gsi/client')) googleRequests.push(request.url());
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Только необходимое' })).toBeVisible();
  await page.getByRole('button', { name: 'Только необходимое' }).click();
  await expect(page.getByRole('button', { name: 'Только необходимое' })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('button', { name: 'Только необходимое' })).toHaveCount(0);
  expect(googleRequests).toEqual([]);
});
