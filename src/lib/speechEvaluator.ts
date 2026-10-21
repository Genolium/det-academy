/**
 * AI Speech Evaluator Engine for DET Speaking Studio
 * Analyzes audio transcripts and speech telemetry for:
 * 1. Pacing & WPM (Words Per Minute)
 * 2. Pause & Hesitation Diagnosis
 * 3. Fluency & Pronunciation Flow Score (0-100 & DET 10-160 equivalent)
 * 4. Lexical Sophistication & CEFR Tiering (A1-A2, B1-B2, C1-C2)
 * 5. Academic Discourse Markers & Coherence Connectors
 */

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface CEFRWordTag {
  word: string;
  level: CEFRLevel;
  isAcademic: boolean;
}

export interface SpeechEvaluationResult {
  transcript: string;
  wordCount: number;
  durationSeconds: number;
  wpm: number;
  pacingRating: 'TOO_SLOW' | 'IDEAL' | 'TOO_FAST';
  pauseCount: number;
  hesitationRatio: number; // 0.0 - 1.0 (estimated hesitation / unfilled pause index)
  fluencyScore: number; // 0 - 100
  estimatedDetSubscore: number; // 10 - 160
  cefrBreakdown: {
    a1_a2: number;
    b1_b2: number;
    c1_c2: number;
    c1_c2_percentage: number;
  };
  cefrTaggedWords: CEFRWordTag[];
  discourseMarkersFound: string[];
  grammarComplexityScore: number; // 0 - 100
  strengths: string[];
  strengthsRu: string[];
  strengthsEn: string[];
  areasForImprovement: string[];
  areasForImprovementRu: string[];
  areasForImprovementEn: string[];
  tipsRu: string[];
  tipsEn: string[];
}

// Academic discourse connectors common in high-scoring DET speaking
const SPEAKING_DISCOURSE_MARKERS = [
  'furthermore', 'moreover', 'consequently', 'therefore', 'nevertheless',
  'nonetheless', 'on the other hand', 'in contrast', 'in addition', 'specifically',
  'for instance', 'for example', 'to illustrate', 'as a result', 'in particular',
  'predominantly', 'notably', 'ultimately', 'significantly', 'it is worth noting',
  'from my perspective', 'in my view', 'i would argue that', 'taking into account'
];

// C1-C2 High Level Academic Vocabulary (AWL + CEFR C1/C2)
const C1_C2_LEXICON = new Set([
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

// B1-B2 Intermediate Vocabulary
const B1_B2_LEXICON = new Set([
  'analyze', 'approach', 'assess', 'assume', 'authority', 'available', 'benefit',
  'concept', 'consistent', 'constitutional', 'context', 'create', 'data', 'define',
  'derive', 'distribution', 'economic', 'environment', 'establish', 'estimate',
  'evidence', 'export', 'factors', 'financial', 'formula', 'function', 'identify',
  'income', 'indicate', 'individual', 'interpretation', 'involve', 'issue',
  'labor', 'legal', 'legislation', 'major', 'method', 'occur', 'percent',
  'period', 'policy', 'principle', 'procedure', 'process', 'require', 'research',
  'respond', 'role', 'section', 'sector', 'significant', 'similar', 'source',
  'specific', 'structure', 'theory', 'vary', 'appropriate', 'aspect', 'complex',
  'conclude', 'consequence', 'considerable', 'constant', 'culture', 'distinct',
  'element', 'evaluate', 'feature', 'final', 'impact', 'journal', 'maintain',
  'obtain', 'potential', 'previous', 'primary', 'purchase', 'range', 'region',
  'relevant', 'restrict', 'secure', 'strategy', 'transfer', 'community', 'consequently'
]);

// Common filler/hesitation words
const FILLER_WORDS = new Set(['uh', 'um', 'err', 'ah', 'like', 'you know', 'sort of', 'kind of']);

/**
 * Tokenizes text into lowercase clean words
 */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0);
}

/**
 * Categorizes a single word into CEFR level
 */
export function classifyWordCEFR(word: string): CEFRLevel {
  const clean = word.toLowerCase().trim();
  if (C1_C2_LEXICON.has(clean)) return 'C1';
  if (B1_B2_LEXICON.has(clean)) return 'B2';
  if (clean.length > 8 && !clean.endsWith('ing') && !clean.endsWith('ed')) return 'B2';
  if (clean.length <= 4) return 'A1';
  return 'A2';
}

/**
 * Analyzes speech transcript and timing metrics
 */
