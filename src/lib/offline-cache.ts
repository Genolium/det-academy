import type { User } from '@/lib/api';
import { getAuthUserId } from '@/lib/auth-session';

const USER_CACHE_KEY = 'det_offline_user_v1';
const USER_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface CachedUser {
  user: User;
  cachedAt: number;
}

export function cacheUser(user: User): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(USER_CACHE_KEY, JSON.stringify({ user, cachedAt: Date.now() }));
  } catch {
    // Storage may be unavailable in private/restricted contexts.
  }
}

export function getCachedUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedUser;
    if (!cached?.user?.id || Date.now() - cached.cachedAt > USER_CACHE_TTL_MS) {
      localStorage.removeItem(USER_CACHE_KEY);
      return null;
    }
    const tokenUserId = getAuthUserId();
    if (tokenUserId && tokenUserId !== cached.user.id) return null;
    return cached.user;
  } catch {
    return null;
  }
}

export function clearOfflineData(options: { clearPages?: boolean } = {}): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(USER_CACHE_KEY);
  } catch {
    // Ignore unavailable storage.
  }
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.controller?.postMessage({
      type: 'CLEAR_OFFLINE_CACHES',
      clearPages: Boolean(options.clearPages),
    });
  }
}
