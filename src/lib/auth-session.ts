/**
 * Single client-side entry point for the authenticated session.
 *
 * Feature stores must not read or write auth storage directly. Keeping the
 * token behind this adapter means the transport can later move to HttpOnly
 * cookies/refresh tokens without touching every feature.
 */

const SESSION_TOKEN_KEY = 'det_auth_token';
const LEGACY_TOKEN_KEYS = ['det_token'] as const;

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Copies a legacy token into the canonical key and removes the old key.
 * Safe to call on every app start; it is a no-op after the first run.
 */
export function migrateLegacyAuthStorage(): void {
  const storage = getStorage();
  if (!storage) return;

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

/**
 * Reads the user id from the access token without trusting it for authorization.
 * It is only used to scope browser-local offline caches to the current user.
 */
export function getAuthUserId(): string | null {
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
 * Stable non-secret namespace for browser-local caches when a token exists but
 * its payload is not a decodable JWT (for example, a test or legacy token).
 */
export function getAuthCacheUserId(): string | null {
  return getAuthUserId() || (getAuthToken() ? `token-${getAuthToken()!.slice(-16)}` : null);
}

export function getAuthToken(): string | null {
  const storage = getStorage();
  if (!storage) return null;
  migrateLegacyAuthStorage();
  try {
    return storage.getItem(SESSION_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
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

export function clearAuthToken(): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.removeItem(SESSION_TOKEN_KEY);
    for (const legacyKey of LEGACY_TOKEN_KEYS) {
      storage.removeItem(legacyKey);
    }
  } catch {
    // Ignore unavailable storage.
  }
}

/**
 * Returns true when a client token is present. The backend also accepts its
 * HttpOnly `det_token` cookie, so a missing local token is not proof that the
 * user is signed out; callers that need certainty must call `getMe()`.
 */
export function hasAuthSession(): boolean {
  return Boolean(getAuthToken());
}

// Run the one-time migration as soon as the module is loaded in a browser.
migrateLegacyAuthStorage();
