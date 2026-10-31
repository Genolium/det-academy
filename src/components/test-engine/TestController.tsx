'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTestStore, StageName } from '@/store/useTestStore';
import { useProgressStore } from '@/store/useProgressStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { api, ApiError } from '@/lib/api';
import { clearResponseOutbox, flushResponseOutbox } from '@/lib/response-outbox';
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
import { AlertTriangle, Clock, Loader2, RefreshCw, ShieldAlert, WifiOff, SkipForward } from 'lucide-react';

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
  if (err instanceof ApiError && err.status === 409) return false;
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
    deadlineAt,
  } = useTestStore();

  const { addTestResult } = useProgressStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;
  const tr = useCallback(
    (ruText: string, enText: string) => (locale === 'ru' ? ruText : enText),
    [locale]
  );
  const isInitializingRef = useRef(false);
  const advanceInFlightRef = useRef(false);
  const [isFinalStageComplete, setIsFinalStageComplete] = useState(false);
  const [stageSyncError, setStageSyncError] = useState<string | null>(null);
  const [lastStageAction, setLastStageAction] = useState<'advance' | 'finalize' | null>(null);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [resumeUnavailable, setResumeUnavailable] = useState(false);

  const finalizeAttempt = useCallback(
    async (sessionId: string) => {
      const current = useTestStore.getState();
      if (current.attemptStatus === 'submitting' || current.attemptStatus === 'completed') {
        return;
      }
      if (!sessionId) {
        setAttemptStatus('failed', tr('Серверная попытка не найдена. Баллы не начислены.', 'The server attempt was not found. No score was awarded.'));
        return;
      }

      setAttemptStatus('submitting');
      writeStoredAttempt({ sessionId, finalizing: true, updatedAt: Date.now() });

      try {
        const remaining = await flushResponseOutbox(sessionId);
        if (remaining > 0) {
          setAttemptStatus(
            'pending_sync',
            tr(
              'Часть ответов ещё не сохранена на сервере. Результат не будет выставлен до полной синхронизации.',
              'Some answers are not saved on the server yet. The result will not be issued until everything is synced.'
            )
          );
          return;
        }
        const resp = await api.completeTestSession(sessionId);
        if (!resp?.scores) {
          throw new Error(tr('Сервер не вернул подтверждённый результат. Баллы не начислены.', 'The server did not return a confirmed result. No score was awarded.'));
        }

        applyServerCompletion({
          sessionId: resp.session?.id || sessionId,
          scores: resp.scores,
          certificateId: resp.certificate?.id,
          certificateEligible: Boolean(resp.certificateEligible || resp.certificate),
          completedAt: resp.session?.completedAt,
        });

        // An incomplete attempt stays visible in the result modal but is not
        // written into the scored history as if it were a real overall score.
        if (resp.scores.overall > 0) {
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
        }

        writeStoredAttempt(null);
        clearResponseOutbox(sessionId);
        setStageSyncError(null);
      } catch (err) {
        const message = errorMessage(
          err,
          tr('Сервер не подтвердил завершение попытки. Результат не начислен.', 'The server did not confirm completion. No result was awarded.')
        );
        if (isPermanentClientError(err)) {
          setAttemptStatus('failed', message);
        } else {
          setAttemptStatus('pending_sync', message);
        }
      }
    },
    [addTestResult, applyServerCompletion, candidateName, setAttemptStatus, tr]
  );

  const startServerSession = useCallback(async () => {
    setAttemptStatus('starting');
    setStageSyncError(null);
    try {
      const resp = await api.startTestSession({ candidateName, difficultyLevel });
      if (!resp?.session?.id) {
        throw new Error(tr('Сервер не создал попытку теста.', 'The server did not create a test attempt.'));
      }
      writeStoredAttempt({
        sessionId: resp.session.id,
        finalizing: false,
        updatedAt: Date.now(),
      });
      hydrateServerAttempt({
        sessionId: resp.session.id,
        candidateName: resp.session.candidateName,
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
        tr(
          'Не удалось начать попытку на сервере. Тест не начнётся без подтверждённой сессии.',
          'Could not start the attempt on the server. The test will not begin without a confirmed session.'
        )
      );
      setAttemptStatus('failed', message);
    }
  }, [candidateName, difficultyLevel, hydrateServerAttempt, setAttemptStatus, tr]);

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
        clearResponseOutbox(stored.sessionId);
        setIsFinalStageComplete(true);
        setLastStageAction('finalize');
        await finalizeAttempt(stored.sessionId);
        return;
      }

      hydrateServerAttempt({
        sessionId: session.id,
        candidateName: session.candidateName,
        stage: (session.stageName as StageName) || 'READ_SELECT',
        difficultyLevel: (session.difficultyLevel as 'A2' | 'B1' | 'B2' | 'C1') || 'B1',
        deadlineAt: session.deadlineAt ? new Date(session.deadlineAt).getTime() : null,
        questions: resp.questions || [],
      });
      setIsFinalStageComplete(false);
      void flushResponseOutbox(session.id);
    } catch (err) {
      if (err instanceof ApiError && (err.status === 404 || err.status === 403)) {
        setResumeUnavailable(true);
        setAttemptStatus(
          'failed',
          tr(
            'Прежняя попытка больше недоступна. Начните новую или вернитесь в кабинет.',
            'The previous attempt is no longer available. Start a new one or return to the dashboard.'
          )
        );
        return;
      }
      const message = errorMessage(
        err,
        tr(
          'Не удалось получить состояние попытки с сервера. Баллы не начислены.',
          'Could not load the attempt state from the server. No score was awarded.'
        )
      );
      setAttemptStatus('failed', message);
    }
  }, [finalizeAttempt, hydrateServerAttempt, setAttemptStatus, startServerSession, tr]);

  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;
    void resumeAttempt();
  }, [resumeAttempt]);

  const currentStageIndex = STAGES_SEQUENCE.indexOf(currentStage);

  const handleStageAdvance = useCallback(async (force = false) => {
    if (advanceInFlightRef.current) return;
    const sessionId = useTestStore.getState().backendSessionId;
    if (!sessionId) {
      setAttemptStatus(
        'failed',
        tr('Серверная попытка не найдена. Завершить тест и получить балл невозможно.', 'The server attempt was not found, so the test cannot be completed or scored.')
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
      if (!force) {
        const remaining = await flushResponseOutbox(sessionId);
        if (remaining > 0) {
          setStageSyncError(
            tr(
              'Часть ответов не сохранена на сервере. Этап не будет завершён до синхронизации.',
              'Some answers are not saved on the server yet. The stage will not complete until everything is synced.'
            )
          );
          return;
        }
      }

      // The server derives stage accuracy from recorded responses. No client
      // score is sent into the final grading path.
      const accuracy = 0;
      const totalQuestions = 0;
      const correctQuestions = 0;

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
      if (err instanceof ApiError && err.status === 409) {
        // The server already advanced the stage but the response was lost.
        // Re-hydrate instead of retrying the same stale stage forever.
        await resumeAttempt();
        setStageSyncError(null);
        return;
      }
      setStageSyncError(
        errorMessage(
          err,
          tr('Не удалось сохранить этап на сервере. Повторите синхронизацию.', 'Could not save the stage on the server. Retry the sync.')
        )
      );
    } finally {
      advanceInFlightRef.current = false;
    }
  }, [currentStage, currentStageIndex, finalizeAttempt, resumeAttempt, tr]);

  const handleSkipStage = () => {
    if (advanceInFlightRef.current) return;
    const confirmed =
      typeof window === 'undefined' ||
      window.confirm(
        tr(
          'Завершить этап без ответа? Несохранённый ответ не попадёт в результат.',
          'Finish this stage without an answer? An unsaved answer will not be scored.'
        )
      );
    if (confirmed) void handleStageAdvance(true);
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

  useEffect(() => {
    if (!deadlineAt) {
      setSecondsLeft(null);
      return;
    }
    const tick = () => {
      setSecondsLeft(Math.max(0, Math.ceil((deadlineAt - Date.now()) / 1000)));
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [deadlineAt]);

  const deadlineAdvanceRef = useRef(false);
  useEffect(() => {
    deadlineAdvanceRef.current = false;
  }, [deadlineAt]);

  useEffect(() => {
    if (secondsLeft === 0 && !deadlineAdvanceRef.current && attemptStatus === 'in_progress') {
      // The server clock is authoritative; never leave the learner on an
      // expired stage with a disabled or failed in-stage action.
      deadlineAdvanceRef.current = true;
      void handleStageAdvance(true);
    }
  }, [secondsLeft, attemptStatus, handleStageAdvance]);

  if (attemptStatus === 'starting') {
    return (
      <StatusScreen
        icon={<Loader2 className="w-8 h-8 animate-spin text-[#D2F544]" />}
        title={tr('Подключение к серверу теста', 'Connecting to the test server')}
        message={tr(
          'Проверяем состояние попытки. Тест не начнётся, пока сервер не подтвердит сессию.',
          'Checking the attempt state. The test will not start until the server confirms the session.'
        )}
      />
    );
  }

  if (attemptStatus === 'failed' && !isFinalStageComplete) {
    return (
      <StatusScreen
        icon={<WifiOff className="w-8 h-8 text-red-400" />}
        title={tr('Попытка не подтверждена сервером', 'Attempt not confirmed by the server')}
        message={
          attemptError ||
          tr(
            'Сервер недоступен. Баллы, сертификат и завершённая попытка не создаются на клиенте.',
            'The server is unavailable. Scores, certificates and completed attempts are never created on the client.'
          )
        }
        tone="danger"
        actions={
          resumeUnavailable ? (
            <>
              <Button
                variant="primary"
                onClick={() => {
                  writeStoredAttempt(null);
                  setResumeUnavailable(false);
                  setStageSyncError(null);
                  startNewSession(candidateName);
                  void startServerSession();
                }}
              >
                {tr('Начать новую попытку', 'Start a new attempt')}
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">{tr('В кабинет', 'Dashboard')}</Button>
              </Link>
            </>
          ) : (
            <>
              <Button variant="primary" onClick={() => void resumeAttempt()} icon={<RefreshCw className="w-4 h-4" />}>
                {tr('Повторить подключение', 'Retry connection')}
              </Button>
              <Link href="/dashboard">
                <Button variant="outline">{tr('Вернуться в кабинет', 'Back to dashboard')}</Button>
              </Link>
            </>
          )
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
          title={tr('Сервер проверяет и фиксирует результат', 'The server is grading and recording the result')}
          message={tr('Баллы будут показаны только после подтверждения сервером.', 'Scores appear only after the server confirms them.')}
        />
      );
    }

    return (
      <StatusScreen
        icon={<AlertTriangle className="w-8 h-8 text-amber-400" />}
        title={tr('Результат ожидает подтверждения', 'Result awaiting confirmation')}
        message={
          attemptError ||
          tr(
            'Ответы сохранены, но сервер не подтвердил завершение. Баллы и сертификат не выданы. Повторите синхронизацию.',
            'Answers are saved, but the server has not confirmed completion. No score or certificate was issued. Retry the sync.'
          )
        }
        tone="warning"
        actions={
          <>
            <Button variant="primary" onClick={retryLastAction} icon={<RefreshCw className="w-4 h-4" />}>
              {tr('Повторить синхронизацию', 'Retry sync')}
            </Button>
            <Link href="/dashboard">
              <Button variant="outline">{tr('Вернуться в кабинет', 'Back to dashboard')}</Button>
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
        title={tr('Попытка недоступна', 'Attempt unavailable')}
        message={tr(
          'Сервер не подтвердил активную попытку. Обновите страницу или начните тест заново.',
          'The server did not confirm an active attempt. Refresh the page or start the test again.'
        )}
        tone="warning"
        actions={
          resumeUnavailable ? (
            <>
              <Button
                variant="primary"
                onClick={() => {
                  writeStoredAttempt(null);
                  setResumeUnavailable(false);
                  setStageSyncError(null);
                  startNewSession(candidateName);
                  void startServerSession();
                }}
              >
                {tr('Начать новую попытку', 'Start a new attempt')}
              </Button>
              <Link
                href="/dashboard"
                className="rounded-xl border border-neutral-700 px-4 py-2 text-xs font-bold text-neutral-300 hover:border-neutral-500"
              >
                {tr('В кабинет', 'Dashboard')}
              </Link>
            </>
          ) : undefined
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1012] text-white flex flex-col justify-between py-6">
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#D2F544] text-[#0C2418] font-black flex items-center justify-center text-sm">
            D
          </div>
          <span className="font-bold text-xs sm:text-sm tracking-wide truncate">DET CAT SIMULATION · 13 TASKS</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <PillBadge variant="mint" prefixHash className="hidden sm:inline-flex text-[10px]">
            Difficulty Band: {difficultyLevel}
          </PillBadge>
          <div className="hidden sm:block text-xs font-mono text-neutral-400">
            {t.stepLabel} {Math.max(1, currentStageIndex + 1)} / {STAGES_SEQUENCE.length}
          </div>
          {secondsLeft !== null && (
            <div
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-xs font-bold ${
                secondsLeft <= 60
                  ? 'border-red-500/50 bg-red-500/10 text-red-300 animate-pulse'
                  : 'border-neutral-700 bg-neutral-900 text-[#D2F544]'
              }`}
              title={tr('Серверный дедлайн этапа', 'Server stage deadline')}
            >
              <Clock className="w-3.5 h-3.5" />
              {Math.floor(secondsLeft / 60)}:
              {(secondsLeft % 60).toString().padStart(2, '0')}
            </div>
          )}
          <button
            type="button"
            onClick={handleSkipStage}
            aria-label={tr('Пропустить этап', 'Skip stage')}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-700 px-3 py-1 text-xs font-bold text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-200"
          >
            <SkipForward className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{tr('Пропустить этап', 'Skip stage')}</span>
          </button>
        </div>
      </div>

      {stageSyncError && (
        <div className="max-w-4xl mx-auto w-full px-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-200" role="status" aria-live="polite">
            <span>{stageSyncError}</span>
            <button
              onClick={retryLastAction}
              className="inline-flex items-center gap-1.5 font-bold text-amber-300 hover:text-amber-100"
            >
              <RefreshCw className="w-3.5 h-3.5" /> {tr('Повторить', 'Retry')}
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
