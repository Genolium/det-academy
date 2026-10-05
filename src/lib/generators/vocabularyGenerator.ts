export interface VocabularyItem {
  word: string;
  isReal: boolean;
  difficulty: 'A2' | 'B1' | 'B2' | 'C1';
  definition: string;
}

export interface GeneratedFillInBlank {
  id: string;
  sentenceBefore: string;
  givenPrefix: string;
  missingLetters: string;
  sentenceAfter: string;
  fullWord: string;
  difficulty: 'A2' | 'B1' | 'B2' | 'C1';
  explanation: string;
}

// 1. Real Academic & C2 Vocabulary (from Level C2 Word List & VIP Vocabulary)
export const realWordsPool: VocabularyItem[] = [
  // Additional C1 & C2 authentic items from Level C2 Word List & VIP Vocabulary
  { word: 'accord', isReal: true, difficulty: 'C1', definition: 'Согласие, договор; of your own accord — по собственной воле.' },
  { word: 'adverse', isReal: true, difficulty: 'B2', definition: 'Неблагоприятный, враждебный (adverse weather conditions).' },
  { word: 'albeit', isReal: true, difficulty: 'C1', definition: 'Хотя и, тем не менее (albeit with some reluctance).' },
  { word: 'allocation', isReal: true, difficulty: 'B2', definition: 'Распределение ресурсов, ассигнование (resource allocation).' },
  { word: 'anonymous', isReal: true, difficulty: 'B1', definition: 'Анонимный, неназванный (anonymous donor).' },
  { word: 'assert', isReal: true, difficulty: 'B2', definition: 'Утверждать, заявлять позицию (assert authority/rights).' },
  { word: 'bias', isReal: true, difficulty: 'B2', definition: 'Предвзятость, систематическое искажение (cognitive bias).' },
  { word: 'conspiracy', isReal: true, difficulty: 'B2', definition: 'Заговор, тайный сговор (conspiracy theory).' },
  { word: 'convey', isReal: true, difficulty: 'B2', definition: 'Передавать мысль, смысл или сообщение (convey an idea).' },
  { word: 'denial', isReal: true, difficulty: 'B2', definition: 'Отрицание, отказ признать факт (in total denial).' },
  { word: 'dismissal', isReal: true, difficulty: 'B2', definition: 'Увольнение; отклонение иска или аргумента.' },
  { word: 'eccentric', isReal: true, difficulty: 'C1', definition: 'Эксцентричный, нестандартный в поведении.' },
  { word: 'formidable', isReal: true, difficulty: 'C1', definition: 'Грозный, внушительный, труднопреодолимый.' },
  { word: 'hazard', isReal: true, difficulty: 'B2', definition: 'Опасность, производственный или природный риск.' },
  { word: 'injustice', isReal: true, difficulty: 'B1', definition: 'Несправедливость, нарушение законных прав.' },
  { word: 'invoke', isReal: true, difficulty: 'C1', definition: 'Призывать, активировать закон, ссылаться на правило.' },
  { word: 'interim', isReal: true, difficulty: 'B2', definition: 'Промежуточный, временный (interim report).' },
  { word: 'paramount', isReal: true, difficulty: 'C1', definition: 'Первостепенный, имеющий высшее значение.' },
  { word: 'rigorous', isReal: true, difficulty: 'B2', definition: 'Строгий, неукоснительный, тщательный (rigorous research).' },
  { word: 'specimen', isReal: true, difficulty: 'B2', definition: 'Образец для научного исследования или анализа.' },
  { word: 'substantiate', isReal: true, difficulty: 'C1', definition: 'Обосновывать, подтверждать доказательствами.' },
  { word: 'unprecedented', isReal: true, difficulty: 'C1', definition: 'Беспрецедентный, не имеющий аналогов в истории.' },
  // B1
  { word: 'coherent', isReal: true, difficulty: 'B1', definition: 'Связный, логичный, последовательный (Logical and clear).' },
  { word: 'reinforce', isReal: true, difficulty: 'B1', definition: 'Укреплять, усиливать позицию/аргумент (Strengthen or support).' },
  { word: 'sustain', isReal: true, difficulty: 'B1', definition: 'Поддерживать, сохранять жизнедеятельность (Maintain or keep in existence).' },
  { word: 'widespread', isReal: true, difficulty: 'B1', definition: 'Широко распространенный (Found over a wide area).' },
  { word: 'consequently', isReal: true, difficulty: 'B1', definition: 'Следовательно, в результате этого (As a result; therefore).' },
  { word: 'adequate', isReal: true, difficulty: 'B1', definition: 'Достаточный, удовлетворительный (Satisfactory or acceptable).' },
  { word: 'perspective', isReal: true, difficulty: 'B1', definition: 'Точка зрения, ракурс понимания (Point of view; outlook).' },
  
  // B2
  { word: 'ambiguous', isReal: true, difficulty: 'B2', definition: 'Двусмысленный, неясный (Open to more than one interpretation).' },
  { word: 'facilitate', isReal: true, difficulty: 'B2', definition: 'Облегчать, содействовать процессу (Make easier; promote).' },
  { word: 'fluctuate', isReal: true, difficulty: 'B2', definition: 'Колебаться, меняться волнообразно (Rise and fall irregularly).' },
  { word: 'predominant', isReal: true, difficulty: 'B2', definition: 'Преобладающий, доминирующий (Present as strongest or main element).' },
  { word: 'qualitative', isReal: true, difficulty: 'B2', definition: 'Качественный (в отличие от количественного).' },
  { word: 'subsequent', isReal: true, difficulty: 'B2', definition: 'Последующий, идущий следом (Coming after something in time).' },
  { word: 'deteriorate', isReal: true, difficulty: 'B2', definition: 'Ухудшаться, приходить в упадок (Become progressively worse).' },
  { word: 'comprehensive', isReal: true, difficulty: 'B2', definition: 'Всеобъемлющий, комплексный, полный (Including all elements).' },
  { word: 'counterpart', isReal: true, difficulty: 'B2', definition: 'Коллега, аналог на той же должности/позиции.' },
  { word: 'preliminary', isReal: true, difficulty: 'B2', definition: 'Предварительный, подготовительный (Preceding main event).' },

  // C1
  { word: 'empirical', isReal: true, difficulty: 'C1', definition: 'Эмпирический, основанный на практическом опыте/фактах.' },
  { word: 'infrastructure', isReal: true, difficulty: 'C1', definition: 'Базовая инфраструктура государства или системы.' },
  { word: 'intrinsic', isReal: true, difficulty: 'C1', definition: 'Внутренне присущий, неотъемлемый (Belonging naturally).' },
  { word: 'paradigm', isReal: true, difficulty: 'C1', definition: 'Парадигма, фундаментальная модель или образец мышления.' },
  { word: 'ubiquitous', isReal: true, difficulty: 'C1', definition: 'Вездесущий, повсеместно встречающийся (Found everywhere).' },
  { word: 'dichotomy', isReal: true, difficulty: 'C1', definition: 'Дихотомия, резкое деление на две противоположные части.' },
  { word: 'ephemeral', isReal: true, difficulty: 'C1', definition: 'Эфемерный, недолговечный, мимолетный (Lasting a short time).' },
  { word: 'pragmatic', isReal: true, difficulty: 'C1', definition: 'Прагматичный, ориентированный на практический результат.' },
  { word: 'pervasive', isReal: true, difficulty: 'C1', definition: 'Проникающий во все сферы, распространяющийся повсюду.' },
  { word: 'lucrative', isReal: true, difficulty: 'C1', definition: 'Высокодоходный, прибыльный (Highly profitable).' },
  { word: 'juxtapose', isReal: true, difficulty: 'C1', definition: 'Сопоставлять, помещать рядом для контраста.' },
  { word: 'retrospective', isReal: true, difficulty: 'C1', definition: 'Ретроспективный, обращенный в прошлое.' },
];

