import { clearAuthToken, getAuthToken, setAuthToken } from '@/lib/auth-session';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL !== undefined && process.env.NEXT_PUBLIC_API_URL !== ''
    ? process.env.NEXT_PUBLIC_API_URL
    : process.env.NEXT_PUBLIC_API_SAME_ORIGIN === 'true'
    ? ''
    : typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? ''
    : 'http://localhost:18080';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'editor' | 'admin';
  avatarUrl?: string;
  emailVerified?: boolean;
  locale: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SocialAccount {
  id: string;
  userId: string;
  provider: 'google' | 'vk' | 'yandex' | 'apple';
  providerUserId: string;
  email: string;
  createdAt: string;
}

export interface LinkedProvidersResponse {
  providers: SocialAccount[] | null;
  hasPassword: boolean;
  email: string;
}

export interface TheoryProgressResponse {
  completedLessons: string[];
  totalLessons: number;
  progressPercent: number;
  isAllCompleted: boolean;
}

export interface BackendCertificate {
  id: string;
  userId: string;
  testSessionId: string;
  candidateName: string;
  overallScore: number;
  literacyScore: number;
  comprehensionScore: number;
  productionScore: number;
  conversationScore: number;
  issuedAt: string;
  pdfUrl?: string;
  isVerified: boolean;
}

export interface BackendQuestion {
  id: string;
  type: string;
  difficultyBand: string;
  contentPayload: Record<string, unknown>;
  timeLimitSec: number;
}

export interface BackendTestSession {
  id: string;
  userId: string;
  candidateName: string;
  status: string;
  currentStage: number;
  stageName: string;
  difficultyLevel: string;
  overallScore?: number;
  readingScore?: number;
  listeningScore?: number;
  writingScore?: number;
  speakingScore?: number;
  literacyScore?: number;
  comprehensionScore?: number;
  productionScore?: number;
  conversationScore?: number;
  deadlineAt?: string;
  createdAt: string;
  completedAt?: string;
}

export interface BlueprintStage {
  stageName: string;
  displayName: string;
  skillCategory: string;
  itemCount: number;
  timeLimitSec: number;
  description: string;
}

export interface ExamBlueprint {
  version: string;
  totalStages: number;
  stages: BlueprintStage[];
}

export interface SessionDetailsResponse {
  session: BackendTestSession;
  questions: BackendQuestion[];
  responses: Array<{
    id: string;
    sessionId: string;
    questionId: string;
    userResponse: unknown;
    rawScore: number;
    timeSpentSec: number;
  }>;
  blueprint: ExamBlueprint;
}

export interface SessionCompleteResponse {
  session: BackendTestSession;
  scores: {
    overall: number;
    reading: number;
    listening: number;
    writing: number;
    speaking: number;
    literacy: number;
    comprehension: number;
    production: number;
    conversation: number;
    completeness: number;
    confidence: 'low' | 'medium' | 'high' | string;
    rangeLow: number;
    rangeHigh: number;
    notMeasured?: string[];
    answeredQuestions: number;
    timeoutEvents?: number;
  };
  certificateEligible: boolean;
  certificate?: {
    id: string;
    candidateName: string;
    overallScore: number;
    readingScore?: number;
    listeningScore?: number;
    writingScore?: number;
    speakingScore?: number;
    literacyScore: number;
    comprehensionScore: number;
    productionScore: number;
    conversationScore: number;
    issuedAt: string;
    pdfUrl?: string;
    isVerified: boolean;
  };
}

export interface MediaAsset {
  id: string;
  userId: string;
  sessionId?: string;
  questionId?: string;
  fileType: string;
  filePath: string;
  url: string;
  fileSize: number;
  durationSec: number;
  createdAt: string;
}

export interface ReviewItem {
  questionId: string;
  questionType: string;
  stageName: string;
  prompt: string;
  userAnswer: string;
  correctAnswer?: string;
  isCorrect: boolean;
  rawScore: number;
}

export interface SessionReviewResponse {
  sessionId: string;
  items: ReviewItem[];
}

