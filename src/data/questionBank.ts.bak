export type DifficultyBand = 'A2' | 'B1' | 'B2' | 'C1';

export interface ReadSelectWord {
  word: string;
  isReal: boolean;
  difficulty: DifficultyBand;
}

export interface FillBlanksQuestion {
  id: string;
  sentenceBefore: string;
  givenPrefix: string;
  missingLetters: string; // The letters the user must type
  sentenceAfter: string;
  fullWord: string;
  difficulty: DifficultyBand;
}

export interface CTestQuestion {
  id: string;
  title: string;
  difficulty: DifficultyBand;
  firstSentence: string;
  damagedTokens: {
    prefix: string;
    missing: string;
    suffix?: string;
  }[];
  lastSentence: string;
}

export interface ListenTypeQuestion {
  id: string;
  audioSentence: string;
  difficulty: DifficultyBand;
}

export interface InteractiveReadingBlock {
  id: string;
  passageTitle: string;
  passageText: string;
  difficulty: DifficultyBand;
  // Step 1: Select missing words in sentences
  gapSentence: {
    before: string;
    options: string[];
    correct: string;
    after: string;
  };
  // Step 2: Complete the passage with sentence
  sentenceOptions: {
    options: string[];
    correctIndex: number;
  };
  // Step 3: Highlight answer
  highlightPrompt: string;
  highlightCorrectSubstring: string;
  // Step 4: Main Idea
  mainIdeaQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
  };
  // Step 5: Best Title
  titleQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

export interface InteractiveListeningBlock {
  id: string;
  scenario: string;
  difficulty: DifficultyBand;
  turns: {
    speaker: string;
    speakerAudioText: string;
    options: string[];
    correctIndex: number;
  }[];
  summaryPrompt: string;
}

export interface WritePhotoQuestion {
  id: string;
  imageUrl: string;
  altText: string;
  difficulty: DifficultyBand;
}

export interface InteractiveWritingQuestion {
  id: string;
  part1Prompt: string;
  part2Prompt: string;
  difficulty: DifficultyBand;
}

export interface WritingSampleQuestion {
  id: string;
  prompt: string;
  difficulty: DifficultyBand;
}

// BANK OF READ AND SELECT
export const readSelectBank: ReadSelectWord[] = [
  // Real words
  { word: 'ambiguous', isReal: true, difficulty: 'B2' },
  { word: 'coherent', isReal: true, difficulty: 'B1' },
  { word: 'consequent', isReal: true, difficulty: 'B2' },
  { word: 'empirical', isReal: true, difficulty: 'C1' },
  { word: 'facilitate', isReal: true, difficulty: 'B2' },
  { word: 'fluctuate', isReal: true, difficulty: 'B2' },
  { word: 'infrastructure', isReal: true, difficulty: 'C1' },
  { word: 'intrinsic', isReal: true, difficulty: 'C1' },
  { word: 'paradigm', isReal: true, difficulty: 'C1' },
  { word: 'predominant', isReal: true, difficulty: 'B2' },
  { word: 'qualitative', isReal: true, difficulty: 'B2' },
  { word: 'reinforce', isReal: true, difficulty: 'B1' },
  { word: 'subsequent', isReal: true, difficulty: 'B2' },
  { word: 'sustain', isReal: true, difficulty: 'B1' },
  { word: 'widespread', isReal: true, difficulty: 'B1' },
  // Pseudo-words (DET traps)
  { word: 'disflown', isReal: false, difficulty: 'B1' },
  { word: 'tweenful', isReal: false, difficulty: 'B1' },
  { word: 'dramatical', isReal: false, difficulty: 'B2' },
  { word: 'misclover', isReal: false, difficulty: 'B2' },
  { word: 'overmound', isReal: false, difficulty: 'B2' },
  { word: 'reprehendive', isReal: false, difficulty: 'C1' },
  { word: 'unfluent', isReal: false, difficulty: 'B1' },
  { word: 'constratious', isReal: false, difficulty: 'C1' },
  { word: 'proflactive', isReal: false, difficulty: 'C1' },
  { word: 'circumflect', isReal: false, difficulty: 'B2' },
  { word: 'subvenient', isReal: false, difficulty: 'C1' },
  { word: 'interclash', isReal: false, difficulty: 'B1' },
];

