export interface WritingPrompt {
  id: string;
  type: 'PHOTO' | 'INTERACTIVE' | 'WRITING_SAMPLE';
  prompt: string;
  imageUrl?: string;
  minWords: number;
  timeLimitSec: number;
  difficulty: 'B1' | 'B2' | 'C1';
  category: string;
  checklist: string[];
  modelAnswer: string;
}

export const writingPromptsCorpus: WritingPrompt[] = [
  // Additional authentic prompts from Writing 50 words, Tips & Argument, and Full Tests
  {
    id: 'wp-gen-auth-1',
    type: 'INTERACTIVE',
    prompt: 'In general, people are living significantly longer today than in previous generations. Discuss some of the social and economic implications of this phenomenon.',
    minWords: 80,
    timeLimitSec: 300,
    difficulty: 'B2',
    category: 'Demographics & Society',
    checklist: [
      'Clear thesis on both positive and negative implications',
      'Economic aspect: retirement age, pension sustainability, healthcare expenditure',
      'Social aspect: multi-generational knowledge transfer, active community roles',
      'Academic signposting: "Primarily", "Consequently", "On the other hand"',
    ],
    modelAnswer: 'Rising global life expectancy represents both a triumph of modern healthcare and a profound socioeconomic challenge. On one hand, an aging population places unprecedented fiscal strain on national pension systems and specialized geriatric healthcare infrastructure. Governments must continually adjust retirement thresholds to maintain economic productivity. On the other hand, experienced seniors provide invaluable institutional mentorship and volunteer support across educational and civic sectors. Therefore, societies must proactively adapt workplace structures to harness the potential of older citizens while ensuring equitable social support.',
  },
  {
    id: 'wp-gen-auth-2',
    type: 'WRITING_SAMPLE',
    prompt: 'Some educators advocate that all secondary school students should be required to study philosophy and critical thinking. Others contend that vocational and technical subjects should take precedence. Which viewpoint do you support, and why?',
    minWords: 100,
    timeLimitSec: 300,
    difficulty: 'C1',
    category: 'Philosophy & Curriculum Design',
    checklist: [
      'Balanced introduction with explicit personal thesis',
      'Argument 1: Critical thinking as a foundational filter against digital misinformation',
      'Argument 2: Complementarity between analytical thought and technical execution',
      'Refutation of counter-perspective and firm academic conclusion',
    ],
    modelAnswer: 'The debate surrounding curricular prioritization between abstract philosophical inquiry and applied technical training reflects differing visions of educational purpose. While vocational training undeniably equips students with direct market competencies, I firmly maintain that philosophy and critical thinking should remain mandatory components of secondary education. In our contemporary digital landscape, citizens are inundated with persuasive algorithmic media and unverified claims. Cultivating formal philosophical skepticism trains adolescents to identify cognitive fallacies, evaluate empirical evidence, and form reasoned moral judgments. Furthermore, advanced technical innovation itself relies heavily on ethical reasoning and creative problem-solving rather than rote technical execution. In conclusion, rather than treating practical skills and philosophical rigor as mutually exclusive, secondary schools must cultivate rigorous analytical minds capable of guiding technological progress responsibly.',
  },
  {
    id: 'wp-gen-auth-3',
    type: 'PHOTO',
    prompt: 'Write one or more sentences that describe the image.',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    minWords: 25,
    timeLimitSec: 60,
    difficulty: 'B2',
    category: 'Scientific Research',
    checklist: [
      'Central subject and action: "A researcher is calibrating..."',
      'Spatial details: "in the sterile laboratory setting..."',
      'Inference/hypothesis: "judging by the protective equipment, she appears to be conducting..."',
    ],
    modelAnswer: 'This photograph depicts a dedicated scientific technician operating sophisticated analytical hardware inside an advanced research facility. In the background, illuminated display panels and orderly chemical storage cabinets reinforce the clinical precision of the workspace. Judging by her meticulous handling of the diagnostic instruments, she appears to be conducting a high-precision microbiological assay.',
  },
  // 1. Photo prompts - Official DET format: "Write one or more sentences that describe the image."
  {
    id: 'wp-gen-1',
    type: 'PHOTO',
    prompt: 'Write one or more sentences that describe the image.',
    imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    minWords: 20,
    timeLimitSec: 60,
    difficulty: 'B2',
    category: 'Engineering & Construction',
    checklist: [
      'General summary: "This is a photo of..."',
      'Action in Present Continuous: "is examining..."',
      'Location prepositions: "in the background / foreground"',
      'Speculation: "he might be / must be..."',
    ],
    modelAnswer: 'This image portrays a civil engineer wearing a protective safety helmet and high-visibility vest on a construction site. He is holding architectural blueprints while surveying the building structure in front of him, suggesting that he is supervising ongoing structural renovations.',
  },
  {
    id: 'wp-gen-2',
    type: 'PHOTO',
    prompt: 'Write one or more sentences that describe the image.',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    minWords: 20,
    timeLimitSec: 60,
    difficulty: 'B1',
    category: 'University Life',
    checklist: [
      'Describe group interaction and facial expressions',
      'Use descriptive adjectives (collaborative, focused)',
      'Mention surroundings (bookshelves, laptops)',
    ],
    modelAnswer: 'A diverse group of university students is gathered around a wooden table in a contemporary library, collaborating closely on an academic project. They are smiling and looking at notes together, creating a friendly and productive study atmosphere.',
  },
  {
    id: 'wp-gen-3',
    type: 'PHOTO',
    prompt: 'Write one or more sentences that describe the image.',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    minWords: 20,
    timeLimitSec: 60,
    difficulty: 'B2',
    category: 'Scientific Research',
    checklist: [
      'Identify central objects: laboratory glassware, pipettes, chemical beakers',
      'Describe the environment: sterile scientific research bench',
      'Speculate on purpose: pharmaceutical trials or chemical experiments',
    ],
    modelAnswer: 'This photograph showcases specialized scientific glassware, including measuring beakers and precision pipettes arranged neatly on a clean laboratory workbench. The sterile lighting and clean setup suggest that chemical experiments or pharmaceutical tests are being prepared in this medical research facility.',
  },
  {
    id: 'wp-gen-4',
    type: 'PHOTO',
    prompt: 'Write one or more sentences that describe the image.',
    imageUrl: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    minWords: 20,
    timeLimitSec: 60,
    difficulty: 'B1',
    category: 'Urban Life & Hospitality',
    checklist: [
      'Describe setting: modern cozy coffee shop',
      'Actions: barista operating espresso machine',
      'Atmosphere: warm interior lighting and morning rush',
    ],
    modelAnswer: 'This image captures a barista carefully preparing artisanal coffee behind the wooden counter of a modern, well-lit cafe. The warm ambiance and neatly organized cups create an inviting atmosphere for morning customers.',
  },

  // 2. Interactive Writing & Samples
  {
    id: 'wp-gen-5',
    type: 'WRITING_SAMPLE',
    prompt: 'Many countries are investing heavily in public high-speed rail rather than expanding automotive highway networks. Discuss the ecological, urban, and economic ramifications of this transition. (Aim for 100+ words).',
    minWords: 100,
    timeLimitSec: 300,
    difficulty: 'B2',
    category: 'Infrastructure & Environment',
    checklist: [
      'Clear thesis statement in Introduction',
      'Paragraph 1: Environmental advantages (carbon emissions reduction)',
      'Paragraph 2: Economic and social accessibility',
      'Formal conclusion summarizing key points',
    ],
    modelAnswer: 'Investing in high-speed rail networks represents a transformative policy for sustainable urban development. Firstly, modern electric trains generate significantly fewer carbon emissions per passenger kilometer compared to private automobiles, directly mitigating climate degradation and urban smog. Furthermore, rail corridors alleviate chronic highway congestion while democratizing regional mobility for citizens who cannot afford private vehicles. In conclusion, expanding railway infrastructure stimulates sustainable economic vitality while protecting our natural environment.',
  },
  {
    id: 'wp-gen-6',
    type: 'WRITING_SAMPLE',
    prompt: 'Some educators advocate that remote artificial intelligence tutors will soon replace conventional classroom instruction. To what extent do you agree or disagree with this perspective? Provide specific reasons and examples. (Aim for 100+ words).',
    minWords: 100,
    timeLimitSec: 300,
    difficulty: 'C1',
    category: 'EdTech & Future of Work',
    checklist: [
      'State clear viewpoint (agree / disagree / nuanced)',
      'Highlight human mentor empathy vs AI scalability',
      'Use C1 transition words (Furthermore, Consequently, Conversely)',
    ],
    modelAnswer: 'While automated artificial intelligence platforms can deliver personalized drills and instant linguistic feedback, I firmly disagree that they will completely replace human educators. Teachers cultivate critical emotional intelligence, collaborative ethics, and empathetic mentorship that algorithmic software cannot emulate. Consequently, hybrid learning models that synthesize AI precision with human mentorship will prove substantially more advantageous for future generations.',
  },
];

