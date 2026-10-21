'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { submitOrQueueResponse } from '@/lib/response-outbox';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Clock } from 'lucide-react';

interface InteractiveReadingProps {
  onComplete: () => void;
}

interface ReadingPayload {
  passageTitle?: string;
  passageText?: string;
  gapSentence?: { before?: string; after?: string; options?: string[] };
  sentenceOptions?: string[] | { options?: string[] };
  mainIdeaQuestion?: { question?: string; options?: string[] };
  titleQuestion?: { question?: string; options?: string[] };
  highlightPrompt?: string;
}

type Step = 'gap' | 'sentence' | 'highlight' | 'mainIdea' | 'title';

export const InteractiveReading: React.FC<InteractiveReadingProps> = ({ onComplete }) => {
  const { serverQuestions, backendSessionId } = useTestStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;

  const block = useMemo(() => {
    const question = serverQuestions.find((item) => item.type === 'INTERACTIVE_READING');
    if (!question) return null;
    const payload = question.contentPayload as ReadingPayload;
    const sentenceOptions = Array.isArray(payload.sentenceOptions)
      ? payload.sentenceOptions
      : payload.sentenceOptions?.options || [];
    const steps: Step[] = ['gap'];
    if (sentenceOptions.length > 0) steps.push('sentence');
    if (payload.passageText) steps.push('highlight');
    if (payload.mainIdeaQuestion?.options?.length) steps.push('mainIdea');
    if (payload.titleQuestion?.options?.length) steps.push('title');
    return {
      id: question.id,
      title: payload.passageTitle || 'Interactive Reading',
      passageText: payload.passageText || '',
      gap: payload.gapSentence || {},
      sentenceOptions,
      sentenceQuestion:
        'Select the sentence that best fits into the passage:',
      highlightPrompt: payload.highlightPrompt || 'Select the sentence that answers the prompt.',
      mainIdea: payload.mainIdeaQuestion || null,
      titleQuestion: payload.titleQuestion || null,
      steps,
      timeLimitSec: question.timeLimitSec || 420,
    };
  }, [serverQuestions]);

  const [stepIndex, setStepIndex] = useState(0);
  const [gap, setGap] = useState('');
  const [sentenceIndex, setSentenceIndex] = useState<number | null>(null);
  const [highlightSentence, setHighlightSentence] = useState('');
  const [mainIdeaIndex, setMainIdeaIndex] = useState<number | null>(null);
  const [titleIndex, setTitleIndex] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(block?.timeLimitSec || 420);
  const startedAtRef = useRef(Date.now());
  const submittedRef = useRef(false);

  const currentStep: Step | undefined = block?.steps[stepIndex];
  const passageSentences = useMemo(
    () =>
      (block?.passageText || '')
        .split(/(?<=[.!?])\s+/)
        .map((sentence) => sentence.trim())
        .filter(Boolean),
    [block?.passageText]
  );

  useEffect(() => {
    if (!block) return;
    setTimeLeft(block.timeLimitSec);
    startedAtRef.current = Date.now();
  }, [block?.id, block?.timeLimitSec]);

  const submit = () => {
    if (submittedRef.current || !block) return;
    submittedRef.current = true;
    if (backendSessionId) {
      void submitOrQueueResponse(backendSessionId, {
        questionId: block.id,
        userResponse: {
          gap,
          sentenceIndex: sentenceIndex ?? undefined,
          highlightSentence: highlightSentence || undefined,
          mainIdeaIndex: mainIdeaIndex ?? undefined,
          titleIndex: titleIndex ?? undefined,
        },
        rawScore: 0,
        timeSpentSec: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)),
      });
    }
    onComplete();
  };

  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  useEffect(() => {
    if (!block) return;
    const deadline = Date.now() + block.timeLimitSec * 1000;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        submitRef.current();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [block?.id, block?.timeLimitSec]);

  if (!block) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center space-y-3">
        <h2 className="text-xl font-bold text-white">Сервер не выдал задание Interactive Reading</h2>
        <p className="text-sm text-neutral-400">
          Этап нельзя начать без серверного вопроса. Обновите страницу или перезапустите попытку.
        </p>
      </div>
    );
  }

  const isLastStep = stepIndex >= block.steps.length - 1;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const next = () => {
    if (isLastStep) {
      submit();
    } else {
      setStepIndex((index) => index + 1);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-4 font-mono">
        <span className="uppercase font-bold tracking-wider text-white">Interactive Reading</span>
        <div className="flex items-center gap-3">
          <span className="bg-neutral-800 text-[#D2F544] px-3 py-1 rounded-full font-bold">
            {t.readingStep} {stepIndex + 1} / {block.steps.length}
          </span>
          <span className="flex items-center gap-1.5 text-[#D2F544] font-bold">
            <Clock className="w-4 h-4" />
            {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-6 sm:p-8 text-neutral-300 shadow-xl max-h-[500px] overflow-y-auto">
          <h4 className="text-sm uppercase font-mono text-[#D2F544] font-bold mb-4">
            {block.title}
          </h4>
          <p className="text-sm leading-relaxed mb-4">{block.passageText}</p>
          {currentStep === 'highlight' && (
            <p className="text-[11px] text-amber-300">{block.highlightPrompt}</p>
          )}
        </div>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            {currentStep === 'gap' && (
              <>
                <h3 className="text-base font-bold text-neutral-900">
                  1. Select the missing word to complete the sentence:
                </h3>
                <p className="text-sm text-neutral-700 leading-relaxed">
                  {block.gap.before}
                  <select
                    value={gap}
                    onChange={(e) => setGap(e.target.value)}
                    className="mx-2 bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-2 text-base font-bold text-emerald-800 focus:outline-none"
                  >
                    <option value="">{t.selectWordOption}</option>
                    {(block.gap.options || []).map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  {block.gap.after}
                </p>
              </>
            )}

            {currentStep === 'sentence' && (
              <>
                <h3 className="text-base font-bold text-neutral-900">{block.sentenceQuestion}</h3>
                <div className="space-y-3">
                  {block.sentenceOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSentenceIndex(index)}
                      className={`w-full text-left p-3.5 rounded-2xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                        sentenceIndex === index
                          ? 'bg-[#D2F544] border-[#0C2418] text-[#0C2418] font-bold shadow-sm'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}

            {currentStep === 'highlight' && (
              <>
                <h3 className="text-base font-bold text-neutral-900">
                  3. Select the sentence that answers the prompt:
                </h3>
                <p className="text-sm text-neutral-600">{block.highlightPrompt}</p>
                <div className="space-y-2">
                  {passageSentences.map((sentence, index) => (
                    <button
                      key={index}
                      onClick={() => setHighlightSentence(sentence)}
                      className={`w-full text-left p-3 rounded-xl text-xs border transition-all cursor-pointer ${
                        highlightSentence === sentence
                          ? 'bg-[#D2F544] border-[#0C2418] text-[#0C2418] font-semibold'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                      }`}
                    >
                      {sentence}
                    </button>
                  ))}
                </div>
              </>
            )}

            {currentStep === 'mainIdea' && block.mainIdea && (
              <>
                <h3 className="text-base font-bold text-neutral-900">
                  {block.mainIdea.question || 'What is the main idea?'}
                </h3>
                <div className="space-y-3">
                  {(block.mainIdea.options || []).map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setMainIdeaIndex(index)}
                      className={`w-full text-left p-3.5 rounded-2xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                        mainIdeaIndex === index
                          ? 'bg-[#D2F544] border-[#0C2418] text-[#0C2418] font-bold shadow-sm'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}

            {currentStep === 'title' && block.titleQuestion && (
              <>
                <h3 className="text-base font-bold text-neutral-900">
                  {block.titleQuestion.question || 'Choose the best title:'}
                </h3>
                <div className="space-y-3">
                  {(block.titleQuestion.options || []).map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setTitleIndex(index)}
                      className={`w-full text-left p-3.5 rounded-2xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                        titleIndex === index
                          ? 'bg-[#D2F544] border-[#0C2418] text-[#0C2418] font-bold shadow-sm'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                      }`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="pt-6">
            <Button
              variant="primary"
              onClick={next}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              {isLastStep ? t.submitBtn : t.nextBtn}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
