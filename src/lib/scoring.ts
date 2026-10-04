/**
 * Calculates Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];
  const aLen = a.length;
  const bLen = b.length;

  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;

  for (let i = 0; i <= bLen; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= aLen; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= bLen; i++) {
    for (let j = 1; j <= aLen; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[bLen][aLen];
}

/**
 * Normalizes similarity score between 0.0 and 1.0 based on Levenshtein distance
 */
export function stringSimilarity(source: string, target: string): number {
  const s = source.trim();
  const t = target.trim();
  const maxLen = Math.max(s.length, t.length);
  if (maxLen === 0) return 1.0;
  const dist = levenshteinDistance(s, t);
  return Math.max(0, (maxLen - dist) / maxLen);
}

/**
 * Rounds score to nearest multiple of 5, constrained between 10 and 160
 */
export function roundToDetScale(score: number): number {
  const clamped = Math.max(10, Math.min(160, score));
  return Math.round(clamped / 5) * 5;
}

export interface CalculatedScores {
  overall: number;
  literacy: number;
  comprehension: number;
  production: number;
  conversation: number;
}

/**
 * Calculates DET 10-160 score and subscores based on test performance components
 */
export function computeFinalScores(params: {
  readSelectAccuracy: number;     // 0.0 - 1.0
  fillBlanksAccuracy: number;     // 0.0 - 1.0
  cTestAccuracy: number;          // 0.0 - 1.0
  listenTypeAccuracy: number;     // 0.0 - 1.0
  interactiveReadingScore: number;// 0.0 - 1.0
  interactiveListeningScore: number; // 0.0 - 1.0
  writingScore: number;           // 0.0 - 1.0
}): CalculatedScores {
  // Base raw calculations mapped to 10..160 range:
  // Baseline starts at ~30 for attempting, scales to 160 for perfection.
  const toScale = (ratio: number) => 30 + ratio * 130;

  // Literacy = Reading + Writing (Read & Select, C-Test, Interactive Reading, Writing)
  const literacyRatio =
    params.readSelectAccuracy * 0.25 +
    params.cTestAccuracy * 0.25 +
    params.interactiveReadingScore * 0.25 +
    params.writingScore * 0.25;

  // Comprehension = Reading + Listening (Read & Select, Fill in Blanks, Interactive Reading, Listen & Type, Interactive Listening)
  const compRatio =
    params.readSelectAccuracy * 0.2 +
    params.fillBlanksAccuracy * 0.2 +
    params.interactiveReadingScore * 0.2 +
    params.listenTypeAccuracy * 0.2 +
    params.interactiveListeningScore * 0.2;

  // Production = Writing + Speaking (In MVP non-speaking: Write about photo, Interactive Writing, Writing Sample, Summary)
  const prodRatio =
    params.writingScore * 0.7 +
    params.cTestAccuracy * 0.15 +
    params.fillBlanksAccuracy * 0.15;

  // Conversation = Listening + Speaking (In MVP non-speaking: Listen & Type, Interactive Listening dialog)
  const convRatio =
    params.listenTypeAccuracy * 0.5 +
    params.interactiveListeningScore * 0.5;

  const literacy = roundToDetScale(toScale(literacyRatio));
  const comprehension = roundToDetScale(toScale(compRatio));
  const production = roundToDetScale(toScale(prodRatio));
  const conversation = roundToDetScale(toScale(convRatio));

  const average = (literacy + comprehension + production + conversation) / 4;
  const overall = roundToDetScale(average);

  return {
    overall,
    literacy,
    comprehension,
    production,
    conversation,
  };
}
