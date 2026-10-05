export interface DictationItem {
  id: string;
  sentence: string;
  difficulty: 'A2' | 'B1' | 'B2' | 'C1';
  topic: string;
  translationRu: string;
}

export interface WordDiffResult {
  expected: string;
  user: string;
  status: 'correct' | 'wrong' | 'missing' | 'extra';
}

// Corpus from Dictation Tips & Difficult Dictation 20 Tests
export const dictationCorpus: DictationItem[] = [
  {
    id: 'dict-auth-1',
    sentence: 'There are thousands of robots doing a wide variety of tasks in hospitals.',
    difficulty: 'B1',
    topic: 'Healthcare Robotics',
    translationRu: 'В медицинских учреждениях тысячи автоматизированных роботов выполняют широкий спектр задач.',
  },
  {
    id: 'dict-auth-2',
    sentence: 'Educational methods include teaching, storytelling, discussions, and research.',
    difficulty: 'B1',
    topic: 'Pedagogical Frameworks',
    translationRu: 'Образовательные методики охватывают прямое преподавание, повествование, дискуссии и исследовательскую деятельность.',
  },
  {
    id: 'dict-auth-3',
    sentence: 'Many large university institutions are now starting to offer free online courses.',
    difficulty: 'B1',
    topic: 'Higher Education Access',
    translationRu: 'Многие крупные университетские институты в настоящее время открывают доступ к бесплатным онлайн-курсам.',
  },
  {
    id: 'dict-auth-4',
    sentence: 'Cultural globalization refers to the transmission of ideas, meanings, and values around the world.',
    difficulty: 'B2',
    topic: 'Cultural Sociology',
    translationRu: 'Культурная глобализация означает трансграничную передачу идей, смыслов и фундаментальных ценностей.',
  },
  {
    id: 'dict-auth-5',
    sentence: 'Developments in technology and transportation infrastructure have made tourism more affordable.',
    difficulty: 'B2',
    topic: 'Infrastructure & Mobility',
    translationRu: 'Прогресс в технологиях и транспортной инфраструктуре сделал международный туризм существенно более доступным.',
  },
  {
    id: 'dict-auth-6',
    sentence: 'The internet has been instrumental in connecting people across geographical borders.',
    difficulty: 'B1',
    topic: 'Telecommunications',
    translationRu: 'Сеть Интернет послужила ключевым инструментом объединения людей через географические границы.',
  },
  {
    id: 'dict-auth-7',
    sentence: 'One reason you might consider studying abroad is for the chance to experience different styles of education.',
    difficulty: 'B2',
    topic: 'International Academics',
    translationRu: 'Одной из веских причин обучения за рубежом является возможность познакомиться с иными образовательными моделями.',
  },
  {
    id: 'dict-auth-8',
    sentence: 'I would have bought you a present if I had known it was your birthday.',
    difficulty: 'B1',
    topic: 'Grammar in Context',
    translationRu: 'Я непременно купил бы подарок, если бы заранее знал о твоем дне рождения.',
  },
  {
    id: 'dict-auth-9',
    sentence: 'Many people believe that schools should concentrate more on the child and less on the exam.',
    difficulty: 'B1',
    topic: 'Modern Education Policy',
    translationRu: 'Многие специалисты сходятся во мнении, что школе следует сосредоточиться на личности ученика, а не на экзаменах.',
  },
  {
    id: 'dict-auth-10',
    sentence: 'The mobile phone has made an enormous difference to the way we communicate.',
    difficulty: 'B1',
    topic: 'Digital Communication',
    translationRu: 'Мобильный телефон коренным образом преобразовал привычные форматы человеческой коммуникации.',
  },
  {
    id: 'dict-auth-11',
    sentence: 'Had I realized the severity of the situation, I would have informed the authorities immediately.',
    difficulty: 'C1',
    topic: 'Formal Inversion',
    translationRu: 'Если бы я в полной мере осознавал серьезность ситуации, я бы немедленно поставил в известность уполномоченные органы.',
  },
  {
    id: 'dict-auth-12',
    sentence: 'The primary energy source of tropical storms is warm ocean waters.',
    difficulty: 'B2',
    topic: 'Meteorology',
    translationRu: 'Главным источником термодинамической энергии тропических штормов служат прогретые океанические воды.',
  },
  {
    id: 'dict-auth-13',
    sentence: 'Once they had checked all my bags, I was allowed on the plane.',
    difficulty: 'B1',
    topic: 'Aviation Protocol',
    translationRu: 'После того как досмотр всех сумок завершился, мне разрешили пройти на посадку в самолет.',
  },
  {
    id: 'dict-auth-14',
    sentence: 'She became very sick because she had not been sleeping enough.',
    difficulty: 'B1',
    topic: 'Health & Physiology',
    translationRu: 'Ее самочувствие резко ухудшилось из-за систематического дефицита полноценного сна.',
  },
  {
    id: 'dict-auth-15',
    sentence: 'Scientific research on human emotions has increased significantly over the past two decades.',
    difficulty: 'B2',
    topic: 'Cognitive Science',
    translationRu: 'Объем научных публикаций по проблематике человеческих эмоций существенно вырос за последние двадцать лет.',
  },
  {
    id: 'dict-auth-16',
    sentence: 'After the evaluation, the government announced a radical review of its procedures.',
    difficulty: 'C1',
    topic: 'Public Policy',
    translationRu: 'По итогам экспертной оценки правительство анонсировало фундаментальный пересмотр установленных регламентов.',
  },
  {
    id: 'dict-auth-17',
    sentence: 'The company has decided to integrate the sales and marketing departments.',
    difficulty: 'B2',
    topic: 'Corporate Management',
    translationRu: 'Руководство предприятия приняло решение объединить подразделения сбыта и маркетинга.',
  },
  {
    id: 'dict-auth-18',
    sentence: 'The public sector is the part of the economy that provides basic government services.',
    difficulty: 'B2',
    topic: 'Macroeconomics',
    translationRu: 'Государственный сектор представляет собой сегмент экономики, обеспечивающий базовые общественные институты.',
  },
  {
    id: 'dict-auth-19',
    sentence: 'Obesity is connected to many different fatal diseases.',
    difficulty: 'B1',
    topic: 'Epidemiology',
    translationRu: 'Хроническое ожирение сопряжено с повышенным риском развития опасных для жизни патологий.',
  },
  {
    id: 'dict-auth-20',
    sentence: 'I do not think it is worth spending all that money on exploring the universe.',
    difficulty: 'B2',
    topic: 'Space Exploration Debate',
    translationRu: 'Я не считаю целесообразным направлять столь колоссальные бюджетные средства на освоение дальнего космоса.',
  },
  {
    id: 'dict-1',
    sentence: 'The professor reminded the students about the upcoming deadline for the research proposal.',
    difficulty: 'B2',
    topic: 'Academic Administration',
    translationRu: 'Профессор напомнил студентам о приближающемся дедлайне по исследовательскому проекту.',
  },
  {
    id: 'dict-2',
    sentence: 'Global temperatures continue to rise despite international climate agreements.',
    difficulty: 'B1',
    topic: 'Environment',
    translationRu: 'Среднемировая температура продолжает расти, несмотря на международные климатические соглашения.',
  },
  {
    id: 'dict-3',
    sentence: 'Careful linguistic analysis revealed significant differences between the two manuscripts.',
    difficulty: 'C1',
    topic: 'Humanities & Research',
    translationRu: 'Тщательный лингвистический анализ выявил существенные различия между двумя рукописями.',
  },
  {
    id: 'dict-4',
    sentence: 'Undergraduate scholarships will be awarded based on academic merit and community leadership.',
    difficulty: 'B2',
    topic: 'Education',
    translationRu: 'Стипендии бакалавриата будут присуждаться на основе академической успеваемости и лидерских качеств.',
  },
  {
    id: 'dict-5',
    sentence: 'Economic growth requires sustainable investment in public transportation and digital technology.',
    difficulty: 'B2',
    topic: 'Economics & Society',
    translationRu: 'Экономический рост требует устойчивых инвестиций в общественный транспорт и цифровые технологии.',
  },
  {
    id: 'dict-6',
    sentence: 'The archaeological excavation yielded artifacts dating back several thousand years.',
    difficulty: 'C1',
    topic: 'History & Archaeology',
    translationRu: 'Археологические раскопки принесли артефакты, датируемые несколькими тысячами лет назад.',
  },
  {
    id: 'dict-7',
    sentence: 'Many bird species migrate south before the harsh winter conditions arrive.',
    difficulty: 'B1',
    topic: 'Biology',
    translationRu: 'Многие виды птиц мигрируют на юг до наступления суровых зимних условий.',
  },
  {
    id: 'dict-8',
    sentence: 'The scientific symposium brought together leading specialists in quantum computational mechanics.',
    difficulty: 'C1',
    topic: 'Physics & STEM',
    translationRu: 'Научный симпозиум собрал ведущих специалистов по квантовой вычислительной механике.',
  },
  {
    id: 'dict-9',
    sentence: 'Students must submit their laboratory reports through the student portal before Friday afternoon.',
    difficulty: 'B1',
    topic: 'University Life',
    translationRu: 'Студенты обязаны загрузить свои лабораторные отчеты через студенческий портал до полудня пятницы.',
  },
  {
    id: 'dict-10',
    sentence: 'Renewable energy infrastructure continues to expand across developing and industrialized nations.',
    difficulty: 'B2',
    topic: 'Clean Tech',
    translationRu: 'Инфраструктура возобновляемой энергетики продолжает расширяться как в развивающихся, так и в индустриальных странах.',
  },
];

