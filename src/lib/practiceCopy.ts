import type { Locale } from '@/lib/translations';

type CategoryCopy = { title: string; description: string; actionText: string };

export const practiceCopy: Record<
  Locale,
  {
    categories: Record<
      'typing' | 'c-test' | 'read-select' | 'fill-blanks' | 'dictation' | 'flashcards' | 'speak-photo' | 'speaking-sample' | 'writing-inspector' | 'photo-writing' | 'error-bank',
      CategoryCopy
    >;
    strictNote: string;
    activeDrill: string;
    closeDrill: string;
    essayField: string;
    draftPlaceholder: string;
    timeUp: string;
    paceNote: string;
    reset: string;
    noErrors: string;
    toReview: string;
  }
> = {
  ru: {
    categories: {
      typing: {
        title: 'DET Typing Trainer (Скоропечатание)',
        description: 'Тренажер скоропечатания вслепую на английском с академическим словарем DET.',
        actionText: 'Открыть тренажер печати',
      },
      'c-test': {
        title: 'Read and Complete (C-Test)',
        description: 'Интерактивное восстановление текста: допишите недостающие буквы в словах, опираясь на контекст.',
        actionText: 'Тренировать C-Test онлайн',
      },
      'read-select': {
        title: 'Словарный блиц (Read and Select)',
        description: 'Распознавание реальных академических C2 слов и выявление коварных псевдослов (трапов DET).',
        actionText: 'Тренировать Read & Select',
      },
      'fill-blanks': {
        title: 'Fill in the Blanks Sprint',
        description: 'Контекстная вставка пропущенных частей слов. Только американский спеллинг и грамматика.',
        actionText: 'Тренировать Fill in Blanks',
      },
      dictation: {
        title: 'Аудио-диктанты (Listen and Type)',
        description: 'Восприятие связной речи с американским акцентом. Правило 3 воспроизведений и пунктуация.',
        actionText: 'Тренировать диктанты',
      },
      flashcards: {
        title: 'Академический словарь (SRS Flashcards)',
        description: 'Карточки 500+ слов Academic Word List с алгоритмом интервального повторения SuperMemo SM-2, озвучкой и коллокациями.',
        actionText: 'Учить слова C1/C2',
      },
      'speak-photo': {
        title: 'AI Speaking Studio (Speak About Photo)',
        description: 'Живая осциллограмма голоса, замер WPM, распознавание речевых пауз и анализ лексики C1/C2 при описании фото за 90 секунд.',
        actionText: 'Запустить Speaking Studio',
      },
      'speaking-sample': {
        title: 'Speaking Sample (Академический монолог)',
        description: 'Устный видеомонолог 1–3 минуты на дискуссионную тему с live спектрограммой, таймером подготовки и скорингом беглости.',
        actionText: 'Тренировать устный монолог',
      },
      'writing-inspector': {
        title: 'AI Writing Diagnostic Inspector',
        description: 'Интерактивная подсветка CEFR уровней (A1–C2), экспресс-замена слабых слов на C1/C2 (Vocab Upgrades) и OREO чек-лист.',
        actionText: 'Открыть Writing Inspector',
      },
      'photo-writing': {
        title: 'Writing Lab & Photo Studio',
        description: 'Отработка 4-шаговой формулы описания фото и академических эссе с проверкой C1/C2 лексики.',
        actionText: 'Тренировать письмо',
      },
      'error-bank': {
        title: 'Smart Error Bank (Банк ошибок)',
        description: 'Автоматический сбор всех ваших ошибок из C-Test, Dictations, Fill Blanks и Read & Select. Отрабатывайте слабые места в изолированном режиме.',
        actionText: 'Открыть банк ошибок',
      },
    },
    strictNote: 'Строгий режим добавляет общий таймер на 10 минут. Экзаменационный тест всегда использует серверный дедлайн.',
    activeDrill: 'Активный тренажер',
    closeDrill: 'Закрыть тренажер',
    essayField: 'Интерактивное поле ввода эссе',
    draftPlaceholder: 'Напишите свой черновик здесь: инспектор не подставляет готовое эссе.',
    timeUp: 'Время вышло. В реальном экзамене ответы после дедлайна не принимаются.',
    paceNote: 'Работайте в темпе экзамена. Таймер общий для этой тренировочной сессии.',
    reset: 'Сбросить',
    noErrors: 'Ошибок: 0',
    toReview: 'на повтор',
  },
  en: {
    categories: {
      typing: {
        title: 'DET Typing Trainer',
        description: 'Touch typing practice in English with the academic vocabulary used in DET tasks.',
        actionText: 'Open the typing trainer',
      },
      'c-test': {
        title: 'Read and Complete (C-Test)',
        description: 'Restore the missing letters in a passage from context.',
        actionText: 'Practise the C-Test',
      },
      'read-select': {
        title: 'Read and Select',
        description: 'Spot real academic words among convincing pseudowords.',
        actionText: 'Practise Read and Select',
      },
      'fill-blanks': {
        title: 'Fill in the Blanks',
        description: 'Complete missing word parts in context with US spelling and grammar.',
        actionText: 'Practise Fill in the Blanks',
      },
      dictation: {
        title: 'Listen and Type',
        description: 'Connected speech with an American accent, three playbacks and punctuation.',
        actionText: 'Practise dictations',
      },
      flashcards: {
        title: 'Academic vocabulary (SRS)',
        description: '500+ Academic Word List cards with SuperMemo SM-2 spacing, audio and collocations.',
        actionText: 'Study C1/C2 words',
      },
      'speak-photo': {
        title: 'Speaking Studio (Speak About Photo)',
        description: 'Live waveform, WPM, pause detection and C1/C2 vocabulary analysis for a 90-second photo description.',
        actionText: 'Open Speaking Studio',
      },
      'speaking-sample': {
        title: 'Speaking Sample',
        description: 'A 1–3 minute academic monologue with a live spectrogram, preparation timer and fluency scoring.',
        actionText: 'Practise a monologue',
      },
      'writing-inspector': {
        title: 'Writing Diagnostic Inspector',
        description: 'CEFR highlighting (A1–C2), C1/C2 vocabulary upgrades and an OREO checklist.',
        actionText: 'Open Writing Inspector',
      },
      'photo-writing': {
        title: 'Writing Lab and Photo Studio',
        description: 'Four-step photo description and academic essay practice with C1/C2 vocabulary checks.',
        actionText: 'Practise writing',
      },
      'error-bank': {
        title: 'Smart Error Bank',
        description: 'Every mistake from C-Test, dictations, Fill in the Blanks and Read and Select in one focused drill.',
        actionText: 'Open the error bank',
      },
    },
    strictNote: 'Strict mode adds a 10-minute overall timer. The exam simulator always uses the server deadline.',
    activeDrill: 'Active drill',
    closeDrill: 'Close drill',
    essayField: 'Essay draft',
    draftPlaceholder: 'Write your draft here: the inspector does not seed a model essay.',
    timeUp: 'Time is up. In the real exam, answers after the deadline are not accepted.',
    paceNote: 'Work at exam pace. This practice session has one overall timer.',
    reset: 'Reset',
    noErrors: 'No errors',
    toReview: 'to review',
  },
};
