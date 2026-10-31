import { test, expect } from '@playwright/test';

const HUBS = [
  { path: '/vocabulary', canonical: '/vocabulary' },
  { path: '/institutions', canonical: '/institutions' },
  { path: '/theory', canonical: '/theory' },
  { path: '/privacy', canonical: '/privacy' },
];

for (const hub of HUBS) {
  test(`${hub.path} has its own title and canonical`, async ({ page }) => {
    await page.goto(hub.path);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(10);
    expect(title).not.toBe(
      'DET Academy | Интерактивная платформа подготовки к Duolingo English Test'
    );
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', new RegExp(`${hub.canonical}/?$`));
  });
}

test('theory lesson renders content for crawlers without the auth spinner', async ({ page }) => {
  await page.goto('/theory/rules-and-technicalities');
  await expect(page.getByText('Проверяем сессию')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
