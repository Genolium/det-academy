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
  const startSessionBodies: unknown[] = [];

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
    if (path.endsWith('/auth/refresh')) {
      return json(route, 401, { error: 'no refresh session' });
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
    if (path.endsWith('/user/research-consent')) {
      return json(route, 200, { consent: false, version: '2026-10-29' });
    }
    if (path.endsWith('/user/report/weekly')) {
      return json(route, 200, {
        weekStart: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
        weekEnd: new Date().toISOString().slice(0, 10),
        studyDays: 3,
        sessions: 2,
        mockTests: 1,
        srsReviews: 12,
        errorsAdded: 4,
        errorsMastered: 1,
        currentEstimate: 0,
        rangeLow: 0,
        rangeHigh: 0,
        weakestSkill: '',
        recommendations: ['Продолжайте текущий план'],
      });
    }
    if (/\/test\/sessions\/[^/]+\/evaluations$/.test(path)) {
      return json(route, 200, {
        evaluations: [
          {
            id: 'eval-speech-1',
            sessionId: TEST_ATTEMPT_ID,
            questionId: 'q-ss-01',
            questionType: 'SPEAKING_SAMPLE',
            status: 'COMPLETED',
            score: 0.72,
            wordCount: 92,
            uniqueWords: 61,
            lexicalDiversity: 0.66,
            academicWords: ['significant', 'framework'],
            connectors: ['however', 'therefore'],
            relevanceScore: 0.8,
            cefrLevel: 'B2',
            speakingDuration: 75,
            wpm: 74,
            speechRate: 74,
            pauseRatio: 0.18,
            pauseCount: 4,
            fillerCount: 2,
            pronunciationStability: 0.86,
            pauses: [
              { start: 10, end: 12 },
              { start: 28, end: 29.5 },
              { start: 44, end: 45 },
              { start: 61, end: 62.5 },
            ],
            recommendations: [],
            feedback: 'Хорошая структура ответа.',
            rubric: [
              { key: 'fluency', label: 'Беглость и темп', score: 0.55, band: 'зона роста', evidence: 'Темп: 74 сл/мин, паузы: 18%.', suggestion: 'Держите темп 110–160 сл/мин.' },
              { key: 'lexical', label: 'Лексика', score: 0.78, band: 'уверенно', evidence: 'Разнообразие: 66%, академических слов: 2.', suggestion: 'Добавьте 2–3 точных академических слова.' },
              { key: 'relevance', label: 'Соответствие заданию', score: 0.8, band: 'сильная сторона', evidence: 'Ответ раскрывает тему.', suggestion: 'Прямо ответьте на вопрос в первом предложении.' },
              { key: 'accuracy', label: 'Точность и структура', score: 0.72, band: 'уверенно', evidence: 'Структура понятна.', suggestion: 'Проверьте согласование времён.' },
            ],
            nextAction: 'Держите темп 110–160 сл/мин.',
            createdAt: new Date().toISOString(),
          },
        ],
      });
    }
    if (path.endsWith('/user/plan')) {
      return json(route, 200, {
        configured: true,
        targetScore: 125,
        targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        daysRemaining: 30,
        dailyMinutes: 45,
        currentEstimate: 0,
        weakestSkill: 'reading',
        weeklyHoursNeeded: 5,
        readinessAvailable: false,
        readinessPercent: 0,
        readinessBasis: 'Not enough data: at least two completed mock tests are required.',
        statusMessage: '',
        tasksToday: [],
        estimatedRange: {
          low: 110,
          high: 130,
          confidence: 'high',
          basis: '3 мока, последний 120, разброс ±10 баллов.',
        },
        projectedRange: {
          low: 122,
          high: 134,
          target: 125,
          onTrack: true,
          confidence: 'medium',
          slopePerDay: 0.4,
          basis: 'Тренд по 3 мокам: +0.40 балла в день. К дате экзамена через 30 дней: около 128.',
        },
        nextBestAction: {
          title: 'Отработать Read and Select',
          description: '2 неусвоенных ошибки этого типа: 10 минут точечной практики.',
          href: '/practice?drill=read-and-select',
          type: 'READ_SELECT',
          minutes: 10,
          reason: 'В тетради ошибок 2 неусвоенных задания типа READ_SELECT.',
        },
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
    if (path.endsWith('/user/placement')) {
      return json(route, 200, {
        available: true,
        level: 'B2',
        overall: 115,
        completedAt: '2026-10-26',
      });
    }
    if (path.endsWith('/user/limits')) {
      return json(route, 200, {
        date: '2026-10-27',
        mockUsed: 1,
        mockLimit: 3,
        speakingUsed: 2,
        speakingLimit: 20,
      });
    }
    if (path.endsWith('/user/xp')) {
      return json(route, 200, {
        total: 320,
        weekly: 320,
        weekStart: '2026-10-19',
        league: 'Gold',
        nextLeague: 'Platinum',
        nextAt: 700,
        leagueBasis: 'Лига считается по XP за текущую неделю (с понедельника 00:00 UTC, начало 2026-10-19).',
        history: [],
      });
    }
    if (path.endsWith('/user/goals')) {
      return json(route, 200, {
        configured: true,
        goal: {
          userId: user.id,
          targetScore: 125,
          targetDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
          dailyMinutes: 45,
          updatedAt: new Date().toISOString(),
        },
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
      const url = new URL(route.request().url());
      const level = url.searchParams.get('level') || 'ALL';
      const source = url.searchParams.get('source') || 'all';
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const all = [
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
        {
          id: 'voc-b1-1',
          word: 'Benefit',
          ipa: '/ˈben.ɪ.fɪt/',
          pos: 'noun',
          level: 'B1',
          meaningRu: 'Польза, выгода',
          definitionEn: 'An advantage or profit gained from something.',
          example: 'Regular practice brings a clear benefit.',
          collocations: ['clear benefit', 'mutual benefit'],
          source: 'DET B1 core (platform dataset)',
          status: 'published',
          version: '2026.2',
          reviewedAt: new Date().toISOString(),
        },
      ];
      const entries = all
        .filter((entry) => level === 'ALL' || entry.level === level)
        .filter((entry) =>
          source === 'all' ||
          (source === 'awl' && entry.source.startsWith('Academic Word List')) ||
          (source === 'b1' && entry.source.startsWith('DET B1 core'))
        )
        .filter((entry) => !search || `${entry.word} ${entry.meaningRu} ${entry.definitionEn}`.toLowerCase().includes(search));
      return json(route, 200, { entries, total: entries.length });
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
    if (path.endsWith('/test/sessions') && method === 'POST') {
      if (request.postData()) startSessionBodies.push(request.postDataJSON());
      return json(route, 201, { session: session(), questions: [] });
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
    getStartSessionBodies: () => startSessionBodies,
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

/**
 * Installs a deterministic fake microphone and MediaRecorder for speaking
 * tests. The recorder emits one non-empty blob when stopped.
 */
export async function installFakeMedia(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type FakeWindow = Window & {
      __mediaRecorderStartCount?: number;
      webkitAudioContext?: typeof AudioContext;
    };
    const fakeWindow = window as unknown as FakeWindow;
    fakeWindow.__mediaRecorderStartCount = 0;

    class FakeMediaRecorder {
      static isTypeSupported(): boolean {
        return true;
      }
      state = 'inactive';
      mimeType = 'audio/webm';
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      constructor(_stream: unknown, options?: { mimeType?: string }) {
        if (options?.mimeType) this.mimeType = options.mimeType;
      }
      start(): void {
        this.state = 'recording';
        fakeWindow.__mediaRecorderStartCount = (fakeWindow.__mediaRecorderStartCount || 0) + 1;
      }
      stop(): void {
        if (this.state === 'inactive') return;
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob(['fake audio'], { type: this.mimeType }) });
        this.onstop?.();
      }
    }

    class FakeAudioContext {
      state = 'running';
      createAnalyser() {
        return {
          fftSize: 256,
          smoothingTimeConstant: 0.8,
          frequencyBinCount: 8,
          getByteFrequencyData(data: Uint8Array) {
            data.fill(0);
          },
        };
      }
      createMediaStreamSource() {
        return { connect() {} };
      }
      close() {
        this.state = 'closed';
      }
    }

    const fakeStream = {
      getTracks: () => [{ stop() {} }],
    };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => fakeStream },
    });
    Object.defineProperty(window, 'MediaRecorder', {
      configurable: true,
      value: FakeMediaRecorder,
    });
    Object.defineProperty(window, 'AudioContext', {
      configurable: true,
      value: FakeAudioContext,
    });
    Object.defineProperty(window, 'webkitAudioContext', {
      configurable: true,
      value: FakeAudioContext,
    });
  });
}

export async function installDeniedMedia(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => {
          throw new DOMException('Permission denied', 'NotAllowedError');
        },
      },
    });
  });
}
