import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

const plan = {
  focusType: 'READ_SELECT',
  focusSlug: 'read-and-select',
  title: 'Адаптивная практика: Read and Select',
  reason: '2 неусвоенных ошибок типа READ_SELECT. Сначала закройте их.',
  errorCount: 2,
  minutes: 10,
  errorIds: ['err-1', 'err-2'],
};

const errors = [
  {
    id: 'err-1',
    userId: 'user-a',
    type: 'READ_SELECT',
    prompt: 'Read and Select: "meticulous" — это настоящее слово?',
    userAnswer: 'No',
    correctAnswer: 'Yes',
    explanation: 'Meticulous means very careful and precise.',
    errorCategory: 'vocabulary',
    errorRule: 'real word',
    consecutiveSuccesses: 0,
    attemptsCount: 1,
    mastered: false,
    createdAt: '2026-10-20T10:00:00Z',
  },
  {
    id: 'err-2',
    userId: 'user-a',
    type: 'READ_SELECT',
    prompt: 'Read and Select: "blorpt" — это настоящее слово?',
    userAnswer: 'Yes',
    correctAnswer: 'No',
    explanation: 'Blorpt is a pseudo-word.',
    errorCategory: 'vocabulary',
    errorRule: 'pseudo word',
    consecutiveSuccesses: 0,
    attemptsCount: 1,
    mastered: false,
    createdAt: '2026-10-20T10:01:00Z',
  },
];

test.describe('adaptive practice session', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('det_auth_token', 'token-user-a');
      localStorage.setItem('det_cookie_consent', 'true');
    });
    await mockApi(page);
    await page.route('**/api/v1/user/practice/adaptive', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(plan) })
    );
    await page.route('**/api/v1/user/errors', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ errors, total: errors.length }),
        });
      }
      return route.fallback();
    });

    let recalls = 0;
    await page.route('**/api/v1/user/errors/err-1/recall', (route) => {
      recalls += 1;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          consecutiveSuccesses: recalls,
          mastered: recalls >= 2,
          correctAnswer: 'Yes',
          explanation: 'Meticulous means very careful and precise.',
          message: recalls >= 2 ? 'Ошибка усвоена.' : 'Верно, нужен ещё один успех.',
        }),
      });
    });
  });

  test('serves exactly the returned error IDs and requires two successes to master', async ({ page }) => {
    await page.goto('/practice/adaptive');

    await expect(page.getByTestId('adaptive-session')).toBeVisible();
    await expect(page.getByText('Read and Select: "meticulous"')).toBeVisible();
    await expect(page.getByText('2 точных заданий')).toBeVisible();
    await expect(page.getByText(/Задание 1 \/ 2/)).toBeVisible();

    const input = page.getByLabel('Ваш ответ');
    await input.fill('Yes');
    await page.getByRole('button', { name: 'Проверить' }).click();
    await expect(page.getByRole('status')).toContainText('нужен ещё один успех');
    await expect(page.getByText('Правильный ответ')).toBeVisible();

    await page.getByRole('button', { name: /Повторить/ }).click();
    await input.fill('Yes');
    await page.getByRole('button', { name: 'Проверить' }).click();
    await expect(page.getByRole('status')).toContainText('Ошибка усвоена');
    await expect(page.getByTestId('adaptive-mastered')).toContainText('1');

    await page.getByRole('button', { name: /Следующая ошибка/ }).click();
    await expect(page.getByText('Read and Select: "blorpt"')).toBeVisible();
    await expect(page.getByText(/Задание 1 \/ 1/)).toBeVisible();
  });

  test('renders a recoverable error when the set cannot be built', async ({ page }) => {
    await page.unroute('**/api/v1/user/practice/adaptive');
    await page.route('**/api/v1/user/practice/adaptive', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' })
    );
    await page.goto('/practice/adaptive');
    await expect(page.getByRole('alert').filter({ hasText: 'Не удалось собрать набор' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Пересобрать/ })).toBeVisible();
  });
});