// Vocabulary upgrade dictionary: simple word -> advanced C1/C2 replacement
export const vocabularyUpgrades: Record<string, string[]> = {
  important: ['crucial', 'vital', 'pivotal', 'indispensable', 'imperative'],
  bad: ['detrimental', 'adverse', 'deleterious', 'suboptimal'],
  good: ['beneficial', 'advantageous', 'favorable', 'meritorious'],
  think: ['believe', 'contend', 'posit', 'maintain', 'assert'],
  show: ['demonstrate', 'illustrate', 'exemplify', 'elucidate'],
  big: ['substantial', 'considerable', 'monumental', 'expansive'],
  help: ['facilitate', 'assist', 'foster', 'bolster'],
  change: ['transform', 'evolve', 'alter', 'fluctuate'],
  problem: ['dilemma', 'impediment', 'challenge', 'obstacle'],
};

/**
 * Checks whether text is likely gibberish (random key mash)
 */
function isGibberishText(text: string): boolean {
  const clean = text.trim();
  if (clean.length < 5) return false;

  if (/[;:,._]{2,}/.test(clean)) return true;
  if (/([bcdfghjklmnpqrstvwxyz]{6,})/i.test(clean)) return true;

  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;

  let vowelWords = 0;
  for (const w of words) {
    if (/[aeiouy]/i.test(w)) vowelWords++;
  }

  return vowelWords / words.length < 0.4;
}

