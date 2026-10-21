'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Single application-level auth bootstrap. Pages and layout chrome must not
 * call checkAuth themselves; otherwise one dashboard load issues several
 * competing /auth/me requests and races the progress sync.
 */
export const AuthBootstrap: React.FC = () => {
  useEffect(() => {
    void useAuthStore.getState().checkAuth();
  }, []);
  return null;
};
