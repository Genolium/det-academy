import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

test('the writing trainer opens an editable field with a prompt', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  await page.goto('/practice');

  const startWriting = page.getByRole('button', { name: /Тренировать письмо/i });
  await expect(startWriting).toBeVisible();
  await startWriting.click();

  // The drill must render the prompt and an editable textarea (the slug
  // mismatch used to render an empty card with no input).
  const editor = page.getByPlaceholder(/This photograph showcases/i);
  await expect(editor).toBeVisible();

  await editor.click();
  await editor.fill('This photograph portrays a scientist working with precision instruments in a modern laboratory.');
  await expect(editor).toHaveValue(/precision instruments/);

  const wordCounter = page.getByText(/Слов:/).first();
  await expect(wordCounter).toBeVisible();
});

test('the vocabulary offers a pronunciation button next to the word', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await mockApi(page);

  // Block the external dictionary lookup so the test stays offline; the button
  // must still work through the browser voice fallback.
  await page.route('**/api.dictionaryapi.dev/**', (route) => route.abort());

  await page.goto('/vocabulary');

  const speaker = page.getByRole('button', { name: /Прослушать произношение/i }).first();
  await expect(speaker).toBeVisible();
  await speaker.click();
  await expect(speaker).toBeEnabled();
});
