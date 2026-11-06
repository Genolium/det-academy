import { test, expect } from '@playwright/test';

const API = process.env.FULLSTACK_API_URL || 'http://localhost:18081';

test('the live catalogue exposes 13 trackable tasks and two references', async ({ request }) => {
  const catalog = await request.get(`${API}/api/v1/theory/catalog`);
  expect(catalog.status()).toBe(200);
  const payload = await catalog.json();
  const lessons: Array<{ slug: string; is_trackable: boolean }> = payload.lessons;
  expect(lessons).toHaveLength(15);
  expect(lessons.filter((lesson) => lesson.is_trackable)).toHaveLength(13);
  expect(lessons.filter((lesson) => !lesson.is_trackable).map((lesson) => lesson.slug).sort()).toEqual([
    'rules-and-technicalities',
    'subscores-and-cat-engine',
  ]);
  expect(lessons.map((lesson) => lesson.slug)).not.toContain('listen-and-select');
  expect(lessons.map((lesson) => lesson.slug)).not.toContain('read-aloud');
  expect(lessons.map((lesson) => lesson.slug)).not.toContain('read-listen-speak');
  expect(lessons.map((lesson) => lesson.slug)).toContain('interactive-speaking');
  expect(lessons.map((lesson) => lesson.slug)).toContain('read-then-speak');
});

test('progress is counted out of 13 and reference pages are not toggleable', async ({ request }) => {
  const email = `theory-${Date.now()}@example.com`;
  const registered = await request.post(`${API}/api/v1/auth/register`, {
    data: { email, password: 'strongPassword123!', name: 'Theory Student', locale: 'ru' },
  });
  expect(registered.status()).toBe(201);
  const auth = await registered.json();

  const progress = await request.get(`${API}/api/v1/theory/progress`, {
    headers: { Authorization: `Bearer ${auth.token}` },
  });
  expect(progress.status()).toBe(200);
  expect(await progress.json()).toMatchObject({ totalLessons: 13, progressPercent: 0, isAllCompleted: false });

  const reference = await request.post(`${API}/api/v1/theory/toggle`, {
    headers: { Authorization: `Bearer ${auth.token}` },
    data: { lessonSlug: 'rules-and-technicalities' },
  });
  expect(reference.status()).toBe(400);

  const task = await request.post(`${API}/api/v1/theory/toggle`, {
    headers: { Authorization: `Bearer ${auth.token}` },
    data: { lessonSlug: 'read-and-select' },
  });
  expect(task.status()).toBe(200);
  const toggled = await task.json();
  expect(toggled.totalLessons).toBe(13);
  expect(toggled.completedLessons).toContain('read-and-select');
});
