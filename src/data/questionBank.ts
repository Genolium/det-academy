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
  gapSentence: {
    before: string;
    options: string[];
    correct: string;
    after: string;
  };
  sentenceOptions: {
    options: string[];
    correctIndex: number;
  };
  highlightPrompt: string;
  highlightCorrectSubstring: string;
  mainIdeaQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
  };
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

// 1. BANK OF READ AND SELECT (87 words)
export const readSelectBank: ReadSelectWord[] = [
  {
    "word": "ambiguous",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "coherent",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "consequent",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "empirical",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "facilitate",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "fluctuate",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "infrastructure",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "intrinsic",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "paradigm",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "predominant",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "qualitative",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "reinforce",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "subsequent",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "sustain",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "widespread",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "deteriorate",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "comprehensive",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "counterpart",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "preliminary",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "accord",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "adverse",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "albeit",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "allocation",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "anonymous",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "assert",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "bias",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "conspiracy",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "convey",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "denial",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "dismissal",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "eccentric",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "formidable",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "hazard",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "injustice",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "invoke",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "interim",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "paramount",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "rigorous",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "specimen",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "substantiate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "unprecedented",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "discrepancy",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "plausible",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "reluctant",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "stance",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "quarrel",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "pertain",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "maximize",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "potent",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "rigid",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "aduse",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "ammock",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "perfolds",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "perium",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "persenet",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "tapity",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "tessity",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "unlial",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "urbact",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "bresk",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "cappose",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "obstial",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "sheck",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "serfack",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "depact",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "agalition",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "swind",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "crove",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "implow",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "errical",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "sidedown",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "floop",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "satics",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "blick",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "edual",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "dehumanics",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "counterbrain",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "sploration",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "conseptual",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "flunder",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "gration",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "intransient",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "misguidement",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "probalistic",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "reversable",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "substantivement",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "unpredictance",
    "isReal": false,
    "difficulty": "B2"
  }
,
  {
    "word": "ubiquitous",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "scrutinize",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "preliminary",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "resilient",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "mitigate",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "plausible",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "discrepancy",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "comprehensive",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "arbitrary",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "ambivalent",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "pragmatic",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "deteriorate",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "equilibrium",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "lucid",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "vulnerable",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "spontaneous",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "paramount",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "concur",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "diminish",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "rigorous",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "comprehendive",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "unclariable",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "prospectate",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "subvertionary",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "impenetrabilityness",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "disruptivement",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "transcendably",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "equilibrateous",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "reversitivity",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "hypothetize",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "intercedement",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "conclusible",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "unplausible",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "magnitudic",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "cogniscently",
    "isReal": false,
    "difficulty": "C1"
  }
];