/**
 * Scans student essay and finds suggestions for higher scoring C1/C2 replacements
 */
export function analyzeWritingVocabulary(text: string): {
  wordCount: number;
  suggestions: Array<{ word: string; upgrades: string[] }>;
  hasContractions: boolean;
  isGibberish: boolean;
  feedbackMessage?: string;
} {
  const clean = text.trim();
  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (isGibberishText(clean)) {
    return {
      wordCount,
      suggestions: [],
      hasContractions: false,
      isGibberish: true,
      feedbackMessage: 'Обнаружен случайный или бессмысленный ввод символов (keyboard mash). Напишите связный текст на английском языке для проверки.',
    };
  }

  const foundSuggestions: Array<{ word: string; upgrades: string[] }> = [];
  const lowerText = clean.toLowerCase();

  const contractionsPattern = /\b(can't|don't|won't|isn't|aren't|didn't|it's|they're|we're)\b/i;
  const hasContractions = contractionsPattern.test(clean);

  for (const [simpleWord, upgrades] of Object.entries(vocabularyUpgrades)) {
    const regex = new RegExp(`\\b${simpleWord}\\b`, 'i');
    if (regex.test(lowerText)) {
      foundSuggestions.push({ word: simpleWord, upgrades });
    }
  }

  return {
    wordCount,
    suggestions: foundSuggestions,
    hasContractions,
    isGibberish: false,
  };
}

/**
 * Get random writing prompt
 */
export function getRandomWritingPrompt(type?: 'PHOTO' | 'INTERACTIVE' | 'WRITING_SAMPLE'): WritingPrompt {
  let pool = writingPromptsCorpus;
  if (type) {
    pool = writingPromptsCorpus.filter((p) => p.type === type);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}
