import { readSelectBank } from '@/data/questionBank';

export type QuickPlacementQuestion = {
  id: string;
  word: string;
  isReal: boolean;
  level: 'B1' | 'B2' | 'C1';
};

const real = (level: 'B1' | 'B2' | 'C1') =>
  readSelectBank.filter((word) => word.isReal && word.difficulty === level);
const fake = (level: 'B1' | 'B2' | 'C1') =>
  readSelectBank.filter((word) => !word.isReal && word.difficulty === level);

const mix = [
  real('B1')[0], fake('B1')[0], real('B1')[1], real('B1')[2],
  fake('B2')[0], real('B2')[0], real('B2')[1], fake('B2')[1],
  real('C1')[0], fake('C1')[0], real('C1')[1], real('C1')[2],
];

/** Twelve Read & Select items: a 2-minute vocabulary-based level check. */
export const quickPlacementQuestions: QuickPlacementQuestion[] = mix.map((word, index) => ({
  id: `qp-${index + 1}`,
  word: word.word,
  isReal: word.isReal,
  level: word.difficulty as QuickPlacementQuestion['level'],
}));

export type QuickPlacementResult = {
  level: 'A2' | 'B1' | 'B2' | 'C1';
  correct: number;
  total: number;
  completedAt: string;
};

export function scoreQuickPlacement(answers: boolean[]): QuickPlacementResult {
  const correct = quickPlacementQuestions.reduce(
    (total, question, index) => (answers[index] === question.isReal ? total + 1 : total),
    0
  );
  const level: QuickPlacementResult['level'] =
    correct >= 10 ? 'C1' : correct >= 7 ? 'B2' : correct >= 4 ? 'B1' : 'A2';
  return {
    level,
    correct,
    total: quickPlacementQuestions.length,
    completedAt: new Date().toISOString().slice(0, 10),
  };
}

export const QUICK_PLACEMENT_STORAGE_KEY = 'det_onboarding_placement';
export const ONBOARDING_DONE_STORAGE_KEY = 'det_onboarding_done_v1';

export function readQuickPlacement(): QuickPlacementResult | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(QUICK_PLACEMENT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QuickPlacementResult) : null;
  } catch {
    return null;
  }
}
