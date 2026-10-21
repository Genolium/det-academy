import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

const errorItem = (id: string, prompt: string) => ({
  id,
  userId: 'user-a',
  type: 'READ_SELECT',
  prompt,
  userAnswer: 'No',
  correctAnswer: 'Yes',
  explanation: '',
  consecutiveSuccesses: 0,
  attemptsCount: 1,
  mastered: false,
  createdAt: new Date().toISOString(),
});

test.describe('client auth session adapter', () => {
  test('a legacy token key is migrated and removed', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('det_token', 'legacy-token-value');
      localStorage.removeItem('det_auth_token');
    });

    await mockApi(page);
    await page.goto('/');

    await expect
      .poll(() =>
        page.evaluate(() => ({
          canonical: localStorage.getItem('det_auth_token'),
          legacy: localStorage.getItem('det_token'),
        }))
      )
      .toEqual({ canonical: 'legacy-token-value', legacy: null });
  });

  test('switching users does not reveal the previous user\'s error notebook', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('det_cookie_consent', 'true');
      if (localStorage.getItem('det_e2e_seeded') === 'true') return;
      localStorage.setItem('det_e2e_seeded', 'true');
      localStorage.setItem('det_auth_token', 'token-user-a');
      localStorage.setItem(
        'det_error_notebook_user-a',
        JSON.stringify([
          {
            id: 'a-cache-1',
            type: 'READ_SELECT',
            prompt: 'USER A CACHED SECRET',
            userAnswer: 'No',
            correctAnswer: 'Yes',
            timestamp: new Date().toISOString(),
            consecutiveSuccesses: 0,
            attemptsCount: 1,
            mastered: false,
          },
        ])
      );
      localStorage.setItem(
        'det_error_notebook_user-b',
        JSON.stringify([
          {
            id: 'b-cache-1',
            type: 'READ_SELECT',
            prompt: 'USER B CACHED SECRET',
            userAnswer: 'No',
            correctAnswer: 'Yes',
            timestamp: new Date().toISOString(),
            consecutiveSuccesses: 0,
            attemptsCount: 1,
            mastered: false,
          },
        ])
      );
    });

    await mockApi(page, {
      errorsForToken: (token) =>
        token === 'token-user-a' ? [errorItem('a-server-1', 'USER A SERVER ERROR')] : [],
    });

    await page.goto('/dashboard');
    await expect(page.getByText('USER A SERVER ERROR')).toBeVisible();
    await expect(page.getByText('USER B CACHED SECRET')).toHaveCount(0);

    // Log out through the same UI a real user uses.
    await page.getByRole('button', { name: /U User/ }).click();
    await page.getByRole('button', { name: /Выйти/ }).click();
    await expect(page.getByRole('button', { name: /Войти/ }).first()).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('det_auth_token'))).toBeNull();

    // Sign in as B in the same tab. The server returns an empty notebook.
    await page.evaluate(() => {
      localStorage.setItem('det_auth_token', 'token-user-b');
    });
    await page.reload();

    await expect(page.getByText('Пользователь User B').or(page.getByText('User B')).first()).toBeVisible();
    await expect(page.getByText('USER A SERVER ERROR')).toHaveCount(0);
    await expect(page.getByText('USER A CACHED SECRET')).toHaveCount(0);
    await expect(page.getByText('USER B CACHED SECRET')).toHaveCount(0);
  });
});
