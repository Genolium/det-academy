import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

const adaptivePlan = {
  focusType: 'READ_SELECT',
  focusSlug: 'read-and-select',
  title: 'Адаптивная практика: Read and Select',
  reason: '2 неусвоенных ошибок типа READ_SELECT. Сначала закройте их.',
  errorCount: 2,
  minutes: 10,
  errorIds: ['err-1', 'err-2'],
};

test.describe('adaptive practice', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('det_auth_token', 'token-user-a');
      localStorage.setItem('det_cookie_consent', 'true');
    });
    await mockApi(page);
    await page.route('**/api/v1/user/practice/adaptive', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(adaptivePlan),
      })
    );
  });

  test('opens the error-driven set from the dashboard in one click', async ({ page }) => {
    await page.goto('/dashboard');
    const link = page.getByRole('link', { name: /Адаптивная практика из ошибок/ });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/practice\/adaptive$/);
    await expect(page.getByRole('heading', { name: adaptivePlan.title })).toBeVisible();
    await expect(page.getByText(adaptivePlan.reason)).toBeVisible();
    await expect(page.getByText('2 неусвоенных ошибок', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Открыть тренажёр/ })).toHaveAttribute(
      'href',
      '/practice?drill=read-and-select'
    );
  });

  test('shows a recoverable error when the set cannot be built', async ({ page }) => {
    await page.unroute('**/api/v1/user/practice/adaptive');
    await page.route('**/api/v1/user/practice/adaptive', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );
    await page.goto('/practice/adaptive');
    await expect(page.getByRole('alert').filter({ hasText: 'Не удалось собрать набор' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Пересобрать/ })).toBeVisible();
  });
});
