#!/usr/bin/env node
/**
 * HTTP load smoke test for the mock-exam and speaking paths.
 *
 * It exercises the real backend, not a stub: register, diagnostic session,
 * question answers, the DB-heavy study plan, a full session walked to a
 * speaking stage, and a real audio upload. Thresholds are pass/fail.
 *
 *   node scripts/load_test.mjs --profile=mock,speaking \
 *     --base=http://127.0.0.1:18080 --mock-requests=24 --speaking-requests=2 \
 *     --p95=2000 --error-rate=0.02
 *
 * Use a disposable local database: the script creates a load-test user and
 * leaves sessions behind. It never runs against production unless --base is
 * passed explicitly, and it refuses non-local hosts without --allow-remote.
 */
const args = process.argv.slice(2);
const value = (name, fallback) => {
  const found = args.find((arg) => arg.startsWith(`--${name}=`));
  return found ? found.split('=').slice(1).join('=') : fallback;
};
const has = (name) => args.includes(`--${name}`) || args.some((arg) => arg.startsWith(`--${name}=`));

const base = value('base', 'http://127.0.0.1:18080').replace(/\/$/, '');
const profiles = new Set(value('profile', 'mock,speaking').split(',').map((item) => item.trim()));
const mockRequests = Number(value('mock-requests', '24'));
const speakingRequests = Number(value('speaking-requests', '2'));
const concurrency = Math.max(1, Number(value('concurrency', '3')));
const p95Limit = Number(value('p95', '2000'));
const errorRateLimit = Number(value('error-rate', '0.02'));
const allowRemote = has('allow-remote');

if (!/^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/.test(base) && !allowRemote) {
  console.error('Refusing a non-local base URL without --allow-remote');
  process.exit(2);
}

const email = value('email', `loadtest-${Date.now()}@example.com`);
const password = value('password', 'LoadTest123!');
const samples = [];
let token = '';

const wav = (() => {
  const sampleRate = 16000;
  const samplesCount = sampleRate / 2;
  const data = Buffer.alloc(samplesCount * 2);
  for (let index = 0; index < samplesCount; index += 1) {
    data.writeInt16LE(Math.round(220 * Math.sin((2 * Math.PI * 220 * index) / sampleRate)), index * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
})();

async function timed(name, request) {
  const started = performance.now();
  let status = 0;
  let body = null;
  let error = null;
  try {
    const response = await request();
    status = response.status;
    const text = await response.text();
    body = text ? JSON.parse(text) : null;
  } catch (caught) {
    error = caught instanceof Error ? caught.message : String(caught);
  }
  const duration = performance.now() - started;
  const ok = status >= 200 && status < 400 && !error;
  samples.push({ name, status, duration, ok, error });
  if (!ok) {
    console.error(`  FAIL ${name}: status=${status} ${error ?? JSON.stringify(body)?.slice(0, 160) ?? ''}`);
  }
  return { status, body, ok, duration };
}

function authHeaders(extra = {}) {
  return { authorization: `Bearer ${token}`, ...extra };
}

async function authenticate() {
  const register = await timed('auth.register', () =>
    fetch(`${base}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password, name: 'Load Test' }),
    })
  );
  if (register.body?.token) {
    token = register.body.token;
    return;
  }
  const login = await timed('auth.login', () =>
    fetch(`${base}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  );
  token = login.body?.token ?? '';
  if (!token) throw new Error('authentication failed');
}

async function startSession(mode) {
  const started = await timed(`session.start.${mode}`, () =>
    fetch(`${base}/api/v1/test/sessions`, {
      method: 'POST',
      headers: authHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify({ mode, candidateName: 'Load Test' }),
    })
  );
  const session = started.body?.session;
  const questions = started.body?.questions ?? [];
  if (!session?.id) throw new Error('session start returned no id');
  return { session, questions };
}

async function answerFirstQuestion(sessionId, questions) {
  const question = questions.find((item) => item.type === 'READ_SELECT') ?? questions[0];
  if (!question) return;
  await timed('question.respond', () =>
    fetch(`${base}/api/v1/test/sessions/${encodeURIComponent(sessionId)}/respond`, {
      method: 'POST',
      headers: authHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify({
        questionId: question.id,
        userResponse: { selected: [] },
        rawScore: 0.5,
        timeSpentSec: 5,
      }),
    })
  );
}

async function refreshSession(sessionId) {
  const result = await timed('session.get', () =>
    fetch(`${base}/api/v1/test/sessions/${encodeURIComponent(sessionId)}`, {
      headers: authHeaders(),
    })
  );
  return result.body;
}

async function completeStage(sessionId, stageName) {
  return timed('stage.complete', () =>
    fetch(`${base}/api/v1/test/sessions/${encodeURIComponent(sessionId)}/stage-complete`, {
      method: 'POST',
      headers: authHeaders({ 'content-type': 'application/json' }),
      body: JSON.stringify({ stageName, accuracy: 0.5 }),
    })
  );
}

async function readOnlyIteration() {
  await timed('health.get', () => fetch(`${base}/api/v1/health`));
  await timed('ready.get', () => fetch(`${base}/api/v1/ready`));
  await timed('vocabulary.get', () => fetch(`${base}/api/v1/vocabulary?limit=20`));
  await timed('institutions.get', () => fetch(`${base}/api/v1/institutions`));
  await timed('theory.get', () => fetch(`${base}/api/v1/theory/lessons`));
}

async function mockIteration() {
  const { session, questions } = await startSession('diagnostic');
  await answerFirstQuestion(session.id, questions);
  await timed('plan.get', () => fetch(`${base}/api/v1/user/plan`, { headers: authHeaders() }));
  await timed('adaptive.get', () =>
    fetch(`${base}/api/v1/user/practice/adaptive`, { headers: authHeaders() })
  );
  await completeStage(session.id, session.stageName);
}

async function speakingIteration() {
  const { session } = await startSession('full');
  let current = session;
  for (let step = 0; step < 12; step += 1) {
    const stage = current.stageName ?? current.session?.stageName;
    if (!stage) throw new Error('session has no stage');
    if (String(stage).includes('SPEAK')) {
      const question = (current.questions ?? [])[0];
      if (!question) throw new Error('speaking stage has no question');
      const form = new FormData();
      form.append('audio', new Blob([wav], { type: 'audio/wav' }), 'loadtest.wav');
      form.append('questionId', question.id);
      form.append('transcript', 'I describe the scene in detail for the load test.');
      form.append('durationSec', '0.5');
      await timed('speaking.upload', () =>
        fetch(`${base}/api/v1/test/sessions/${encodeURIComponent(session.id)}/audio`, {
          method: 'POST',
          headers: authHeaders(),
          body: form,
        })
      );
      return;
    }
    await completeStage(session.id, stage);
    current = await refreshSession(session.id);
  }
  throw new Error('speaking stage was not reached in 12 steps');
}

async function pool(items, worker, size) {
  let index = 0;
  const runners = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      await worker(items[current], current);
    }
  });
  await Promise.all(runners);
}

