const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'editor' | 'admin';
  avatarUrl?: string;
  locale: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
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
  literacyScore?: number;
  comprehensionScore?: number;
  productionScore?: number;
  conversationScore?: number;
  createdAt: string;
  completedAt?: string;
}

export interface SessionCompleteResponse {
  session: BackendTestSession;
  scores: {
    overall: number;
    literacy: number;
    comprehension: number;
    production: number;
    conversation: number;
  };
  certificateEligible: boolean;
  certificate?: {
    id: string;
    candidateName: string;
    overallScore: number;
    literacyScore: number;
    comprehensionScore: number;
    productionScore: number;
    conversationScore: number;
    issuedAt: string;
    pdfUrl?: string;
    isVerified: boolean;
  };
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

export interface Institution {
  id: string;
  name: string;
  country: string;
  city: string;
  state?: string;
  minScore: number;
  subscoreReqs?: string;
  latitude: number;
  longitude: number;
  websiteUrl: string;
  logoUrl?: string;
  category: string;
  acceptanceRate?: string;
  programs: string[];
  createdAt: string;
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

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('det_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('det_token', data.token);
    }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('det_token', data.token);
    }
    return data;
  }

  async getMe(): Promise<User> {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Not authenticated');
    }
    return res.json();
  }

  async logout(): Promise<void> {
    await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    }).catch(() => {});
    if (typeof window !== 'undefined') {
      localStorage.removeItem('det_token');
    }
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

  // --- Test & CAT ---

  async startTestSession(params: { candidateName?: string; difficultyLevel?: string }): Promise<{
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
      throw new Error(data.error || 'Для прохождения симулятора теста требуется регистрация');
    }
    return res.json();
  }

  async submitQuestionResponse(sessionId: string, payload: {
    questionId: string;
    userResponse: unknown;
    rawScore: number;
    timeSpentSec: number;
  }): Promise<void> {
    await fetch(`${API_BASE_URL}/api/v1/test/sessions/${sessionId}/respond`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
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
      throw new Error('Failed to complete stage on backend');
    }
    return res.json();
  }

  async completeTestSession(sessionId: string, scores: {
    readSelectAccuracy: number;
    fillBlanksAccuracy: number;
    cTestAccuracy: number;
    listenTypeAccuracy: number;
    interactiveReadingScore: number;
    interactiveListeningScore: number;
    writingScore: number;
  }): Promise<SessionCompleteResponse> {
    const res = await fetch(`${API_BASE_URL}/api/v1/test/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(scores),
    });
    if (!res.ok) {
      throw new Error('Failed to finalize test session on backend');
    }
    return res.json();
  }

  // --- Certificates ---

  async getCertificate(id: string): Promise<BackendCertificate> {
    const res = await fetch(`${API_BASE_URL}/api/v1/certificates/${id}`, {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error('Certificate not found');
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

  async createQuestion(data: any): Promise<BackendQuestion> {
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
}

export const api = new ApiClient();
