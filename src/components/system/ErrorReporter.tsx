'use client';

import { useEffect } from 'react';
import { installErrorReporter } from '@/lib/error-reporter';

export const ErrorReporter: React.FC = () => {
  useEffect(() => {
    installErrorReporter();
  }, []);
  return null;
};