// 2. DET Trap Pseudo-Words (Phonologically plausible fake English words with clear explanations)
export const fakeWordsPool: VocabularyItem[] = [
  { word: 'disflown', isReal: false, difficulty: 'B1', definition: 'Ловушка DET: Выглядит как причастие от fly с приставкой dis-, но такого слова нет в английском языке.' },
  { word: 'tweenful', isReal: false, difficulty: 'B1', definition: 'Ловушка DET: Слово tween существует в сленге, но суффикс -ful с ним не образует нормативного слова.' },
  { word: 'unfluent', isReal: false, difficulty: 'B1', definition: 'Ловушка DET: В английском говорят non-fluent или not fluent. Форма с приставкой un- ошибочна.' },
  { word: 'interclash', isReal: false, difficulty: 'B1', definition: 'Ловушка DET: Имитация сложения inter- + clash. В словарях отсутствует.' },
  { word: 'reclaimance', isReal: false, difficulty: 'B1', definition: 'Ловушка DET: От reclaim существительное — reclamation, а не reclaimance.' },
  { word: 'dramatical', isReal: false, difficulty: 'B2', definition: 'Ловушка DET: Нормативное прилагательное — dramatic. Суффикс -al здесь избыточен.' },
  { word: 'misclover', isReal: false, difficulty: 'B2', definition: 'Ловушка DET: Искусственно сконструированное псевдослово (mis + clover).' },
  { word: 'overmound', isReal: false, difficulty: 'B2', definition: 'Ловушка DET: Выглядит как сложный глагол, но в академическом английском не зафиксировано.' },
  { word: 'circumflect', isReal: false, difficulty: 'B2', definition: 'Ловушка DET: Смешение латинских корней circumflex и deflect. Псевдослово.' },
  { word: 'proferment', isReal: false, difficulty: 'B2', definition: 'Ловушка DET: Искаженное написание profferment / preferment.' },
  { word: 'transmital', isReal: false, difficulty: 'B2', definition: 'Ловушка DET: Правильное существительное от transmit — transmittal (с двойной t) или transmission.' },
  { word: 'reprehendive', isReal: false, difficulty: 'C1', definition: 'Ловушка DET: Существует reprehensible (достойный порицания), формы reprehendive не существует.' },
  { word: 'constratious', isReal: false, difficulty: 'C1', definition: 'Ловушка DET: Набор латинских корней (contra + fractious), не образующий реального слова.' },
  { word: 'proflactive', isReal: false, difficulty: 'C1', definition: 'Ловушка DET: Имитация медицинского термина (смесь prophylactic и active).' },
  { word: 'subvenient', isReal: false, difficulty: 'C1', definition: 'Ловушка DET: Устаревшая или вымышленная форма. Нормативное слово — subservient.' },
  { word: 'inexplorable', isReal: false, difficulty: 'C1', definition: 'Ловушка DET: В английском используется unexplored или unexplorable. Приставка in- ошибочна.' },
  { word: 'polygraphous', isReal: false, difficulty: 'C1', definition: 'Ловушка DET: Несуществующее прилагательное от polygraph.' },
  { word: 'obsolescite', isReal: false, difficulty: 'C1', definition: 'Ловушка DET: Искажение термина obsolescent (устаревающий).' },
];

