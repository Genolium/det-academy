'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/useAuthStore';
import { AuthRequiredGuard } from '@/components/auth/AuthRequiredGuard';
import { Button } from '@/components/ui/Button';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { Brain, Clock, Target, ShieldCheck, Loader2 } from 'lucide-react';

function DiagnosticLauncher() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].diagnostic;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.startTestSession({
        candidateName: user?.name || 'Candidate',
        difficultyLevel: 'B1',
        mode: 'diagnostic',
      });
      if (!response?.session?.id) throw new Error(t.createFailed);
      writeStoredAttempt(response.session.id);
      router.push('/test/session');
    } catch (err) {
      setError(err instanceof Error ? err.message : (locale === 'ru' ? 'Не удалось начать диагностику' : 'Could not start the diagnostic'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0E1012] text-white py-16 px-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#D2F544]/20 border border-[#D2F544]/40 text-[#D2F544] flex items-center justify-center mx-auto">
            <Brain className="w-8 h-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
            {t.title}
          </h1>
          <p className="text-sm text-neutral-400 max-w-xl mx-auto leading-relaxed">
            {t.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            [<Clock key="c" className="w-5 h-5" />, t.timeTitle, t.timeDesc],
            [<Target key="t" className="w-5 h-5" />, t.skillsTitle, t.skillsDesc],
            [<ShieldCheck key="s" className="w-5 h-5" />, t.serverTitle, t.serverDesc],
          ].map(([icon, title, text]) => (
            <div key={String(title)} className="rounded-2xl border border-neutral-800 bg-[#111315] p-4">
              <div className="text-[#D2F544] mb-2">{icon}</div>
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="mt-1 text-[11px] text-neutral-400">{text}</p>
            </div>
          ))}
        </div>

        <div className="rounded-3xl border border-neutral-800 bg-[#111315] p-6 space-y-4">
          <p className="text-xs text-neutral-400">
            {t.disclaimer}
          </p>
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
              {error}
            </div>
          )}
          <Button
            variant="primary"
            size="lg"
            onClick={() => void start()}
            disabled={loading}
            icon={loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
          >
            {loading ? t.creating : t.start}
          </Button>
        </div>
      </div>
    </div>
  );
}

function writeStoredAttempt(sessionId: string) {
  try {
    localStorage.setItem(
      'det_active_test_attempt_v2',
      JSON.stringify({ sessionId, finalizing: false, updatedAt: Date.now() })
    );
    localStorage.setItem('det_active_test_session_id', sessionId);
  } catch {}
}

export default function DiagnosticPage() {
  return (
    <AuthRequiredGuard badge="Diagnostic">
      <DiagnosticLauncher />
    </AuthRequiredGuard>
  );
}
