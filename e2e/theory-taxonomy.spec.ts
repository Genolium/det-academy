import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test('theory catalogue exposes 13 tasks and separate references', async ({ page }) => {
  await page.goto('/theory');
  await expect(page.getByText(/13 типов заданий/)).toBeVisible();
  await expect(page.getByTestId('theory-task-card')).toHaveCount(13);
  await expect(page.getByTestId('theory-reference-card')).toHaveCount(3); // start-here + 2 guides
  await expect(page.getByText('Listen and Select')).toHaveCount(0);
  await expect(page.getByText('Read Aloud')).toHaveCount(0);
  await expect(page.getByText('Listen, Then Speak')).toHaveCount(0);
  await expect(page.getByText('Read / Listen, Then Speak')).toHaveCount(0);
});

test('interactive speaking and read then speak are current lessons', async ({ page }) => {
  await page.goto('/theory/interactive-speaking');
  await expect(page.getByRole('heading', { name: /Interactive Speaking/ }).first()).toBeVisible();
  await expect(page.getByText(/6–8/).first()).toBeVisible();
  await expect(page.getByText(/35 секунд/).first()).toBeVisible();

  await page.goto('/theory/read-then-speak');
  await expect(page.getByRole('heading', { name: /Read, Then Speak/ }).first()).toBeVisible();
  await expect(page.getByText(/Listen, Then Speak/)).toHaveCount(0);
});

test('retired lesson URLs redirect', async ({ page }) => {
  for (const [from, to] of [
    ['/theory/listen-and-select', '/theory/fill-in-the-blanks'],
    ['/theory/read-aloud', '/theory/read-then-speak'],
    ['/theory/read-listen-speak', '/theory/read-then-speak'],
  ]) {
    await page.goto(from);
    await expect(page).toHaveURL(new RegExp(`${to}$`));
  }
});
