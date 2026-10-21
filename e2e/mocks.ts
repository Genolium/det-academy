import { Page, Route } from '@playwright/test';

export const TEST_ATTEMPT_ID = '11111111-1111-4111-8111-111111111111';

export interface MockOptions {
  /** When true the resumed session is already finalized on the server. */
  resumeCompleted?: boolean;
  sessionStage?: string;
  sessionQuestions?: unknown[];
  afterStage?: string;
  nextQuestions?: unknown[];
  /** Responses returned by POST /test/sessions/:id/complete, in order. */
  completionResponses?: Array<
    | { status: number; body: unknown }
    | { delayMs: number; status: number; body: unknown }
  >;
  /** Server-side notebook items returned for the current Authorization token. */
  errorsForToken?: (token: string | null) => unknown[];
}

const json = async (route: Route, status: number, body: unknown) => {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': '*',
    },
  });
};

const userForToken = (token: string | null) => {
  if (token === 'token-user-b') {
    return {
      id: 'user-b',
      email: 'b@example.com',
      name: 'User B',
      role: 'student',
      locale: 'ru',
      createdAt: new Date().toISOString(),
    };
  }
  return {
    id: 'user-a',
    email: 'a@example.com',
    name: 'User A',
    role: 'student',
    locale: 'ru',
    createdAt: new Date().toISOString(),
  };
};