export interface EvaluationResult {
  id: string;
  responseId?: string;
  sessionId: string;
  questionId: string;
  questionType: string;
  status: 'COMPLETED' | 'EMPTY' | 'INSUFFICIENT' | 'FAILED';
  score: number;
  wordCount: number;
  uniqueWords: number;
  lexicalDiversity: number;
  academicWords: string[];
  connectors: string[];
  relevanceScore: number;
  cefrLevel: 'Pre-A1' | 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  speakingDuration?: number;
  wpm?: number;
  recommendations: string[];
  audioUrl?: string;
  transcript?: string;
  transcriptSource?: string;
  provider?: string;
  evaluatorVersion?: string;
  feedbackStatus?: string;
  feedback?: string;
  evidenceSpans?: Array<{
    start: number;
    end: number;
    text: string;
    label: string;
    suggestion?: string;
  }>;
  retryCount?: number;
  lastError?: string;
  createdAt: string;
}

// --- Stage D: Study Plan, SRS, Error Notebook & Skills ---

export interface UserGoal {
  userId: string;
  targetScore: number;
  targetDate: string; // YYYY-MM-DD
  dailyMinutes: number;
  targetUniversityId?: string;
  updatedAt: string;
}

export interface UpdateGoalsRequest {
  targetScore: number;
  targetDate: string;
  dailyMinutes: number;
  targetUniversityId?: string;
}

export interface DailyTask {
  id: string;
  type: string;
  title: string;
  description: string;
  actionUrl: string;
  count?: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  /** Planning cost, used to fit the task into the available time. */
  estimatedMinutes: number;
  /** Why the task was assigned. */
  reason: string;
  completed: boolean;
  completedAt?: string;
}

export interface UserGoalsResponse {
  configured: boolean;
  goal: UserGoal | null;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  studyDays: number;
  sessions: number;
  mockTests: number;
  srsReviews: number;
  errorsAdded: number;
  errorsMastered: number;
  currentEstimate: number;
  rangeLow: number;
  rangeHigh: number;
  weakestSkill: string;
  recommendations: string[];
}

export interface StudyPlanResponse {
  /** False until the student has chosen a target. */
  configured: boolean;
  targetScore: number;
  targetDate: string;
  daysRemaining: number;
  dailyMinutes: number;
  currentEstimate: number;
  weakestSkill: string;
  weeklyHoursNeeded: number;
  /** Readiness is only reported after enough completed attempts. */
  readinessAvailable: boolean;
  readinessPercent: number;
  readinessBasis: string;
  statusMessage: string;
  tasksToday: DailyTask[];
}

export interface UserErrorItem {
  id: string;
  userId: string;
  type: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
  consecutiveSuccesses: number;
  attemptsCount: number;
  mastered: boolean;
  lastReviewedAt?: string;
  createdAt: string;
}

export interface SaveErrorRequest {
  type: string;
  prompt: string;
  userAnswer: string;
  correctAnswer: string;
  explanation?: string;
}

export interface RecallErrorResponse {
  success: boolean;
  consecutiveSuccesses: number;
  mastered: boolean;
  correctAnswer: string;
  explanation?: string;
  message: string;
}

export interface SRSCardProgress {
  cardId: string;
  intervalDays: number;
  repetitions: number;
  easinessFactor: number;
  dueDate: string; // YYYY-MM-DD
  lastReviewedAt: string;
}

export interface SRSStats {
  streakDays: number;
  lastStudiedDate: string;
  totalReviewed: number;
}

export interface SRSStateResponse {
  stats: SRSStats;
  cards: Record<string, SRSCardProgress>;
  overdueCount: number;
  dueTodayCount: number;
  totalLearned: number;
}

export interface ReviewSRSCardResponse {
  cardId: string;
  intervalDays: number;
  repetitions: number;
  easinessFactor: number;
  dueDate: string;
  streakDays: number;
  totalReviewed: number;
}

export interface ModalityScore {
  score: number;
  cefr: string;
  questionsCount: number;
  status: string;
}

export interface IntegratedSubscores {
  literacy: number;
  comprehension: number;
  production: number;
  conversation: number;
}

export interface SkillAttemptHistory {
  sessionId: string;
  date: string;
  overall: number;
  modalities: Record<string, number>;
  subscores: IntegratedSubscores;
}

