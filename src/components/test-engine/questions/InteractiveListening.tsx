'use client';

import React, { useState, useEffect } from 'react';
import { interactiveListeningBank } from '@/data/questionBank';
import { useTestStore } from '@/store/useTestStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { translations } from '@/lib/translations';
import { sound } from '@/lib/sound';
import { Button } from '@/components/ui/Button';
import { Volume2, ArrowRight, Clock, MessageSquareQuote, FileText } from 'lucide-react';

interface InteractiveListeningProps {
  onComplete: () => void;
}

export const InteractiveListening: React.FC<InteractiveListeningProps> = ({ onComplete }) => {
  const { recordInteractiveListeningResult } = useTestStore();
  const { locale } = useSettingsStore();
  const t = translations[locale].testSession;
  const block = interactiveListeningBank[0];

  // Phase: 'DIALOG' -> 'SCRIPT_PAUSE' (15s) -> 'SUMMARY' (75s)
  const [phase, setPhase] = useState<'DIALOG' | 'SCRIPT_PAUSE' | 'SUMMARY'>('DIALOG');
  const [currentTurnIdx, setCurrentTurnIdx] = useState(0);
  const [selectedResponses, setSelectedResponses] = useState<number[]>([]);
  const [summaryText, setSummaryText] = useState('');

  const [pauseTimer, setPauseTimer] = useState(15);
  const [summaryTimer, setSummaryTimer] = useState(75);

  const currentTurn = block.turns[currentTurnIdx];

  // Speak dialogue line when turn changes
  useEffect(() => {
    if (phase === 'DIALOG' && currentTurn) {
      sound.speakEnglish(currentTurn.speakerAudioText);
    }
  }, [phase, currentTurnIdx]);

  // 15s script pause timer
  useEffect(() => {
    if (phase !== 'SCRIPT_PAUSE') return;

    const timer = setInterval(() => {
      setPauseTimer((prev) => {
        if (prev <= 1) {
          setPhase('SUMMARY');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase]);

  // 75s summary timer
  useEffect(() => {
    if (phase !== 'SUMMARY') return;

    const timer = setInterval(() => {
      setSummaryTimer((prev) => {
        if (prev <= 1) {
          handleSubmitFinal();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, summaryText]);

  const handleSelectTurnOption = (optionIndex: number) => {
    const updated = [...selectedResponses, optionIndex];
    setSelectedResponses(updated);

    if (currentTurnIdx + 1 < block.turns.length) {
      setCurrentTurnIdx((i) => i + 1);
    } else {
      // Transition to 15s script review
      setPhase('SCRIPT_PAUSE');
    }
  };

  const handleSubmitFinal = () => {
    // Score dialog choices (0..1)
    let dialogCorrect = 0;
    block.turns.forEach((turn, idx) => {
      if (selectedResponses[idx] === turn.correctIndex) {
        dialogCorrect++;
      }
    });

    const wordsCount = summaryText.trim().split(/\s+/).filter(Boolean).length;
    // 3 sentences recommended, minimum ~30 words for decent score
    const summaryScore = Math.min(1.0, Math.max(0.2, wordsCount / 40));

    const finalBlockScore = (dialogCorrect / block.turns.length) * 0.5 + summaryScore * 0.5;
    recordInteractiveListeningResult(finalBlockScore);
    onComplete();
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-6 font-mono">
        <span className="uppercase font-bold tracking-wider text-white">Interactive Listening</span>
        {phase === 'SCRIPT_PAUSE' && (
          <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full font-bold">
            {t.listeningPauseTimer}: {pauseTimer}s
          </span>
        )}
        {phase === 'SUMMARY' && (
          <span className="bg-[#D2F544] text-[#0C2418] px-3 py-1 rounded-full font-bold">
            {t.listeningSummaryTimer}: {summaryTimer}s
          </span>
        )}
      </div>

      {phase === 'DIALOG' && (
        <div className="space-y-6">
          {/* Scenario info */}
          <div className="bg-[#111315] border border-neutral-800 rounded-3xl p-6 text-xs text-neutral-300">
            <strong className="text-[#D2F544] block mb-1 uppercase font-bold">{t.scenarioLabel}:</strong>
            {block.scenario}
          </div>

          {/* Speaker Audio Prompt Box */}
          <div className="bg-neutral-900 border-2 border-neutral-800 rounded-3xl p-6 text-white flex items-center gap-4">
            <button
              onClick={() => sound.speakEnglish(currentTurn.speakerAudioText)}
              className="w-14 h-14 rounded-2xl bg-[#D2F544] text-[#0C2418] flex items-center justify-center shrink-0 hover:scale-105 active:scale-95 transition-transform"
            >
              <Volume2 className="w-7 h-7" />
            </button>
            <div>
              <span className="text-xs text-[#D2F544] font-bold uppercase block">{currentTurn.speaker}</span>
              <p className="text-sm font-medium italic text-neutral-200">
                &ldquo;{currentTurn.speakerAudioText}&rdquo;
              </p>
            </div>
          </div>

          {/* User Choice Options */}
          <div className="space-y-3">
            <span className="text-xs text-neutral-400 font-bold uppercase block">
              {t.chooseTurnHint} ({currentTurnIdx + 1} / {block.turns.length}):
            </span>
            {currentTurn.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectTurnOption(idx)}
                className="w-full text-left p-4 rounded-2xl bg-white hover:bg-[#D2F544] hover:text-[#0C2418] text-[#0E1012] font-semibold text-sm border border-neutral-200 transition-all cursor-pointer shadow-sm active:scale-[0.99]"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'SCRIPT_PAUSE' && (
        <div className="bg-[#111315] text-white p-8 rounded-3xl border border-neutral-800 shadow-2xl space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-[#D2F544]">
            <MessageSquareQuote className="w-6 h-6" />
            <h3 className="text-xl font-black uppercase">{t.dialogueFinishedTitle}</h3>
          </div>
          <p className="text-xs text-neutral-400">
            {t.dialogueFinishedDesc}
          </p>

          <div className="bg-neutral-900 p-6 rounded-2xl border border-neutral-800 space-y-3 text-xs text-neutral-300 max-h-60 overflow-y-auto">
            {block.turns.map((tTurn, i) => (
              <div key={i} className="space-y-1">
                <span className="text-[#D2F544] font-bold">{tTurn.speaker}:</span> {tTurn.speakerAudioText}
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button variant="primary" size="md" onClick={() => setPhase('SUMMARY')}>
              {t.startSummaryNowBtn}
            </Button>
          </div>
        </div>
      )}

      {phase === 'SUMMARY' && (
        <div className="bg-[#111315] text-white p-8 rounded-3xl border border-neutral-800 shadow-2xl space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[#D2F544]">
              <FileText className="w-6 h-6" />
              <h3 className="text-xl font-black uppercase">{t.summaryHeading}</h3>
            </div>
            <span className="text-xs text-neutral-400">
              {t.wordsCounter}: <strong className="text-white">{summaryText.trim().split(/\s+/).filter(Boolean).length}</strong>
            </span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            {block.summaryPrompt}
          </p>

          <textarea
            rows={5}
            value={summaryText}
            onChange={(e) => setSummaryText(e.target.value)}
            placeholder="I spoke with my professor today regarding... They suggested that I should... In the end, I decided to..."
            className="w-full bg-neutral-900 border-2 border-neutral-700 focus:border-[#D2F544] rounded-2xl p-4 text-white text-sm outline-none leading-relaxed"
            autoFocus
          />

          <div className="flex justify-end">
            <Button variant="primary" size="lg" onClick={handleSubmitFinal} icon={<ArrowRight className="w-4 h-4" />}>
              {t.submitSummaryBtn}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
