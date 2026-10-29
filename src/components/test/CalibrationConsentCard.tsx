'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { isCalibrationConsentPromptSnoozed, snoozeCalibrationConsentPrompt } from '@/lib/calibrationConsent';

const DECLINE_SNOOZE_DAYS = 14;

type CardState = 'loading' | 'hidden' | 'prompt' | 'saved';

/**
 * Optional, non-blocking consent card shown before the mock test starts.
 * Declining is exactly as easy as granting, and the card never gates the test.
 */
export const CalibrationConsentCard: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';
  const [state, setState] = useState<CardState>('loading');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setState('hidden');
      return;
    }
    if (isCalibrationConsentPromptSnoozed()) {
      setState('hidden');
      return;
    }

    let active = true;
    api
      .getResearchConsent()
      .then((consent) => {
        if (!active) return;
        setState(consent.consent ? 'hidden' : 'prompt');
      })
      .catch(() => {
        if (active) setState('hidden');
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  const grant = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await api.updateResearchConsent(true);
      setState(saved.consent ? 'saved' : 'hidden');
    } catch {
      setError(
        ru
          ? 'Не удалось сохранить согласие. Можно продолжить тест без него.'
          : 'Could not save consent. You can continue the test without it.'
      );
    } finally {
      setSaving(false);
    }
  };

  const decline = () => {
    snoozeCalibrationConsentPrompt(DECLINE_SNOOZE_DAYS);
    setState('hidden');
  };

  if (state === 'loading' || state === 'hidden') return null;

  if (state === 'saved') {
    return (
      <div
        role="status"
        data-testid="calibration-consent-saved"
        className="mb-8 rounded-2xl border border-emerald-800/60 bg-emerald-950/40 px-5 py-4 text-sm text-emerald-200 flex items-center gap-3"
      >
        <CheckCircle2 className="w-5 h-5 shrink-0" />
        <span>
          {ru
            ? 'Согласие сохранено. Спасибо! Его можно отозвать в любой момент в профиле.'
            : 'Consent saved. Thank you! You can revoke it at any time in your profile.'}
        </span>
      </div>
    );
  }

  return (
    <section
      data-testid="calibration-consent-card"
      aria-labelledby="calibration-consent-title"
      className="mb-8 rounded-2xl border border-neutral-700 bg-[#0E1012] px-5 py-5 sm:px-6 sm:py-6 text-white"
    >
      <div className="flex flex-col lg:flex-row lg:items-start gap-5">
        <div className="flex items-start gap-3.5 flex-1">
          <div className="w-10 h-10 rounded-2xl bg-[#D2F544]/15 border border-[#D2F544]/30 flex items-center justify-center text-[#D2F544] shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 id="calibration-consent-title" className="text-sm font-bold text-white">
              {ru
                ? 'Помогите сделать оценку Speaking/Writing точнее'
                : 'Help make Speaking/Writing scoring more accurate'}
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-neutral-400 max-w-3xl">
              {ru
                ? 'По желанию разрешите обезличенно использовать ваши письменные и устные ответы для калибровки тренажёра. Два независимых эксперта оценят их, идентификаторы и контакты удаляются. Согласие добровольно, не влияет на доступ и результат теста, его можно отозвать в профиле.'
                : 'Optionally allow your written and spoken answers to be used in de-identified form to calibrate the practice evaluator. Two independent experts rate them, and identifiers and contact details are removed. Consent is voluntary, does not affect access or your test result, and can be revoked in your profile.'}
            </p>
            <p className="mt-1.5 text-[11px] text-neutral-500">
              <Link href="/privacy" className="underline hover:text-neutral-300">
                {ru ? 'Политика данных' : 'Data policy'}
              </Link>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-2 shrink-0">
          <button
            type="button"
            data-testid="calibration-consent-grant"
            onClick={() => void grant()}
            disabled={saving}
            className="rounded-xl border border-[#D2F544]/60 bg-[#D2F544]/10 px-4 py-2.5 text-xs font-bold text-[#D2F544] transition-colors hover:bg-[#D2F544]/20 disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {saving ? (ru ? 'Сохраняем…' : 'Saving…') : ru ? 'Разрешить' : 'Allow'}
          </button>
          <button
            type="button"
            data-testid="calibration-consent-decline"
            onClick={decline}
            className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2.5 text-xs font-bold text-neutral-200 transition-colors hover:border-neutral-500 disabled:opacity-50"
          >
            {ru ? 'Не сейчас' : 'Not now'}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-xs text-rose-300">
          {error}
        </p>
      )}
    </section>
  );
};
