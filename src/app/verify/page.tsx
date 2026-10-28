'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Search, ArrowRight, ArrowLeft } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function VerifySearchPage() {
  const router = useRouter();
  const { locale } = useSettingsStore();
  const t = (ruText: string, enText: string) => (locale === 'ru' ? ruText : enText);
  const [certId, setCertId] = useState('');
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = certId.trim();
    if (!trimmed) {
      setError(t('Пожалуйста, введите номер сертификата', 'Enter a certificate number'));
      return;
    }
    setError('');
    router.push(`/verify/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-[#070809] text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('На главную', 'Home')}
        </Link>

        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-[#D2F544]/10 border border-[#D2F544]/30 text-[#D2F544] flex items-center justify-center mx-auto shadow-lg">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            {t('Проверка сертификата DET Academy', 'DET Academy certificate verification')}
          </h1>
          <p className="text-sm text-neutral-400 max-w-md mx-auto">
            {t('Введите уникальный идентификатор отчёта', 'Enter the unique report identifier')} ({t('например', 'for example')}, <code className="text-[#D2F544]">det-cert-...</code>) {t('для проверки подлинности результатов тестирования в реестре.', 'to verify the test results in the registry.')}
          </p>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={certId}
              onChange={(e) => {
                setCertId(e.target.value);
                if (error) setError('');
              }}
              placeholder={t('Введите номер сертификата (det-cert-...)', 'Enter the certificate number (det-cert-...)')}
              className="w-full px-5 py-4 pl-12 rounded-2xl bg-neutral-900 border border-neutral-800 text-white placeholder-neutral-500 focus:outline-none focus:border-[#D2F544] transition-colors font-mono text-sm"
            />
            <Search className="w-5 h-5 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
          </div>

          {error && (
            <p className="text-xs text-red-400 px-1 font-medium">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-4 rounded-2xl bg-[#D2F544] hover:bg-[#c2e534] text-[#0C2418] font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
          >
            {t('Проверить подлинность', 'Verify authenticity')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="border-t border-neutral-800/80 pt-6 text-center text-xs text-neutral-500 space-y-2">
          <p>
            {t(
              'Сертификаты выдаются кандидатам, успешно завершившим тренировочный экзамен с сертифицированным результатом ≥105 баллов и прошедшим полный курс теории.',
              'Certificates are issued to candidates who complete the training exam with a verified result of 105 or more and finish the full theory course.'
            )}
          </p>
          <p>
            {t(
              'Платформа DET Academy является независимым тренировочным комплексом и не аффилирована с Duolingo Inc.',
              'DET Academy is an independent training platform and is not affiliated with Duolingo Inc.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
