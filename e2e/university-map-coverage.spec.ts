import { test, expect } from '@playwright/test';

const CATALOG_URL = '/registry/institutions-map';

test('the map catalogue is verified and complete', async ({ request }) => {
  const response = await request.get(CATALOG_URL);
  expect(response.ok()).toBe(true);
  const payload = await response.json();

  expect(payload.institutions.length).toBeGreaterThanOrEqual(2000);
  expect(payload.stats.withCoordinates).toBe(payload.institutions.length);
  expect(payload.stats.withCity).toBeGreaterThanOrEqual(1900);
  expect(payload.stats.withScore).toBeGreaterThanOrEqual(1300);
  expect(payload.stats.countries).toBeGreaterThanOrEqual(80);
  expect(payload.stats.official).toBe(payload.institutions.length);
  expect(payload.stats.extended).toBe(0);

  for (const category of [
    'Ivy League',
    'Top Global',
    'Top STEM',
    'Public Research',
    'Private Research',
    'Public University',
    'Liberal Arts',
    'Community College',
  ]) {
    expect(payload.stats.categories[category] || 0).toBeGreaterThan(0);
  }

  const sample = payload.institutions[0];
  expect(Number.isFinite(sample.latitude)).toBe(true);
  expect(Number.isFinite(sample.longitude)).toBe(true);
  expect(sample.source).toBe('duolingo');
  expect(sample.verified).toBe(true);
  expect(sample.coordinateSource).toContain('wikipedia.org');

  const byName = (name: string) =>
    payload.institutions.find((item: { name: string }) => item.name === name);

  const harvard = byName('Harvard University');
  expect(harvard.city).toBe('Cambridge');
  expect(harvard.state).toBe('Massachusetts');
  expect(harvard.minScore).toBeGreaterThan(0);
  expect(harvard.latitude).toBeCloseTo(42.3744, 2);
  expect(harvard.longitude).toBeCloseTo(-71.1169, 2);

  const stanford = byName('Stanford University');
  expect(stanford.city).toBe('Stanford');
  expect(stanford.latitude).toBeCloseTo(37.4275, 2);
  expect(stanford.longitude).toBeCloseTo(-122.1703, 2);

  const westminster = byName('Westminster College (Pennsylvania)');
  expect(westminster.city).toBe('New Wilmington');
  expect(westminster.state).toBe('Pennsylvania');
  expect(westminster.latitude).toBeCloseTo(41.1178, 2);
  expect(westminster.longitude).toBeCloseTo(-80.3294, 2);

  // The old generated catalogue pinned this institution in Los Angeles.
  expect(byName('University of Illinois')).toBeUndefined();
});

test('the map shows scores, cities and working category filters', async ({ page }) => {
  await page.goto('/institutions');
  // The map is the default tab.
  await expect(page.getByRole('button', { name: /Карта с проверенными координатами/ })).toBeVisible();
  await expect(page.locator('.leaflet-container')).toBeVisible({ timeout: 20000 });

  const found = page.locator('[data-testid="map-found-count"]');
  await expect(found).toContainText('2185');

  for (const category of ['Ivy League', 'Top Global', 'Community College', 'Liberal Arts']) {
    await expect(page.getByRole('button', { name: new RegExp(category) })).toBeVisible();
  }

  await page.getByPlaceholder(/Поиск/).fill('Harvard University');
  const card = page.getByRole('option', { name: /Harvard University/ }).first();
  await expect(card).toBeVisible();
  await expect(card).toContainText('125');
  await expect(card).toContainText('Cambridge');
});

test('every admission requirement carries provenance and unknown stays unknown', async ({ request }) => {
  const response = await request.get(CATALOG_URL);
  expect(response.ok()).toBe(true);
  const payload = await response.json();

  const sample = payload.institutions.slice(0, 200);
  expect(sample.length).toBeGreaterThan(0);

  for (const institution of sample) {
    expect(institution.requirementSource).toBe('https://englishtest.duolingo.com/institutions');
    expect(institution.requirementCheckedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(institution.requirementVerified).toBe(false);
    expect(Number.isFinite(institution.minScore)).toBe(true);
  }

  // An absent threshold is represented as 0 ("unknown"), never as an invented score.
  const unknown = payload.institutions.filter((item: { minScore: number }) => !item.minScore);
  expect(unknown.length).toBeGreaterThan(0);
  for (const institution of unknown) {
    expect(institution.minScore).toBe(0);
  }
});
