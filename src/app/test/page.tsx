'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTestStore } from '@/store/useTestStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { BentoCard } from '@/components/ui/BentoCard';
import { PillBadge } from '@/components/ui/PillBadge';
import { Button } from '@/components/ui/Button';
import { AuthRequiredGuard } from '@/components/auth/AuthRequiredGuard';
import { PlayCircle, ShieldCheck } from 'lucide-react';

export default function TestLobbyPage() {
  const router = useRouter();
  const { startNewSession } = useTestStore();
  const { user } = useAuthStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testLobby;
  const [candidateName, setCandidateName] = useState('');

  useEffect(() => {
    if (user?.name) {
      setCandidateName(user.name);
    }
  }, [user]);

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    startNewSession(candidateName.trim() || user?.name || 'Candidate');
    router.push('/test/session');
  };

  const activeMechanics = [
    { title: 'Read and Select', timing: locale === 'ru' ? '5с на слово' : '5s per word', status: 'Active' },
    { title: 'Fill in the Blanks', timing: locale === 'ru' ? '20с на пункт' : '20s per item', status: 'Active' },
    { title: 'Read and Complete (C-Test)', timing: locale === 'ru' ? '3 минуты' : '3 minutes', status: 'Active' },
    { title: 'Listen and Type', timing: locale === 'ru' ? '60с (макс 3 аудио)' : '60s (max 3 replays)', status: 'Active' },
    { title: 'Interactive Reading', timing: locale === 'ru' ? '5 экранов' : '5 screens', status: 'Active' },
    { title: 'Interactive Listening', timing: locale === 'ru' ? 'Диалог + 75с Summary' : 'Dialogue + 75s Summary', status: 'Active' },
    { title: 'Write About the Photo', timing: locale === 'ru' ? '3 фото по 60с' : '3 photos x 60s', status: 'Active' },
    { title: 'Interactive Writing', timing: locale === 'ru' ? '5 мин + 3 мин follow-up' : '5 min + 3 min follow-up', status: 'Active' },
    { title: 'Writing Sample', timing: locale === 'ru' ? '5 минут (100+ слов)' : '5 minutes (100+ words)', status: 'Active' },
    { title: 'Speak About the Photo', timing: locale === 'ru' ? '90 секунд' : '90 seconds', status: 'Coming Soon' },
    { title: 'Read / Listen, Then Speak', timing: locale === 'ru' ? '90 секунд' : '90 seconds', status: 'Coming Soon' },
    { title: 'Interactive Speaking', timing: locale === 'ru' ? '35с на вопрос' : '35s per prompt', status: 'Coming Soon' },
    { title: 'Speaking Sample', timing: locale === 'ru' ? '3 минуты' : '3 minutes', status: 'Coming Soon' },
  ];

  return (
    <AuthRequiredGuard
      title={locale === 'ru' ? 'Симулятор теста доступен только после регистрации' : 'Test simulator requires authentication'}
      subtitle={locale === 'ru' ? 'Для запуска Computer Adaptive Testing (CAT), фиксации серверных таймингов, оценки сабскоров и выдачи официального сертификата требуется авторизация.' : 'Log in or create an account to start computer adaptive testing, record certified timings, and receive your certificate.'}
      badge="DET Simulation Engine"
    >
      <div className="min-h-screen py-12 ambient-glow">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <PillBadge variant="mint" prefixHash>
                {t.engineBadge}
              </PillBadge>
              <span className="text-xs font-bold text-neutral-500 uppercase">
                {t.scoringTag}
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black uppercase text-[#0E1012] tracking-tight mb-4">
              {t.title}
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 max-w-2xl mx-auto">
              {t.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start mb-12">
            {/* Form Card (5 cols) */}
            <BentoCard variant="dark" className="md:col-span-5 space-y-6">
              <div>
                <PillBadge variant="lime" prefixHash className="mb-2">
                  {t.sessionBadge}
                </PillBadge>
                <h3 className="text-2xl font-black uppercase text-white">
                  {t.sessionTitle}
                </h3>
              </div>

              <form onSubmit={handleStart} className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase text-neutral-400 block mb-1.5">
                    {t.nameLabel}
                  </label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder={t.namePlaceholder}
                    className="w-full bg-neutral-900 border border-neutral-700 focus:border-[#D2F544] rounded-2xl p-3.5 text-white text-sm outline-none font-medium"
                  />
                  <span className="text-[11px] text-neutral-500 mt-1 block">
                    {t.nameHint}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900/90 border border-neutral-800 space-y-2 text-xs text-neutral-300">
                  <div className="flex items-center gap-2 text-[#D2F544] font-bold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>{t.rulesTitle}</span>
                  </div>
                  <p>{t.rule1}</p>
                  <p>{t.rule2}</p>
                  <p>{t.rule3}</p>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full cursor-pointer"
                  icon={<PlayCircle className="w-5 h-5" />}
                >
                  {t.startBtn}
                </Button>
              </form>
            </BentoCard>

            {/* Catalog of Tasks Statuses (7 cols) */}
            <BentoCard variant="light" className="md:col-span-7">
              <h3 className="text-xl font-bold uppercase text-[#0E1012] mb-4 flex items-center justify-between">
                <span>{t.compositionTitle}</span>
                <span className="text-xs font-mono text-neutral-400 font-normal">{t.mvpStatusLabel}</span>
              </h3>

              <div className="divide-y divide-neutral-100 max-h-[460px] overflow-y-auto pr-2">
                {activeMechanics.map((item, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-neutral-900 block">{item.title}</span>
                      <span className="text-neutral-500">{item.timing}</span>
                    </div>
                    <div>
                      {item.status === 'Active' ? (
                        <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full text-[10px]">
                          {t.statusActive}
                        </span>
                      ) : (
                        <span className="bg-neutral-100 text-neutral-500 font-medium px-2.5 py-1 rounded-full text-[10px]">
                          {t.statusComingSoon}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>
          </div>
        </div>
      </div>
    </AuthRequiredGuard>
  );
}