// Sentences for dynamic Fill-in-the-Blanks generator
const fillInBlanksCorpus = [
  {
    before: 'The research committee ',
    word: 'concluded',
    prefix: 'con',
    after: ' that renewable subsidies significantly accelerate adoption rates.',
    difficulty: 'B2' as const,
    explanation: 'Глагол conclude в Past Simple (concluded): сделать вывод на основе данных исследования.',
  },
  {
    before: 'Higher education institutions must ',
    word: 'adapt',
    prefix: 'ad',
    after: ' to rapid technological disruptions in virtual classrooms.',
    difficulty: 'B1' as const,
    explanation: 'Глагол adapt (адаптироваться к изменениям): модальный глагол must требует инфинитива.',
  },
  {
    before: 'Severe economic inflation may ',
    word: 'undermine',
    prefix: 'un',
    after: ' public investments in healthcare infrastructure.',
    difficulty: 'C1' as const,
    explanation: 'Академический глагол undermine (подрывать, ослаблять стабильность).',
  },
  {
    before: 'Engineering students are encouraged to ',
    word: 'collaborate',
    prefix: 'co',
    after: ' on multidisciplinary laboratory assignments.',
    difficulty: 'B2' as const,
    explanation: 'Глагол collaborate (сотрудничать в команде): конструкция be encouraged to + инфинитив.',
  },
  {
    before: 'The atmospheric chemist noted that humidity levels ',
    word: 'fluctuate',
    prefix: 'flu',
    after: ' unpredictably during monsoonal transitions.',
    difficulty: 'B2' as const,
    explanation: 'Глагол fluctuate (колебаться): описывает нестабильное изменение числовых параметров.',
  },
  {
    before: 'Smartphones have become an ',
    word: 'ubiquitous',
    prefix: 'ubi',
    after: ' element of contemporary urban lifestyle and communications.',
    difficulty: 'C1' as const,
    explanation: 'Прилагательное ubiquitous (вездесущий): артикль an перед гласным звуком указывает на это слово.',
  },
  {
    before: 'The government formulated a ',
    word: 'comprehensive',
    prefix: 'comp',
    after: ' framework to protect endangered maritime wildlife.',
    difficulty: 'B2' as const,
    explanation: 'Прилагательное comprehensive (всеобъемлющий, комплексный план действий).',
  },
  {
    before: 'Empirical data provides an ',
    word: 'indispensable',
    prefix: 'indi',
    after: ' foundation for rigorous academic research and verification.',
    difficulty: 'C1' as const,
    explanation: 'Прилагательное indispensable (незаменимый, жизненно необходимый): C1 синоним к important.',
  },
  {
    before: 'Public transit subsidies will ',
    word: 'facilitate',
    prefix: 'fac',
    after: ' easier access to downtown employment centers for citizens.',
    difficulty: 'B2' as const,
    explanation: 'Глагол facilitate (облегчать доступ): модальный will + начальная форма глагола.',
  },
];

