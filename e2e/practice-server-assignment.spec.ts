import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('practice drill renders the exact server assignment and submits once', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);
  await page.route('**/api/v1/user/practice/assignment?type=READ_SELECT', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        assignmentId: 'asgn-server-1',
        questionId: 'q-rs-server',
        questionType: 'READ_SELECT',
        difficultyBand: 'B2',
        contentPayload: { word: 'meticulous' },
        timeLimitSec: 5,
        createdAt: '2026-10-29T10:00:00Z',
      }),
    })
  );
  let submitted: Record<string, unknown> | null = null;
  await page.route('**/api/v1/user/practice/attempts', (route) => {
    submitted = route.request().postDataJSON() as Record<string, unknown>;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'attempt-1', assignmentId: 'asgn-server-1', questionId: 'q-rs-server',
        questionType: 'READ_SELECT', isCorrect: true, score: 1, serverGraded: true, xpAwarded: 15,
      }),
    });
  });

  await page.goto('/practice?drill=read-and-select');
  const panel = page.getByTestId('server-assignment');
  await expect(panel).toBeVisible();
  await expect(panel.getByText('meticulous')).toBeVisible();
  await expect(panel.getByText('Серверное задание')).toBeVisible();
  await panel.getByRole('button', { name: 'Реальное' }).click();
  await panel.getByRole('button', { name: 'Проверить на сервере' }).click();
  await expect(panel.getByText(/Результат подтверждён сервером/)).toBeVisible();
  expect(submitted).toMatchObject({
    assignmentId: 'asgn-server-1',
    questionType: 'READ_SELECT',
    userResponse: { isReal: true },
  });
});
