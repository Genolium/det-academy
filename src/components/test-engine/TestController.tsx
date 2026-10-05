'use client';

import React, { useState, useEffect } from 'react';
import { useTestStore, StageName } from '@/store/useTestStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { api } from '@/lib/api';
import { ReadAndSelect } from './questions/ReadAndSelect';
import { FillInTheBlanks } from './questions/FillInTheBlanks';
import { ReadAndComplete } from './questions/ReadAndComplete';
import { ListenAndType } from './questions/ListenAndType';
import { InteractiveReading } from './questions/InteractiveReading';
import { InteractiveListening } from './questions/InteractiveListening';
import { WriteAboutPhoto } from './questions/WriteAboutPhoto';
import { InteractiveWriting } from './questions/InteractiveWriting';
import { WritingSample } from './questions/WritingSample';
import { TestResultModal } from './TestResultModal';
import { PillBadge } from '@/components/ui/PillBadge';
import { ShieldAlert } from 'lucide-react';

export const TestController: React.FC = () => {
  const {
    currentStage,
    setStage,
    difficultyLevel,
    candidateName,
    finalScores,
    finishTestAndCalculateScores,
    startNewSession,
  } = useTestStore();

  const { addTestResult, isEligibleForCertificate } = useProgressStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
  const [issuedCertId, setIssuedCertId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;
    api.startTestSession({ candidateName, difficultyLevel })
      .then((res) => {
        if (isMounted && res?.session?.id) {
          setBackendSessionId(res.session.id);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [candidateName, difficultyLevel]);

  const stagesSequence: StageName[] = [
    'READ_SELECT',
    'FILL_BLANKS',
    'C_TEST',
    'LISTEN_TYPE',
    'INTERACTIVE_READING',
    'INTERACTIVE_LISTENING',
    'WRITE_PHOTO',
    'INTERACTIVE_WRITING',
    'WRITING_SAMPLE',
  ];

  const currentStageIndex = stagesSequence.indexOf(currentStage);

  const handleStageAdvance = () => {
    if (currentStageIndex + 1 < stagesSequence.length) {
      setStage(stagesSequence[currentStageIndex + 1]);
    } else {
      const scores = finishTestAndCalculateScores();
      const localCertId = 'det-cert-' + Math.random().toString(36).substring(2, 9);

      if (backendSessionId) {
        const state = useTestStore.getState();
        const rsRatio = state.readSelectTotal > 0 ? state.readSelectCorrect / state.readSelectTotal : 0.8;
        const fbRatio = state.fillBlanksTotal > 0 ? state.fillBlanksCorrect / state.fillBlanksTotal : 0.8;
        const ctRatio = state.cTestTotal > 0 ? state.cTestCorrect / state.cTestTotal : 0.8;
        const ltRatio = state.listenTypeTotal > 0 ? state.listenTypeSimilaritySum / state.listenTypeTotal : 0.85;

        api.completeTestSession(backendSessionId, {
          readSelectAccuracy: rsRatio,
          fillBlanksAccuracy: fbRatio,
          cTestAccuracy: ctRatio,
          listenTypeAccuracy: ltRatio,
          interactiveReadingScore: state.interactiveReadingScore,
          interactiveListeningScore: state.interactiveListeningScore,
          writingScore: state.writingScoreRatio || 0.8,
        })
          .then((resp) => {
            if (resp?.certificate?.id) {
              setIssuedCertId(resp.certificate.id);
            }
          })
          .catch(() => {});
      }

      addTestResult({
        id: localCertId,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        overallScore: scores.overall,
        literacy: scores.literacy,
        comprehension: scores.comprehension,
        production: scores.production,
        conversation: scores.conversation,
        candidateName: candidateName || 'Candidate',
      });
    }
  };

  if (currentStage === 'COMPLETED' && finalScores) {
    return (
      <TestResultModal
        scores={finalScores}
        candidateName={candidateName}
        isEligibleForCert={isEligibleForCertificate()}
        certificateId={issuedCertId}
        onRetake={() => {
          startNewSession(candidateName);
          setIssuedCertId(undefined);
          setBackendSessionId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1012] text-white flex flex-col justify-between py-6">
      {/* Top Test Engine Bar (Strict proctoring emulation: No ads, clean layout) */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D2F544] text-[#0C2418] font-black flex items-center justify-center text-sm">
            D
          </div>
          <span className="font-bold text-sm tracking-wide">
            DET CAT SIMULATION
          </span>
        </div>

        <div className="flex items-center gap-4">
          <PillBadge variant="mint" prefixHash className="text-[10px]">
            Difficulty Band: {difficultyLevel}
          </PillBadge>
          <div className="text-xs font-mono text-neutral-400">
            {t.stepLabel} {currentStageIndex + 1} / {stagesSequence.length}
          </div>
        </div>
      </div>

      {/* Main question renderer */}
      <div className="flex-1 flex flex-col justify-center">
        {currentStage === 'READ_SELECT' && <ReadAndSelect onComplete={handleStageAdvance} />}
        {currentStage === 'FILL_BLANKS' && <FillInTheBlanks onComplete={handleStageAdvance} />}
        {currentStage === 'C_TEST' && <ReadAndComplete onComplete={handleStageAdvance} />}
        {currentStage === 'LISTEN_TYPE' && <ListenAndType onComplete={handleStageAdvance} />}
        {currentStage === 'INTERACTIVE_READING' && <InteractiveReading onComplete={handleStageAdvance} />}
        {currentStage === 'INTERACTIVE_LISTENING' && <InteractiveListening onComplete={handleStageAdvance} />}
        {currentStage === 'WRITE_PHOTO' && <WriteAboutPhoto onComplete={handleStageAdvance} />}
        {currentStage === 'INTERACTIVE_WRITING' && <InteractiveWriting onComplete={handleStageAdvance} />}
        {currentStage === 'WRITING_SAMPLE' && <WritingSample onComplete={handleStageAdvance} />}
      </div>

      {/* Bottom Proctoring Security Bar */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4 border-t border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between">
        <span className="flex items-center gap-1 text-neutral-400">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          {t.proctoringWarning}
        </span>
        <span>{t.candidateLabel}: {candidateName}</span>
      </div>
    </div>
  );
};
