import type { Locale } from '@/lib/translations';

export const vocabularyCopy: Record<Locale, {
  badge: string;
  title: string;
  subtitle: string;
  search: string;
  tabs: { dictionary: string; readSelect: string; fillBlanks: string };
  levels: { all: string; a2: string; b1: string; b2: string; c1: string; c2: string };
  sourceLabel: string;
  sources: { all: string; awl: string; course: string; b1: string };
  b1Hint: string;
  emptyTitle: string;
  emptyHint: string;
  error: string;
  showMore: string;
  loadingMore: string;
  shown: (visible: number, total: number) => string;
  readSelectNote: (count: number) => string;
  fillBlanksNote: (count: number) => string;
  srs: string;
  drills: string;
  howToLearn: string;
}> = {
  ru: {
    badge: 'Открытый словарь',
    title: 'Словарь DET Academy',
    subtitle: 'Перевод, определение, транскрипция, пример и озвучка. Слова отсортированы по алфавиту, фильтруются по уровню и источнику.',
    search: 'Найти слово, перевод или определение…',
    tabs: { dictionary: 'Словарь', readSelect: 'Read & Select', fillBlanks: 'Fill in the Blanks' },
    levels: { all: 'Все уровни', a2: 'A2', b1: 'B1', b2: 'B2', c1: 'C1', c2: 'C2' },
    sourceLabel: 'Источник:',
    sources: { all: 'Все', awl: 'Academic Word List', course: 'Слова из программы', b1: 'B1 core' },
    b1Hint: 'В Academic Word List нет слов уровня B1: это академический список C1–C2. B1-лексика собрана в «B1 core».',
    emptyTitle: 'По запросу ничего не найдено.',
    emptyHint: 'Попробуйте другой уровень или источник: например, «B1 core» или «Все».',
    error: 'Не удалось загрузить словарь',
    showMore: 'Показать ещё',
    loadingMore: 'Загружаем…',
    shown: (visible, total) => `Показано ${visible} из ${total}`,
    readSelectNote: (count) => `${count} слов и псевдослов из тренажёра Read & Select. Слушайте произношение перед ответом.`,
    fillBlanksNote: (count) => `${count} слов из Fill in the Blanks: контекст, пропуск и озвучка.`,
    srs: 'Тренировать в SRS',
    drills: 'Открыть тренажёры',
    howToLearn: 'Как учить слова',
  },
  en: {
    badge: 'Open dictionary',
    title: 'DET Academy dictionary',
    subtitle: 'Translation, definition, IPA, example and audio. Words are sorted alphabetically and filtered by level and source.',
    search: 'Search a word, meaning or definition…',
    tabs: { dictionary: 'Dictionary', readSelect: 'Read & Select', fillBlanks: 'Fill in the Blanks' },
    levels: { all: 'All levels', a2: 'A2', b1: 'B1', b2: 'B2', c1: 'C1', c2: 'C2' },
    sourceLabel: 'Source:',
    sources: { all: 'All', awl: 'Academic Word List', course: 'Course vocabulary', b1: 'B1 core' },
    b1Hint: 'The Academic Word List has no B1 entries: it is a C1–C2 list. B1 vocabulary lives in the B1 core source.',
    emptyTitle: 'Nothing matched this search.',
    emptyHint: 'Try another level or source, for example B1 core or All.',
    error: 'Could not load the dictionary',
    showMore: 'Show more',
    loadingMore: 'Loading…',
    shown: (visible, total) => `Showing ${visible} of ${total}`,
    readSelectNote: (count) => `${count} words and pseudowords from the Read and Select drill. Listen before you answer.`,
    fillBlanksNote: (count) => `${count} words from Fill in the Blanks with context and audio.`,
    srs: 'Practise in SRS',
    drills: 'Open the drills',
    howToLearn: 'How to learn words',
  },
};