export interface SkillAnalyticsResponse {
  hasData: boolean;
  latestOverall: number;
  bestOverall: number;
  modalities: Record<string, ModalityScore>;
  subscores: IntegratedSubscores;
  weakestSkill: string;
  recommendations: string[];
  history: SkillAttemptHistory[];
}

export interface AdBannerData {
  id: string;
  placement: string;
  imageUrl: string;
  targetUrl: string;
  altText: string;
  isActive: boolean;
  impressions?: number;
  clicks?: number;
}

export interface VocabularyEntry {
  id: string;
  word: string;
  ipa?: string;
  pos?: string;
  level: string;
  meaningRu: string;
  definitionEn: string;
  example?: string;
  collocations?: string[];
  source: string;
  sourceUrl?: string;
  status: string;
  version: string;
  reviewedAt: string;
}

export interface Institution {
  id: string;
  name: string;
  country: string;
  city: string;
  state?: string;
  minScore: number;
  minLiteracy?: number;
  minComprehension?: number;
  minProduction?: number;
  minConversation?: number;
  subscoreReqs?: string;
  latitude: number;
  longitude: number;
  websiteUrl: string;
  logoUrl?: string;
  category: string;
  acceptanceRate?: string;
  programs: string[];
  createdAt: string;
  source?: 'duolingo' | 'extended';
  verified?: boolean;
  coordinateSource?: string;
}

export interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  completedSessions: number;
  averageScore: number;
  totalCertificates: number;
  activeBanners: number;
  totalBannerClicks: number;
  totalQuestions: number;
  totalInstitutions: number;
  scoreDistribution: Record<string, number>;
  recentRegistrations: User[];
}

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

class ApiClient {
  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // --- Auth ---

  async register(params: { email: string; password: string; name: string; locale?: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Registration failed');
    }
    const data: AuthResponse = await res.json();
    if (!data?.token || !data?.user) {
      throw new ApiError('Invalid registration response', 500);
    }
    setAuthToken(data.token);
    return data;
  }

  async login(params: { email: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Login failed');
    }
    const data: AuthResponse = await res.json();
    if (!data?.token || !data?.user) {
      throw new ApiError('Invalid authentication response', 500);
    }
    setAuthToken(data.token);
    return data;
  }

