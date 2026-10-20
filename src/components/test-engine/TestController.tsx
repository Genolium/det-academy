'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { SpeakAboutPhoto } from './questions/SpeakAboutPhoto';
import { ReadThenSpeak } from './questions/ReadThenSpeak';
import { InteractiveSpeaking } from './questions/InteractiveSpeaking';
import { WritingSample } from './questions/WritingSample';
import { SpeakingSample } from './questions/SpeakingSample';
import { TestResultModal } from './TestResultModal';
import { PillBadge } from '@/components/ui/PillBadge';
import { ShieldAlert } from 'lucide-react';

const STAGES_SEQUENCE: StageName[] = [
  'READ_SELECT',
  'FILL_BLANKS',
  'C_TEST',
  'LISTEN_TYPE',
  'INTERACTIVE_READING',
  'INTERACTIVE_LISTENING',
  'WRITE_PHOTO',
  'INTERACTIVE_WRITING',
  'SPEAK_PHOTO',
  'READ_THEN_SPEAK',
  'INTERACTIVE_SPEAKING',
  'WRITING_SAMPLE',
  'SPEAKING_SAMPLE',
];

const STORAGE_ACTIVE_SESSION_KEY = 'det_active_test_session_id';

export const TestController: React.FC = () => {
  const {
    currentStage,
    setStage,
    difficultyLevel,
    setDifficultyLevel,
    candidateName,
    finalScores,
    setFinalScores,
    finishTestAndCalculateScores,
    startNewSession,
    setServerQuestions,
    setDeadlineAt,
  } = useTestStore();

  const { addTestResult, isEligibleForCertificate } = useProgressStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
  const [issuedCertId, setIssuedCertId] = useState<string | undefined>(undefined);
  const isInitializingRef = useRef(false);

  // Initialize or resume session once on mount
  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

    const savedSessionId = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_ACTIVE_SESSION_KEY) : null;

    if (savedSessionId) {
      api.getTestSession(savedSessionId)
        .then((res) => {
          if (res?.session?.id && res.session.status === 'IN_PROGRESS') {
            setBackendSessionId(res.session.id);
            setStage(res.session.stageName as StageName);
            if (res.session.difficultyLevel) {
              setDifficultyLevel(res.session.difficultyLevel as 'A2' | 'B1' | 'B2' | 'C1');
            }
            if (res.questions) {
              setServerQuestions(res.questions);
            }
            if (res.session.deadlineAt) {
              setDeadlineAt(new Date(res.session.deadlineAt).getTime());
            }
            return;
          }
          // If session is completed or invalid, start new session
          initNewSession();
        })
        .catch(() => {
          initNewSession();
        });
    } else {
      initNewSession();
    }

    function initNewSession() {
      api.startTestSession({ candidateName, difficultyLevel })
        .then((res) => {
          if (res?.session?.id) {
            setBackendSessionId(res.session.id);
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_ACTIVE_SESSION_KEY, res.session.id);
            }
            if (res.questions) {
              setServerQuestions(res.questions);
            }
            if (res.session.deadlineAt) {
              setDeadlineAt(new Date(res.session.deadlineAt).getTime());
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  const currentStageIndex = STAGES_SEQUENCE.indexOf(currentStage);

  const handleStageAdvance = () => {
    const nextIndex = currentStageIndex + 1;
    const isLastStage = nextIndex >= STAGES_SEQUENCE.length;

    if (backendSessionId) {
      const state = useTestStore.getState();
      const currentStageAccuracy =
        state.readSelectTotal > 0
          ? state.readSelectCorrect / state.readSelectTotal
          : state.fillBlanksTotal > 0
          ? state.fillBlanksCorrect / state.fillBlanksTotal
          : 0.8;

      api.completeStage(backendSessionId, {
        stageName: currentStage,
        accuracy: currentStageAccuracy,
        totalQuestions: 5,
        correctQuestions: 4,
      })
        .then((resp) => {
          if (resp?.nextQuestions && resp.nextQuestions.length > 0) {
            setServerQuestions(resp.nextQuestions);
          }
          if (resp?.session?.difficultyLevel) {
            setDifficultyLevel(resp.session.difficultyLevel as 'A2' | 'B1' | 'B2' | 'C1');
          }
          if (resp?.session?.deadlineAt) {
            setDeadlineAt(new Date(resp.session.deadlineAt).getTime());
          }
        })
        .catch(() => {});
    }

    if (!isLastStage) {
      setStage(STAGES_SEQUENCE[nextIndex]);
    } else {
      // Final stage completed -> Complete session on server
      if (backendSessionId) {
        const state = useTestStore.getState();
        const rsRatio = state.readSelectTotal > 0 ? state.readSelectCorrect / state.readSelectTotal : 0;
        const fbRatio = state.fillBlanksTotal > 0 ? state.fillBlanksCorrect / state.fillBlanksTotal : 0;
        const ctRatio = state.cTestTotal > 0 ? state.cTestCorrect / state.cTestTotal : 0;
        const ltRatio = state.listenTypeTotal > 0 ? state.listenTypeSimilaritySum / state.listenTypeTotal : 0;

        api.completeTestSession(backendSessionId, {
          readSelectAccuracy: rsRatio,
          fillBlanksAccuracy: fbRatio,
          cTestAccuracy: ctRatio,
          listenTypeAccuracy: ltRatio,
          interactiveReadingScore: state.interactiveReadingScore,
          interactiveListeningScore: state.interactiveListeningScore,
          writingScore: state.writingScoreRatio,
          speakingScore: state.speakingTexts.length > 0 ? 0.75 : 0,
        })
          .then((resp) => {
            if (resp?.certificate?.id) {
              setIssuedCertId(resp.certificate.id);
            }
            if (resp?.scores) {
              setFinalScores(resp.scores);
              addTestResult({
                id: resp.certificate?.id || 'det-cert-' + Math.random().toString(36).substring(2, 9),
                date: new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                }),
                overallScore: resp.scores.overall,
                literacy: resp.scores.literacy,
                comprehension: resp.scores.comprehension,
                production: resp.scores.production,
                conversation: resp.scores.conversation,
                candidateName: candidateName || 'Candidate',
              });
            }
            if (typeof window !== 'undefined') {
              localStorage.removeItem(STORAGE_ACTIVE_SESSION_KEY);
            }
          })
          .catch(() => {
            // Local fallback if network disconnected
            const fallbackScores = finishTestAndCalculateScores();
            addTestResult({
              id: 'det-cert-' + Math.random().toString(36).substring(2, 9),
              date: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              }),
              overallScore: fallbackScores.overall,
              literacy: fallbackScores.literacy,
              comprehension: fallbackScores.comprehension,
              production: fallbackScores.production,
              conversation: fallbackScores.conversation,
              candidateName: candidateName || 'Candidate',
            });
          });
      } else {
        const scores = finishTestAndCalculateScores();
        addTestResult({
          id: 'det-cert-' + Math.random().toString(36).substring(2, 9),
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
    }
  };

  if (currentStage === 'COMPLETED' && finalScores) {
    return (
      <TestResultModal
        scores={finalScores}
        candidateName={candidateName}
        isEligibleForCert={isEligibleForCertificate()}
        certificateId={issuedCertId}
        sessionId={backendSessionId || undefined}
        onRetake={() => {
          if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_ACTIVE_SESSION_KEY);
          }
          startNewSession(candidateName);
          setIssuedCertId(undefined);
          setBackendSessionId(null);
          // Start fresh backend session
          api.startTestSession({ candidateName, difficultyLevel })
            .then((res) => {
              if (res?.session?.id) {
                setBackendSessionId(res.session.id);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(STORAGE_ACTIVE_SESSION_KEY, res.session.id);
                }
                if (res.questions) {
                  setServerQuestions(res.questions);
                }
              }
            })
            .catch(() => {});
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
            DET CAT SIMULATION · 13 TASKS
          </span>
        </div>

        <div className="flex items-center gap-4">
          <PillBadge variant="mint" prefixHash className="text-[10px]">
            Difficulty Band: {difficultyLevel}
          </PillBadge>
          <div className="text-xs font-mono text-neutral-400">
            {t.stepLabel} {Math.max(1, currentStageIndex + 1)} / {STAGES_SEQUENCE.length}
          </div>
        </div>
      </div>

      {/* Main question renderer for all 13 official DET tasks */}
      <div className="flex-1 flex flex-col justify-center py-6">
        {currentStage === 'READ_SELECT' && <ReadAndSelect onComplete={handleStageAdvance} />}
        {currentStage === 'FILL_BLANKS' && <FillInTheBlanks onComplete={handleStageAdvance} />}
        {currentStage === 'C_TEST' && <ReadAndComplete onComplete={handleStageAdvance} />}
        {currentStage === 'LISTEN_TYPE' && <ListenAndType onComplete={handleStageAdvance} />}
        {currentStage === 'INTERACTIVE_READING' && <InteractiveReading onComplete={handleStageAdvance} />}
        {currentStage === 'INTERACTIVE_LISTENING' && <InteractiveListening onComplete={handleStageAdvance} />}
        {currentStage === 'WRITE_PHOTO' && <WriteAboutPhoto onComplete={handleStageAdvance} />}
        {currentStage === 'INTERACTIVE_WRITING' && <InteractiveWriting onComplete={handleStageAdvance} />}
        {currentStage === 'SPEAK_PHOTO' && <SpeakAboutPhoto onComplete={handleStageAdvance} />}
        {currentStage === 'READ_THEN_SPEAK' && <ReadThenSpeak onComplete={handleStageAdvance} />}
        {currentStage === 'INTERACTIVE_SPEAKING' && <InteractiveSpeaking onComplete={handleStageAdvance} />}
        {currentStage === 'WRITING_SAMPLE' && <WritingSample onComplete={handleStageAdvance} />}
        {currentStage === 'SPEAKING_SAMPLE' && <SpeakingSample onComplete={handleStageAdvance} />}
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