// 2. BANK OF FILL IN THE BLANKS (16 items)
export const fillBlanksBank: FillBlanksQuestion[] = [
  {
    "id": "fb-1",
    "sentenceBefore": "The lead researcher ",
    "givenPrefix": "con",
    "missingLetters": "cluded",
    "sentenceAfter": " that previous hypotheses had overlooked critical environmental factors.",
    "fullWord": "concluded",
    "difficulty": "B2"
  },
  {
    "id": "fb-2",
    "sentenceBefore": "Higher education institutions must ",
    "givenPrefix": "ad",
    "missingLetters": "apt",
    "sentenceAfter": " to rapid technological changes in distance learning.",
    "fullWord": "adapt",
    "difficulty": "B1"
  },
  {
    "id": "fb-3",
    "sentenceBefore": "Economic instability can severely ",
    "givenPrefix": "un",
    "missingLetters": "dermine",
    "sentenceAfter": " social welfare programs in developing nations.",
    "fullWord": "undermine",
    "difficulty": "C1"
  },
  {
    "id": "fb-4",
    "sentenceBefore": "Students are encouraged to ",
    "givenPrefix": "co",
    "missingLetters": "llaborate",
    "sentenceAfter": " on their final engineering capstone projects.",
    "fullWord": "collaborate",
    "difficulty": "B2"
  },
  {
    "id": "fb-5",
    "sentenceBefore": "Due to severe blizzard conditions, airport authorities decided to ",
    "givenPrefix": "can",
    "missingLetters": "cel",
    "sentenceAfter": " all scheduled transatlantic flights.",
    "fullWord": "cancel",
    "difficulty": "B1"
  },
  {
    "id": "fb-6",
    "sentenceBefore": "National ecological policies must be firmly ",
    "givenPrefix": "sup",
    "missingLetters": "ported",
    "sentenceAfter": " by peer-reviewed empirical evidence.",
    "fullWord": "supported",
    "difficulty": "B2"
  },
  {
    "id": "fb-7",
    "sentenceBefore": "Urban architects are redesigning infrastructure to ",
    "givenPrefix": "fa",
    "missingLetters": "cilitate",
    "sentenceAfter": " safer non-motorized cycling routes.",
    "fullWord": "facilitate",
    "difficulty": "C1"
  },
  {
    "id": "fb-8",
    "sentenceBefore": "Market economists predict currency values will ",
    "givenPrefix": "fluc",
    "missingLetters": "tuate",
    "sentenceAfter": " unpredictably ahead of interest rate decisions.",
    "fullWord": "fluctuate",
    "difficulty": "B2"
  },
  {
    "id": "fb-9",
    "sentenceBefore": "Marine biologists caution that coral reefs will ",
    "givenPrefix": "de",
    "missingLetters": "teriorate",
    "sentenceAfter": " unless ocean surface temperatures stabilize.",
    "fullWord": "deteriorate",
    "difficulty": "C1"
  },
  {
    "id": "fb-10",
    "sentenceBefore": "The scholarship committee requested a ",
    "givenPrefix": "com",
    "missingLetters": "prehensive",
    "sentenceAfter": " portfolio of extracurricular community projects.",
    "fullWord": "comprehensive",
    "difficulty": "B2"
  },
  {
    "id": "fb-11",
    "sentenceBefore": "Researchers could find no direct ",
    "givenPrefix": "evi",
    "missingLetters": "dence",
    "sentenceAfter": " correlating cognitive fatigue with digital screen time.",
    "fullWord": "evidence",
    "difficulty": "B1"
  },
  {
    "id": "fb-12",
    "sentenceBefore": "Diplomats worked tirelessly to ",
    "givenPrefix": "re",
    "missingLetters": "solve",
    "sentenceAfter": " longstanding maritime border disagreements.",
    "fullWord": "resolve",
    "difficulty": "B1"
  },
  {
    "id": "fb-13",
    "sentenceBefore": "The engineering team conducted a ",
    "givenPrefix": "pre",
    "missingLetters": "liminary",
    "sentenceAfter": " stress test on the suspension cables before construction.",
    "fullWord": "preliminary",
    "difficulty": "B2"
  },
  {
    "id": "fb-14",
    "sentenceBefore": "Public health agencies stressed the ",
    "givenPrefix": "ne",
    "missingLetters": "cessity",
    "sentenceAfter": " of widespread diagnostic screening.",
    "fullWord": "necessity",
    "difficulty": "B2"
  },
  {
    "id": "fb-15",
    "sentenceBefore": "The experimental vaccine generated an ",
    "givenPrefix": "un",
    "missingLetters": "precedented",
    "sentenceAfter": " immune response in laboratory trials.",
    "fullWord": "unprecedented",
    "difficulty": "C1"
  },
  {
    "id": "fb-16",
    "sentenceBefore": "Anthropologists unearthed ancient tools that shed light on human ",
    "givenPrefix": "mi",
    "missingLetters": "gration",
    "sentenceAfter": " across glacial land bridges.",
    "fullWord": "migration",
    "difficulty": "B2"
  }
,
  {
    "id": "fb-17",
    "sentenceBefore": "The government launched an initiative to ",
    "givenPrefix": "pro",
    "missingLetters": "mote",
    "sentenceAfter": " sustainable agricultural practices among local farmers.",
    "fullWord": "promote",
    "difficulty": "B1"
  },
  {
    "id": "fb-18",
    "sentenceBefore": "Recent clinical trials have ",
    "givenPrefix": "dem",
    "missingLetters": "onstrated",
    "sentenceAfter": " the efficacy of the novel therapeutic compound.",
    "fullWord": "demonstrated",
    "difficulty": "B2"
  },
  {
    "id": "fb-19",
    "sentenceBefore": "Environmental economists argue that carbon taxation can effectively ",
    "givenPrefix": "cur",
    "missingLetters": "tail",
    "sentenceAfter": " industrial emissions.",
    "fullWord": "curtail",
    "difficulty": "C1"
  },
  {
    "id": "fb-20",
    "sentenceBefore": "The department dean was asked to ",
    "givenPrefix": "cla",
    "missingLetters": "rify",
    "sentenceAfter": " the new examination guidelines for graduating seniors.",
    "fullWord": "clarify",
    "difficulty": "B1"
  },
  {
    "id": "fb-21",
    "sentenceBefore": "Scholars have long debated the ",
    "givenPrefix": "or",
    "missingLetters": "igin",
    "sentenceAfter": " of dramatic theater in ancient Mediterranean societies.",
    "fullWord": "origin",
    "difficulty": "B1"
  },
  {
    "id": "fb-22",
    "sentenceBefore": "Heavy volcanic ash clouds can completely ",
    "givenPrefix": "obs",
    "missingLetters": "cure",
    "sentenceAfter": " solar illumination for several consecutive days.",
    "fullWord": "obscure",
    "difficulty": "B2"
  },
  {
    "id": "fb-23",
    "sentenceBefore": "The committee reached a unanimous ",
    "givenPrefix": "de",
    "missingLetters": "cision",
    "sentenceAfter": " regarding the distribution of university research grants.",
    "fullWord": "decision",
    "difficulty": "B1"
  },
  {
    "id": "fb-24",
    "sentenceBefore": "To maintain structural integrity, modern skyscrapers are designed to ",
    "givenPrefix": "abs",
    "missingLetters": "orb",
    "sentenceAfter": " seismic vibrations efficiently.",
    "fullWord": "absorb",
    "difficulty": "B2"
  },
  {
    "id": "fb-25",
    "sentenceBefore": "The international summit aimed to ",
    "givenPrefix": "str",
    "missingLetters": "engthen",
    "sentenceAfter": " diplomatic partnerships across participating continents.",
    "fullWord": "strengthen",
    "difficulty": "B2"
  },
  {
    "id": "fb-26",
    "sentenceBefore": "Philosophers frequently ",
    "givenPrefix": "que",
    "missingLetters": "stion",
    "sentenceAfter": " the fundamental assumptions underpinning ethical theories.",
    "fullWord": "question",
    "difficulty": "B1"
  },
  {
    "id": "fb-27",
    "sentenceBefore": "The company decided to ",
    "givenPrefix": "ter",
    "missingLetters": "minate",
    "sentenceAfter": " non-essential operations to reduce overhead expenditures.",
    "fullWord": "terminate",
    "difficulty": "B2"
  },
  {
    "id": "fb-28",
    "sentenceBefore": "Genetic mutations can either benefit an organism or prove distinctly ",
    "givenPrefix": "det",
    "missingLetters": "rimental",
    "sentenceAfter": " to its survival.",
    "fullWord": "detrimental",
    "difficulty": "C1"
  },
  {
    "id": "fb-29",
    "sentenceBefore": "The primary objective of the survey is to ",
    "givenPrefix": "eva",
    "missingLetters": "luate",
    "sentenceAfter": " consumer attitudes toward autonomous electric vehicles.",
    "fullWord": "evaluate",
    "difficulty": "B2"
  },
  {
    "id": "fb-30",
    "sentenceBefore": "Scientists gathered at the symposium to discuss the ",
    "givenPrefix": "imp",
    "missingLetters": "lications",
    "sentenceAfter": " of generative models on intellectual copyright.",
    "fullWord": "implications",
    "difficulty": "B2"
  }
];