const session = (overrides: Record<string, unknown> = {}) => ({
  id: TEST_ATTEMPT_ID,
  userId: 'user-a',
  candidateName: 'User A',
  status: 'IN_PROGRESS',
  currentStage: 13,
  stageName: 'SPEAKING_SAMPLE',
  difficultyLevel: 'B1',
  deadlineAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const completedResult = {
  session: session({
    status: 'COMPLETED',
    stageName: 'COMPLETED',
    currentStage: 14,
    overallScore: 125,
    readingScore: 130,
    listeningScore: 120,
    writingScore: 120,
    speakingScore: 130,
    literacyScore: 125,
    comprehensionScore: 125,
    productionScore: 125,
    conversationScore: 125,
    completedAt: new Date().toISOString(),
  }),
  scores: {
    overall: 125,
    reading: 130,
    listening: 120,
    writing: 120,
    speaking: 130,
    literacy: 125,
    comprehension: 125,
    production: 125,
    conversation: 125,
  },
  certificateEligible: false,
};

export async function mockApi(page: Page, options: MockOptions = {}) {
  const completionQueue = [...(options.completionResponses || [])];
  let completionCalls = 0;
  const completionBodies: unknown[] = [];
  const responseBodies: unknown[] = [];

  await page.route('**/api/v1/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;
    const method = request.method();

    if (method === 'OPTIONS') {
      return json(route, 204, {});
    }

    const authHeader = request.headers()['authorization'] || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    const user = userForToken(token);

    if (path.endsWith('/auth/me')) {
      if (!token) return json(route, 401, { error: 'unauthorized' });
      return json(route, 200, user);
    }
    if (path.endsWith('/auth/logout')) {
      return json(route, 200, { status: 'ok' });
    }
    if (path.endsWith('/theory/progress')) {
      return json(route, 200, {
        completedLessons: [],
        totalLessons: 16,
        progressPercent: 0,
        isAllCompleted: false,
      });
    }
    if (path.endsWith('/test/sessions/me')) {
      return json(route, 200, { sessions: [] });
    }
    if (path.endsWith('/user/plan')) {
      return json(route, 200, {
        targetScore: 125,
        targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        daysRemaining: 30,
        dailyMinutes: 45,
        currentEstimate: 0,
        weakestSkill: 'reading',
        weeklyHoursNeeded: 5,
        readinessPercent: 0,
        statusMessage: '',
        tasksToday: [],
      });
    }
    if (path.endsWith('/banners') || path.includes('/banners?')) {
      return json(route, 200, []);
    }
    if (path.endsWith('/user/streak') && method === 'GET') {
      return json(route, 200, { streakDays: 0, lastActiveDate: '' });
    }
    if (path.endsWith('/user/activity') && method === 'POST') {
      return json(route, 200, {
        streakDays: 1,
        lastActiveDate: new Date().toISOString().slice(0, 10),
      });
    }
    if (path.endsWith('/user/srs') && method === 'GET') {
      return json(route, 200, {
        stats: { streakDays: 0, lastStudiedDate: '', totalReviewed: 0 },
        cards: {},
        overdueCount: 0,
        dueTodayCount: 0,
        totalLearned: 0,
      });
    }
    if (path.endsWith('/user/goals')) {
      return json(route, 200, {
        userId: user.id,
        targetScore: 125,
        targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        dailyMinutes: 45,
        updatedAt: new Date().toISOString(),
      });
    }
    if (path.endsWith('/user/analytics/skills')) {
      return json(route, 200, {
        hasData: false,
        latestOverall: 0,
        bestOverall: 0,
        modalities: {},
        subscores: { literacy: 0, comprehension: 0, production: 0, conversation: 0 },
        weakestSkill: '',
        recommendations: [],
        history: [],
      });
    }
    if (path.endsWith('/arena/leaderboard')) {
      return json(route, 200, { leaderboard: [], total: 0 });
    }
    if (path.endsWith('/vocabulary')) {
      return json(route, 200, {
        entries: [
          {
            id: 'voc-1',
            word: 'Substantiate',
            ipa: '/səbˈstæn.ʃi.eɪt/',
            pos: 'verb',
            level: 'C1',
            meaningRu: 'Обосновывать',
            definitionEn: 'To provide evidence to support a claim.',
            example: 'The candidate failed to substantiate her claim.',
            collocations: ['substantiate claims'],
            source: 'Academic Word List (platform dataset)',
            status: 'published',
            version: '2026.1',
            reviewedAt: new Date().toISOString(),
          },
        ],
        total: 1,
      });
    }
    if (path.endsWith('/institutions')) {
      return json(route, 200, { institutions: [], total: 0 });
    }
    if (path.endsWith('/user/errors') && method === 'GET') {
      return json(route, 200, {
        errors: options.errorsForToken ? options.errorsForToken(token) : [],
        total: options.errorsForToken ? options.errorsForToken(token).length : 0,
      });
    }
    if (path.endsWith('/user/errors') && method === 'POST') {
      const payload = request.postDataJSON() as Record<string, unknown>;
      return json(route, 201, {
        id: 'server-error-1',
        userId: user.id,
        type: payload.type,
        prompt: payload.prompt,
        userAnswer: payload.userAnswer,
        correctAnswer: payload.correctAnswer,
        explanation: payload.explanation || '',
        consecutiveSuccesses: 0,
        attemptsCount: 1,
        mastered: false,
        createdAt: new Date().toISOString(),
      });
    }
    if (/\/test\/sessions\/[^/]+$/.test(path) && method === 'GET') {
      return json(route, 200, {
        session: options.resumeCompleted
          ? completedResult.session
          : session({ stageName: options.sessionStage || 'SPEAKING_SAMPLE' }),
        questions: options.sessionQuestions || [],
        responses: [],
        blueprint: { version: '1', totalStages: 13, stages: [] },
      });
    }
    if (/\/test\/sessions\/[^/]+\/respond$/.test(path)) {
      if (request.postData()) responseBodies.push(request.postDataJSON());
      return json(route, 200, { status: 'recorded', isCorrect: true, rawScore: 1 });
    }
    if (/\/test\/sessions\/[^/]+\/stage-complete$/.test(path)) {
      return json(route, 200, {
        session: session({
          stageName: options.afterStage || 'COMPLETED',
          currentStage: options.afterStage ? 2 : 14,
          deadlineAt: null,
        }),
        nextQuestions: options.nextQuestions || [],
      });
    }
    if (/\/test\/sessions\/[^/]+\/complete$/.test(path)) {
      completionCalls += 1;
      completionBodies.push(request.postData() ? request.postDataJSON() : {});
      const next = completionQueue.shift();
      if (next) {
        if ('delayMs' in next) {
          await new Promise((resolve) => setTimeout(resolve, next.delayMs));
        }
        return json(route, next.status, next.body);
      }
      return json(route, 200, completedResult);
    }
    if (path.endsWith('/certificates/does-not-exist')) {
      return json(route, 404, { error: 'certificate not found or invalid' });
    }

    return json(route, 200, {});
  });

  return {
    getCompletionCalls: () => completionCalls,
    getCompletionBodies: () => completionBodies,
    getResponseBodies: () => responseBodies,
  };
}

export const incompleteResult = {
  session: session({
    status: 'COMPLETED',
    stageName: 'COMPLETED',
    currentStage: 14,
    overallScore: 0,
    readingScore: 0,
    listeningScore: 0,
    writingScore: 0,
    speakingScore: 0,
    literacyScore: 0,
    comprehensionScore: 0,
    productionScore: 0,
    conversationScore: 0,
    completedAt: new Date().toISOString(),
  }),
  scores: {
    overall: 0,
    reading: 0,
    listening: 0,
    writing: 0,
    speaking: 0,
    literacy: 0,
    comprehension: 0,
    production: 0,
    conversation: 0,
    completeness: 0.25,
    confidence: 'low',
    rangeLow: 0,
    rangeHigh: 0,
    notMeasured: ['reading', 'listening', 'speaking', 'overall'],
    answeredQuestions: 1,
  },
  certificateEligible: false,
};

export const pendingSyncError = {
  status: 503,
  body: { error: 'service unavailable' },
};