/**
 * Word-by-word diff calculation
 */
export function computeWordDiff(userInput: string, targetSentence: string): WordDiffResult[] {
  const cleanUserWords = userInput.trim().split(/\s+/).filter(Boolean);
  const targetWords = targetSentence.trim().split(/\s+/).filter(Boolean);

  const results: WordDiffResult[] = [];
  const maxLen = Math.max(cleanUserWords.length, targetWords.length);

  for (let i = 0; i < maxLen; i++) {
    const exp = targetWords[i] || '';
    const usr = cleanUserWords[i] || '';

    if (!usr) {
      results.push({ expected: exp, user: '', status: 'missing' });
    } else if (!exp) {
      results.push({ expected: '', user: usr, status: 'extra' });
    } else {
      const cleanExp = exp.replace(/[^a-zA-Z]/g, '').toLowerCase();
      const cleanUsr = usr.replace(/[^a-zA-Z]/g, '').toLowerCase();
      if (cleanExp === cleanUsr) {
        results.push({ expected: exp, user: usr, status: 'correct' });
      } else {
        results.push({ expected: exp, user: usr, status: 'wrong' });
      }
    }
  }

  return results;
}

/**
 * Levenshtein distance
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  const an = a ? a.length : 0;
  const bn = b ? b.length : 0;
  if (an === 0) return bn;
  if (bn === 0) return an;

  const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));

  for (let i = 0; i <= an; i++) matrix[0][i] = i;
  for (let j = 0; j <= bn; j++) matrix[j][0] = j;

  for (let j = 1; j <= bn; j++) {
    for (let i = 1; i <= an; i++) {
      if (b.charAt(j - 1) === a.charAt(i - 1)) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1
        );
      }
    }
  }

  return matrix[bn][an];
}

/**
 * Compute accuracy ratio and detailed word analysis
 */