// 3. BANK OF C-TEST (6 passages)
export const cTestBank: CTestQuestion[] = [
  {
    "id": "ct-1",
    "title": "Renewable Energy Innovation",
    "difficulty": "B2",
    "firstSentence": "Solar panels have transformed how communities produce clean energy worldwide.",
    "damagedTokens": [
      {
        "prefix": "Rec",
        "missing": "ent",
        "suffix": "advancements"
      },
      {
        "prefix": "in",
        "missing": "photovoltaic"
      },
      {
        "prefix": "cel",
        "missing": "ls"
      },
      {
        "prefix": "ha",
        "missing": "ve"
      },
      {
        "prefix": "dramati",
        "missing": "cally"
      },
      {
        "prefix": "low",
        "missing": "ered"
      },
      {
        "prefix": "manufac",
        "missing": "turing"
      },
      {
        "prefix": "co",
        "missing": "sts"
      }
    ],
    "lastSentence": "Consequently, clean energy is now more affordable than traditional fossil fuels in many nations."
  },
  {
    "id": "ct-2",
    "title": "Urban Ecology & Green Spaces",
    "difficulty": "B1",
    "firstSentence": "Modern cities are creating greener spaces to support local wildlife and improve community health.",
    "damagedTokens": [
      {
        "prefix": "Lar",
        "missing": "ge"
      },
      {
        "prefix": "pub",
        "missing": "lic"
      },
      {
        "prefix": "par",
        "missing": "ks"
      },
      {
        "prefix": "pro",
        "missing": "vide"
      },
      {
        "prefix": "sa",
        "missing": "fe"
      },
      {
        "prefix": "she",
        "missing": "lters"
      },
      {
        "prefix": "f",
        "missing": "or"
      },
      {
        "prefix": "bi",
        "missing": "rds"
      }
    ],
    "lastSentence": "These green corridors also help reduce urban heat and give residents peaceful areas to exercise."
  },
  {
    "id": "ct-3",
    "title": "Deep Ocean Exploration",
    "difficulty": "C1",
    "firstSentence": "Specialized submersibles have unlocked unprecedented insights into underwater geological formations.",
    "damagedTokens": [
      {
        "prefix": "Auton",
        "missing": "omous"
      },
      {
        "prefix": "mar",
        "missing": "ine"
      },
      {
        "prefix": "vehi",
        "missing": "cles"
      },
      {
        "prefix": "navi",
        "missing": "gate"
      },
      {
        "prefix": "ext",
        "missing": "reme"
      },
      {
        "prefix": "wat",
        "missing": "er"
      },
      {
        "prefix": "pres",
        "missing": "sure"
      }
    ],
    "lastSentence": "Astrobiologists study these ecosystems because hydrothermal vents support life without solar radiation."
  },
  {
    "id": "ct-4",
    "title": "The Psychology of Decision Making",
    "difficulty": "B2",
    "firstSentence": "Cognitive psychologists investigate how subconscious biases influence economic choices.",
    "damagedTokens": [
      {
        "prefix": "Wh",
        "missing": "en"
      },
      {
        "prefix": "individ",
        "missing": "uals"
      },
      {
        "prefix": "confr",
        "missing": "ont"
      },
      {
        "prefix": "comp",
        "missing": "lex"
      },
      {
        "prefix": "dilem",
        "missing": "mas"
      },
      {
        "prefix": "th",
        "missing": "ey"
      },
      {
        "prefix": "re",
        "missing": "ly"
      }
    ],
    "lastSentence": "Researchers emphasize that recognizing irrational tendencies enables citizens to make prudent investments."
  },
  {
    "id": "ct-5",
    "title": "Marine Microplastics & Food Webs",
    "difficulty": "B2",
    "firstSentence": "Synthetic polymer contamination represents a formidable challenge to oceanic life.",
    "damagedTokens": [
      {
        "prefix": "Indus",
        "missing": "trial"
      },
      {
        "prefix": "run",
        "missing": "off"
      },
      {
        "prefix": "depo",
        "missing": "sits"
      },
      {
        "prefix": "micros",
        "missing": "copic"
      },
      {
        "prefix": "plas",
        "missing": "tic"
      },
      {
        "prefix": "parti",
        "missing": "cles"
      }
    ],
    "lastSentence": "Conservation biologists urge international regulatory bodies to enforce comprehensive packaging restrictions."
  },
  {
    "id": "ct-6",
    "title": "The Evolution of Written Language",
    "difficulty": "C1",
    "firstSentence": "Ancient civilizations developed structured writing systems to preserve administrative and agricultural records.",
    "damagedTokens": [
      {
        "prefix": "Ear",
        "missing": "ly"
      },
      {
        "prefix": "cunei",
        "missing": "form"
      },
      {
        "prefix": "tabl",
        "missing": "ets"
      },
      {
        "prefix": "in",
        "missing": "Mesopotamia"
      },
      {
        "prefix": "recor",
        "missing": "ded"
      },
      {
        "prefix": "gr",
        "missing": "ain"
      }
    ],
    "lastSentence": "Anthropologists assert that written symbols allowed human communities to transmit empirical knowledge across generations."
  }
,
  {
    "id": "ct-7",
    "title": "Quantum Computing & Information Security",
    "difficulty": "C1",
    "firstSentence": "Quantum computing has the potential to revolutionize how complex mathematical calculations are solved.",
    "damagedTokens": [
      {
        "prefix": "Unli",
        "missing": "ke"
      },
      {
        "prefix": "clas",
        "missing": "sical"
      },
      {
        "prefix": "com",
        "missing": "puters"
      },
      {
        "prefix": "whi",
        "missing": "ch"
      },
      {
        "prefix": "pr",
        "missing": "ocess"
      },
      {
        "prefix": "bi",
        "missing": "nary"
      },
      {
        "prefix": "bi",
        "missing": "ts"
      },
      {
        "prefix": "qua",
        "missing": "ntum"
      }
    ],
    "lastSentence": "Consequently, cybersecurity experts are developing cryptographic systems capable of resisting quantum attacks."
  },
  {
    "id": "ct-8",
    "title": "Vertical Farming in Urban Landscapes",
    "difficulty": "B2",
    "firstSentence": "Indoor vertical farming represents an innovative method of cultivating fresh produce inside dense cities.",
    "damagedTokens": [
      {
        "prefix": "The",
        "missing": "se"
      },
      {
        "prefix": "fac",
        "missing": "ilities"
      },
      {
        "prefix": "ut",
        "missing": "ilize"
      },
      {
        "prefix": "artif",
        "missing": "icial"
      },
      {
        "prefix": "lig",
        "missing": "hting"
      },
      {
        "prefix": "a",
        "missing": "nd"
      },
      {
        "prefix": "hydr",
        "missing": "oponic"
      },
      {
        "prefix": "sys",
        "missing": "tems"
      }
    ],
    "lastSentence": "By growing crops close to urban consumers, vertical farms substantially reduce transportation emissions."
  },
  {
    "id": "ct-9",
    "title": "Sleep Cycles & Memory Consolidation",
    "difficulty": "B2",
    "firstSentence": "Quality sleep is vital for maintaining physical well-being and peak cognitive performance.",
    "damagedTokens": [
      {
        "prefix": "Dur",
        "missing": "ing"
      },
      {
        "prefix": "de",
        "missing": "ep"
      },
      {
        "prefix": "sle",
        "missing": "ep"
      },
      {
        "prefix": "th",
        "missing": "e"
      },
      {
        "prefix": "br",
        "missing": "ain"
      },
      {
        "prefix": "conso",
        "missing": "lidates"
      },
      {
        "prefix": "rec",
        "missing": "ent"
      },
      {
        "prefix": "memo",
        "missing": "ries"
      }
    ],
    "lastSentence": "Neuroscientists recommend eight hours of rest to optimize long-term learning retention."
  },
  {
    "id": "ct-10",
    "title": "Glacial Retreat & Global Sea Levels",
    "difficulty": "B2",
    "firstSentence": "Polar ice sheets and alpine glaciers are shrinking at rates faster than historical averages.",
    "damagedTokens": [
      {
        "prefix": "Sate",
        "missing": "llite"
      },
      {
        "prefix": "obse",
        "missing": "rvations"
      },
      {
        "prefix": "sh",
        "missing": "ow"
      },
      {
        "prefix": "th",
        "missing": "at"
      },
      {
        "prefix": "mil",
        "missing": "lions"
      },
      {
        "prefix": "o",
        "missing": "f"
      },
      {
        "prefix": "to",
        "missing": "ns"
      },
      {
        "prefix": "me",
        "missing": "lt"
      }
    ],
    "lastSentence": "Rising coastal waters pose immediate environmental hazards to island communities and delta regions."
  }
];

