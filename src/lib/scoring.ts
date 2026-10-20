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

/**
 * Maps latent trait θ [-3.0 .. +3.0] to official DET scale [10 .. 160] (step of 5)
 */
export function thetaToDetScore(theta: number): number {
  const raw = 105.0 + theta * 18.5;
  const clamped = Math.max(10.0, Math.min(160.0, raw));
  return Math.round(clamped / 5.0) * 5.0;
}

/**
 * Maps accuracy ratio [0.05 .. 0.95] to latent ability trait θ
 */
export function ratioToTheta(ratio: number): number {
  const clamped = Math.max(0.05, Math.min(0.95, ratio));
  return Math.log(clamped / (1.0 - clamped)) / 1.2;
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
}

/**
 * Calculates DET 10-160 score and subscores based on calibrated IRT scale,
 * aligning with the server engine.
 */
export function computeFinalScores(params: {
  readSelectAccuracy: number;     // 0.0 - 1.0
  fillBlanksAccuracy: number;     // 0.0 - 1.0
  cTestAccuracy: number;          // 0.0 - 1.0
  listenTypeAccuracy: number;     // 0.0 - 1.0
  interactiveReadingScore: number;// 0.0 - 1.0
  interactiveListeningScore: number; // 0.0 - 1.0
  writingScore: number;           // 0.0 - 1.0
  speakingScore?: number;         // 0.0 - 1.0
}): CalculatedScores {
  const readingRatio =
    (params.readSelectAccuracy +
      params.fillBlanksAccuracy +
      params.cTestAccuracy +
      params.interactiveReadingScore) /
    4.0;
  const listeningRatio =
    (params.listenTypeAccuracy + params.interactiveListeningScore) / 2.0;
  const writingRatio = params.writingScore;
  const speakingRatio = params.speakingScore ?? (listeningRatio + writingRatio) / 2.0;

  const reading = thetaToDetScore(ratioToTheta(readingRatio));
  const listening = thetaToDetScore(ratioToTheta(listeningRatio));
  const writing = thetaToDetScore(ratioToTheta(writingRatio));
  const speaking = thetaToDetScore(ratioToTheta(speakingRatio));

  const literacy = roundToDetScale((reading + writing) / 2.0);
  const comprehension = roundToDetScale((reading + listening) / 2.0);
  const production = roundToDetScale((writing + speaking) / 2.0);
  const conversation = roundToDetScale((listening + speaking) / 2.0);

  const average = (reading + listening + writing + speaking) / 4.0;
  const overall = roundToDetScale(average);

  return {
    overall,
    reading,
    listening,
    writing,
    speaking,
    literacy,
    comprehension,
    production,
    conversation,
  };
}
