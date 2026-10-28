'use client';

import React, { use, useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Printer,
  Share2,
  ArrowLeft,
  FileText,
  Lock,
  Search,
} from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useSettingsStore } from '@/store/useSettingsStore';

interface VerifyPageProps {
  params: Promise<{ id: string }>;
}

interface CertificateData {
  id: string;
  candidateName: string;
  overallScore: number;
  literacyScore: number;
  comprehensionScore: number;
  productionScore: number;
  conversationScore: number;
  issuedAt: string;
  isVerified: boolean;
  sha256Hash?: string;
  essaySnapshot?: string;
}

export default function CertificateVerificationPage({ params }: VerifyPageProps) {
  const resolvedParams = use(params);
  const { locale } = useSettingsStore();
  const ru = locale === 'ru';
  const t = (ruText: string, enText: string) => (ru ? ruText : enText);
  const certId = resolvedParams?.id || '';

  const [loading, setLoading] = useState(true);
  const [cert, setCert] = useState<CertificateData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<'not_found' | 'network' | 'unknown' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (!certId) {
      setError(t('Идентификатор сертификата не указан', 'No certificate identifier provided'));
      setErrorKind('not_found');
      setLoading(false);
      return;
    }

    const fetchCert = async () => {
      setLoading(true);
      setError(null);
      setErrorKind(null);
      try {
        const data = await api.getCertificate(certId);
        if (isMounted) {
          if (data && data.id) {
            setCert({
              id: data.id,
              candidateName: data.candidateName || t('Кандидат', 'Candidate'),
              overallScore: data.overallScore ?? 0,
              literacyScore: data.literacyScore ?? 0,
              comprehensionScore: data.comprehensionScore ?? 0,
              productionScore: data.productionScore ?? 0,
              conversationScore: data.conversationScore ?? 0,
              issuedAt: data.issuedAt || new Date().toISOString(),
              isVerified: Boolean(data.isVerified),
              sha256Hash: (data as unknown as Record<string, unknown>).sha256Hash as string | undefined,
              essaySnapshot: (data as unknown as Record<string, unknown>).essaySnapshot as string | undefined,
            });
            setError(null);
          } else {
            setCert(null);
            setError(t('Сертификат с указанным идентификатором не найден', 'No certificate found with this identifier'));
            setErrorKind('not_found');
          }
        }
      } catch (err) {
        if (isMounted) {
          setCert(null);
          if (err instanceof ApiError && err.status === 404) {
            setErrorKind('not_found');
            setError(t('Сертификат с указанным идентификатором не зарегистрирован', 'A certificate with this identifier is not registered'));
          } else if (err instanceof ApiError && err.status === 0) {
            setErrorKind('network');
            setError(t(
              'Реестр сертификатов временно недоступен. Это не означает, что сертификат отсутствует.',
              'The certificate registry is temporarily unavailable. This does not mean the certificate is missing.'
            ));
          } else {
            setErrorKind('unknown');
            setError(t(
              'Не удалось проверить сертификат из-за ошибки реестра. Повторите попытку позже.',
              'The certificate could not be verified because of a registry error. Try again later.'
            ));
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCert();
    return () => {
      isMounted = false;
    };
  }, [certId, locale]);

  const getCefrBadge = (score: number) => {
    if (score >= 130) return { band: 'C1 / C2 Advanced Mastery', color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60' };
    if (score >= 105) return { band: 'B2 Upper-Intermediate', color: 'text-[#D2F544] bg-[#D2F544]/15 border-[#D2F544]/30' };
    if (score >= 80) return { band: 'B1 Intermediate', color: 'text-amber-400 bg-amber-950/60 border-amber-800/60' };
    return { band: 'A2 Elementary', color: 'text-neutral-400 bg-neutral-900 border-neutral-800' };
  };

  const handleCopyLink = async () => {
    if (typeof window === 'undefined') return;
    const shareUrl = window.location.href;
    const shareData = {
      title: cert ? `Сертификат DET Academy: ${cert.candidateName}` : 'DET Academy',
      text: cert
        ? `Результат тренировочного экзамена: ${cert.overallScore}/160`
        : 'Проверка сертификата DET Academy',
      url: shareUrl,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch {
        // The user cancelled the share sheet: fall through to copying.
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch {
      // Clipboard can be unavailable on insecure origins; the address bar still
      // contains the public URL, so no error dialog is needed.
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070809] text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-2 border-[#D2F544] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-neutral-400 font-medium">{t('Проверка подлинности сертификата в реестре...', 'Verifying the certificate in the registry...')}</p>
        </div>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen bg-[#070809] text-white py-16 px-4">
        <div className="max-w-md mx-auto text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">
              {errorKind === 'network'
                ? t('Реестр недоступен', 'Registry unavailable')
                : errorKind === 'not_found'
                ? t('Сертификат не найден', 'Certificate not found')
                : t('Не удалось проверить сертификат', 'Could not verify the certificate')}
            </h1>
            <p className="text-sm text-neutral-400 mt-2">
              {errorKind === 'network' ? (
                error
              ) : (
                <>
                  {t('Документ с номером', 'Document number')}{' '}
                  <span className="font-mono text-neutral-200">{certId}</span> {t('не зарегистрирован в реестре отчётов DET Academy.', 'is not registered in the DET Academy report registry.')}
                </>
              )}
            </p>
          </div>
          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/verify"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-sm transition-colors"
            >
              <Search className="w-4 h-4" /> {t('Проверить другой номер', 'Check another number')}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-transparent hover:text-white text-neutral-400 font-semibold text-sm transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> {t('На главную', 'Home')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cefr = getCefrBadge(cert.overallScore);

  return (
    <div className="min-h-screen bg-[#070809] text-white py-12 px-4 sm:px-6 lg:px-8 print:bg-white print:text-black">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation & Actions Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
          <Link
            href="/verify"
            className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('Проверить другой сертификат', 'Check another certificate')}
          </Link>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-semibold text-neutral-200 hover:text-white hover:border-neutral-700 transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? t('Ссылка скопирована', 'Link copied') : t('Поделиться', 'Share')}
            </button>
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#D2F544] text-[#0C2418] font-bold text-xs hover:bg-[#c2e534] transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              {t('Печать отчёта', 'Print report')}
            </button>
          </div>
        </div>

        {/* Official Certificate Card */}
        <div className="relative bg-neutral-950 border border-neutral-800 rounded-3xl p-6 sm:p-10 space-y-8 overflow-hidden shadow-2xl print:border-none print:shadow-none print:p-0">
          {/* Official Verification Watermark Badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-6">
            <div className="flex items-center gap-2 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-wider">
                {t('Отчёт тренировочного экзамена DET Academy', 'DET Academy training exam report')}
              </span>
            </div>
            <div className="font-mono text-xs text-neutral-400 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800">
              ID: {cert.id}
            </div>
          </div>

          {/* Institution Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#D2F544] text-[#0C2418] flex items-center justify-center font-black text-2xl shadow-lg">
                🦉
              </div>
              <div>
                <h2 className="text-xl font-black uppercase text-white tracking-tight">
                  DET Academy
                </h2>
                <p className="text-xs text-neutral-400">
                  Duolingo English Test Preparation & Progress Evaluation
                </p>
              </div>
            </div>

            <div className="sm:text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-black border ${cefr.color}`}>
                {cefr.band}
              </span>
            </div>
          </div>

          {/* Candidate Profile Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-2">
            <div>
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                {t('ФИО Кандидата', 'Candidate name')}
              </span>
              <p className="text-lg font-black text-white">{cert.candidateName}</p>
            </div>

            <div>
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                {t('Дата экзамена', 'Exam date')}
              </span>
              <p className="text-sm font-bold text-neutral-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-neutral-400" />
                {new Date(cert.issuedAt).toLocaleDateString(ru ? 'ru-RU' : 'en-US', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block mb-1">
                {t('Статус в реестре DET Academy', 'DET Academy registry status')}
              </span>
              <p className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> {cert.isVerified ? t('Зарегистрирован в реестре DET Academy', 'Registered in the DET Academy registry') : t('Ожидает проверки', 'Pending verification')}
              </p>
            </div>
          </div>

          {/* Big Score Box */}
          <div className="bg-gradient-to-br from-[#12161A] to-[#0A0D0F] border border-neutral-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <span className="text-xs font-extrabold text-neutral-400 uppercase tracking-wider">
                {t('Тренировочная оценка (Overall Estimate)', 'Training estimate (Overall Estimate)')}
              </span>
              <div className="flex items-baseline justify-center md:justify-start gap-2 mt-1">
                <span className="text-6xl sm:text-7xl font-black text-[#D2F544] tracking-tight">
                  {cert.overallScore}
                </span>
                <span className="text-xl text-neutral-500 font-bold">/ 160</span>
              </div>
              <p className="text-xs text-neutral-400 mt-2 max-w-sm">
                {t('Оценочный балл по тренировочному симулятору платформы DET Academy.', 'Estimated score from the DET Academy training simulator.')}
              </p>
            </div>

            {/* 4 Subscores Bar Cards */}
            <div className="grid grid-cols-2 gap-3 w-full md:max-w-md">
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-neutral-300">Literacy</span>
                  <span className="text-sm font-black text-white">{cert.literacyScore}</span>
                </div>
                <div className="text-[10px] text-neutral-500">{t('Чтение + Письмо', 'Reading + Writing')}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-neutral-300">Comprehension</span>
                  <span className="text-sm font-black text-white">{cert.comprehensionScore}</span>
                </div>
                <div className="text-[10px] text-neutral-500">{t('Чтение + Аудирование', 'Reading + Listening')}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-neutral-300">Conversation</span>
                  <span className="text-sm font-black text-white">{cert.conversationScore}</span>
                </div>
                <div className="text-[10px] text-neutral-500">{t('Аудио + Говорение', 'Listening + Speaking')}</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-neutral-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-neutral-300">Production</span>
                  <span className="text-sm font-black text-white">{cert.productionScore}</span>
                </div>
                <div className="text-[10px] text-neutral-500">{t('Письмо + Говорение', 'Writing + Speaking')}</div>
              </div>
            </div>
          </div>

          {/* Optional Essay Work Snapshot if genuinely present */}
          {cert.essaySnapshot && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#D2F544]" />
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">
                  {t('Снимок письменной работы кандидата (Writing Sample Snapshot)', 'Candidate writing sample snapshot')}
                </h3>
              </div>
              <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300 leading-relaxed font-serif italic">
                &ldquo;{cert.essaySnapshot}&rdquo;
              </div>
            </div>
          )}

          {/* Validation Box */}
          <div className="border-t border-neutral-800 pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#D2F544]" />
                {t('Идентификатор верификации:', 'Verification identifier:')}
              </span>
              <p className="font-mono text-xs text-neutral-300 select-all">
                {cert.id}
              </p>
            </div>

            {cert.sha256Hash && (
              <div className="space-y-1 sm:text-right">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  {t('Контрольный хеш записи:', 'Record checksum:')}
                </span>
                <p className="font-mono text-[10px] text-neutral-400 break-all select-all max-w-xs">
                  {cert.sha256Hash}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <p className="text-center text-xs text-neutral-500 print:hidden">
          {t(
            'Электронный отчёт платформы подготовки DET Academy. Не является официальным свидетельством Duolingo Inc.',
            'Electronic report from the DET Academy preparation platform. Not an official Duolingo Inc. certificate.'
          )}
        </p>
      </div>
    </div>
  );
}
