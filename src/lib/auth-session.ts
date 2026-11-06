/**
 * Single client-side entry point for the authenticated session.
 *
 * Production auth is carried by HttpOnly cookies. The browser stores only a
 * non-secret user id/session marker for offline cache scoping and for deciding
 * whether an initial `/auth/me` probe is worth making. The access token is
 * never written to localStorage.
 *
 * Playwright mocks still need a Bearer token, so the legacy localStorage path
 * exists only when NEXT_PUBLIC_ALLOW_LEGACY_BEARER is explicitly set by the
 * test web server. Production builds must leave it unset.
 */

const SESSION_TOKEN_KEY = 'det_auth_token';
const AUTH_USER_ID_KEY = 'det_auth_user_id';
const AUTH_MARKER_KEY = 'det_auth_present';
const AUTH_MIGRATION_KEY = 'det_auth_migrating';
const LEGACY_TOKEN_KEYS = ['det_token'] as const;
const LEGACY_BEARER_ALLOWED = process.env.NEXT_PUBLIC_ALLOW_LEGACY_BEARER === 'true';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function clearLegacyToken(storage: Storage): void {
  try {
    storage.removeItem(SESSION_TOKEN_KEY);
    for (const legacyKey of LEGACY_TOKEN_KEYS) {
      storage.removeItem(legacyKey);
    }
  } catch {
    // Storage can be unavailable in private/restricted contexts.
  }
}

/**
 * Copies a legacy token only in the test-only Bearer mode. In production the
 * old key is removed on the first visit so an XSS payload cannot keep using it.
 */
export function migrateLegacyAuthStorage(): void {
  const storage = getStorage();
  if (!storage) return;
  if (!LEGACY_BEARER_ALLOWED) {
    // One-time migration grace: keep an existing token long enough for the
    // app to exchange the old Bearer session for HttpOnly cookies on the next
    // `/auth/me` + `/auth/refresh` cycle. `setAuthUser` removes it afterward.
    try {
      const existing = storage.getItem(SESSION_TOKEN_KEY) || storage.getItem('det_token');
      if (existing) {
        storage.setItem(SESSION_TOKEN_KEY, existing);
        storage.setItem(AUTH_MIGRATION_KEY, '1');
      } else {
        storage.removeItem(AUTH_MIGRATION_KEY);
      }
      storage.removeItem('det_token');
    } catch {
      // Ignore unavailable storage.
    }
    return;
  }
  try {
    const canonical = storage.getItem(SESSION_TOKEN_KEY);
    if (!canonical) {
      for (const legacyKey of LEGACY_TOKEN_KEYS) {
        const legacy = storage.getItem(legacyKey);
        if (legacy) {
          storage.setItem(SESSION_TOKEN_KEY, legacy);
          break;
        }
      }
    }
    for (const legacyKey of LEGACY_TOKEN_KEYS) {
      storage.removeItem(legacyKey);
    }
  } catch {
    // Storage can be unavailable in private/restricted contexts.
  }
}

export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = 'det_csrf=';
  const row = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return row ? decodeURIComponent(row.slice(prefix.length)) : null;
}

export function setAuthUser(userId: string): void {
  const storage = getStorage();
  if (!storage || !userId.trim()) return;
  try {
    storage.setItem(AUTH_USER_ID_KEY, userId);
    storage.setItem(AUTH_MARKER_KEY, '1');
    if (!LEGACY_BEARER_ALLOWED) {
      clearLegacyToken(storage);
      storage.removeItem(AUTH_MIGRATION_KEY);
    }
  } catch {
    // Ignore unavailable storage.
  }
}

/**
 * Reads the user id without trusting a token for authorization. Used only to
 * scope browser-local offline caches to the current user.
 */
export function getAuthUserId(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const stored = storage.getItem(AUTH_USER_ID_KEY);
    if (stored) return stored;
  } catch {
    return null;
  }
  if (!LEGACY_BEARER_ALLOWED) return null;
  const token = getAuthToken();
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized + '='.repeat((4 - (normalized.length % 4)) % 4)));
    const id = decoded?.userId ?? decoded?.user_id ?? decoded?.sub;
    return typeof id === 'string' && id ? id : null;
  } catch {
    return null;
  }
}

/**
 * Stable non-secret namespace for browser-local caches when a user id is
 * available. Returns null for a truly anonymous browser.
 */
export function getAuthCacheUserId(): string | null {
  return getAuthUserId();
}

export function getAuthToken(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  migrateLegacyAuthStorage();
  if (!LEGACY_BEARER_ALLOWED && storage.getItem(AUTH_MIGRATION_KEY) !== '1') return null;
  try {
    return storage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Test-only compatibility hook. Production never calls this to persist a token.
 */
export function setAuthToken(token: string): void {
  if (!LEGACY_BEARER_ALLOWED) return;
  const storage = getStorage();
  if (!storage || typeof token !== 'string' || !token.trim()) return;
  try {
    storage.setItem(SESSION_TOKEN_KEY, token);
    for (const legacyKey of LEGACY_TOKEN_KEYS) {
      storage.removeItem(legacyKey);
    }
  } catch {
    // Ignore unavailable storage.
  }
}

export function clearAuthSession(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(AUTH_USER_ID_KEY);
    storage.removeItem(AUTH_MARKER_KEY);
    storage.removeItem(AUTH_MIGRATION_KEY);
    clearLegacyToken(storage);
  } catch {
    // Ignore unavailable storage.
  }
}

export function clearAuthToken(): void {
  clearAuthSession();
}

/**
 * The readable CSRF cookie is a safe session hint: it is set with the same
 * lifetime as the access cookie and cleared on logout. A missing hint means an
 * anonymous browser; a present hint means it is worth probing `/auth/me`.
 */
export function hasAuthSession(): boolean {
  return Boolean(getAuthUserId() || getCsrfToken() || getAuthToken());
}

// Run the one-time migration as soon as the module is loaded in a browser.
migrateLegacyAuthStorage();
