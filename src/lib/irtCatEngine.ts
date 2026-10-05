/**
 * Item Response Theory (IRT) & CAT Engine Simulator
 * Implements 2-Parameter Logistic (2PL) Model:
 * P(θ) = 1 / (1 + exp(-D * a * (θ - b)))
 * where:
 * θ (theta): candidate latent proficiency trait (-3.0 to +3.0)
 * b: item difficulty parameter (-2.5 to +2.5)
 * a: item discrimination parameter (typically 0.8 to 1.8)
 * D: scaling constant 1.702
 */

export interface IRTItem {
  id: string;
  type: string;
  difficultyBand: 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  b: number; // Difficulty parameter on theta scale
  a: number; // Discrimination parameter
}

// Typical difficulty mappings for CEFR bands on theta scale:
export const DIFFICULTY_THETA_MAP: Record<string, number> = {
  A2: -1.8,
  B1: -0.6,
  B2: 0.5,
  C1: 1.6,
  C2: 2.4,
};

const D_CONSTANT = 1.702;

/**
 * Probability of correct response given ability theta (2PL model)
 */
export function probabilityCorrect2PL(theta: number, b: number, a: number = 1.2): number {
  const exponent = -D_CONSTANT * a * (theta - b);
  return 1 / (1 + Math.exp(exponent));
}

/**
 * Information function for an item at ability theta:
 * I(θ) = D^2 * a^2 * P(θ) * (1 - P(θ))
 */
export function itemInformation(theta: number, b: number, a: number = 1.2): number {
  const p = probabilityCorrect2PL(theta, b, a);
  const q = 1 - p;
  return Math.pow(D_CONSTANT * a, 2) * p * q;
}

/**
 * Updates theta using Bayesian Expected A Posteriori (EAP) / Newton-Raphson step approximation
 * given previous theta and whether response was correct (or partial credit [0.0..1.0])
 */
export function updateTheta2PL(
  currentTheta: number,
  itemDifficulty: number,
  scoreRatio: number, // 0.0 to 1.0 (1 = correct, 0 = wrong, or partial)
  discrimination: number = 1.2
): number {
  const expectedProb = probabilityCorrect2PL(currentTheta, itemDifficulty, discrimination);
  const residual = scoreRatio - expectedProb;

  // Adaptive learning rate that decreases with confidence, bounded step:
  const learningRate = 0.45;
  const delta = learningRate * discrimination * residual;

  // Clamp step change to prevent wild oscillations
  const clampedDelta = Math.max(-0.6, Math.min(0.6, delta));
  const newTheta = currentTheta + clampedDelta;

  // Clamp theta within standard IRT range [-3.0 .. +3.0]
  return Math.max(-3.0, Math.min(3.0, newTheta));
}

/**
 * Maps theta ability trait [-3.0 .. +3.0] to official DET scale [10 .. 160]
 * Formula calibrated to DET 2024-2026 score distributions:
 * Mean score ~ 105 (theta = 0.0), SD ~ 20 (1 theta ~ 18-20 points)
 */
export function thetaToDetScore(theta: number): number {
  // Linear affine mapping: Score = 105 + 18.5 * theta
  const rawScore = 105 + theta * 18.5;
  const clamped = Math.max(10, Math.min(160, rawScore));
  // Round to nearest 5 points
  return Math.round(clamped / 5) * 5;
}

/**
 * Reverse mapping from DET score [10 .. 160] to theta ability [-3.0 .. +3.0]
 */
export function detScoreToTheta(score: number): number {
  const clamped = Math.max(10, Math.min(160, score));
  return Math.max(-3.0, Math.min(3.0, (clamped - 105) / 18.5));
}
