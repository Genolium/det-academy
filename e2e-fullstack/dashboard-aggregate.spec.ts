import { test, expect } from '@playwright/test';

const API = process.env.FULLSTACK_API_URL || 'http://localhost:18081';

test('dashboard aggregate returns goals, theory, sessions and errors in one payload', async ({ request }) => {
  const email = `dashboard-${Date.now()}@example.com`;
  const registered = await request.post(`${API}/api/v1/auth/register`, {
    data: { email, password: 'strongPassword123!', name: 'Dashboard Student', locale: 'ru' },
  });
  expect(registered.status()).toBe(201);
  const auth = await registered.json();
  const headers = { Authorization: `Bearer ${auth.token}` };

  const goals = await request.put(`${API}/api/v1/user/goals`, {
    headers,
    data: { targetScore: 125, targetDate: '2026-12-31', dailyMinutes: 45 },
  });
  expect(goals.status()).toBe(200);

  const dashboard = await request.get(`${API}/api/v1/user/dashboard?utc_offset_minutes=0`, { headers });
  expect(dashboard.status()).toBe(200);
  const payload = await dashboard.json();

  expect(payload.theory.totalLessons).toBe(13);
  expect(payload.goalsConfigured).toBe(true);
  expect(payload.studyPlan.configured).toBe(true);
  expect(payload.studyPlan.targetScore).toBe(125);
  expect(Array.isArray(payload.sessions)).toBe(true);
  expect(Array.isArray(payload.errors)).toBe(true);
  expect(payload.streak).toBeTruthy();
  expect(payload.bestWpm).toBeGreaterThanOrEqual(0);
  expect(JSON.stringify(payload.sessions)).not.toContain('contentSnapshot');
});
