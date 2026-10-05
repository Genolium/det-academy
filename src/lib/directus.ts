/**
 * Directus Headless CMS Client & API Synchronization
 * 
 * Provides typed access to Directus REST API collections for:
 * - Theory Lessons (`theory_lessons`)
 * - Question Bank (`questions`)
 * - Universities & Acceptance (`institutions`)
 * - Ad Banners (`ad_banners`)
 */

const DIRECTUS_URL = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:18055';

export interface DirectusTheoryLesson {
  id: string;
  number: number;
  slug: string;
  title_ru: string;
  title_en: string;
  category: string;
  category_label_ru: string;
  category_label_en: string;
  format: string;
  scoring: string;
  time_limit: string;
  rules: string[];
  strategy_steps: string[];
  formula?: string;
  examples: Array<{
    question?: string;
    sampleText?: string;
    audioPrompt?: string;
    modelAnswer: string;
    comment: string;
  }>;
  pitfalls: string[];
}

export interface DirectusQuestion {
  id: string;
  type: string;
  difficulty_band: string;
  content_payload: Record<string, unknown>;
  correct_answers: Record<string, unknown>;
  time_limit_sec: number;
  is_active: boolean;
}

export interface DirectusInstitution {
  id: string;
  name: string;
  country: string;
  city: string;
  state?: string;
  min_score: number;
  subscore_reqs?: string;
  latitude: number;
  longitude: number;
  website_url: string;
  logo_url?: string;
  category?: string;
  acceptance_rate?: string;
  programs?: string[];
}

export interface DirectusAdBanner {
  id: string;
  placement: 'HEADER' | 'FOOTER';
  image_url?: string;
  target_url: string;
  alt_text: string;
  is_active: boolean;
  impressions: number;
  clicks: number;
}

class DirectusCmsClient {
  private baseUrl: string;

  constructor(url: string = DIRECTUS_URL) {
    this.baseUrl = url.replace(/\/$/, '');
  }

  private async fetchCollection<T>(collection: string, queryParams: Record<string, string> = {}): Promise<T[]> {
    try {
      const url = new URL(`${this.baseUrl}/items/${collection}`);
      Object.entries(queryParams).forEach(([key, val]) => url.searchParams.append(key, val));

      const res = await fetch(url.toString(), {
        next: { revalidate: 60 }, // ISR cache revalidation
      });

      if (!res.ok) {
        return [];
      }

      const json = await res.json();
      return json.data || [];
    } catch {
      // Directus might be offline or starting up, gracefully fallback
      return [];
    }
  }

  /**
   * Get all theory lessons published in Directus CMS
   */
  async getTheoryLessons(): Promise<DirectusTheoryLesson[]> {
    return this.fetchCollection<DirectusTheoryLesson>('theory_lessons', {
      sort: 'number',
    });
  }

  /**
   * Get a single theory lesson by its slug
   */
  async getTheoryLessonBySlug(slug: string): Promise<DirectusTheoryLesson | null> {
    try {
      const res = await fetch(`${this.baseUrl}/items/theory_lessons?filter[slug][_eq]=${slug}`, {
        next: { revalidate: 60 },
      });
      if (!res.ok) return null;
      const json = await res.json();
      return json.data?.[0] || null;
    } catch {
      return null;
    }
  }

  /**
   * Get active questions by difficulty or type
   */
  async getQuestions(filter?: { type?: string; difficulty_band?: string }): Promise<DirectusQuestion[]> {
    const params: Record<string, string> = { 'filter[is_active][_eq]': 'true' };
    if (filter?.type) params['filter[type][_eq]'] = filter.type;
    if (filter?.difficulty_band) params['filter[difficulty_band][_eq]'] = filter.difficulty_band;

    return this.fetchCollection<DirectusQuestion>('questions', params);
  }

  /**
   * Get institutions catalog
   */
  async getInstitutions(): Promise<DirectusInstitution[]> {
    return this.fetchCollection<DirectusInstitution>('institutions', {
      sort: '-min_score',
    });
  }

  /**
   * Get banners by placement
   */
  async getBanners(placement: 'HEADER' | 'FOOTER'): Promise<DirectusAdBanner[]> {
    return this.fetchCollection<DirectusAdBanner>('ad_banners', {
      'filter[placement][_eq]': placement,
      'filter[is_active][_eq]': 'true',
    });
  }
}

export const directusCms = new DirectusCmsClient();