export function evaluateSpeechSample(
  transcript: string,
  durationSeconds: number,
  recordedSilencePauses: number = 0
): SpeechEvaluationResult {
  const safeDuration = Math.max(5, durationSeconds);
  const words = tokenize(transcript);
  const wordCount = words.length;

  // Words per minute (WPM)
  const wpm = Math.round((wordCount / safeDuration) * 60);

  // DET Speaking benchmark:
  // Optimal: 110 - 145 WPM
  // Too Slow: < 100 WPM
  // Too Fast: > 165 WPM
  let pacingRating: 'TOO_SLOW' | 'IDEAL' | 'TOO_FAST' = 'IDEAL';
  if (wpm < 100) pacingRating = 'TOO_SLOW';
  else if (wpm > 165) pacingRating = 'TOO_FAST';

  // Pause / Hesitation calculation
  let fillersCount = 0;
  words.forEach((w) => {
    if (FILLER_WORDS.has(w)) fillersCount++;
  });

  const totalPauses = recordedSilencePauses + fillersCount;
  const hesitationRatio = wordCount > 0 ? Math.min(1, totalPauses / (wordCount / 10)) : 0;

  // Lexical tagging
  let a1_a2_count = 0;
  let b1_b2_count = 0;
  let c1_c2_count = 0;

  const cefrTaggedWords: CEFRWordTag[] = words.map((w) => {
    const level = classifyWordCEFR(w);
    if (level === 'C1' || level === 'C2') c1_c2_count++;
    else if (level === 'B1' || level === 'B2') b1_b2_count++;
    else a1_a2_count++;

    return {
      word: w,
      level,
      isAcademic: C1_C2_LEXICON.has(w) || B1_B2_LEXICON.has(w),
    };
  });

  const c1_c2_percentage = wordCount > 0 ? Math.round((c1_c2_count / wordCount) * 100) : 0;

  // Detect discourse markers
  const lowerText = transcript.toLowerCase();
  const discourseMarkersFound = SPEAKING_DISCOURSE_MARKERS.filter((marker) =>
    lowerText.includes(marker)
  );

  // Fluency score calculation (0 - 100)
  // Factors:
  // 1. Pacing score (optimal WPM is 120-140) -> 35 pts
  let pacingScore = 35;
  if (wpm < 70) pacingScore = 15;
  else if (wpm < 100) pacingScore = 25;
  else if (wpm > 175) pacingScore = 26;
  else if (wpm >= 110 && wpm <= 150) pacingScore = 35;
  else pacingScore = 30;

  // 2. Volume & Duration attainment -> 25 pts
  let volumeScore = 25;
  if (wordCount < 20) volumeScore = 8;
  else if (wordCount < 40) volumeScore = 15;
  else if (wordCount < 70) volumeScore = 20;

  // 3. Discourse structure & markers -> 20 pts
  const discourseScore = Math.min(20, discourseMarkersFound.length * 6);

  // 4. Lexical sophistication -> 20 pts
  let vocabScore = 10;
  if (c1_c2_count >= 5) vocabScore = 20;
  else if (c1_c2_count >= 2 || b1_b2_count >= 8) vocabScore = 16;
  else if (b1_b2_count >= 4) vocabScore = 13;

  // Hesitation penalty
  const hesitationPenalty = Math.round(hesitationRatio * 15);

  const rawFluency = Math.max(10, Math.min(100, pacingScore + volumeScore + discourseScore + vocabScore - hesitationPenalty));
  const fluencyScore = rawFluency;

  // Estimated DET Subscore (10 - 160 scale)
  // Fluency 100 -> ~150-155 DET
  // Fluency 75 -> ~125 DET
  // Fluency 50 -> ~95 DET
  // Fluency 25 -> ~65 DET
  const estimatedDetSubscore = Math.max(10, Math.min(160, Math.round(25 + (fluencyScore / 100) * 130)));

  // Grammar complexity score
  // Based on sentence lengths and complex connectors
  const sentenceCount = Math.max(1, (transcript.match(/[.!?]+/g) || []).length);
  const avgWordsPerSentence = wordCount / sentenceCount;
  let grammarComplexity = 50;
  if (avgWordsPerSentence >= 14) grammarComplexity += 25;
  else if (avgWordsPerSentence >= 10) grammarComplexity += 15;
  if (discourseMarkersFound.length >= 2) grammarComplexity += 20;
  grammarComplexity = Math.min(100, grammarComplexity);

  // Strengths & Improvement Diagnosis
  const strengthsRu: string[] = [];
  const strengthsEn: string[] = [];
  const areasForImprovementRu: string[] = [];
  const areasForImprovementEn: string[] = [];
  const tipsRu: string[] = [];
  const tipsEn: string[] = [];

  if (pacingRating === 'IDEAL') {
    strengthsRu.push('Отличный естественный темп речи (110–150 WPM)');
    strengthsEn.push('Optimal conversational speech rate (110–150 WPM)');
  } else if (pacingRating === 'TOO_SLOW') {
    areasForImprovementRu.push('Слишком медленный темп речи (< 100 WPM). Экзаменаторы DET снижают балл за частые паузы.');
    areasForImprovementEn.push('Pacing is below target (< 100 WPM). DET scorers penalize hesitations and lengthy pauses.');
    tipsRu.push('Старайтесь говорить блоками словосочетаний (chunks), избегая зависаний между словами.');
    tipsEn.push('Aim for 110–140 WPM. Speak in syntactic chunks rather than pausing before each word.');
  } else {
    areasForImprovementRu.push('Слишком высокий темп речи (> 165 WPM). Риск потери четкости дикции и проглатывания окончаний.');
    areasForImprovementEn.push('Speaking rate exceeds 165 WPM. Risk of slurred articulation and unclear sentence boundaries.');
    tipsRu.push('Снизьте темп и уделите внимание четкой артикуляции академических терминов.');
    tipsEn.push('Slow down slightly to maintain crisp pronunciation and sentence boundary clarity.');
  }

  if (c1_c2_count >= 3) {
    strengthsRu.push(`Сильный академический вокабуляр C1/C2 (${c1_c2_count} продвинутых терминов)`);
    strengthsEn.push(`Advanced C1/C2 academic lexical density (${c1_c2_count} sophisticated terms)`);
  } else {
    areasForImprovementRu.push('Низкая доля академической лексики C1/C2. Преобладают базовые слова A1–B1.');
    areasForImprovementEn.push('Low proportion of C1/C2 academic vocabulary. Base A1–B1 words dominate.');
    tipsRu.push('Заменяйте простые слова (good, bad, show) на продвинутые аналоги (pivotal, detrimental, demonstrate).');
    tipsEn.push('Elevate your lexical register with C1 adjectives and verbs like "substantiate" and "paramount".');
  }

  if (discourseMarkersFound.length >= 2) {
    strengthsRu.push(`Уверенное использование связующих маркеров (${discourseMarkersFound.join(', ')})`);
    strengthsEn.push(`Confident use of cohesive discourse markers (${discourseMarkersFound.join(', ')})`);
  } else {
    areasForImprovementRu.push('Недостаточно дискурсивных коннекторов (Moreover, Consequently, In contrast).');
    areasForImprovementEn.push('Insufficient discourse connectors (Moreover, Consequently, In contrast).');
    tipsRu.push('Используйте связки для логического перехода между мыслями: "Furthermore", "On the other hand".');
    tipsEn.push('Add discourse markers to signpost arguments clearly: "Furthermore", "Consequently".');
  }

  if (wordCount >= 75) {
    strengthsRu.push(`Высокая глубина ответа (${wordCount} слов за сессию)`);
    strengthsEn.push(`Robust production volume (${wordCount} words per session)`);
  } else if (wordCount < 40) {
    areasForImprovementRu.push('Малый объем речевого материала. На экзамене DET говорите до истечения таймера.');
    areasForImprovementEn.push('Limited speech volume. On the official DET exam, keep speaking until the timer expires.');
    tipsRu.push('Развивайте мысль по формуле PREP/OREO: тезис -> причина -> конкретный пример -> вывод.');
    tipsEn.push('Elaborate with concrete examples: State position -> Explain reason -> Give example -> Conclude.');
  }

  return {
    transcript,
    wordCount,
    durationSeconds: Math.round(safeDuration),
    wpm,
    pacingRating,
    pauseCount: totalPauses,
    hesitationRatio,
    fluencyScore,
    estimatedDetSubscore,
    cefrBreakdown: {
      a1_a2: a1_a2_count,
      b1_b2: b1_b2_count,
      c1_c2: c1_c2_count,
      c1_c2_percentage,
    },
    cefrTaggedWords,
    discourseMarkersFound,
    grammarComplexityScore: grammarComplexity,
    strengths: strengthsRu,
    strengthsRu,
    strengthsEn,
    areasForImprovement: areasForImprovementRu,
    areasForImprovementRu,
    areasForImprovementEn,
    tipsRu,
    tipsEn,
  };
}
