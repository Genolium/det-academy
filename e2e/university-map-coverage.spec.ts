import { test, expect } from '@playwright/test';

test('the map catalogue contains the full university coverage', async ({ request }) => {
  const response = await request.get('/registry/institutions-map');
  expect(response.ok()).toBe(true);
  const payload = await response.json();
  expect(payload.institutions.length).toBeGreaterThanOrEqual(12500);
  expect(payload.stats.withCoordinates).toBe(payload.institutions.length);
  expect(payload.stats.countries).toBeGreaterThanOrEqual(190);
  expect(payload.stats.official).toBeGreaterThan(0);
  expect(payload.stats.extended).toBeGreaterThan(0);
  const sample = payload.institutions[0];
  expect(Number.isFinite(sample.latitude)).toBe(true);
  expect(Number.isFinite(sample.longitude)).toBe(true);
  expect(['duolingo', 'extended']).toContain(sample.source);
  expect(typeof sample.verified).toBe('boolean');
});

test('the map loads the catalogue and filters it', async ({ page }) => {
  await page.goto('/institutions');
  await page.getByRole('button', { name: /Интерактивная карта/ }).click();
  await expect(page.getByText(/Найдено/i)).toBeVisible({ timeout: 20000 });
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20000 });

  const found = page.locator('[data-testid="map-found-count"]');
  await expect(found).toContainText(/12\s?5\d\d|[1-9]\d{4}/);

  await page.getByPlaceholder(/Поиск/).fill('Harvard');
  await expect(found).not.toContainText(/12\s?5\d\d/);

  await page.getByLabel('Страна').selectOption({ label: 'United States' });
  await expect(found).toContainText(/\d/);
});
