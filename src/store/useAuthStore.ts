import { create } from 'zustand';
import { api, User } from '@/lib/api';
import { useProgressStore } from '@/store/useProgressStore';

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
  }) => Promise<boolean>;
  updateProfile: (params: { name?: string; avatarUrl?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

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
      if (resp.user?.name) {
        useProgressStore.getState().setCandidateName(resp.user.name);
      }
      useProgressStore.getState().syncWithBackend(resp.user.id);
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
      if (resp.user?.name) {
        useProgressStore.getState().setCandidateName(resp.user.name);
      }
      useProgressStore.getState().syncWithBackend(resp.user.id);
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
      if (resp.user?.name) {
        useProgressStore.getState().setCandidateName(resp.user.name);
      }
      useProgressStore.getState().syncWithBackend(resp.user.id);
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
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  checkAuth: async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('det_token');
    if (!token) {
      useProgressStore.getState().resetProgressState();
      return;
    }

    set({ isLoading: true });
    try {
      const user = await api.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
      if (user?.name) {
        useProgressStore.getState().setCandidateName(user.name);
      }
      useProgressStore.getState().syncWithBackend(user.id);
    } catch {
      localStorage.removeItem('det_token');
      useProgressStore.getState().resetProgressState();
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
