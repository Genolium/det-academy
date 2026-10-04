'use client';

import React from 'react';
import { Award, ShieldCheck, Download, Printer, CheckCircle, ExternalLink } from 'lucide-react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { PillBadge } from '@/components/ui/PillBadge';
import { Button } from '@/components/ui/Button';

export interface CertificateData {
  id: string;
  candidateName: string;
  issueDate: string;
  overallScore: number;
  literacy: number;
  comprehension: number;
  production: number;
  conversation: number;
  isVerified: boolean;
}

interface CertificateViewProps {
  data: CertificateData;
}

export const CertificateView: React.FC<CertificateViewProps> = ({ data }) => {
  const { locale } = useSettingsStore();
  const t = translations[locale].certificate;

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6">
      {/* Verification status header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-neutral-900">
                {t.officialBadge}
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {t.verifiedTag}
              </span>
            </div>
            <p className="text-xs text-neutral-500 font-mono">
              {t.certIdLabel}: {data.id} • {t.issueDateLabel}: {data.issueDate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="dark" size="sm" onClick={handlePrint} icon={<Printer className="w-4 h-4" />}>
            {t.printPdfBtn}
          </Button>
        </div>
      </div>

      {/* Official Certificate Canvas */}
      <div
        id="certificate-frame"
        className="bg-white rounded-3xl border-8 border-neutral-900 p-8 sm:p-14 shadow-2xl relative overflow-hidden print:border-4 print:p-8 print:shadow-none"
      >
        {/* Subtle Watermark Background */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
          <span className="text-[180px] font-black uppercase text-black transform -rotate-12">
            DET ACADEMY
          </span>
        </div>

        {/* Top Certificate Header */}
        <div className="flex items-start justify-between border-b-2 border-neutral-100 pb-8 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[#0E1012] text-[#D2F544] flex items-center justify-center font-black text-2xl shadow-lg">
              D
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
                DET ACADEMY
              </h2>
              <span className="text-xs uppercase tracking-widest text-neutral-500 font-bold block">
                Certificate of Simulation Proficiency
              </span>
            </div>
          </div>

          <div className="text-right">
            <div className="w-16 h-16 rounded-2xl border-2 border-[#D2F544] bg-[#D2F544]/20 flex items-center justify-center ml-auto">
              <Award className="w-8 h-8 text-[#0C2418]" />
            </div>
          </div>
        </div>

        {/* Candidate Presentation */}
        <div className="text-center my-8 space-y-3">
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold">
            {t.awardedTo}
          </span>
          <h1 className="text-3xl sm:text-5xl font-black text-neutral-900 tracking-tight underline decoration-[#D2F544] decoration-4 underline-offset-8">
            {data.candidateName}
          </h1>
          <p className="text-sm text-neutral-600 max-w-xl mx-auto pt-2">
            {t.awardReason}
          </p>
        </div>

        {/* Scores Block */}
        <div className="bg-[#111315] text-white rounded-3xl p-6 sm:p-8 my-8 shadow-md">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-neutral-800">
            <div>
              <span className="text-xs uppercase font-bold text-[#D2F544] tracking-widest block mb-1">
                {t.verifiedScoreLabel}
              </span>
              <div className="text-5xl font-black text-white font-mono">
                {data.overallScore} <span className="text-xl text-neutral-500 font-normal">/ 160</span>
              </div>
            </div>
            <div className="text-xs text-neutral-400 text-center sm:text-right max-w-xs">
              {t.scaleExplanation}
            </div>
          </div>

          {/* Subscores */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
            <div className="text-center">
              <span className="text-[11px] uppercase font-bold text-neutral-400 block mb-1">Literacy</span>
              <div className="text-2xl font-black text-[#D2F544] font-mono">{data.literacy}</div>
            </div>
            <div className="text-center">
              <span className="text-[11px] uppercase font-bold text-neutral-400 block mb-1">Comprehension</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">{data.comprehension}</div>
            </div>
            <div className="text-center">
              <span className="text-[11px] uppercase font-bold text-neutral-400 block mb-1">Production</span>
              <div className="text-2xl font-black text-amber-400 font-mono">{data.production}</div>
            </div>
            <div className="text-center">
              <span className="text-[11px] uppercase font-bold text-neutral-400 block mb-1">Conversation</span>
              <div className="text-2xl font-black text-blue-400 font-mono">{data.conversation}</div>
            </div>
          </div>
        </div>

        {/* Bottom Signatures and QR Code placeholder */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t-2 border-neutral-100 text-xs text-neutral-500">
          <div>
            <span className="font-bold text-neutral-900 block">{t.boardTitle}</span>
            <span>{t.boardSubtitle}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-neutral-900 text-[#D2F544] p-1.5 rounded-xl font-mono text-[9px] flex flex-col items-center justify-center font-bold text-center">
              <span>{t.qrLabel}</span>
              <span className="text-[7px] text-white">ID: {data.id.slice(0, 8)}</span>
            </div>
            <div className="text-[11px]">
              <span className="text-emerald-700 font-bold block">{t.authenticatedRecord}</span>
              <span>det-academy.org/verify/{data.id}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