/**
 * Generate a randomized Read & Select quiz batch of specified size
 * with balanced real and fake words
 */
export function generateReadSelectBatch(count: number = 8, difficulty?: 'A2' | 'B1' | 'B2' | 'C1'): VocabularyItem[] {
  let reals = realWordsPool;
  let fakes = fakeWordsPool;

  if (difficulty) {
    const rFiltered = realWordsPool.filter((w) => w.difficulty === difficulty);
    const fFiltered = fakeWordsPool.filter((w) => w.difficulty === difficulty);
    if (rFiltered.length >= 4) reals = rFiltered;
    if (fFiltered.length >= 4) fakes = fFiltered;
  }

  // Shuffle both
  const shuffledReals = [...reals].sort(() => Math.random() - 0.5);
  const shuffledFakes = [...fakes].sort(() => Math.random() - 0.5);

  const realCount = Math.floor(count / 2);
  const fakeCount = count - realCount;

  const selected = [
    ...shuffledReals.slice(0, realCount),
    ...shuffledFakes.slice(0, fakeCount),
  ];

  return selected.sort(() => Math.random() - 0.5);
}

/**
 * Generate a randomized Fill in the Blanks task
 */
export function generateRandomFillInBlank(preferredDifficulty?: 'A2' | 'B1' | 'B2' | 'C1'): GeneratedFillInBlank {
  let pool = fillInBlanksCorpus;
  if (preferredDifficulty) {
    const filtered = fillInBlanksCorpus.filter((item) => item.difficulty === preferredDifficulty);
    if (filtered.length > 0) pool = filtered;
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const missingLetters = chosen.word.substring(chosen.prefix.length);

  return {
    id: 'fib-' + Math.random().toString(36).substring(2, 9),
    sentenceBefore: chosen.before,
    givenPrefix: chosen.prefix,
    missingLetters,
    sentenceAfter: chosen.after,
    fullWord: chosen.word,
    difficulty: chosen.difficulty,
    explanation: chosen.explanation,
  };
}