// 4. BANK OF LISTEN AND TYPE (20 sentences)
export const listenTypeBank: ListenTypeQuestion[] = [
  {
    "id": "lt-1",
    "audioSentence": "There are thousands of robots doing a wide variety of tasks in hospitals.",
    "difficulty": "B1"
  },
  {
    "id": "lt-2",
    "audioSentence": "Educational methods include teaching, storytelling, discussions, and research.",
    "difficulty": "B1"
  },
  {
    "id": "lt-3",
    "audioSentence": "Many large university institutions are now starting to offer free online courses.",
    "difficulty": "B1"
  },
  {
    "id": "lt-4",
    "audioSentence": "Cultural globalization refers to the transmission of ideas, meanings, and values around the world.",
    "difficulty": "B2"
  },
  {
    "id": "lt-5",
    "audioSentence": "Developments in technology and transportation infrastructure have made tourism more affordable.",
    "difficulty": "B2"
  },
  {
    "id": "lt-6",
    "audioSentence": "The internet has been instrumental in connecting people across geographical borders.",
    "difficulty": "B1"
  },
  {
    "id": "lt-7",
    "audioSentence": "One reason you might consider studying abroad is for the chance to experience different styles of education.",
    "difficulty": "B2"
  },
  {
    "id": "lt-8",
    "audioSentence": "I would have bought you a present if I had known it was your birthday.",
    "difficulty": "B1"
  },
  {
    "id": "lt-9",
    "audioSentence": "Many people believe that schools should concentrate more on the child and less on the exam.",
    "difficulty": "B1"
  },
  {
    "id": "lt-10",
    "audioSentence": "The mobile phone has made an enormous difference to the way we communicate.",
    "difficulty": "B1"
  },
  {
    "id": "lt-11",
    "audioSentence": "Had I realized the severity of the situation, I would have informed the authorities immediately.",
    "difficulty": "C1"
  },
  {
    "id": "lt-12",
    "audioSentence": "The primary energy source of tropical storms is warm ocean waters.",
    "difficulty": "B2"
  },
  {
    "id": "lt-13",
    "audioSentence": "Once they had checked all my bags, I was allowed on the plane.",
    "difficulty": "B1"
  },
  {
    "id": "lt-14",
    "audioSentence": "She became very sick because she had not been sleeping enough.",
    "difficulty": "B1"
  },
  {
    "id": "lt-15",
    "audioSentence": "Scientific research on human emotions has increased significantly over the past two decades.",
    "difficulty": "B2"
  },
  {
    "id": "lt-16",
    "audioSentence": "After the evaluation, the government announced a radical review of its procedures.",
    "difficulty": "C1"
  },
  {
    "id": "lt-17",
    "audioSentence": "The company has decided to integrate the sales and marketing departments.",
    "difficulty": "B2"
  },
  {
    "id": "lt-18",
    "audioSentence": "The public sector is the part of the economy that provides basic government services.",
    "difficulty": "B2"
  },
  {
    "id": "lt-19",
    "audioSentence": "Obesity is connected to many different fatal diseases.",
    "difficulty": "B1"
  },
  {
    "id": "lt-20",
    "audioSentence": "I do not think it is worth spending all that money on exploring the universe.",
    "difficulty": "B2"
  }
,
  {
    "id": "lt-21",
    "audioSentence": "The university library provides extensive digital archives for graduate researchers.",
    "difficulty": "B1"
  },
  {
    "id": "lt-22",
    "audioSentence": "Modern renewable technologies have significantly decreased the cost of solar energy.",
    "difficulty": "B2"
  },
  {
    "id": "lt-23",
    "audioSentence": "Students who organize their revision schedules generally experience less stress before exams.",
    "difficulty": "B1"
  },
  {
    "id": "lt-24",
    "audioSentence": "The laboratory technician calibrated the electronic balance before weighing the chemical samples.",
    "difficulty": "B2"
  },
  {
    "id": "lt-25",
    "audioSentence": "Urban planning initiatives must prioritize pedestrian accessibility and efficient public transit.",
    "difficulty": "B2"
  },
  {
    "id": "lt-26",
    "audioSentence": "Artificial intelligence algorithms require rigorous ethical oversight when deployed in healthcare.",
    "difficulty": "C1"
  },
  {
    "id": "lt-27",
    "audioSentence": "She decided to enroll in an intensive language course before studying abroad in France.",
    "difficulty": "B1"
  },
  {
    "id": "lt-28",
    "audioSentence": "Financial analysts predicted a modest economic recovery following the quarterly market report.",
    "difficulty": "B2"
  },
  {
    "id": "lt-29",
    "audioSentence": "Marine reserves provide critical sanctuaries where endangered species can replenish their numbers.",
    "difficulty": "B2"
  },
  {
    "id": "lt-30",
    "audioSentence": "Cognitive psychologists investigated how bilingualism influences working memory in young adults.",
    "difficulty": "C1"
  }
];

