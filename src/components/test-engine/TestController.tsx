'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTestStore, StageName } from '@/store/useTestStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { api, ApiError } from '@/lib/api';
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
import { Button } from '@/components/ui/Button';
import { AlertTriangle, Loader2, RefreshCw, ShieldAlert, WifiOff } from 'lucide-react';

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
const STORAGE_ACTIVE_ATTEMPT_KEY = 'det_active_test_attempt_v2';

interface StoredAttempt {
  sessionId: string;
  finalizing: boolean;
  updatedAt: number;
}

function readStoredAttempt(): StoredAttempt | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_ATTEMPT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredAttempt;
      if (parsed?.sessionId) return parsed;
    }
    const legacyId = localStorage.getItem(STORAGE_ACTIVE_SESSION_KEY);
    if (legacyId) {
      return { sessionId: legacyId, finalizing: false, updatedAt: Date.now() };
    }
  } catch {}
  return null;
}

function writeStoredAttempt(attempt: StoredAttempt | null) {
  if (typeof window === 'undefined') return;
  try {
    if (attempt) {
      localStorage.setItem(STORAGE_ACTIVE_ATTEMPT_KEY, JSON.stringify(attempt));
      localStorage.setItem(STORAGE_ACTIVE_SESSION_KEY, attempt.sessionId);
    } else {
      localStorage.removeItem(STORAGE_ACTIVE_ATTEMPT_KEY);
      localStorage.removeItem(STORAGE_ACTIVE_SESSION_KEY);
    }
  } catch {}
}

function isPermanentClientError(err: unknown): boolean {
  return err instanceof ApiError && err.status >= 400 && err.status < 500;
}

function errorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export const TestController: React.FC = () => {
  const {
    currentStage,
    setStage,
    difficultyLevel,
    candidateName,
    finalScores,
    startNewSession,
    setServerQuestions,
    setDeadlineAt,
    setDifficultyLevel,
    hydrateServerAttempt,
    setAttemptStatus,
    applyServerCompletion,
    attemptStatus,
    attemptError,
    certificateId,
    certificateEligible,
    backendSessionId,
  } = useTestStore();

  const { addTestResult } = useProgressStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;
  const isInitializingRef = useRef(false);
  const advanceInFlightRef = useRef(false);
  const [isFinalStageComplete, setIsFinalStageComplete] = useState(false);
  const [stageSyncError, setStageSyncError] = useState<string | null>(null);
  const [lastStageAction, setLastStageAction] = useState<'advance' | 'finalize' | null>(null);

  const buildCompletionPayload = useCallback(() => {
    const state = useTestStore.getState();
    const ratio = (correct: number, total: number) => (total > 0 ? correct / total : 0);
    return {
      readSelectAccuracy: ratio(state.readSelectCorrect, state.readSelectTotal),
      fillBlanksAccuracy: ratio(state.fillBlanksCorrect, state.fillBlanksTotal),
      cTestAccuracy: ratio(state.cTestCorrect, state.cTestTotal),
      listenTypeAccuracy: ratio(state.listenTypeSimilaritySum, state.listenTypeTotal),
      interactiveReadingScore: state.interactiveReadingScore,
      interactiveListeningScore: state.interactiveListeningScore,
      // The server owns writing/speaking evaluation from recorded responses.
      writingScore: 0,
      speakingScore: 0,
    };
  }, []);

  const finalizeAttempt = useCallback(
    async (sessionId: string) => {
      const current = useTestStore.getState();
      if (current.attemptStatus === 'submitting' || current.attemptStatus === 'completed') {
        return;
      }
      if (!sessionId) {
        setAttemptStatus('failed', 'Серверная попытка не найдена. Баллы не начислены.');
        return;
      }

      setAttemptStatus('submitting');
      writeStoredAttempt({ sessionId, finalizing: true, updatedAt: Date.now() });

      try {
        const resp = await api.completeTestSession(sessionId, buildCompletionPayload());
        if (!resp?.scores) {
          throw new Error('Сервер не вернул подтверждённый результат. Баллы не начислены.');
        }

        applyServerCompletion({
          sessionId: resp.session?.id || sessionId,
          scores: resp.scores,
          certificateId: resp.certificate?.id,
          certificateEligible: Boolean(resp.certificateEligible || resp.certificate),
          completedAt: resp.session?.completedAt,
        });

        addTestResult({
          id: resp.session?.id || sessionId,
          date: new Date(resp.session?.completedAt || Date.now()).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          overallScore: resp.scores.overall,
          reading: resp.scores.reading,
          listening: resp.scores.listening,
          writing: resp.scores.writing,
          speaking: resp.scores.speaking,
          literacy: resp.scores.literacy,
          comprehension: resp.scores.comprehension,
          production: resp.scores.production,
          conversation: resp.scores.conversation,
          candidateName: resp.session?.candidateName || candidateName || 'Candidate',
        });

        writeStoredAttempt(null);
        setStageSyncError(null);
      } catch (err) {
        const message = errorMessage(
          err,
          'Сервер не подтвердил завершение попытки. Результат не начислен.'
        );
        if (isPermanentClientError(err)) {
          setAttemptStatus('failed', message);
        } else {
          setAttemptStatus('pending_sync', message);
        }
      }
    },
    [addTestResult, applyServerCompletion, buildCompletionPayload, candidateName, setAttemptStatus]
  );

  const startServerSession = useCallback(async () => {
    setAttemptStatus('starting');
    setStageSyncError(null);
    try {
      const resp = await api.startTestSession({ candidateName, difficultyLevel });
      if (!resp?.session?.id) {
        throw new Error('Сервер не создал попытку теста.');
      }
      writeStoredAttempt({
        sessionId: resp.session.id,
        finalizing: false,
        updatedAt: Date.now(),
      });
      hydrateServerAttempt({
        sessionId: resp.session.id,
        stage: (resp.session.stageName as StageName) || 'READ_SELECT',
        difficultyLevel: (resp.session.difficultyLevel as 'A2' | 'B1' | 'B2' | 'C1') || 'B1',
        deadlineAt: resp.session.deadlineAt
          ? new Date(resp.session.deadlineAt).getTime()
          : null,
        questions: resp.questions || [],
      });
      setIsFinalStageComplete(false);
    } catch (err) {
      const message = errorMessage(
        err,
        'Не удалось начать попытку на сервере. Тест не начнётся без подтверждённой сессии.'
      );
      setAttemptStatus('failed', message);
    }
  }, [candidateName, difficultyLevel, hydrateServerAttempt, setAttemptStatus]);

  const resumeAttempt = useCallback(async () => {
    const stored = readStoredAttempt();
    if (!stored) {
      await startServerSession();
      return;
    }

    setAttemptStatus('starting');
    try {
      const resp = await api.getTestSession(stored.sessionId);
      const session = resp.session;

      if (session.status === 'COMPLETED' || session.stageName === 'COMPLETED') {
        // The completion endpoint is idempotent and returns the immutable
        // result plus certificate metadata for an already finished attempt.
        setIsFinalStageComplete(true);
        setLastStageAction('finalize');
        await finalizeAttempt(stored.sessionId);
        return;
      }

      hydrateServerAttempt({
        sessionId: session.id,
        stage: (session.stageName as StageName) || 'READ_SELECT',
        difficultyLevel: (session.difficultyLevel as 'A2' | 'B1' | 'B2' | 'C1') || 'B1',
        deadlineAt: session.deadlineAt ? new Date(session.deadlineAt).getTime() : null,
        questions: resp.questions || [],
      });
      setIsFinalStageComplete(false);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
        writeStoredAttempt(null);
        await startServerSession();
        return;
      }
      const message = errorMessage(
        err,
        'Не удалось получить состояние попытки с сервера. Баллы не начислены.'
      );
      setAttemptStatus('failed', message);
    }
  }, [finalizeAttempt, hydrateServerAttempt, setAttemptStatus, startServerSession]);

  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    void resumeAttempt();
  }, [resumeAttempt]);

  const currentStageIndex = STAGES_SEQUENCE.indexOf(currentStage);

  const handleStageAdvance = async () => {
    if (advanceInFlightRef.current) return;
    const sessionId = useTestStore.getState().backendSessionId;
    if (!sessionId) {
      setAttemptStatus(
        'failed',
        'Серверная попытка не найдена. Завершить тест и получить балл невозможно.'
      );
      return;
    }

    advanceInFlightRef.current = true;
    setStageSyncError(null);

    const nextIndex = currentStageIndex + 1;
    const isLastStage = nextIndex >= STAGES_SEQUENCE.length;
    // Until stage-complete succeeds, a retry must replay the stage transition,
    // not finalize an incomplete stage.
    setLastStageAction('advance');

    try {
      const state = useTestStore.getState();
      let accuracy = 0.5;
      let totalQuestions = 1;
      let correctQuestions = 0;

      if (currentStage === 'READ_SELECT') {
        totalQuestions = state.readSelectTotal;
        correctQuestions = state.readSelectCorrect;
      } else if (currentStage === 'FILL_BLANKS') {
        totalQuestions = state.fillBlanksTotal;
        correctQuestions = state.fillBlanksCorrect;
      } else if (currentStage === 'C_TEST') {
        totalQuestions = state.cTestTotal;
        correctQuestions = state.cTestCorrect;
      } else if (currentStage === 'LISTEN_TYPE') {
        totalQuestions = state.listenTypeTotal;
        correctQuestions = Math.round(state.listenTypeSimilaritySum);
      } else if (currentStage === 'INTERACTIVE_READING') {
        accuracy = state.interactiveReadingScore;
      } else if (currentStage === 'INTERACTIVE_LISTENING') {
        accuracy = state.interactiveListeningScore;
      }

      if (totalQuestions > 0) {
        accuracy = correctQuestions / totalQuestions;
      }

      const resp = await api.completeStage(sessionId, {
        stageName: currentStage,
        accuracy,
        totalQuestions,
        correctQuestions,
      });

      if (resp?.nextQuestions && resp.nextQuestions.length > 0) {
        setServerQuestions(resp.nextQuestions);
      }
      if (resp?.session?.difficultyLevel) {
        setDifficultyLevel(resp.session.difficultyLevel as 'A2' | 'B1' | 'B2' | 'C1');
      }
      if (resp?.session?.deadlineAt) {
        setDeadlineAt(new Date(resp.session.deadlineAt).getTime());
      }

      useTestStore.setState((state) => ({
        serverRevision: state.serverRevision + 1,
        lastConfirmedStage: currentStage,
        lastSyncedAt: Date.now(),
      }));

      if (isLastStage || resp?.session?.stageName === 'COMPLETED') {
        setLastStageAction('finalize');
        setIsFinalStageComplete(true);
        await finalizeAttempt(sessionId);
      } else {
        setStage(STAGES_SEQUENCE[nextIndex]);
      }
    } catch (err) {
      setStageSyncError(
        errorMessage(err, 'Не удалось сохранить этап на сервере. Повторите синхронизацию.')
      );
    } finally {
      advanceInFlightRef.current = false;
    }
  };

  const retryLastAction = () => {
    if (lastStageAction === 'finalize' || isFinalStageComplete) {
      const sessionId = useTestStore.getState().backendSessionId;
      if (sessionId) void finalizeAttempt(sessionId);
    } else {
      void handleStageAdvance();
    }
  };

  const handleRetake = async () => {
    writeStoredAttempt(null);
    startNewSession(candidateName);
    setIsFinalStageComplete(false);
    setStageSyncError(null);
    await startServerSession();
  };

  if (attemptStatus === 'starting') {
    return (
      <StatusScreen
        icon={<Loader2 className="w-8 h-8 animate-spin text-[#D2F544]" />}
        title="Подключение к серверу теста"
        message="Проверяем состояние попытки. Тест не начнётся, пока сервер не подтвердит сессию."
      />
    );
  }

  if (attemptStatus === 'failed' && !isFinalStageComplete) {
    return (
      <StatusScreen
        icon={<WifiOff className="w-8 h-8 text-red-400" />}
        title="Попытка не подтверждена сервером"
        message={
          attemptError ||
          'Сервер недоступен. Баллы, сертификат и завершённая попытка не создаются на клиенте.'
        }
        tone="danger"
        actions={
          <>
            <Button variant="primary" onClick={() => void resumeAttempt()} icon={<RefreshCw className="w-4 h-4" />}>
              Повторить подключение
            </Button>
            <Link href="/dashboard">
              <Button variant="outline">Вернуться в кабинет</Button>
            </Link>
          </>
        }
      />
    );
  }

  if (attemptStatus === 'completed' && finalScores) {
    return (
      <TestResultModal
        scores={finalScores}
        candidateName={candidateName}
        isEligibleForCert={Boolean(certificateEligible)}
        certificateId={certificateId || undefined}
        sessionId={backendSessionId || undefined}
        onRetake={() => void handleRetake()}
      />
    );
  }

  if (isFinalStageComplete) {
    if (attemptStatus === 'submitting') {
      return (
        <StatusScreen
          icon={<Loader2 className="w-8 h-8 animate-spin text-[#D2F544]" />}
          title="Сервер проверяет и фиксирует результат"
          message="Баллы будут показаны только после подтверждения сервером."
        />
      );
    }

    return (
      <StatusScreen
        icon={<AlertTriangle className="w-8 h-8 text-amber-400" />}
        title="Результат ожидает подтверждения"
        message={
          attemptError ||
          'Ответы сохранены, но сервер не подтвердил завершение. Баллы и сертификат не выданы. Повторите синхронизацию.'
        }
        tone="warning"
        actions={
          <>
            <Button variant="primary" onClick={retryLastAction} icon={<RefreshCw className="w-4 h-4" />}>
              Повторить синхронизацию
            </Button>
            <Link href="/dashboard">
              <Button variant="outline">Вернуться в кабинет</Button>
            </Link>
          </>
        }
      />
    );
  }

  if (attemptStatus !== 'in_progress' || !backendSessionId) {
    return (
      <StatusScreen
        icon={<ShieldAlert className="w-8 h-8 text-amber-400" />}
        title="Попытка недоступна"
        message="Сервер не подтвердил активную попытку. Обновите страницу или начните тест заново."
        tone="warning"
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1012] text-white flex flex-col justify-between py-6">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex items-center justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D2F544] text-[#0C2418] font-black flex items-center justify-center text-sm">
            D
          </div>
          <span className="font-bold text-sm tracking-wide">DET CAT SIMULATION · 13 TASKS</span>
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

      {stageSyncError && (
        <div className="max-w-4xl mx-auto w-full px-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            <span>{stageSyncError}</span>
            <button
              onClick={retryLastAction}
              className="inline-flex items-center gap-1.5 font-bold text-amber-300 hover:text-amber-100"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Повторить
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col justify-center py-6">
        {currentStage === 'READ_SELECT' && <ReadAndSelect onComplete={handleStageAdvance} />}
        {currentStage === 'FILL_BLANKS' && <FillInTheBlanks onComplete={handleStageAdvance} />}
        {currentStage === 'C_TEST' && <ReadAndComplete onComplete={handleStageAdvance} />}
        {currentStage === 'LISTEN_TYPE' && <ListenAndType onComplete={handleStageAdvance} />}
        {currentStage === 'INTERACTIVE_READING' && (
          <InteractiveReading onComplete={handleStageAdvance} />
        )}
        {currentStage === 'INTERACTIVE_LISTENING' && (
          <InteractiveListening onComplete={handleStageAdvance} />
        )}
        {currentStage === 'WRITE_PHOTO' && <WriteAboutPhoto onComplete={handleStageAdvance} />}
        {currentStage === 'INTERACTIVE_WRITING' && (
          <InteractiveWriting onComplete={handleStageAdvance} />
        )}
        {currentStage === 'SPEAK_PHOTO' && <SpeakAboutPhoto onComplete={handleStageAdvance} />}
        {currentStage === 'READ_THEN_SPEAK' && <ReadThenSpeak onComplete={handleStageAdvance} />}
        {currentStage === 'INTERACTIVE_SPEAKING' && (
          <InteractiveSpeaking onComplete={handleStageAdvance} />
        )}
        {currentStage === 'WRITING_SAMPLE' && <WritingSample onComplete={handleStageAdvance} />}
        {currentStage === 'SPEAKING_SAMPLE' && <SpeakingSample onComplete={handleStageAdvance} />}
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-4 border-t border-neutral-800 text-[11px] text-neutral-500 flex items-center justify-between">
        <span className="flex items-center gap-1 text-neutral-400">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          {t.proctoringWarning}
        </span>
        <span>
          {t.candidateLabel}: {candidateName}
        </span>
      </div>
    </div>
  );
};

interface StatusScreenProps {
  icon: React.ReactNode;
  title: string;
  message: string;
  tone?: 'default' | 'warning' | 'danger';
  actions?: React.ReactNode;
}

const StatusScreen: React.FC<StatusScreenProps> = ({
  icon,
  title,
  message,
  tone = 'default',
  actions,
}) => {
  const border =
    tone === 'danger'
      ? 'border-red-800/60'
      : tone === 'warning'
      ? 'border-amber-800/60'
      : 'border-neutral-800';

  return (
    <div className="min-h-screen bg-[#0E1012] text-white flex items-center justify-center px-4 py-16">
      <div className={`w-full max-w-xl rounded-3xl border ${border} bg-[#111315] p-8 sm:p-10 text-center space-y-5`}>
        <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
          {icon}
        </div>
        <div className="space-y-2">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">{title}</h1>
          <p className="text-sm text-neutral-400 leading-relaxed">{message}</p>
        </div>
        {actions && <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">{actions}</div>}
      </div>
    </div>
  );
};