function percentile(values, ratio) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
}

function report(name, filter) {
  const group = samples.filter((sample) => filter(sample.name));
  if (group.length === 0) return null;
  const durations = group.map((sample) => sample.duration);
  const failures = group.filter((sample) => !sample.ok).length;
  return {
    name,
    count: group.length,
    p50: percentile(durations, 0.5),
    p95: percentile(durations, 0.95),
    max: Math.max(...durations),
    errors: failures,
    errorRate: failures / group.length,
  };
}

try {
  if (profiles.has('readonly')) {
    await pool(
      Array.from({ length: mockRequests }, (_, index) => index),
      async () => {
        try {
          await readOnlyIteration();
        } catch (error) {
          samples.push({ name: 'readonly.iteration', status: 0, duration: 0, ok: false, error: error.message });
        }
      },
      concurrency
    );
  }
  if (profiles.has('mock') || profiles.has('speaking')) {
    await authenticate();
  }
  if (profiles.has('mock')) {
    await pool(
      Array.from({ length: mockRequests }, (_, index) => index),
      async () => {
        try {
          await mockIteration();
        } catch (error) {
          console.error(`  mock iteration failed: ${error.message}`);
          samples.push({ name: 'mock.iteration', status: 0, duration: 0, ok: false, error: error.message });
        }
      },
      concurrency
    );
  }
  if (profiles.has('speaking')) {
    await pool(
      Array.from({ length: speakingRequests }, (_, index) => index),
      async () => {
        try {
          await speakingIteration();
        } catch (error) {
          console.error(`  speaking iteration failed: ${error.message}`);
          samples.push({ name: 'speaking.iteration', status: 0, duration: 0, ok: false, error: error.message });
        }
      },
      1
    );
  }
} catch (error) {
  console.error(`FATAL ${error.message}`);
  process.exit(1);
}

const measured = samples.filter((sample) => !sample.name.startsWith('auth.'));
const failures = measured.filter((sample) => !sample.ok).length;
const errorRate = measured.length > 0 ? failures / measured.length : 1;
const p95 = percentile(measured.map((sample) => sample.duration), 0.95);

console.log('\nProfile report');
const groups = [
  report('all measured', () => true),
  report('session start', (name) => name.startsWith('session.start')),
  report('question answer', (name) => name === 'question.respond'),
  report('study plan', (name) => name === 'plan.get' || name === 'adaptive.get'),
  report('stage complete', (name) => name === 'stage.complete'),
  report('speaking upload', (name) => name === 'speaking.upload'),
  report('readonly GET', (name) => name.endsWith('.get')),
].filter(Boolean);
for (const group of groups) {
  console.log(
    `${group.name.padEnd(16)} n=${String(group.count).padEnd(4)} p50=${group.p50.toFixed(0)}ms p95=${group.p95.toFixed(0)}ms max=${group.max.toFixed(0)}ms errors=${group.errors}`
  );
}
console.log(`\nMeasured requests: ${measured.length}`);
console.log(`Overall p95: ${p95.toFixed(0)}ms (limit ${p95Limit}ms)`);
console.log(`Error rate: ${(errorRate * 100).toFixed(2)}% (limit ${(errorRateLimit * 100).toFixed(2)}%)`);

const passed = measured.length > 0 && p95 <= p95Limit && errorRate <= errorRateLimit;
console.log(passed ? 'THRESHOLDS PASS' : 'THRESHOLDS FAIL');
process.exit(passed ? 0 : 1);
