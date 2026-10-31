import { create } from 'zustand';
import { api, ApiError, User } from '@/lib/api';
import { hasAuthSession } from '@/lib/auth-session';
import { cacheUser, clearOfflineData, getCachedUser } from '@/lib/offline-cache';
import { clearAllResponseOutbox } from '@/lib/response-outbox';
import { useProgressStore } from '@/store/useProgressStore';
import { useErrorNotebookStore } from '@/store/useErrorNotebookStore';
import { useTestStore } from '@/store/useTestStore';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  oauthLogin: (params: {
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
  }) => Promise<boolean>;
  updateProfile: (params: { name?: string; avatarUrl?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

let checkAuthPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await api.login({ email, password });
      set({ user: resp.user, isAuthenticated: true, isLoading: false });
      clearOfflineData({ clearPages: true });
      cacheUser(resp.user);
      await useProgressStore.getState().syncWithBackend(resp.user.id);
      if (resp.user?.name) {
        useProgressStore.getState().setCandidateName(resp.user.name);
      }
      void useErrorNotebookStore.getState().loadForUser(resp.user.id);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await api.register({ email, password, name });
      set({ user: resp.user, isAuthenticated: true, isLoading: false });
      clearOfflineData({ clearPages: true });
      cacheUser(resp.user);
      await useProgressStore.getState().syncWithBackend(resp.user.id);
      if (resp.user?.name) {
        useProgressStore.getState().setCandidateName(resp.user.name);
      }
      void useErrorNotebookStore.getState().loadForUser(resp.user.id);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  oauthLogin: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const resp = await api.oauthLogin(params);
      set({ user: resp.user, isAuthenticated: true, isLoading: false });
      clearOfflineData({ clearPages: true });
      cacheUser(resp.user);
      await useProgressStore.getState().syncWithBackend(resp.user.id);
      if (resp.user?.name) {
        useProgressStore.getState().setCandidateName(resp.user.name);
      }
      void useErrorNotebookStore.getState().loadForUser(resp.user.id);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'OAuth authentication failed';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  updateProfile: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const updatedUser = await api.updateProfile(params);
      set({ user: updatedUser, isLoading: false });
      cacheUser(updatedUser);
      if (updatedUser?.name) {
        useProgressStore.getState().setCandidateName(updatedUser.name);
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Profile update failed';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await api.logout();
    } finally {
      useProgressStore.getState().resetProgressState();
      useErrorNotebookStore.getState().resetForUser();
      clearAllResponseOutbox();
      clearOfflineData({ clearPages: true });
      useTestStore.getState().startNewSession();
      if (typeof window !== 'undefined') {
        localStorage.removeItem('det_active_test_attempt_v2');
        localStorage.removeItem('det_active_test_session_id');
      }
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return;
    if (checkAuthPromise) return checkAuthPromise;
    checkAuthPromise = (async () => {
      if (typeof window === 'undefined') return;
      if (!hasAuthSession()) {
        // No local access token: do not probe /auth/me and /auth/refresh just
        // to render a 401 in the console for every anonymous visitor.
        useProgressStore.getState().resetProgressState();
        useErrorNotebookStore.getState().resetForUser();
        set({ user: null, isAuthenticated: false, isLoading: false });
        return;
      }

      set({ isLoading: true });
      try {
        const user = await api.getMe();
        set({ user, isAuthenticated: true, isLoading: false });
        cacheUser(user);
        if (user?.name) {
          useProgressStore.getState().setCandidateName(user.name);
        }
        useProgressStore.getState().syncWithBackend(user.id);
        void useErrorNotebookStore.getState().loadForUser(user.id);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          // Access token expired: try the rotating HttpOnly refresh cookie once.
          try {
            const refreshed = await api.refreshSession();
            set({ user: refreshed.user, isAuthenticated: true, isLoading: false });
            cacheUser(refreshed.user);
            useProgressStore.getState().syncWithBackend(refreshed.user.id);
            void useErrorNotebookStore.getState().loadForUser(refreshed.user.id);
            return;
          } catch {
            await api.logout().catch(() => {});
            useProgressStore.getState().resetProgressState();
            useErrorNotebookStore.getState().resetForUser();
            set({ user: null, isAuthenticated: false, isLoading: false });
            return;
          }
        }
        // A network/5xx failure must not destroy the local session token. If a
        // recent profile snapshot exists, keep the authenticated UI usable in
        // offline mode; 401/refresh failures above deliberately skip this path.
        const cached = getCachedUser();
        if (cached) {
          set({ user: cached, isAuthenticated: true, isLoading: false });
          return;
        }
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    })();
    try {
      await checkAuthPromise;
    } finally {
      checkAuthPromise = null;
    }
  },
}));