export function evaluateDictationAccuracy(userInput: string, targetSentence: string): {
  similarity: number;
  isExact: boolean;
  capitalizationCorrect: boolean;
  punctuationCorrect: boolean;
  wordDiff: WordDiffResult[];
} {
  const cleanUser = userInput.trim();
  const cleanTarget = targetSentence.trim();

  if (!cleanUser) {
    return {
      similarity: 0,
      isExact: false,
      capitalizationCorrect: false,
      punctuationCorrect: false,
      wordDiff: computeWordDiff('', targetSentence),
    };
  }

  const dist = calculateLevenshteinDistance(cleanUser.toLowerCase(), cleanTarget.toLowerCase());
  const maxLen = Math.max(cleanUser.length, cleanTarget.length);
  const similarity = Math.max(0, 1 - dist / maxLen);

  const capitalizationCorrect = cleanUser.charAt(0) === cleanTarget.charAt(0);
  const targetPunct = cleanTarget.slice(-1);
  const userPunct = cleanUser.slice(-1);
  const punctuationCorrect = targetPunct === '.' || targetPunct === '?' ? userPunct === targetPunct : true;

  return {
    similarity,
    isExact: cleanUser === cleanTarget,
    capitalizationCorrect,
    punctuationCorrect,
    wordDiff: computeWordDiff(userInput, targetSentence),
  };
}

/**
 * Play audio in browser using Web Speech API synthesis with US English voice
 */
export function playSynthesizedDictation(text: string, rate: number = 0.9): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return reject(new Error('SpeechSynthesis not supported'));
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = rate;

    const voices = window.speechSynthesis.getVoices();
    const usVoice = voices.find((v) => v.lang.includes('en-US') || v.lang.includes('en_US'));
    if (usVoice) {
      utterance.voice = usVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Get random dictation task
 */
export function getRandomDictation(preferredDifficulty?: 'A2' | 'B1' | 'B2' | 'C1'): DictationItem {
  let pool = dictationCorpus;
  if (preferredDifficulty) {
    const filtered = dictationCorpus.filter((d) => d.difficulty === preferredDifficulty);
    if (filtered.length > 0) pool = filtered;
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
