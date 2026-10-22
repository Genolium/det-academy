import { test, expect } from '@playwright/test';

test('the map catalogue contains only verified official institutions', async ({ request }) => {
  const response = await request.get('/registry/institutions-map');
  expect(response.ok()).toBe(true);
  const payload = await response.json();
  expect(payload.institutions.length).toBeGreaterThanOrEqual(700);
  expect(payload.stats.withCoordinates).toBe(payload.institutions.length);
  expect(payload.stats.countries).toBeGreaterThanOrEqual(30);
  expect(payload.stats.official).toBe(payload.institutions.length);
  expect(payload.stats.extended).toBe(0);

  const sample = payload.institutions[0];
  expect(Number.isFinite(sample.latitude)).toBe(true);
  expect(Number.isFinite(sample.longitude)).toBe(true);
  expect(sample.source).toBe('duolingo');
  expect(sample.verified).toBe(true);
  expect(sample.coordinateSource).toContain('wikipedia.org');

  // The old generated catalogue pinned these institutions in Los Angeles.
  // University of Illinois remains excluded because the registry name is
  // ambiguous between the system and its campuses.
  expect(payload.institutions.some((item: { name: string }) => item.name === 'University of Illinois')).toBe(false);
  const westminster = payload.institutions.find((item: { name: string }) => item.name === 'Westminster College (Pennsylvania)');
  expect(Math.abs(westminster.latitude - 41.1178)).toBeLessThan(0.01);
  expect(Math.abs(westminster.longitude - -80.3294)).toBeLessThan(0.01);
  const chicago = payload.institutions.find((item: { name: string }) => item.name === 'The University of Chicago');
  expect(Math.abs(chicago.latitude - 41.7897)).toBeLessThan(0.01);
  expect(Math.abs(chicago.longitude - -87.5997)).toBeLessThan(0.01);
});

test('the map loads the catalogue and filters it', async ({ page }) => {
  await page.goto('/institutions');
  await page.getByRole('button', { name: /Интерактивная карта/ }).click();
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20000 });

  const found = page.locator('[data-testid="map-found-count"]');
  await expect(found).toContainText('771');

  await page.getByPlaceholder(/Поиск/).fill('Harvard');
  await expect(found).not.toContainText('771');

  await page.getByLabel('Страна').selectOption({ index: 1 });
  await expect(found).toContainText(/\d/);
});
