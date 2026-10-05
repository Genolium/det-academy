/**
 * Text Evaluation & Rubric Grader Engine
 * Evaluates student written responses across:
 * 1. Semantic relevance to prompt / context keywords
 * 2. Lexical diversity (Type-Token Ratio - TTR) & Academic vocabulary (B2/C1 terms)
 * 3. Sentence complexity & average length
 * 4. Structural connectors & discourse markers
 */

export interface TextRubricFeedback {
  score: number; // 0.0 - 1.0 (calibrated ratio)
  wordCount: number;
  uniqueWordsCount: number;
  lexicalDiversityRatio: number; // TTR
  academicWordsUsed: string[];
  connectorsUsed: string[];
  relevanceKeywordsFound: string[];
  relevanceScore: number; // 0.0 - 1.0
  recommendations: string[];
}

// Academic discourse connectors (CEFR B2-C1)
const DISCOURSE_CONNECTORS = [
  'furthermore', 'moreover', 'consequently', 'therefore', 'nevertheless',
  'nonetheless', 'in addition', 'on the contrary', 'as a result', 'subsequently',
  'specifically', 'in particular', 'whereas', 'conversely', 'significantly',
  'in contrast', 'ultimately', 'notably', 'demonstrating', 'indicating'
];

// High-utility academic vocabulary (AWL B2-C1)
const ACADEMIC_VOCABULARY = [
  'significant', 'perspective', 'fundamental', 'infrastructure', 'subsequent',
  'paradigm', 'intrinsic', 'demonstrate', 'facilitate', 'enhance',
  'comprehensive', 'allocate', 'coherent', 'deteriorate', 'prevalent',
  'empirical', 'sustainable', 'implication', 'crucial', 'advocate',
  'collaborate', 'distinguish', 'framework', 'predominant', 'phenomenon',
  'substantial', 'prioritize', 'compensate', 'reinforce', 'equitable'
];

/**
 * Normalizes text to lowercase word tokens
 */
function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Evaluates Write About Photo response
 * Checks semantic fit against image context + syntax + grammar volume
 */
export function evaluateWriteAboutPhoto(
  userText: string,
  imageContext: {
    altText?: string;
    expectedKeywords?: string[];
  }
): TextRubricFeedback {
  const words = tokenizeWords(userText);
  const wordCount = words.length;
  const uniqueWords = new Set(words);
  const ttr = wordCount > 0 ? uniqueWords.size / wordCount : 0;

  // Extract reference keywords from alt text or list
  const referenceKeywords: string[] = [];
  if (imageContext.expectedKeywords) {
    referenceKeywords.push(...imageContext.expectedKeywords.map((k) => k.toLowerCase()));
  }
  if (imageContext.altText) {
    const altTokens = tokenizeWords(imageContext.altText);
    const stopWords = new Set(['the', 'and', 'with', 'in', 'on', 'at', 'for', 'of', 'a', 'an']);
    altTokens.forEach((tok) => {
      if (!stopWords.has(tok) && tok.length > 3) {
        referenceKeywords.push(tok);
      }
    });
  }

  // Find matched semantic keywords
  const matchedKeywords: string[] = [];
  referenceKeywords.forEach((kw) => {
    if (words.some((w) => w.includes(kw) || kw.includes(w))) {
      if (!matchedKeywords.includes(kw)) {
        matchedKeywords.push(kw);
      }
    }
  });

  // Check academic words & connectors
  const academicFound = words.filter((w) => ACADEMIC_VOCABULARY.includes(w));
  const uniqueAcademic = Array.from(new Set(academicFound));

  const lowerText = userText.toLowerCase();
  const connectorsFound = DISCOURSE_CONNECTORS.filter((c) => lowerText.includes(c));

  // Relevance score: at least 2 context keywords or descriptive terms
  // Photos also reward spatial descriptive words (background, foreground, appears, wearing, sitting, standing, working)
  const spatialMarkers = ['depicts', 'shows', 'foreground', 'background', 'appears', 'wearing', 'collaborating', 'analyzing', 'working', 'standing', 'sitting', 'holding'];
  const spatialMatches = spatialMarkers.filter((s) => lowerText.includes(s));

  const semanticHits = matchedKeywords.length + spatialMatches.length;
  const relevanceScore = Math.min(1.0, Math.max(0.3, semanticHits / 3.0));

  // Word count score: DET recommends 25-45 words for 60 seconds
  let volumeScore = 0.4;
  if (wordCount >= 25 && wordCount <= 55) {
    volumeScore = 1.0;
  } else if (wordCount > 55) {
    volumeScore = 0.95; // very high, check for run-ons
  } else if (wordCount >= 15) {
    volumeScore = 0.75;
  } else if (wordCount >= 8) {
    volumeScore = 0.5;
  }

  // Lexical diversity score (penalize excessive repetitions)
  const diversityScore = Math.min(1.0, Math.max(0.4, ttr * 1.2));

  // Weighted overall rubric score [0.0 .. 1.0]
  const finalScore = volumeScore * 0.4 + relevanceScore * 0.4 + diversityScore * 0.2;

  const recommendations: string[] = [];
  if (wordCount < 25) {
    recommendations.push('Увеличьте объем описания до 25–45 слов, добавляя детали переднего и заднего плана.');
  }
  if (semanticHits < 2) {
    recommendations.push('Используйте больше конкретных предметных существительных и глаголов действия, соответствующих изображению.');
  }
  if (ttr < 0.65 && wordCount > 20) {
    recommendations.push('Избегайте повторения одних и тех же слов; используйте синонимы.');
  }

  return {
    score: Math.min(1.0, Math.max(0.1, finalScore)),
    wordCount,
    uniqueWordsCount: uniqueWords.size,
    lexicalDiversityRatio: Math.round(ttr * 100) / 100,
    academicWordsUsed: uniqueAcademic,
    connectorsUsed: connectorsFound,
    relevanceKeywordsFound: matchedKeywords,
    relevanceScore: Math.round(relevanceScore * 100) / 100,
    recommendations,
  };
}

