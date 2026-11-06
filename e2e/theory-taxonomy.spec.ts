import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';
import { lessonsData } from '../src/data/theoryContent';

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


test('a reference guide loaded from the API is not counted as a lesson', async ({ page }) => {
  await page.route('**/api/v1/theory/catalog', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        version: '2026.3',
        status: 'published',
        lessons: lessonsData
          .filter((lesson) => lesson.slug !== 'start-here')
          .map((lesson) => ({
            id: lesson.slug,
            number: lesson.number,
            slug: lesson.slug,
            title_ru: lesson.titleRu,
            title_en: lesson.titleEn,
            category: lesson.category,
            category_label_ru: lesson.categoryLabelRu,
            category_label_en: lesson.categoryLabelEn,
            format: lesson.format,
            scoring: lesson.scoring,
            time_limit: lesson.timeLimit,
            rules: lesson.rules,
            strategy_steps: lesson.strategySteps,
            formula: lesson.formula || '',
            examples: lesson.examples,
            pitfalls: lesson.pitfalls,
            is_trackable: lesson.isTrackable !== false,
            publish_status: 'published',
            version: '2026.3',
            updated_at: new Date().toISOString(),
          })),
      }),
    })
  );

  await page.goto('/theory/rules-and-technicalities');
  await expect(page.getByText('Справочник').first()).toBeVisible();
  await expect(page.getByText(/УРОК 14/)).toHaveCount(0);
  await expect(page.getByText('Завершили изучение материала?')).toHaveCount(0);
});

test('a stale 16-slug progress response maps to three current lessons', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await page.route('**/api/v1/theory/progress', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        completedLessons: ['listen-and-select', 'read-aloud', 'read-listen-speak'],
        totalLessons: 16,
        progressPercent: 19,
        isAllCompleted: false,
      }),
    })
  );
  await page.goto('/theory');
  await expect(page.getByText(/3 \/ 13/)).toBeVisible();
});

test('reference-only progress stays at zero of thirteen', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });
  await page.route('**/api/v1/theory/progress', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        completedLessons: ['rules-and-technicalities', 'subscores-and-cat-engine'],
        totalLessons: 16,
        progressPercent: 13,
        isAllCompleted: false,
      }),
    })
  );
  await page.goto('/theory');
  await expect(page.getByText(/0 \/ 13/)).toBeVisible();
});