// 5. BANK OF INTERACTIVE READING (3 blocks)
export const interactiveReadingBank: InteractiveReadingBlock[] = [
  {
    "id": "ir-1",
    "passageTitle": "Coral Reef Ecosystems Under Thermal Stress",
    "difficulty": "B2",
    "passageText": "Coral reefs are among the most biologically diverse ecosystems on the planet, often referred to as the rain forests of the sea. They provide critical habitats for a quarter of all marine life despite covering less than one percent of the ocean floor. Rising sea temperatures cause corals to expel the symbiotic algae living in their tissues, a catastrophic process known as coral bleaching. Without these algae, the coral slowly starves and becomes vulnerable to disease.",
    "gapSentence": {
      "before": "Marine biologists have observed that healthy reef ecosystems provide ",
      "options": [
        "protection",
        "destruction",
        "pollution",
        "ignorance"
      ],
      "correct": "protection",
      "after": " for coastal shorelines against severe tropical storms."
    },
    "sentenceOptions": {
      "options": [
        "Furthermore, widespread bleaching events have increased exponentially in frequency over the past three decades.",
        "However, artificial fish tanks are rarely found near ocean trenches.",
        "Therefore, many tourists prefer warm beaches during winter seasons.",
        "Nevertheless, coal mining remains a traditional source of electrical power."
      ],
      "correctIndex": 0
    },
    "highlightPrompt": "Click and highlight the exact sentence that identifies what happens to corals when ocean temperatures elevate.",
    "highlightCorrectSubstring": "Rising sea temperatures cause corals to expel the symbiotic algae living in their tissues, a catastrophic process known as coral bleaching.",
    "mainIdeaQuestion": {
      "question": "What is the primary objective of the author in this passage?",
      "options": [
        "To describe the biological mechanism and ecological gravity of coral bleaching",
        "To encourage commercial fishing vessels to navigate deeper equatorial waters",
        "To prove that ocean temperatures have ceased fluctuating",
        "To compare tropical rain forests directly with alpine meadows"
      ],
      "correctIndex": 0
    },
    "titleQuestion": {
      "question": "Choose the most appropriate academic title for this passage:",
      "options": [
        "Thermal Degradation in Marine Coral Ecosystems",
        "How Tropical Fish Spend Their Summers",
        "A Brief History of Scuba Diving",
        "Economic Growth of Coastal Tourism"
      ],
      "correctIndex": 0
    }
  },
  {
    "id": "ir-2",
    "passageTitle": "The Architecture of Megacities and Heat Islands",
    "difficulty": "B2",
    "passageText": "Densely populated metropolitan areas routinely experience elevated surface temperatures compared to surrounding rural perimeters, an environmental phenomenon termed the Urban Heat Island effect. Massive expanses of asphalt, concrete pavement, and dark roofing materials absorb solar radiation during daylight hours and slowly re-radiate thermal energy throughout the night. Consequently, cooling demand spikes, placing immense pressure on metropolitan electrical grids.",
    "gapSentence": {
      "before": "Urban planners advocate implementing reflective roofing and green vegetation to ",
      "options": [
        "mitigate",
        "exacerbate",
        "eliminate",
        "disregard"
      ],
      "correct": "mitigate",
      "after": " severe localized temperature spikes across downtown residential zones."
    },
    "sentenceOptions": {
      "options": [
        "Additionally, planting mature street trees provides canopy shading that directly cools asphalt pavements.",
        "Conversely, interstellar voyages require advanced rocket propulsion mechanisms.",
        "Meanwhile, classical Greek tragedy emphasized ethical catharsis among theatre audiences.",
        "In contrast, subterranean subway lines consume no electrical power whatsoever."
      ],
      "correctIndex": 0
    },
    "highlightPrompt": "Click and highlight the sentence detailing why urban building materials retain heat.",
    "highlightCorrectSubstring": "Massive expanses of asphalt, concrete pavement, and dark roofing materials absorb solar radiation during daylight hours and slowly re-radiate thermal energy throughout the night.",
    "mainIdeaQuestion": {
      "question": "Which statement best summarizes the main idea of the passage?",
      "options": [
        "Urban infrastructure contributes significantly to thermal retention, necessitating sustainable cooling interventions.",
        "Rural villages consume more electrical power than modern metropolitan centers.",
        "Concrete is the only building material capable of withstanding heavy rainfall.",
        "Air conditioning systems were invented primarily to reduce carbon emissions."
      ],
      "correctIndex": 0
    },
    "titleQuestion": {
      "question": "Select the best title for this passage:",
      "options": [
        "Urban Heat Islands: Physical Causes and Mitigation Strategies",
        "The Invention of Modern Air Conditioners",
        "Comparing Ancient and Modern Rome",
        "The Decline of Rural Agriculture"
      ],
      "correctIndex": 0
    }
  },
  {
    "id": "ir-3",
    "passageTitle": "Cognitive Plasticity Across the Lifespan",
    "difficulty": "C1",
    "passageText": "For much of the twentieth century, neuroscientists operated under the dogma that the adult human brain was structurally immutable. It was widely believed that neurogenesis ceased after adolescence, leaving older individuals with a fixed cognitive architecture. Modern neuroimaging has shattered this assumption, demonstrating neuroplasticity: the central nervous system's lifelong capacity to reorganize neural pathways in response to novel learning, environmental enrichment, and cognitive rehabilitation.",
    "gapSentence": {
      "before": "Engaging regularly in intellectually demanding activities helps maintain ",
      "options": [
        "synaptic",
        "skeletal",
        "cardiac",
        "respiratory"
      ],
      "correct": "synaptic",
      "after": " connectivity among older adults."
    },
    "sentenceOptions": {
      "options": [
        "Furthermore, acquiring foreign languages or learning musical instruments has been shown to fortify cognitive reserve.",
        "However, ancient philosophers rarely contemplated the biological composition of the cosmos.",
        "Therefore, steam locomotives were rapidly superseded by diesel combustion engines.",
        "Consequently, deep ocean submersibles must withstand extreme atmospheric barometric pressure."
      ],
      "correctIndex": 0
    },
    "highlightPrompt": "Click and highlight the sentence expressing the historical misconception held by early neuroscientists.",
    "highlightCorrectSubstring": "For much of the twentieth century, neuroscientists operated under the dogma that the adult human brain was structurally immutable.",
    "mainIdeaQuestion": {
      "question": "What is the central premise demonstrated in this passage?",
      "options": [
        "The adult human brain retains structural plasticity and adaptable potential throughout life.",
        "Human learning capabilities terminate abruptly at the conclusion of childhood.",
        "Neuroimaging techniques have proven ineffective at measuring mental processes.",
        "Intellectual challenges accelerate cognitive fatigue in elderly subjects."
      ],
      "correctIndex": 0
    },
    "titleQuestion": {
      "question": "Choose the most appropriate academic title for this passage:",
      "options": [
        "Neuroplasticity: Overcoming the Dogma of the Static Brain",
        "The Anatomy of Childhood Memory Formation",
        "Medical History of Medieval Physicians",
        "How to Pass University Cognitive Tests"
      ],
      "correctIndex": 0
    }
  }
,
  {
    "id": "ir-4",
    "passageTitle": "Microbiome Ecology and Human Immunology",
    "difficulty": "B2",
    "passageText": "The human gastrointestinal tract harbors trillions of microorganisms that constitute the gut microbiome. Rather than functioning merely as passive organisms, these bacterial colonies play an active role in training the human immune system. Disruption of this microbial balance, termed dysbiosis, has been linked to numerous chronic conditions ranging from autoimmune disorders to metabolic syndromes.",
    "gapSentence": {
      "before": "Dietary fibers act as prebiotics that selectively promote the ",
      "options": [
        "proliferation",
        "suppression",
        "termination",
        "contamination"
      ],
      "correct": "proliferation",
      "after": " of beneficial probiotic bacterial species."
    },
    "sentenceOptions": {
      "options": [
        "Moreover, broad-spectrum antibiotics can inadvertently eradicate beneficial gut bacteria alongside pathogens.",
        "Consequently, medieval trade routes were heavily guarded by royal cavalry.",
        "Therefore, geothermal vents provide extreme pressure at the bottom of the Mariana Trench.",
        "Nevertheless, steam locomotives revolutionized nineteenth-century continental logistics."
      ],
      "correctIndex": 0
    },
    "highlightPrompt": "Click and highlight the exact sentence that defines the term applied when the bacterial balance is disrupted.",
    "highlightCorrectSubstring": "Disruption of this microbial balance, termed dysbiosis, has been linked to numerous chronic conditions ranging from autoimmune disorders to metabolic syndromes.",
    "mainIdeaQuestion": {
      "question": "What is the primary thesis advanced by the author regarding the gut microbiome?",
      "options": [
        "The gut microbiome plays an indispensable role in maintaining systemic immune and metabolic health.",
        "All microorganisms living inside humans cause infectious diseases unless eradicated.",
        "Dietary fiber has no measurable correlation with digestive well-being.",
        "Antibiotics should replace dietary regulation in modern clinical protocols."
      ],
      "correctIndex": 0
    },
    "titleQuestion": {
      "question": "Choose the most appropriate academic title for this passage:",
      "options": [
        "Symbiotic Microorganisms: The Immunological Significance of the Gut Microbiome",
        "A History of Surgical Equipment in the Nineteenth Century",
        "Industrial Food Processing and Packaging Techniques",
        "How to Cultivate Tropical Plants in Greenhouses"
      ],
      "correctIndex": 0
    }
  },
  {
    "id": "ir-5",
    "passageTitle": "The Geopolitics of Rare Earth Elements",
    "difficulty": "C1",
    "passageText": "The global transition toward renewable energy technologies relies heavily on critical minerals known as rare earth elements. Essential for the fabrication of permanent magnets used in wind turbines and electric vehicle motors, these elements are geologically dispersed yet geographically concentrated in their refining capacity. Securing stable supply chains has become a prominent geopolitical priority for industrialized nations striving to achieve net-zero targets.",
    "gapSentence": {
      "before": "Establishing domestic mineral processing facilities requires substantial capital investment and stringent ",
      "options": [
        "environmental",
        "fictional",
        "negligent",
        "recreational"
      ],
      "correct": "environmental",
      "after": " impact assessments to avoid toxic chemical runoff."
    },
    "sentenceOptions": {
      "options": [
        "Furthermore, international trade partnerships are forming to diversify supply sources and bolster geopolitical resilience.",
        "However, classical Greek philosophers did not anticipate the emergence of commercial aviation.",
        "Therefore, wooden ships were traditionally constructed using seasoned oak timber.",
        "Consequently, Antarctic penguins migrate southward during the harsh austral winter."
      ],
      "correctIndex": 0
    },
    "highlightPrompt": "Click and highlight the sentence explaining why securing critical mineral supply chains has become a geopolitical priority.",
    "highlightCorrectSubstring": "Securing stable supply chains has become a prominent geopolitical priority for industrialized nations striving to achieve net-zero targets.",
    "mainIdeaQuestion": {
      "question": "What is the central focus of the discussion regarding rare earth minerals?",
      "options": [
        "The critical strategic and environmental challenges surrounding mineral supply chains for clean energy",
        "The mechanical engineering differences between diesel and electric motor transmissions",
        "A detailed analysis of agricultural soil fertility in equatorial developing countries",
        "The commercial collapse of international shipping container networks"
      ],
      "correctIndex": 0
    },
    "titleQuestion": {
      "question": "Select the most accurate academic title for the passage:",
      "options": [
        "Critical Minerals in the Clean Energy Transition: Strategic Realities",
        "The Exploration of Deep Ocean Abyssal Plains",
        "Urbanization Trends in Twentieth-Century Europe",
        "Principles of Aerodynamic Flight Control"
      ],
      "correctIndex": 0
    }
  }
];