/**
 * Evaluates Essay / Interactive Writing / Writing Sample response
 */
export function evaluateEssayWriting(
  userText: string,
  minWordTarget: number,
  promptTopicKeywords: string[] = []
): TextRubricFeedback {
  const words = tokenizeWords(userText);
  const wordCount = words.length;
  const uniqueWords = new Set(words);
  const ttr = wordCount > 0 ? uniqueWords.size / wordCount : 0;

  // Academic words and connectors
  const academicFound = words.filter((w) => ACADEMIC_VOCABULARY.includes(w));
  const uniqueAcademic = Array.from(new Set(academicFound));

  const lowerText = userText.toLowerCase();
  const connectorsFound = DISCOURSE_CONNECTORS.filter((c) => lowerText.includes(c));

  // Keyword relevance
  const matchedKeywords: string[] = [];
  promptTopicKeywords.forEach((kw) => {
    const kLower = kw.toLowerCase();
    if (words.some((w) => w.includes(kLower) || kLower.includes(w))) {
      if (!matchedKeywords.includes(kLower)) {
        matchedKeywords.push(kLower);
      }
    }
  });

  // Relevance factor
  const relevanceScore = promptTopicKeywords.length > 0
    ? Math.min(1.0, Math.max(0.4, (matchedKeywords.length / Math.min(promptTopicKeywords.length, 3)) + 0.3))
    : 0.9;

  // Volume factor
  const volumeRatio = Math.min(1.2, wordCount / Math.max(1, minWordTarget));
  const volumeScore = Math.min(1.0, Math.max(0.3, volumeRatio));

  // Diversity & complexity factor
  const diversityScore = Math.min(1.0, Math.max(0.4, ttr * 1.3));
  const structureBonus = Math.min(0.2, connectorsFound.length * 0.05 + uniqueAcademic.length * 0.04);

  const finalScore = Math.min(1.0, volumeScore * 0.45 + relevanceScore * 0.25 + diversityScore * 0.2 + structureBonus);

  const recommendations: string[] = [];
  if (wordCount < minWordTarget) {
    recommendations.push(`Стремитесь достичь целевого порога в ${minWordTarget}+ слов (текущий: ${wordCount}).`);
  }
  if (connectorsFound.length < 2) {
    recommendations.push('Используйте переходные фразы (Furthermore, In addition, Consequently) для связности текста.');
  }
  if (uniqueAcademic.length < 2) {
    recommendations.push('Обогатите эссе академической лексикой B2/C1 (например, crucial, perspective, allocate).');
  }

  return {
    score: Math.min(1.0, Math.max(0.1, finalScore)),
    wordCount,
    uniqueWordsCount: uniqueWords.size,
    lexicalDiversityRatio: Math.round(ttr * 100) / 100,
    academicWordsUsed: uniqueAcademic,
    connectorsUsed: connectorsFound,
    relevanceKeywordsFound: matchedKeywords,
    relevanceScore: Math.round(relevanceScore * 100) / 100,
    recommendations,
  };
}
