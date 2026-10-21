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

export interface CalculatedScores {
  overall: number;
  reading?: number;
  listening?: number;
  writing?: number;
  speaking?: number;
  literacy: number;
  comprehension: number;
  production: number;
  conversation: number;
  /** 0..1 share of the four individual skills that were actually measured. */
  completeness?: number;
  confidence?: 'low' | 'medium' | 'high' | string;
  rangeLow?: number;
  rangeHigh?: number;
  /** Skill names that had no server-verified responses. */
  notMeasured?: string[];
  answeredQuestions?: number;
}
