import { test, expect } from '@playwright/test';

const API = process.env.FULLSTACK_API_URL || 'http://localhost:18081';

test.describe('real backend + PostgreSQL', () => {
  test('registration, plan, diagnostic, response, error notebook and isolation', async ({
    request,
    page,
  }) => {
    const health = await request.get(`${API}/api/v1/ready`);
    expect(health.status()).toBe(200);

    const email = `e2e-${Date.now()}@example.com`;
    const register = await request.post(`${API}/api/v1/auth/register`, {
      data: { email, password: 'strongPassword123!', name: 'E2E Student', locale: 'ru' },
    });
    expect(register.status()).toBe(201);
    const auth = await register.json();
    expect(auth.token).toBeTruthy();
    expect(auth.user.email).toBe(email);

    const plan = await request.get(`${API}/api/v1/user/plan`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    expect(plan.status()).toBe(200);
    const planBody = await plan.json();
    expect(Array.isArray(planBody.tasksToday)).toBe(true);
    expect(planBody.tasksToday.length).toBeGreaterThan(0);

    const start = await request.post(`${API}/api/v1/test/sessions`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      data: { candidateName: 'E2E Student', difficultyLevel: 'B1', mode: 'diagnostic' },
    });
    expect(start.status()).toBe(201);
    const startBody = await start.json();
    expect(startBody.session.mode).toBe('diagnostic');
    expect(startBody.questions.length).toBeGreaterThan(0);

    const sessionID = startBody.session.id;
    const question = startBody.questions[0];
    const answer =
      question.type === 'READ_SELECT'
        ? { isReal: true }
        : question.type === 'FILL_BLANKS'
        ? { answer: 'ergy' }
        : question.type === 'C_TEST'
        ? { answers: ['orporate', 'nimize', 'eated'] }
        : { text: 'The library provides free access to academic journals and students use it every day.' };

    const respond = await request.post(`${API}/api/v1/test/sessions/${sessionID}/respond`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      data: { questionId: question.id, userResponse: answer, rawScore: 0, timeSpentSec: 5 },
    });
    expect(respond.status()).toBe(200);
    expect(await respond.json()).toEqual({ status: 'recorded' });

    const stage = await request.post(`${API}/api/v1/test/sessions/${sessionID}/stage-complete`, {
      headers: { Authorization: `Bearer ${auth.token}` },
      data: { stageName: startBody.session.stageName, accuracy: 0.5 },
    });
    expect(stage.status()).toBe(200);

    const errors = await request.get(`${API}/api/v1/user/errors`, {
      headers: { Authorization: `Bearer ${auth.token}` },
    });
    expect(errors.status()).toBe(200);

    const registerB = await request.post(`${API}/api/v1/auth/register`, {
      data: {
        email: `e2e-b-${Date.now()}@example.com`,
        password: 'strongPassword123!',
        name: 'E2E B',
        locale: 'ru',
      },
    });
    const authB = await registerB.json();
    const forbidden = await request.get(`${API}/api/v1/test/sessions/${sessionID}`, {
      headers: { Authorization: `Bearer ${authB.token}` },
    });
    expect(forbidden.status()).toBe(403);

    const missingCert = await request.get(`${API}/api/v1/certificates/definitely-missing`);
    expect(missingCert.status()).toBe(404);

    await page.addInitScript((token) => {
      localStorage.setItem('det_auth_token', token);
      localStorage.setItem('det_cookie_consent', 'true');
      localStorage.removeItem('det_active_test_attempt_v2');
    }, auth.token);
    await page.goto('/dashboard');
    await expect(page.getByText('Задания на сегодня')).toBeVisible({ timeout: 20_000 });
  });
});
