/**
 * Directus Headless CMS Client & API Synchronization
 * 
 * Provides typed access to Directus REST API collections for:
 * - Theory Lessons (`theory_lessons`)
 * - Question Bank (`questions`)
 * - Universities & Acceptance (`institutions`)
 * - Ad Banners (`ad_banners`)
 */

function resolveDirectusUrl(): string {
  if (typeof window !== 'undefined') {
    // The production Directus subdomain historically served the apex
    // certificate. Use the same-origin nginx /directus proxy instead; it is
    // covered by the apex certificate and avoids a browser TLS warning.
    if (window.location.hostname.endsWith('det-academy.ru')) {
      return '/directus';
    }
    // Prevent Mixed Content: never make http requests from an https page
    if (window.location.protocol === 'https:') {
      const customUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL;
      if (customUrl && customUrl.startsWith('https://') && !customUrl.includes('directus.det-academy.ru')) {
        return customUrl.replace(/\/+$/, '');
      }
      return '/directus';
    }
  }
  // Server side rendering talks to the CMS container directly. The variable is
  // not prefixed with NEXT_PUBLIC_, so it stays server-only.
  const internal = process.env.DIRECTUS_INTERNAL_URL;
  if (internal) {
    return internal.replace(/\/+$/, '');
  }
  const fallback = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://localhost:18055';
  return fallback.replace(/\/+$/, '');
}

/**
 * Browser requests to the CMS are bounded so that an unreachable CMS never
 * blocks the page. Server side requests keep the default behaviour.
 */
function clientTimeoutSignal(): AbortSignal | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return AbortSignal.timeout(5000);
}

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
  private getBaseUrl(): string {
    return resolveDirectusUrl();
  }

  private async fetchCollection<T>(collection: string, queryParams: Record<string, string> = {}): Promise<T[]> {
    try {
      const baseUrl = this.getBaseUrl();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:18055';
      const endpoint = baseUrl.startsWith('http')
        ? `${baseUrl}/items/${collection}`
        : `${origin}${baseUrl}/items/${collection}`;
      const url = new URL(endpoint);
      Object.entries(queryParams).forEach(([key, val]) => url.searchParams.append(key, val));

      const res = await fetch(url.toString(), {
        next: { revalidate: 60 }, // ISR cache revalidation
        signal: clientTimeoutSignal(),
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
      const baseUrl = this.getBaseUrl();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:18055';
      const targetUrl = baseUrl.startsWith('http')
        ? `${baseUrl}/items/theory_lessons?filter[slug][_eq]=${slug}`
        : `${origin}${baseUrl}/items/theory_lessons?filter[slug][_eq]=${slug}`;
      const res = await fetch(targetUrl, {
        next: { revalidate: 60 },
        signal: clientTimeoutSignal(),
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
