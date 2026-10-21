'use client';

import React, { useState } from 'react';
import { api } from '@/lib/api';
import { MailWarning, CheckCircle2 } from 'lucide-react';

export const EmailVerificationBanner: React.FC<{ email?: string }> = ({ email }) => {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const resend = async () => {
    setStatus('sending');
    try {
      await api.resendVerification();
      setStatus('sent');
      setMessage('Письмо отправлено. Проверьте входящие и спам.');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Не удалось отправить письмо.');
    }
  };

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-start gap-3">
        <MailWarning className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-amber-900">Подтвердите email</p>
          <p className="text-xs text-amber-800 mt-0.5">
            {email ? `Мы отправили ссылку на ${email}. ` : ''}
            Без подтверждения мы не сможем восстановить доступ и отправлять отчёты.
          </p>
          {message && <p className="text-[11px] text-amber-700 mt-1">{message}</p>}
        </div>
      </div>
      <button
        onClick={() => void resend()}
        disabled={status === 'sending' || status === 'sent'}
        className="rounded-xl bg-amber-900 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {status === 'sent' ? (
          <span className="inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Отправлено
          </span>
        ) : status === 'sending' ? (
          'Отправляем...'
        ) : (
          'Отправить ещё раз'
        )}
      </button>
    </div>
  );
};
