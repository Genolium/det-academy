'use client';

import React, { useState, useMemo } from 'react';
import { PillBadge } from '@/components/ui/PillBadge';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  HelpCircle,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
  BookOpen,
} from 'lucide-react';

interface WritingInspectorProps {
  text: string;
  onTextChange?: (newText: string) => void;
  minWords?: number;
  promptText?: string;
  showOreoTracker?: boolean;
  className?: string;
}

export type CEFRTag = 'A1_A2' | 'B1_B2' | 'C1_C2';

interface AnalyzedWord {
  word: string;
  cleanWord: string;
  level: CEFRTag;
  upgradeSuggestions?: string[];
  isContraction?: boolean;
}

// C1-C2 Academic Lexicon
const C1_C2_WORDS = new Set([
  'substantiate', 'corroborate', 'paradigm', 'empirical', 'ubiquitous',
  'dichotomy', 'elucidate', 'mitigate', 'disseminate', 'delineate',
  'proponent', 'comprehensive', 'infrastructure', 'subsequent', 'intrinsic',
  'facilitate', 'deteriorate', 'prevalent', 'sustainable', 'implication',
  'crucial', 'collaborate', 'distinguish', 'predominant', 'phenomenon',
  'substantial', 'prioritize', 'equitable', 'adversely', 'paramount',
  'pivotal', 'profound', 'exacerbate', 'myriad', 'pervasive', 'inevitable',
  'contemporary', 'scrutiny', 'diminish', 'foster', 'underscore', 'culminate',
  'tangible', 'indispensable', 'adversity', 'conducive', 'holistic', 'pragmatic',
  'unprecedented', 'catalyst', 'juxtaposition', 'ambiguous', 'lucid', 'succinct'
]);

// B1-B2 Lexicon
const B1_B2_WORDS = new Set([
  'analyze', 'approach', 'assess', 'assume', 'authority', 'available', 'benefit',
  'concept', 'consistent', 'context', 'create', 'data', 'define', 'derive',
  'distribution', 'economic', 'environment', 'establish', 'estimate', 'evidence',
  'export', 'factors', 'financial', 'formula', 'function', 'identify', 'income',
  'indicate', 'individual', 'interpretation', 'involve', 'issue', 'labor',
  'legal', 'legislation', 'major', 'method', 'occur', 'percent', 'period',
  'policy', 'principle', 'procedure', 'process', 'require', 'research',
  'respond', 'role', 'section', 'sector', 'significant', 'similar', 'source',
  'specific', 'structure', 'theory', 'vary', 'appropriate', 'aspect', 'complex',
  'conclude', 'consequence', 'considerable', 'constant', 'culture', 'distinct',
  'element', 'evaluate', 'feature', 'final', 'impact', 'journal', 'maintain',
  'obtain', 'potential', 'previous', 'primary', 'purchase', 'range', 'region',
  'relevant', 'restrict', 'secure', 'strategy', 'transfer', 'community', 'consequently',
  'furthermore', 'moreover', 'therefore', 'nevertheless', 'nonetheless', 'whereas'
]);

import { useSettingsStore } from '@/store/useSettingsStore';

// High-value upgrades dictionary: weak/elementary -> academic C1/C2
const VOCAB_UPGRADES: Record<string, string[]> = {
  important: ['paramount', 'pivotal', 'crucial', 'indispensable'],
  big: ['substantial', 'considerable', 'immense', 'monumental'],
  good: ['beneficial', 'advantageous', 'meritorious', 'propitious'],
  bad: ['detrimental', 'adverse', 'deleterious', 'suboptimal'],
  show: ['delineate', 'demonstrate', 'elucidate', 'exemplify'],
  help: ['facilitate', 'foster', 'accommodate', 'expedite'],
  think: ['contend', 'posit', 'maintain', 'hypothesize'],
  make: ['formulate', 'generate', 'fabricate', 'establish'],
  get: ['acquire', 'obtain', 'procure', 'attain'],
  many: ['myriad', 'numerous', 'copious', 'multifarious'],
  problem: ['dilemma', 'predicament', 'impediment', 'complication'],
  change: ['transform', 'fluctuate', 'metamorphose', 'revise'],
  very: ['exceedingly', 'profoundly', 'exceptionally', 'strikingly'],
  clear: ['lucid', 'evident', 'unambiguous', 'transparent'],
  'lead to': ['culminate in', 'engender', 'precipitate', 'foster'],
};

