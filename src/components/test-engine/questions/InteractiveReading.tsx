'use client';

import React, { useState } from 'react';
import { interactiveReadingBank } from '@/data/questionBank';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { Button } from '@/components/ui/Button';
import { ArrowRight, Check } from 'lucide-react';

interface InteractiveReadingProps {
  onComplete: () => void;
}

export const InteractiveReading: React.FC<InteractiveReadingProps> = ({ onComplete }) => {
  const { recordInteractiveReadingResult } = useTestStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;
  const block = interactiveReadingBank[0];

  // 5 screens: 1: gap word, 2: sentence insertion, 3: highlight, 4: main idea, 5: title
  const [subStep, setSubStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // User responses
  const [selectedGapWord, setSelectedGapWord] = useState('');
  const [selectedSentenceIdx, setSelectedSentenceIdx] = useState<number | null>(null);
  const [highlightClicked, setHighlightClicked] = useState(false);
  const [selectedIdeaIdx, setSelectedIdeaIdx] = useState<number | null>(null);
  const [selectedTitleIdx, setSelectedTitleIdx] = useState<number | null>(null);

  const handleNextStep = () => {
    if (subStep < 5) {
      setSubStep((s) => (s + 1) as 1 | 2 | 3 | 4 | 5);
    } else {
      // Calculate accuracy across 5 subtasks
      let correctCount = 0;
      if (selectedGapWord === block.gapSentence.correct) correctCount++;
      if (selectedSentenceIdx === block.sentenceOptions.correctIndex) correctCount++;
      if (highlightClicked) correctCount++;
      if (selectedIdeaIdx === block.mainIdeaQuestion.correctIndex) correctCount++;
      if (selectedTitleIdx === block.titleQuestion.correctIndex) correctCount++;

      recordInteractiveReadingResult(correctCount / 5);
      onComplete();
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-6 font-mono">
        <span className="uppercase font-bold tracking-wider text-white">Interactive Reading</span>
        <span className="bg-neutral-800 text-[#D2F544] px-3 py-1 rounded-full font-bold">
          {t.readingStep} {subStep} / 5
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Left Side: Passage text */}
        <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-6 sm:p-8 text-neutral-300 shadow-xl max-h-[500px] overflow-y-auto">
          <h4 className="text-sm uppercase font-mono text-[#D2F544] font-bold mb-4">
            {block.passageTitle}
          </h4>
          <p className="text-sm leading-relaxed mb-4">{block.passageText}</p>

          {subStep === 3 && (
            <div className="mt-4 p-4 rounded-2xl bg-neutral-900 border border-amber-500/30 text-xs">
              <span className="text-amber-400 font-bold block mb-2">{t.highlightInstruction}</span>
              <div
                onClick={() => setHighlightClicked(true)}
                className={`p-3 rounded-xl cursor-pointer border transition-all ${
                  highlightClicked
                    ? 'bg-[#D2F544]/20 border-[#D2F544] text-[#D2F544] font-semibold'
                    : 'bg-neutral-800 border-neutral-700 hover:border-neutral-500'
                }`}
              >
                &ldquo;{block.highlightCorrectSubstring}&rdquo;
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Step specific question */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm flex flex-col justify-between">
          {subStep === 1 && (
            <div>
              <h3 className="text-base font-bold text-neutral-900 mb-4">
                1. Select the missing word to complete the sentence:
              </h3>
              <p className="text-sm text-neutral-700 mb-6 leading-relaxed">
                {block.gapSentence.before}
                <select
                  value={selectedGapWord}
                  onChange={(e) => setSelectedGapWord(e.target.value)}
                  className="mx-2 bg-neutral-100 border border-neutral-300 rounded-lg px-3 py-1.5 font-bold text-emerald-800 focus:outline-none"
                >
                  <option value="">{t.selectWordOption}</option>
                  {block.gapSentence.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
                {block.gapSentence.after}
              </p>
            </div>
          )}

          {subStep === 2 && (
            <div>
              <h3 className="text-base font-bold text-neutral-900 mb-4">
                2. Select the sentence that best fits into the passage:
              </h3>
              <div className="space-y-3">
                {block.sentenceOptions.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSentenceIdx(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                      selectedSentenceIdx === idx
                        ? 'bg-[#D2F544] border-[#0C2418] text-[#0C2418] font-bold shadow-sm'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {subStep === 3 && (
            <div>
              <h3 className="text-base font-bold text-neutral-900 mb-4">
                3. Highlight the answer in the text:
              </h3>
              <p className="text-sm text-neutral-600 mb-6">{block.highlightPrompt}</p>
              <div className="text-xs text-neutral-400">
                {t.highlightStatus}:{' '}
                {highlightClicked ? (
                  <strong className="text-emerald-600">{t.highlightSuccess}</strong>
                ) : (
                  t.highlightInstruction
                )}
              </div>
            </div>
          )}

          {subStep === 4 && (
            <div>
              <h3 className="text-base font-bold text-neutral-900 mb-4">
                4. Identify the Idea:
              </h3>
              <p className="text-xs text-neutral-500 mb-4">{block.mainIdeaQuestion.question}</p>
              <div className="space-y-3">
                {block.mainIdeaQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedIdeaIdx(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                      selectedIdeaIdx === idx
                        ? 'bg-[#D2F544] border-[#0C2418] text-[#0C2418] font-bold shadow-sm'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {subStep === 5 && (
            <div>
              <h3 className="text-base font-bold text-neutral-900 mb-4">
                5. Title the Passage:
              </h3>
              <p className="text-xs text-neutral-500 mb-4">{block.titleQuestion.question}</p>
              <div className="space-y-3">
                {block.titleQuestion.options.map((opt, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedTitleIdx(idx)}
                    className={`w-full text-left p-3.5 rounded-2xl text-xs sm:text-sm font-medium border transition-all cursor-pointer ${
                      selectedTitleIdx === idx
                        ? 'bg-[#D2F544] border-[#0C2418] text-[#0C2418] font-bold shadow-sm'
                        : 'bg-neutral-50 border-neutral-200 text-neutral-800 hover:bg-neutral-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-6 mt-6 border-t border-neutral-100">
            <Button variant="primary" size="md" onClick={handleNextStep} icon={<ArrowRight className="w-4 h-4" />}>
              {subStep === 5 ? t.finishReadingBtn : t.nextReadingStepBtn}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
