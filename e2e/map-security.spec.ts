import { test, expect } from '@playwright/test';

test('institutions map uses local Leaflet CSS and keeps attribution', async ({ page }) => {
  const externalLeafletRequests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('unpkg.com') || request.url().includes('leaflet.css')) {
      externalLeafletRequests.push(request.url());
    }
  });
  await page.goto('/institutions');
  // The map is the default view of the catalogue.
  await expect(page.getByRole('button', { name: /Карта с проверенными координатами/ })).toBeVisible();
  await expect(page.getByText(/Требования вузов пока не подтверждены/)).toHaveCount(0);
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.leaflet-control-attribution')).toContainText('OpenStreetMap');
  expect(externalLeafletRequests.filter((url) => url.includes('unpkg.com'))).toEqual([]);
});