// BANK OF FILL IN THE BLANKS
export const fillBlanksBank: FillBlanksQuestion[] = [
  {
    id: 'fb-1',
    sentenceBefore: 'The lead researcher ',
    givenPrefix: 'con',
    missingLetters: 'cluded',
    sentenceAfter: ' that previous hypotheses had overlooked critical environmental factors.',
    fullWord: 'concluded',
    difficulty: 'B2',
  },
  {
    id: 'fb-2',
    sentenceBefore: 'Higher education institutions must ',
    givenPrefix: 'ad',
    missingLetters: 'apt',
    sentenceAfter: ' to rapid technological changes in distance learning.',
    fullWord: 'adapt',
    difficulty: 'B1',
  },
  {
    id: 'fb-3',
    sentenceBefore: 'Economic instability can severely ',
    givenPrefix: 'un',
    missingLetters: 'dermine',
    sentenceAfter: ' social welfare programs in developing nations.',
    fullWord: 'undermine',
    difficulty: 'C1',
  },
  {
    id: 'fb-4',
    sentenceBefore: 'Students are encouraged to ',
    givenPrefix: 'co',
    missingLetters: 'llaborate',
    sentenceAfter: ' on their final engineering capstone projects.',
    fullWord: 'collaborate',
    difficulty: 'B2',
  },
];

// BANK OF READ AND COMPLETE (C-TEST)
export const cTestBank: CTestQuestion[] = [
  {
    id: 'ct-1',
    title: 'Renewable Energy Innovation',
    difficulty: 'B2',
    firstSentence: 'Solar panels have transformed how communities produce clean energy worldwide.',
    damagedTokens: [
      { prefix: 'Rec', missing: 'ent', suffix: 'advancements' },
      { prefix: 'in', missing: 'photovoltaic' },
      { prefix: 'cel', missing: 'ls' },
      { prefix: 'ha', missing: 've' },
      { prefix: 'dramati', missing: 'cally' },
      { prefix: 'low', missing: 'ered' },
      { prefix: 'manufac', missing: 'turing' },
      { prefix: 'co', missing: 'sts' },
    ],
    lastSentence: 'Consequently, clean energy is now more affordable than traditional fossil fuels in many nations.',
  },
];

// BANK OF LISTEN AND TYPE
export const listenTypeBank: ListenTypeQuestion[] = [
  {
    id: 'lt-1',
    audioSentence: 'The professor reminded the students about the upcoming deadline for the research proposal.',
    difficulty: 'B2',
  },
  {
    id: 'lt-2',
    audioSentence: 'Global temperatures continue to rise despite international climate agreements.',
    difficulty: 'B1',
  },
  {
    id: 'lt-3',
    audioSentence: 'Careful linguistic analysis revealed significant differences between the two manuscripts.',
    difficulty: 'C1',
  },
];

// BANK OF INTERACTIVE READING
export const interactiveReadingBank: InteractiveReadingBlock[] = [
  {
    id: 'ir-1',
    passageTitle: 'Coral Reef Ecosystems Under Thermal Stress',
    difficulty: 'B2',
    passageText: 'Coral reefs are among the most biologically diverse ecosystems on the planet, often referred to as the rain forests of the sea. They provide critical habitats for a quarter of all marine life despite covering less than one percent of the ocean floor. Rising sea temperatures cause corals to expel the symbiotic algae living in their tissues, a catastrophic process known as coral bleaching. Without these algae, the coral slowly starves and becomes vulnerable to disease.',
    gapSentence: {
      before: 'Marine biologists have observed that healthy reef ecosystems provide ',
      options: ['protection', 'destruction', 'pollution', 'ignorance'],
      correct: 'protection',
      after: ' for coastal shorelines against severe tropical storms.',
    },
    sentenceOptions: {
      options: [
        'Furthermore, widespread bleaching events have increased exponentially in frequency over the past three decades.',
        'However, artificial fish tanks are rarely found near ocean trenches.',
        'Therefore, many tourists prefer warm beaches during winter seasons.',
        'Nevertheless, coal mining remains a traditional source of electrical power.',
      ],
      correctIndex: 0,
    },
    highlightPrompt: 'Click and highlight the exact sentence that identifies what happens to corals when sea temperatures rise.',
    highlightCorrectSubstring: 'Rising sea temperatures cause corals to expel the symbiotic algae living in their tissues, a catastrophic process known as coral bleaching.',
    mainIdeaQuestion: {
      question: 'What is the primary concern discussed in this passage?',
      options: [
        'The economic cost of deep-sea fishing trawlers.',
        'The devastating impact of rising ocean temperatures on coral reefs.',
        'The history of marine exploration in the twentieth century.',
        'The dietary habits of predatory tropical fish.',
      ],
      correctIndex: 1,
    },
    titleQuestion: {
      question: 'Which is the most suitable title for this text?',
      options: [
        'The Plight of Fragile Coral Reefs',
        'Deep Ocean Trench Exploration',
        'Building Coastal Vacation Resorts',
        'Algae Species in Fresh Water',
      ],
      correctIndex: 0,
    },
  },
];