// Contractions map for academic writing
const CONTRACTIONS_MAP: Record<string, string> = {
  "can't": 'cannot',
  "don't": 'do not',
  "won't": 'will not',
  "isn't": 'is not',
  "aren't": 'are not',
  "didn't": 'did not',
  "it's": 'it is',
  "they're": 'they are',
  "we're": 'we are',
  "i'm": 'I am',
  "doesn't": 'does not',
  "couldn't": 'could not',
  "shouldn't": 'should not',
  "haven't": 'have not',
  "hasn't": 'has not',
  "hadn't": 'had not',
  "wouldn't": 'would not',
  "wasn't": 'was not',
  "weren't": 'were not',
  "you're": 'you are',
  "that's": 'that is',
};

export const WritingInspector: React.FC<WritingInspectorProps> = ({
  text,
  onTextChange,
  minWords = 50,
  promptText,
  showOreoTracker = true,
  className = '',
}) => {
  const { locale } = useSettingsStore();
  const [selectedWord, setSelectedWord] = useState<AnalyzedWord | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'LEXICAL' | 'OREO' | 'UPGRADES'>('LEXICAL');

  const normalizedText = useMemo(() => text.replace(/[‘’]/g, "'"), [text]);
  const lowerText = useMemo(() => normalizedText.toLowerCase(), [normalizedText]);
  const rawWords = useMemo(() => text.trim().split(/\s+/).filter(Boolean), [text]);
  const wordCount = rawWords.length;

  // 1. Lexical Analysis
  const analyzedWords = useMemo<AnalyzedWord[]>(() => {
    return rawWords.map((raw) => {
      const clean = raw.toLowerCase().replace(/[‘’]/g, "'").replace(/[^a-z'-]/g, '');
      let level: CEFRTag = 'A1_A2';

      if (C1_C2_WORDS.has(clean)) {
        level = 'C1_C2';
      } else if (B1_B2_WORDS.has(clean) || (clean.length > 7 && !clean.endsWith('ing') && !clean.endsWith('ed'))) {
        level = 'B1_B2';
      }

      const upgrades = VOCAB_UPGRADES[clean];
      const isContraction = clean in CONTRACTIONS_MAP;

      return {
        word: raw,
        cleanWord: clean,
        level,
        upgradeSuggestions: upgrades,
        isContraction,
      };
    });
  }, [rawWords]);

  // Counts
  const counts = useMemo(() => {
    let a1_a2 = 0;
    let b1_b2 = 0;
    let c1_c2 = 0;
    analyzedWords.forEach((w) => {
      if (w.level === 'C1_C2') c1_c2++;
      else if (w.level === 'B1_B2') b1_b2++;
      else a1_a2++;
    });

    const total = Math.max(1, analyzedWords.length);
    return {
      a1_a2,
      b1_b2,
      c1_c2,
      pctC1_C2: Math.round((c1_c2 / total) * 100),
      pctB1_B2: Math.round((b1_b2 / total) * 100),
      pctA1_A2: Math.round((a1_a2 / total) * 100),
    };
  }, [analyzedWords]);

  // Detected Upgradeable words in text
  const upgradeOpportunities = useMemo(() => {
    const list: Array<{ original: string; upgrades: string[] }> = [];
    Object.keys(VOCAB_UPGRADES).forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(lowerText)) {
        list.push({ original: word, upgrades: VOCAB_UPGRADES[word] });
      }
    });
    return list;
  }, [lowerText]);

  // Detected contractions
  const detectedContractions = useMemo(() => {
    const found: string[] = [];
    Object.keys(CONTRACTIONS_MAP).forEach((c) => {
      const escaped = c.replace("'", "['‘’]");
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      if (regex.test(text)) {
        found.push(c);
      }
    });
    return found;
  }, [text]);

  // 2. OREO Structure Analysis
  const oreoStatus = useMemo(() => {
    // Opinion: check opinion stance markers
    const opinionMarkers = [
      'in my opinion', 'i believe', 'i maintain', 'i contend', 'my perspective is',
      'it is evident that', 'i firmly agree', 'i firmly disagree', 'from my standpoint'
    ];
    const hasOpinion = opinionMarkers.some((m) => lowerText.includes(m)) || lowerText.includes('think') || lowerText.includes('should');

    // Reason: check logical causal markers
    const reasonMarkers = [
      'because', 'due to', 'the primary reason', 'stems from', 'is attributed to',
      'as a consequence', 'given that', 'since', 'on the grounds that'
    ];
    const hasReason = reasonMarkers.some((m) => lowerText.includes(m));

    // Example / Evidence: check empirical/concrete illustration markers
    const exampleMarkers = [
      'for example', 'for instance', 'to illustrate', 'a prime illustration',
      'empirical evidence indicates', 'studies show', 'a notable case', 'in the case of'
    ];
    const hasExample = exampleMarkers.some((m) => lowerText.includes(m));

    // Opinion restated / Outcome: check synthesis markers
    const outcomeMarkers = [
      'in conclusion', 'to summarize', 'ultimately', 'therefore', 'thus',
      'in summary', 'to conclude', 'all things considered'
    ];
    const hasOutcome = outcomeMarkers.some((m) => lowerText.includes(m));

    const totalPassed = (hasOpinion ? 1 : 0) + (hasReason ? 1 : 0) + (hasExample ? 1 : 0) + (hasOutcome ? 1 : 0);

    return {
      opinion: hasOpinion,
      reason: hasReason,
      example: hasExample,
      outcome: hasOutcome,
      totalPassed,
      scorePct: Math.round((totalPassed / 4) * 100),
    };
  }, [lowerText]);

  // Word replacement handler with capitalization preservation
  const handleApplyUpgrade = (original: string, replacement: string) => {
    if (!onTextChange) return;
    const regex = new RegExp(`\\b${original}\\b`, 'i');
    const match = text.match(regex);
    let finalReplacement = replacement;
    if (match && match[0] && match[0][0] === match[0][0].toUpperCase() && match[0][0] !== match[0][0].toLowerCase()) {
      finalReplacement = replacement.charAt(0).toUpperCase() + replacement.slice(1);
    }
    const newText = text.replace(regex, finalReplacement);
    onTextChange(newText);
    setSelectedWord(null);
  };

  const handleFixContraction = (c: string) => {
    if (!onTextChange) return;
    const normalizedKey = c.toLowerCase().replace(/[‘’]/g, "'");
    const replacement = CONTRACTIONS_MAP[normalizedKey];
    if (!replacement) return;
    const escaped = c.replace(/[‘’']/g, "['‘’]");
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    onTextChange(text.replace(regex, (match) => {
      if (match[0] === match[0].toUpperCase()) {
        return replacement.charAt(0).toUpperCase() + replacement.slice(1);
      }
      return replacement;
    }));
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRu = locale === 'ru';

  return (
    <div className={`bg-[#0E1012] border border-neutral-800 rounded-3xl p-5 sm:p-7 text-white shadow-xl space-y-6 ${className}`}>
      
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D2F544]" />
              AI Writing Diagnostic Inspector
            </span>
          </div>
          <h3 className="text-lg font-black text-white">
            {isRu ? 'Лексическая и структурная экспертиза эссе' : 'Lexical & Structural Essay Diagnostics'}
          </h3>
        </div>

        {/* Word count target & Copy */}
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-neutral-400">
              {isRu ? 'Объем:' : 'Word Count:'}
            </span>
            <span className={`text-xs font-black ${wordCount >= minWords ? 'text-[#D2F544]' : 'text-amber-400'}`}>
              {wordCount} / {minWords} {isRu ? 'слов' : 'words'}
            </span>
          </div>

          <button
            onClick={handleCopyText}
            className="p-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            title={isRu ? 'Скопировать текст' : 'Copy text'}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 flex-wrap">
        <button
          onClick={() => setActiveTab('LEXICAL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'LEXICAL'
              ? 'bg-[#D2F544] text-[#0C2418]'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>{isRu ? `CEFR Спектр (${counts.pctC1_C2}% C1/C2)` : `CEFR Spectrum (${counts.pctC1_C2}% C1/C2)`}</span>
        </button>

        <button
          onClick={() => setActiveTab('OREO')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'OREO'
              ? 'bg-[#D2F544] text-[#0C2418]'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>{isRu ? `OREO Структура (${oreoStatus.scorePct}%)` : `OREO Structure (${oreoStatus.scorePct}%)`}</span>
        </button>

        <button
          onClick={() => setActiveTab('UPGRADES')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'UPGRADES'
              ? 'bg-[#D2F544] text-[#0C2418]'
              : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
          }`}
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>{isRu ? `Vocab Upgrades (${upgradeOpportunities.length})` : `Vocab Upgrades (${upgradeOpportunities.length})`}</span>
        </button>
      </div>

      {/* TAB 1: LEXICAL CEFR SPECTRUM & WORD HIGHLIGHT */}
      {activeTab === 'LEXICAL' && (
        <div className="space-y-4">
          {/* CEFR Level Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[10px] font-bold uppercase text-emerald-400 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400" /> C1–C2 Advanced
              </span>
              <div className="text-xl font-black text-white mt-1">
                {counts.pctC1_C2}%
              </div>
              <span className="text-[10px] text-neutral-400 font-medium">
                {isRu ? `${counts.c1_c2} терминов (цель: >15%)` : `${counts.c1_c2} terms (target: >15%)`}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[10px] font-bold uppercase text-indigo-400 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400" /> B1–B2 Upper-Int
              </span>
              <div className="text-xl font-black text-white mt-1">
                {counts.pctB1_B2}%
              </div>
              <span className="text-[10px] text-neutral-400 font-medium">
                {isRu ? `${counts.b1_b2} академических слов` : `${counts.b1_b2} academic words`}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 text-center">
              <span className="text-[10px] font-bold uppercase text-neutral-400 flex items-center justify-center gap-1">
                <span className="w-2 h-2 rounded-full bg-neutral-500" /> A1–A2 General
              </span>
              <div className="text-xl font-black text-white mt-1">
                {counts.pctA1_A2}%
              </div>
              <span className="text-[10px] text-neutral-400 font-medium">
                {isRu ? `${counts.a1_a2} базовых слов` : `${counts.a1_a2} basic words`}
              </span>
            </div>
          </div>

          {/* Interactive Tagged Words Display */}
          <div className="p-4 rounded-2xl bg-neutral-950/80 border border-neutral-800 leading-relaxed font-sans text-xs sm:text-sm">
            {analyzedWords.length === 0 ? (
              <span className="text-neutral-500 italic">
                {isRu ? 'Начните ввод эссе выше, чтобы активировать интерактивную диагностику...' : 'Type or paste your essay above to activate interactive diagnostics...'}
              </span>
            ) : (
              analyzedWords.map((item, index) => {
                let badgeClass = 'text-neutral-300';
                if (item.level === 'C1_C2') {
                  badgeClass = 'bg-[#D2F544]/20 text-[#D2F544] border border-[#D2F544]/40 font-bold px-1 py-0.5 rounded shadow-[0_0_8px_rgba(210,245,68,0.2)]';
                } else if (item.level === 'B1_B2') {
                  badgeClass = 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1 py-0.5 rounded';
                }

                if (item.upgradeSuggestions && item.upgradeSuggestions.length > 0) {
                  badgeClass += ' underline decoration-amber-400 decoration-wavy cursor-pointer';
                }

                return (
                  <span
                    key={index}
                    onClick={() => setSelectedWord(item)}
                    className={`inline-block mx-0.5 cursor-pointer transition-all hover:scale-105 ${badgeClass}`}
                    title={`${isRu ? 'Уровень:' : 'Level:'} ${item.level.replace('_', '-')}${item.upgradeSuggestions ? (isRu ? ' • Доступен апгрейд' : ' • Upgrade available') : ''}`}
                  >
                    {item.word}{' '}
                  </span>
                );
              })
            )}
          </div>

          {/* Word Inspector Card on Click */}
          {selectedWord && (
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-700/80 animate-in fade-in slide-in-from-top-1 duration-150">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-white">{selectedWord.word}</span>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                    selectedWord.level === 'C1_C2'
                      ? 'bg-[#D2F544]/20 text-[#D2F544]'
                      : selectedWord.level === 'B1_B2'
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}>
                    {selectedWord.level.replace('_', '-')}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedWord(null)}
                  className="text-xs text-neutral-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {selectedWord.upgradeSuggestions && selectedWord.upgradeSuggestions.length > 0 ? (
                <div>
                  <span className="text-[11px] text-amber-300 font-bold block mb-1.5">
                    {isRu ? '💡 Академические C1/C2 апгрейды (нажмите для автозамены):' : '💡 Academic C1/C2 upgrades (click to substitute):'}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {selectedWord.upgradeSuggestions.map((up, i) => (
                      <button
                        key={i}
                        onClick={() => handleApplyUpgrade(selectedWord.cleanWord, up)}
                        className="px-2.5 py-1 rounded-xl bg-amber-950/60 hover:bg-amber-900 border border-amber-700 text-xs font-black text-amber-200 transition-all active:scale-95 cursor-pointer"
                      >
                        + {up}
                      </button>
                    ))}
                  </div>
                </div>
              ) : selectedWord.level === 'C1_C2' ? (
                <p className="text-xs text-emerald-400">
                  {isRu ? '✓ Отличное академическое слово высокого регистра! Экзаменаторы DET поощряют такую лексику.' : '✓ Outstanding high-register academic vocabulary! DET raters award elevated lexical marks.'}
                </p>
              ) : (
                <p className="text-xs text-neutral-400">
                  {isRu ? 'Стандартное общеупотребительное слово. Попробуйте подобрать более специфичный термин.' : 'Standard foundational word. Consider elevating to a more precise academic synonym.'}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: OREO STRUCTURE COMPLETENESS TRACKER */}
      {activeTab === 'OREO' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-neutral-950/90 border border-neutral-800">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                {isRu ? 'OREO Академический каркас эссе DET:' : 'OREO Academic DET Essay Framework:'}
              </span>
              <span className={`text-xs font-black ${oreoStatus.totalPassed >= 3 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {oreoStatus.totalPassed} / 4 {isRu ? 'компонентов выполнено' : 'components satisfied'}
              </span>
            </div>

            {/* 4 Steps */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* O: Opinion */}
              <div className={`p-3.5 rounded-2xl border ${
                oreoStatus.opinion
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                  : 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-white">
                    {isRu ? '[O] Opinion / Тезис' : '[O] Opinion / Stance'}
                  </span>
                  {oreoStatus.opinion ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {isRu ? 'Найдено' : 'Detected'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-500">
                      {isRu ? 'Не обнаружено' : 'Not detected'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  {isRu ? 'Четкая авторская позиция. Пример: ' : 'Clear authorial position. Example: '}<i>&quot;In my opinion, higher education should...&quot;</i>
                </p>
              </div>

              {/* R: Reason */}
              <div className={`p-3.5 rounded-2xl border ${
                oreoStatus.reason
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                  : 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-white">
                    {isRu ? '[R] Reason / Обоснование' : '[R] Reason / Justification'}
                  </span>
                  {oreoStatus.reason ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {isRu ? 'Найдено' : 'Detected'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-500">
                      {isRu ? 'Не обнаружено' : 'Not detected'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  {isRu ? 'Причинно-следственная связь. Пример: ' : 'Logical causal link. Example: '}<i>&quot;This is primarily because digital automation...&quot;</i>
                </p>
              </div>

              {/* E: Example */}
              <div className={`p-3.5 rounded-2xl border ${
                oreoStatus.example
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                  : 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-white">
                    {isRu ? '[E] Example / Пример' : '[E] Example / Concrete Evidence'}
                  </span>
                  {oreoStatus.example ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {isRu ? 'Найдено' : 'Detected'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-500">
                      {isRu ? 'Не обнаружено' : 'Not detected'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  {isRu ? 'Фактический случай или исследование. Пример: ' : 'Empirical study or concrete scenario. Example: '}<i>&quot;For instance, empirical studies show...&quot;</i>
                </p>
              </div>

              {/* O: Outcome / Restatement */}
              <div className={`p-3.5 rounded-2xl border ${
                oreoStatus.outcome
                  ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                  : 'bg-neutral-900/40 border-neutral-800 text-neutral-400'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black text-white">
                    {isRu ? '[O] Outcome / Вывод' : '[O] Outcome / Synthesis'}
                  </span>
                  {oreoStatus.outcome ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {isRu ? 'Найдено' : 'Detected'}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-neutral-500">
                      {isRu ? 'Не обнаружено' : 'Not detected'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-400 leading-normal">
                  {isRu ? 'Синтезирующий итог. Пример: ' : 'Synthesized conclusion. Example: '}<i>&quot;Ultimately, governments must prioritize...&quot;</i>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACADEMIC VOCABULARY UPGRADES & CONTRACTIONS */}
      {activeTab === 'UPGRADES' && (
        <div className="space-y-4">
          {/* Contraction warnings */}
          {detectedContractions.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  {isRu ? `Внимание: Обнаружены разговорные сокращения (${detectedContractions.length})` : `Warning: Informal contractions detected (${detectedContractions.length})`}
                </span>
                <span className="text-[10px] text-neutral-400">
                  {isRu ? 'В академическом письме DET сокращения снижают Literacy' : 'In academic DET essays, contractions reduce Literacy marks'}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap pt-1">
                {detectedContractions.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => handleFixContraction(c)}
                    className="px-2.5 py-1 rounded-xl bg-amber-900/40 hover:bg-amber-900 border border-amber-700/60 text-xs font-bold text-amber-200 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>{c}</span>
                    <span className="text-amber-400">→</span>
                    <span className="underline">{CONTRACTIONS_MAP[c.toLowerCase()]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Upgrade List */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider block">
              {isRu ? 'Быстрые лексические апгрейды в тексте:' : 'Quick academic upgrades in text:'}
            </span>

            {upgradeOpportunities.length === 0 ? (
              <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 text-center text-xs text-neutral-400">
                {isRu ? 'Базовых слов для немедленного апгрейда не обнаружено. Ваш словарный выбор стабилен!' : 'No basic words detected for immediate upgrade. Robust academic register!'}
              </div>
            ) : (
              upgradeOpportunities.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div>
                    <span className="text-xs font-bold text-neutral-400">
                      {isRu ? 'Слово в тексте: ' : 'Target word: '}<strong className="text-white">&quot;{item.original}&quot;</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-neutral-500 uppercase font-bold mr-1">
                      {isRu ? 'Заменить на:' : 'Substitute with:'}
                    </span>
                    {item.upgrades.map((u, ui) => (
                      <button
                        key={ui}
                        onClick={() => handleApplyUpgrade(item.original, u)}
                        className="px-2.5 py-1 rounded-xl bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-700/80 text-xs font-black text-emerald-200 transition-all active:scale-95 cursor-pointer"
                      >
                        {u}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
