import { test, expect } from '@playwright/test';
import { mockApi } from './mocks';

const planForConfiguredUser = {
  configured: true,
  targetScore: 135,
  targetDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
  daysRemaining: 60,
  dailyMinutes: 30,
  currentEstimate: 110,
  weakestSkill: 'Writing',
  weeklyHoursNeeded: 3.5,
  readinessAvailable: false,
  readinessPercent: 0,
  readinessBasis: 'Недостаточно данных: нужен минимум 2 завершённых mock-теста (сейчас 1).',
  statusMessage: '',
  tasksToday: [
    {
      id: 'task-srs',
      type: 'srs',
      title: 'Интервальное повторение AWL',
      description: '12 карточек',
      actionUrl: '/practice/flashcards',
      priority: 'HIGH',
      estimatedMinutes: 5,
      reason: 'Пора повторить 12 карточек: интервал SRS подошёл к концу.',
      completed: false,
    },
  ],
};

test('a new account must choose its own goal before any plan appears', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });

  await mockApi(page);

  // The server reports that no goal is configured yet.
  await page.route('**/api/v1/user/goals', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ userId: 'user-a', targetScore: 130, targetDate: '2027-05-01', dailyMinutes: 30 }) });
      return;
    }
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ configured: false, goal: null }) });
  });
  await page.route('**/api/v1/user/plan', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ configured: false }),
    });
  });

  let putBody: Record<string, unknown> | null = null;
  page.on('request', (request) => {
    if (request.method() === 'PUT' && request.url().includes('/user/goals')) {
      try {
        putBody = request.postDataJSON();
      } catch {
        putBody = null;
      }
    }
  });

  await page.goto('/dashboard');

  const onboarding = page.getByRole('heading', { level: 2, name: /Задайте цель подготовки|Set your preparation goal/ });
  await expect(onboarding).toBeVisible();

  // No fabricated readiness is shown.
  await expect(page.getByText(/Готовность к экзамену:\s*нет данных/)).toBeVisible();

  // The student chooses the goal themselves.
  await page.getByRole('spinbutton', { name: /Целевой балл DET|Target DET score/ }).fill('130');
  await page.getByRole('combobox', { name: /Время в день|Time per day/ }).selectOption('30');
  await page.getByRole('button', { name: /Сохранить цель|Save goal/ }).click();

  await expect.poll(() => putBody).not.toBeNull();
  expect(putBody).toMatchObject({ targetScore: 130, dailyMinutes: 30 });
});

test('readiness is explained and tasks carry a reason and a time estimate', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('det_auth_token', 'token-user-a');
    localStorage.setItem('det_cookie_consent', 'true');
  });

  await mockApi(page);
  await page.route('**/api/v1/user/plan', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(planForConfiguredUser) });
  });
  await page.route('**/api/v1/user/goals', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ configured: true, goal: { userId: 'user-a', targetScore: 135, targetDate: planForConfiguredUser.targetDate, dailyMinutes: 30 } }),
    });
  });

  await page.goto('/dashboard');

  await expect(page.getByText(/Недостаточно данных: нужен минимум 2 завершённых mock-теста/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ваш уровень' })).toBeVisible();
  await expect(page.getByText(/по диагностике/)).toBeVisible();
  // The weekly league is feature-flagged off until NEXT_PUBLIC_ARENA_ENABLED.
  await expect(page.getByText('Лига недели')).toHaveCount(0);
  await expect(page.getByText('Лимиты на сегодня')).toBeVisible();
  await expect(page.getByText(/Пора повторить 12 карточек/)).toBeVisible();
  await expect(page.getByText(/Бюджет:/)).toBeVisible();
});