// BANK OF INTERACTIVE LISTENING
export const interactiveListeningBank: InteractiveListeningBlock[] = [
  {
    id: 'il-1',
    scenario: 'You are an undergraduate student meeting your biology professor during office hours to discuss an extension on your research assignment due to illness.',
    difficulty: 'B2',
    turns: [
      {
        speaker: 'Professor Hayes',
        speakerAudioText: 'Come on in! How can I help you today with your final project?',
        options: [
          'Hello Professor. I was sick with the flu this week and would like to request a brief extension.',
          'I wanted to ask why the university cafeteria was closed today.',
          'Yes, I brought my umbrella because it was raining heavily outside.',
          'I do not really like reading textbooks in the evening.',
        ],
        correctIndex: 0,
      },
      {
        speaker: 'Professor Hayes',
        speakerAudioText: 'I am sorry to hear you were unwell. How many additional days do you realistically need?',
        options: [
          'Three days would be sufficient for me to complete the bibliography and edit the final draft.',
          'I think I will probably graduate in two years.',
          'The weather was much better yesterday than today.',
          'No, I did not receive any emails from other students.',
        ],
        correctIndex: 0,
      },
      {
        speaker: 'Professor Hayes',
        speakerAudioText: 'That seems fair. Please make sure to submit your health clinic slip to the departmental portal by Friday.',
        options: [
          'Understood. I will upload the documentation immediately and submit the paper by Thursday night. Thank you!',
          'I already had lunch, so I do not need anything else.',
          'Where is the library located on campus?',
          'Why do other classes have different exams?',
        ],
        correctIndex: 0,
      },
    ],
    summaryPrompt: 'Write a 3-sentence summary of your conversation with the professor. Mention the reason for the visit, the agreement reached, and your next step.',
  },
];

// BANK OF WRITE ABOUT PHOTO
export const writePhotoBank: WritePhotoQuestion[] = [
  {
    id: 'wp-1',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    altText: 'Civil engineer with hard hat inspecting blueprint on construction site',
    difficulty: 'B2',
  },
  {
    id: 'wp-2',
    imageUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80',
    altText: 'Group of diverse university students studying together in a modern library',
    difficulty: 'B1',
  },
  {
    id: 'wp-3',
    imageUrl: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    altText: 'Scientist in laboratory examining test tubes under bright lighting',
    difficulty: 'B2',
  },
];

// BANK OF INTERACTIVE WRITING
export const interactiveWritingBank: InteractiveWritingQuestion[] = [
  {
    id: 'iw-1',
    part1Prompt: 'Some people believe that university students should focus strictly on academic subjects related to their careers, while others argue they should take a broad range of general education courses. What is your opinion? Write at least 80 words.',
    part2Prompt: 'Considering your answer above, how might employers view a candidate who took various interdisciplinary courses outside their primary major?',
    difficulty: 'B2',
  },
];

// BANK OF WRITING SAMPLE
export const writingSampleBank: WritingSampleQuestion[] = [
  {
    id: 'ws-1',
    prompt: 'Many countries are investing heavily in public transportation systems rather than building new highways. Discuss the environmental and economic advantages of this policy. Provide reasons and examples from your knowledge or experience. (Aim for 100+ words).',
    difficulty: 'B2',
  },
];