// 6. BANK OF INTERACTIVE LISTENING (2 blocks)
export const interactiveListeningBank: InteractiveListeningBlock[] = [
  {
    "id": "il-1",
    "scenario": "You are an undergraduate student meeting your biology professor during office hours to discuss an extension on your research assignment due to illness.",
    "difficulty": "B2",
    "turns": [
      {
        "speaker": "Professor Hayes",
        "speakerAudioText": "Come on in! How can I help you today with your final project?",
        "options": [
          "Hello Professor. I was sick with the flu this week and would like to request a brief extension.",
          "I wanted to ask why the university cafeteria was closed today.",
          "Yes, I brought my umbrella because it was raining heavily outside.",
          "I do not really like reading textbooks in the evening."
        ],
        "correctIndex": 0
      },
      {
        "speaker": "Professor Hayes",
        "speakerAudioText": "I am sorry to hear you were unwell. How many additional days do you realistically need?",
        "options": [
          "Three days would be sufficient for me to complete the bibliography and edit the final draft.",
          "I think I will probably graduate in two years.",
          "The weather was much better yesterday than today.",
          "No, I did not receive any emails from other students."
        ],
        "correctIndex": 0
      },
      {
        "speaker": "Professor Hayes",
        "speakerAudioText": "That seems fair. Please make sure to submit your health clinic slip to the departmental administrator by Friday.",
        "options": [
          "Understood. I will stop by the clinic office this afternoon and submit the documentation.",
          "I prefer studying physics over biology anyway.",
          "Can you lend me a textbook for the weekend?",
          "I am planning to go home for the summer vacation."
        ],
        "correctIndex": 0
      }
    ],
    "summaryPrompt": "In 75 seconds, write a concise summary (35–65 words) describing the meeting, the professor's recommendation, and your agreed course of action."
  },
  {
    "id": "il-2",
    "scenario": "You are consulting a university academic advisor about switching your major from Economics to Computer Science in your sophomore year.",
    "difficulty": "B2",
    "turns": [
      {
        "speaker": "Advisor Martinez",
        "speakerAudioText": "Good afternoon! What brings you into the advising center today?",
        "options": [
          "Good afternoon. I am considering switching my major to Computer Science and want to check credit transfers.",
          "I lost my student ID card in the library yesterday.",
          "I need directions to the campus bookstore.",
          "The tuition fees were already paid by my bank last week."
        ],
        "correctIndex": 0
      },
      {
        "speaker": "Advisor Martinez",
        "speakerAudioText": "Have you already completed the prerequisite Calculus and introductory programming sequences?",
        "options": [
          "I finished Calculus I and II with high marks, but I still need to enroll in Python programming next term.",
          "I usually eat lunch around noon on weekdays.",
          "Calculus is taught on the third floor of the science hall.",
          "No, I have never participated in intramural basketball."
        ],
        "correctIndex": 0
      },
      {
        "speaker": "Advisor Martinez",
        "speakerAudioText": "Excellent. If you register for Programming I over the summer session, you will stay completely on track for four-year graduation.",
        "options": [
          "Thank you for the guidance. I will submit the summer registration petition today.",
          "I do not plan to take any courses during my degree.",
          "My roommate is also an economics student.",
          "The library closes at ten on Friday nights."
        ],
        "correctIndex": 0
      }
    ],
    "summaryPrompt": "In 75 seconds, write a concise summary (35–65 words) detailing why you met the advisor, their academic prerequisite recommendations, and your next step."
  }
,
  {
    "id": "il-3",
    "scenario": "You are a graduate student speaking with your faculty dissertation supervisor regarding changes in your methodology chapter.",
    "difficulty": "B2",
    "turns": [
      {
        "speaker": "Dr. Vance",
        "speakerAudioText": "Good morning. I reviewed the draft of your methodology section. Have you considered using mixed methods instead of purely qualitative interviews?",
        "options": [
          "Good morning Dr. Vance. Yes, incorporating survey data would allow me to triangulate my findings across a larger sample size.",
          "I forgot to return the laboratory keys yesterday afternoon.",
          "The campus bus was running twenty minutes late this morning.",
          "I am thinking about taking a painting class over the weekend."
        ],
        "correctIndex": 0
      },
      {
        "speaker": "Dr. Vance",
        "speakerAudioText": "That would strengthen your empirical rigor significantly. How long will it take you to design and pilot the online survey?",
        "options": [
          "I can draft the questionnaire within ten days and pilot it with a focus group next week.",
          "I usually study in the library until eight in the evening.",
          "Survey forms were invented over a hundred years ago in England.",
          "No, I have never participated in varsity cross-country running."
        ],
        "correctIndex": 0
      },
      {
        "speaker": "Dr. Vance",
        "speakerAudioText": "Excellent timeline. Send me the survey questions as soon as they are ready so we can verify the statistical validity.",
        "options": [
          "I will email the survey draft by next Monday. Thank you for the constructive feedback, Dr. Vance.",
          "I will probably buy a new laptop before next semester begins.",
          "The university cafeteria menu changes every Tuesday morning.",
          "Chemistry was always my favorite subject in high school."
        ],
        "correctIndex": 0
      }
    ],
    "summaryPrompt": "In 75 seconds, write a concise summary (35\u201365 words) summarizing why you met Dr. Vance, the methodological recommendation made, and your agreed timeline."
  }
];