  async startOAuth(params: {
    provider: 'google' | 'apple' | 'vk' | 'yandex';
    action?: 'login' | 'link';
    redirectUri: string;
  }): Promise<{ url: string; state: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/oauth/start`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || 'Не удалось начать OAuth-авторизацию', res.status);
    }
    return res.json();
  }

  async oauthLogin(params: {
    provider: 'google' | 'apple' | 'vk' | 'yandex';
    code?: string;
    redirectUri?: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
    deviceId?: string;
    codeVerifier?: string;
    nonce?: string;
    state?: string;
  }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/oauth`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'OAuth authentication failed');
    }
    const data: AuthResponse = await res.json();
    if (!data?.token || !data?.user) {
      throw new ApiError('Invalid authentication response', 500);
    }
    setAuthToken(data.token);
    return data;
  }

  async updateProfile(params: { name?: string; avatarUrl?: string }): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/profile`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Не удалось обновить профиль');
    }
    return res.json();
  }

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new ApiError('Not authenticated', res.status);
    }
    return res.json();
  }

  async refreshSession(): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new ApiError('Session refresh failed', res.status);
    }
    const data: AuthResponse = await res.json();
    if (!data?.token || !data?.user) {
      throw new ApiError('Invalid authentication response', 500);
    }
    setAuthToken(data.token);
    return data;
  }

  async verifyEmail(token: string): Promise<{ status: string; user: User }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-email`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ token }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || 'Ссылка подтверждения недействительна', res.status);
    }
    return res.json();
  }

  async resendVerification(): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/resend-verification`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || 'Не удалось отправить письмо', res.status);
    }
  }

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    }).catch(() => {});
    clearAuthToken();
  }

  async getLinkedProviders(): Promise<LinkedProvidersResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/providers`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Не удалось загрузить привязанные сервисы');
    }
    return res.json();
  }

  async linkProvider(params: {
    provider: 'google' | 'vk' | 'yandex' | 'apple';
    code?: string;
    token?: string;
    email?: string;
    providerUserId?: string;
    deviceId?: string;
    codeVerifier?: string;
    redirectUri?: string;
    nonce?: string;
    state?: string;
  }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/providers/link`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Не удалось привязать аккаунт');
    }
    return res.json();
  }

  async unlinkProvider(provider: 'google' | 'vk' | 'yandex' | 'apple'): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/providers/${provider}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Не удалось отвязать аккаунт');
    }
    return res.json();
  }

  async setPassword(params: { oldPassword?: string; newPassword: string }): Promise<{ message: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/password`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Не удалось обновить пароль');
    }
    return res.json();
  }

  // --- Theory ---

  async getTheoryProgress(): Promise<TheoryProgressResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/theory/progress`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      return {
        completedLessons: [],
        totalLessons: 12,
        progressPercent: 0,
        isAllCompleted: false,
      };
    }
    return res.json();
  }

  async toggleTheoryLesson(lessonSlug: string): Promise<TheoryProgressResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/theory/toggle`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ lessonSlug }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to toggle theory progress');
    }
    return res.json();
  }

  async getMyTestSessions(): Promise<{ sessions: BackendTestSession[] }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/sessions/me`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      return { sessions: [] };
    }
    return res.json();
  }

  async startTestSession(params: { candidateName?: string; difficultyLevel?: string; mode?: 'full' | 'diagnostic' }): Promise<{
    session: BackendTestSession;
    questions: BackendQuestion[];
  }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/sessions`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(
        data.error || 'Для прохождения симулятора теста требуется регистрация',
        res.status
      );
    }
    return res.json();
  }

  async submitQuestionResponse(sessionId: string, payload: {
    questionId: string;
    userResponse: unknown;
    rawScore: number;
    timeSpentSec: number;
  }): Promise<{ status: string }> {
    const send = () =>
      fetch(`${API_BASE_URL}/api/v1/test/sessions/${sessionId}/respond`, {
        method: 'POST',
        headers: this.getHeaders(),
        credentials: 'include',
        body: JSON.stringify(payload),
      });
    let res: Response;
    try {
      res = await send();
      if (res.status === 401) {
        // A long mock can outlive the access token. Refresh once and retry the
        // same queued answer instead of treating it as a permanent rejection.
        let refreshed = false;
        try {
          await this.refreshSession();
          refreshed = true;
        } catch {}
        if (refreshed) res = await send();
      }
    } catch {
      throw new ApiError('Не удалось сохранить ответ на сервере', 0);
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || 'Не удалось сохранить ответ на сервере', res.status);
    }
    const data = await res.json().catch(() => ({ status: 'recorded' }));
    return data as { status: string };
  }

  async completeStage(sessionId: string, payload: {
    stageName: string;
    accuracy: number;
    totalQuestions: number;
    correctQuestions: number;
  }): Promise<{ session: BackendTestSession; nextQuestions?: BackendQuestion[] }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/sessions/${sessionId}/stage-complete`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || 'Failed to complete stage on backend', res.status);
    }
    return res.json();
  }

  async getTestSession(sessionId: string): Promise<SessionDetailsResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/sessions/${sessionId}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || 'Failed to retrieve test session', res.status);
    }
    return res.json();
  }

  async completeTestSession(sessionId: string, scores?: {
    readSelectAccuracy?: number;
    fillBlanksAccuracy?: number;
    cTestAccuracy?: number;
    listenTypeAccuracy?: number;
    interactiveReadingScore?: number;
    interactiveListeningScore?: number;
    writingScore?: number;
    speakingScore?: number;
  }): Promise<SessionCompleteResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(scores || {}),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      if (res.status === 409 && data.code === 'evaluation_pending') {
        throw new ApiError(
          'Оценка Speaking/Writing ещё идёт. Результат появится после завершения проверки.',
          res.status
        );
      }
      throw new ApiError(data.error || 'Failed to finalize test session on backend', res.status);
    }
    return res.json();
  }

  async uploadSpeakingAudio(sessionId: string, formData: FormData): Promise<{
    asset: MediaAsset;
    url: string;
    evaluation: EvaluationResult;
  }> {
    const headers = this.getHeaders();
    // Do not set Content-Type header manually for FormData so browser sets correct boundary
    delete headers['Content-Type'];

    const res = await fetch(`${API_BASE_URL}/api/v1/test/sessions/${sessionId}/audio`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to upload speaking audio');
    }
    return res.json();
  }

  async getSessionReview(sessionId: string): Promise<SessionReviewResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/sessions/${sessionId}/review`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new ApiError('Не удалось загрузить разбор попытки', res.status);
    }
    return res.json();
  }

  async getSessionEvaluations(sessionId: string): Promise<{ evaluations: EvaluationResult[] }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/sessions/${sessionId}/evaluations`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      return { evaluations: [] };
    }
    return res.json();
  }

  // --- Certificates ---

  async getCertificate(id: string): Promise<BackendCertificate> {
    let res: Response;
    try {
      res = await fetch(`${API_BASE_URL}/api/v1/certificates/${encodeURIComponent(id)}`, {
        headers: this.getHeaders(),
        credentials: 'include',
      });
    } catch {
      throw new ApiError('Не удалось связаться с реестром сертификатов', 0);
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message =
        res.status === 404
          ? 'Сертификат с указанным идентификатором не найден'
          : data.error || 'Не удалось проверить сертификат';
      throw new ApiError(message, res.status);
    }
    return res.json();
  }

  // --- Banners ---

  async getActiveBanners(placement: 'HEADER' | 'FOOTER'): Promise<AdBannerData[]> {
    const res = await fetch(`${API_BASE_URL}/api/v1/banners?placement=${placement}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      return [];
    }
    return res.json();
  }

  async recordBannerClick(id: string): Promise<void> {
    await fetch(`${API_BASE_URL}/api/v1/banners/${id}/click`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    }).catch(() => {});
  }

  // --- Universities & Institutions ---

  async getVocabulary(
    params?: { search?: string; level?: string }
  ): Promise<{ entries: VocabularyEntry[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.level && params.level !== 'ALL') query.set('level', params.level);
    const res = await fetch(`${API_BASE_URL}/api/v1/vocabulary?${query.toString()}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new ApiError('Не удалось загрузить словарь', res.status);
    }
    return res.json();
  }

  async getInstitutions(params?: {
    search?: string;
    country?: string;
    minScore?: number;
    category?: string;
  }): Promise<{ institutions: Institution[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.country) query.append('country', params.country);
    if (params?.minScore) query.append('min_score', params.minScore.toString());
    if (params?.category) query.append('category', params.category);

    const res = await fetch(`${API_BASE_URL}/api/v1/institutions?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      return { institutions: [], total: 0 };
    }
    return res.json();
  }

  async getInstitutionById(id: string): Promise<Institution> {
    const res = await fetch(`${API_BASE_URL}/api/v1/institutions/${id}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Institution not found');
    }
    return res.json();
  }

  // --- Admin CRM ---

  async getAdminStats(): Promise<AdminStats> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/stats`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Admin access required');
    }
    return res.json();
  }

  async getAdminUsers(params?: {
    search?: string;
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.role) query.append('role', params.role);
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());

    const res = await fetch(`${API_BASE_URL}/api/v1/admin/users?${query.toString()}`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to load users');
    }
    return res.json();
  }

  async updateUserRole(id: string, role: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/${id}/role`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      throw new Error('Failed to update role');
    }
  }

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/users/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to delete user');
    }
  }

  async getAdminSessions(): Promise<{ sessions: BackendTestSession[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/sessions`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to load sessions');
    }
    return res.json();
  }

  async getAdminVocabulary(): Promise<{ entries: VocabularyEntry[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/vocabulary`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new ApiError('Failed to load vocabulary admin list', res.status);
    }
    return res.json();
  }

  async updateVocabularyStatus(id: string, status: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/vocabulary/${encodeURIComponent(id)}/status`, {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new ApiError(data.error || 'Failed to update vocabulary status', res.status);
    }
  }

  async getAdminBanners(): Promise<{ banners: AdBannerData[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/banners`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to load banners');
    }
    return res.json();
  }

  async createBanner(data: Partial<AdBannerData>): Promise<AdBannerData> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/banners`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Failed to create banner');
    }
    return res.json();
  }

  async updateBanner(id: string, data: Partial<AdBannerData>): Promise<AdBannerData> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/banners/${id}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Failed to update banner');
    }
    return res.json();
  }

  async deleteBanner(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/banners/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to delete banner');
    }
  }

  async getAdminQuestions(): Promise<{ questions: BackendQuestion[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/questions`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to load questions');
    }
    return res.json();
  }

  async createQuestion(data: Record<string, unknown>): Promise<BackendQuestion> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/questions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Failed to create question');
    }
    return res.json();
  }

  async deleteQuestion(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/v1/admin/questions/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to delete question');
    }
  }

  // --- Stage D: Study Plan, SRS, Error Notebook & Skills ---

  async getUserGoals(): Promise<UserGoalsResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/goals`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to get user goals');
    }
    return res.json();
  }

  async completePlanTask(taskId: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/plan/tasks/${encodeURIComponent(taskId)}/complete`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new ApiError('Failed to complete plan task', res.status);
    }
  }

  async updateUserGoals(data: UpdateGoalsRequest): Promise<UserGoal> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/goals`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Failed to update user goals');
    }
    return res.json();
  }

  async getUserStudyPlan(): Promise<StudyPlanResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/plan`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to get study plan');
    }
    return res.json();
  }

  async getUserWeeklyReport(): Promise<WeeklyReport> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/report/weekly`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new ApiError('Failed to get weekly report', res.status);
    }
    return res.json();
  }

  async getUserSkillAnalytics(): Promise<SkillAnalyticsResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/analytics/skills`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to get skill analytics');
    }
    return res.json();
  }

  async getUserErrors(): Promise<{ errors: UserErrorItem[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/errors`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to load user errors');
    }
    return res.json();
  }

  async saveUserError(data: SaveErrorRequest): Promise<UserErrorItem> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/errors`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error('Failed to save error item');
    }
    return res.json();
  }

  async recallUserError(id: string, answer: string): Promise<RecallErrorResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/errors/${id}/recall`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ answer }),
    });
    if (!res.ok) {
      throw new Error('Failed to submit recall answer');
    }
    return res.json();
  }

  async deleteUserError(id: string): Promise<void> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/errors/${id}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to delete error item');
    }
  }

  async getUserStreak(utcOffsetMinutes = 0): Promise<{ streakDays: number; lastActiveDate: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/streak?utc_offset_minutes=${utcOffsetMinutes}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new ApiError('Failed to get user streak', res.status);
    }
    return res.json();
  }

  async recordUserActivity(
    source: string,
    utcOffsetMinutes = 0
  ): Promise<{ streakDays: number; lastActiveDate: string }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/activity`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ source, utcOffsetMinutes }),
    });
    if (!res.ok) {
      throw new ApiError('Failed to record user activity', res.status);
    }
    return res.json();
  }

  async getUserSRSState(): Promise<SRSStateResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/srs`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to get SRS state');
    }
    return res.json();
  }

  async reviewSRSCard(cardId: string, quality: number): Promise<ReviewSRSCardResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/user/srs/review`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ cardId, quality }),
    });
    if (!res.ok) {
      throw new Error('Failed to review SRS card');
    }
    return res.json();
  }

  async getArenaLeaderboard(): Promise<{ leaderboard: ArenaLeaderboardEntry[]; total: number }> {
    const res = await fetch(`${API_BASE_URL}/api/v1/arena/leaderboard`, {
      headers: this.getHeaders(),
    });
    if (!res.ok) {
      throw new Error('Failed to load arena leaderboard');
    }
    return res.json();
  }
}

export interface ArenaLeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  elo: number;
  league: string;
  winRate: string;
  avatar?: string;
  /** Where the rating comes from. Arena duels are not persisted yet. */
  ratingSource?: string;
  /** Best completed mock score behind the rating. */
  bestScore?: number;
}

export const api = new ApiClient();
