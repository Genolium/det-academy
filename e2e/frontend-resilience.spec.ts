import { test, expect } from '@playwright/test';

test('unknown routes render the branded not-found page', async ({ page }) => {
  await page.goto('/definitely-not-a-real-route');
  await expect(page.getByRole('heading', { name: /Страница не найдена/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /На главную/i })).toBeVisible();
});

test('locale persists and updates html lang', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('det_locale', 'en'));
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => document.documentElement.lang)).toBe('en');
});

test('robots, sitemap and lesson metadata are generated', async ({ page }) => {
  const robots = await page.request.get('/robots.txt');
  expect(robots.ok()).toBe(true);
  expect(await robots.text()).toContain('Sitemap:');

  const sitemap = await page.request.get('/sitemap.xml');
  expect(sitemap.ok()).toBe(true);
  expect(await sitemap.text()).toContain('/theory');

  const lesson = await page.request.get('/theory/rules-and-technicalities');
  expect(lesson.ok()).toBe(true);
  expect(await lesson.text()).toContain('Регламент тестирования');
});

test('admin routes are not indexable', async ({ page }) => {
  const admin = await page.request.get('/admin');
  expect(admin.ok()).toBe(true);
  expect((await admin.text()).toLowerCase()).toContain('noindex');
});