// 7. BANK OF WRITE ABOUT PHOTO (6 questions)
export const writePhotoBank: WritePhotoQuestion[] = [
  {
    "id": "wp-1",
    "imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "altText": "A scientist in a white laboratory coat carefully examining a test tube in an analytical chemistry facility",
    "difficulty": "B2"
  },
  {
    "id": "wp-2",
    "imageUrl": "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=800&q=80",
    "altText": "A diverse group of university students collaborating around a wooden table with laptops in a brightly lit library",
    "difficulty": "B1"
  },
  {
    "id": "wp-3",
    "imageUrl": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    "altText": "A civil engineer wearing a protective hard hat surveying blueprints against a backdrop of construction cranes",
    "difficulty": "B2"
  },
  {
    "id": "wp-4",
    "imageUrl": "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
    "altText": "A corporate professional delivering an interactive presentation in a conference hall with digital charts",
    "difficulty": "B2"
  },
  {
    "id": "wp-5",
    "imageUrl": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    "altText": "Two software developers discussing code logic displayed on dual desktop monitors in a modern open-plan office",
    "difficulty": "B2"
  },
  {
    "id": "wp-6",
    "imageUrl": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    "altText": "A medical researcher adjusting optical lenses on a high-precision laboratory microscope",
    "difficulty": "C1"
  }
,
  {
    "id": "wp-7",
    "imageUrl": "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    "altText": "A healthcare physician in scrubs consulting a digital tablet with patient medical imaging scans",
    "difficulty": "B2"
  },
  {
    "id": "wp-8",
    "imageUrl": "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=800&q=80",
    "altText": "A classroom teacher assisting young students engaged in hands-on science activities at round desks",
    "difficulty": "B1"
  },
  {
    "id": "wp-9",
    "imageUrl": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    "altText": "Modern corporate professionals collaborating in an open-plan glass-walled meeting space with digital whiteboard",
    "difficulty": "B2"
  }
];

