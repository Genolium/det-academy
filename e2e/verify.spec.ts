import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test.describe('public certificate registry', () => {
  test('an unknown certificate is a not-found result, not a network error', async ({ page }) => {
    await mockApi(page);
    await page.goto('/verify/does-not-exist');

    await expect(page.getByRole('heading', { name: 'Сертификат не найден' })).toBeVisible();
    await expect(page.getByText(/не зарегистрирован в реестре отчётов DET Academy/)).toBeVisible();
  });

  test('a registry outage is reported separately from a missing certificate', async ({ page }) => {
    await page.route('**/api/v1/certificates/**', (route) => route.abort('failed'));
    await page.goto('/verify/any-id');

    await expect(page.getByRole('heading', { name: 'Реестр недоступен' })).toBeVisible();
    await expect(
      page.getByText(/не означает, что сертификат отсутствует/)
    ).toBeVisible();
  });

  test('a registered report shows the platform registry status', async ({ page }) => {
    await page.route('**/api/v1/certificates/**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          id: 'det-cert-12345678',
          userId: 'user-a',
          testSessionId: 'session-a',
          candidateName: 'User A',
          overallScore: 125,
          literacyScore: 125,
          comprehensionScore: 125,
          productionScore: 125,
          conversationScore: 125,
          issuedAt: new Date().toISOString(),
          isVerified: true,
        }),
      })
    );

    await page.goto('/verify/det-cert-12345678');

    await expect(page.getByText('Зарегистрирован в реестре DET Academy')).toBeVisible();
    await expect(page.getByText('Тренировочная оценка (Overall Estimate)')).toBeVisible();
    await expect(page.getByText(/Не является официальным свидетельством Duolingo/)).toBeVisible();
  });
});