// 8. BANK OF INTERACTIVE WRITING (3 prompts)
export const interactiveWritingBank: InteractiveWritingQuestion[] = [
  {
    "id": "iw-1",
    "part1Prompt": "Some people believe that university students should focus strictly on academic subjects related to their careers, while others argue they should take a broad range of general education courses. What is your opinion? Write at least 80 words.",
    "part2Prompt": "Considering your answer above, how should universities support students who feel overwhelmed by taking general education courses outside their primary field? Write at least 50 words.",
    "difficulty": "B2"
  },
  {
    "id": "iw-2",
    "part1Prompt": "With the rise of remote work and digital nomadism, many professionals choose to work outside traditional corporate offices. Discuss the primary advantages and potential drawbacks of this trend. Write at least 80 words.",
    "part2Prompt": "Reflecting on your initial perspective, what specific obligations do employers have toward preserving employee mental health and preventing burnout in remote environments? Write at least 50 words.",
    "difficulty": "B2"
  },
  {
    "id": "iw-3",
    "part1Prompt": "Some governments are investing substantial public funds into exploring deep space, while critics argue that domestic problems on Earth should take absolute priority. What is your stance? Write at least 80 words.",
    "part2Prompt": "Building upon your previous argument, how can technological innovations developed during space missions directly benefit social infrastructure and everyday life on Earth? Write at least 50 words.",
    "difficulty": "C1"
  }
,
  {
    "id": "iw-4",
    "part1Prompt": "Many educators argue that secondary schools should teach personal financial literacy and investing rather than advanced theoretical calculus. What is your perspective? Write at least 80 words.",
    "part2Prompt": "Following up on your answer, how can educational policymakers design a balanced curriculum that equips students with practical financial skills without compromising essential STEM foundations? Write at least 50 words.",
    "difficulty": "B2"
  }
];

// 9. BANK OF WRITING SAMPLE (4 prompts)
export const writingSampleBank: WritingSampleQuestion[] = [
  {
    "id": "ws-1",
    "prompt": "Many countries are investing heavily in public transportation systems rather than building new highways. Discuss the environmental and economic advantages of this policy. Provide reasons and examples from your knowledge or experience. (Aim for 100+ words).",
    "difficulty": "B2"
  },
  {
    "id": "ws-2",
    "prompt": "In general, people are living significantly longer today than in previous generations. Discuss some of the social and economic implications of this phenomenon. (Aim for 100+ words).",
    "difficulty": "B2"
  },
  {
    "id": "ws-3",
    "prompt": "Some educators advocate that all secondary school students should be required to study philosophy and critical thinking. Others contend that vocational and technical subjects should take precedence. Which viewpoint do you support, and why? (Aim for 100+ words).",
    "difficulty": "C1"
  },
  {
    "id": "ws-4",
    "prompt": "Do you believe artificial intelligence tools in universities empower students to conduct higher quality academic research, or do they weaken foundational critical thinking skills? Support your opinion with concrete examples. (Aim for 100+ words).",
    "difficulty": "C1"
  }
,
  {
    "id": "ws-5",
    "prompt": "With globalization and modern telecommunications, some sociologists predict regional dialects and minority languages will vanish within a century. Do you view this cultural homogenization as an inevitable cost of global progress, or should governments invest actively in language preservation? Give detailed reasons. (Aim for 100+ words).",
    "difficulty": "C1"
  }
];
