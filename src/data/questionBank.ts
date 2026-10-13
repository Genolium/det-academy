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

export interface SpeakAboutPhotoQuestion {
  id: string;
  imageUrl: string;
  altText: string;
  topic: string;
  difficulty: DifficultyBand;
  prepTimeSec: number;
  speakTimeSec: number;
  keyThemes: string[];
  modelTranscript: string;
}

export interface SpeakingSampleQuestion {
  id: string;
  prompt: string;
  topic: string;
  difficulty: DifficultyBand;
  prepTimeSec: number;
  speakTimeSec: number;
  keyThemes: string[];
  modelTranscript: string;
}

// readSelectBank
export const readSelectBank: ReadSelectWord[] = [
  {
    "word": "adequate",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "coherent",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "reinforce",
    "isReal": true,
    "difficulty": "B1"
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
    "word": "consequently",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "perspective",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "anonymous",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "injustice",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "preliminary",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "ambiguous",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "consequent",
    "isReal": true,
    "difficulty": "B2"
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
    "word": "subsequent",
    "isReal": true,
    "difficulty": "B2"
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
    "word": "adverse",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "allocation",
    "isReal": true,
    "difficulty": "B2"
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
    "word": "hazard",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "interim",
    "isReal": true,
    "difficulty": "B2"
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
    "word": "scrutinize",
    "isReal": true,
    "difficulty": "B2"
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
    "word": "appliance",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "authentic",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "boost",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "crawl",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "cue",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "digest",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "dumping",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "functional",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "gesture",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "invade",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "legitimate",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "manifest",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "notify",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "noble",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "overtake",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "outlook",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "precision",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "stance",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "skeptical",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "thrive",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "viable",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "venture",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "withstand",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "splendor",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "acquaintance",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "conscientious",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "diplomatic",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "engrossed",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "synonym",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "assembly",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "materialism",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "inexperienced",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "luxury",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "independent",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "juggle",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "intrusion",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "nostalgic",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "slender",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "syllabus",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "wreckage",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "tranquility",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "frustrated",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "concrete",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "breathtaking",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "readership",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "horizon",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "eligible",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "enforce",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "symbolic",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "densely",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "rebellion",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "referendum",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "ignorance",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "stubbornness",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "empirical",
    "isReal": true,
    "difficulty": "C1"
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
    "word": "accord",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "albeit",
    "isReal": true,
    "difficulty": "C1"
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
    "word": "invoke",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "paramount",
    "isReal": true,
    "difficulty": "C1"
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
    "word": "ubiquitous",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "discrepancy",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "inconceivable",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "antiquated",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "serenity",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "superficial",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "intensity",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "constituent",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "retrieve",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "decree",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "delineate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "elucidate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "ephemeral",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "equivocal",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "exemplify",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "fluctuation",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "heterogeneous",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "juxtapose",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "meticulous",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "nominal",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "ostensible",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "pervasive",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "pragmatic",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "proliferation",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "reciprocal",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "redundant",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "scarcity",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "stringent",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "surpass",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "tangible",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "tenable",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "ubiquity",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "unequivocal",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "utilitarian",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "validity",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "venerable",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "vicarious",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "vindicate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "volatile",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "vulnerable",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "warranted",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "zealous",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "aberration",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "advocate",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "aesthetic",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "amalgamate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "anomaly",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "antipathy",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "arbitrary",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "articulate",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "audacious",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "bolster",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "catalyst",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "chronicle",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "circumvent",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "coalition",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "cognitive",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "collateral",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "commensurate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "concession",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "condone",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "conducive",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "conformity",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "conjecture",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "consensus",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "contentious",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "contingent",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "corroborate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "culminate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "cumulative",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "debilitate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "deferential",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "deleterious",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "demographic",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "deplete",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "derivative",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "detrimental",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "dichotomy",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "diffusion",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "diminution",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "discerning",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "discordant",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "disposition",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "disseminate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "divergence",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "diversity",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "dogmatic",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "eclectic",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "efficacy",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "egalitarian",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "eloquent",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "elusive",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "empathy",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "encompass",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "endemic",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "engender",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "enhance",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "enigma",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "entrenched",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "enumerate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "equitable",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "erroneous",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "esoteric",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "evocative",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "exacerbate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "exhaustive",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "expedient",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "explicit",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "exploit",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "fallacious",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "feasible",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "foster",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "generic",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "hierarchical",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "homogeneous",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "hypothesis",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "idiosyncratic",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "immutable",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "impetus",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "implicit",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "incentive",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "indigenous",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "inevitable",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "infer",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "inherent",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "inhibit",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "innovative",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "integral",
    "isReal": true,
    "difficulty": "B2"
  },
  {
    "word": "lucid",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "nuance",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "recapitulate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "repudiate",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "laudable",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "adamant",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "plethora",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "throng",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "adroit",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "perfunctory",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "loathe",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "reminisce",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "exhilarated",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "jubilant",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "morose",
    "isReal": true,
    "difficulty": "C1"
  },
  {
    "word": "grumpy",
    "isReal": true,
    "difficulty": "B1"
  },
  {
    "word": "discern",
    "isReal": true,
    "difficulty": "C1"
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
  },
  {
    "word": "disturbal",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "preclution",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "confusional",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "obviation",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "intersept",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "glorificate",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "tweenish",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "discongruous",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "submissance",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "inelaborate",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "perfunctious",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "implacible",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "unalterity",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "transductive",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "recursivity",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "prevalency",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "disclosive",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "performancy",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "compatient",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "prolongative",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "cogniscent",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "interferant",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "remedialize",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "disagreeablement",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "invariablement",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "concurrance",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "admissative",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "reconstructivement",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "explicitory",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "illustratory",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "distributance",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "concludative",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "appliant",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "represential",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "justificate",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "defendive",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "sustainment",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "conducement",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "resiliance",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "scrutinous",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "plausive",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "mitigativement",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "fluctuant",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "predominancy",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "empiricismal",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "intrinsity",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "paradigmaticism",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "subsequency",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "deteriorative",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "comprehendive",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "invisibleness",
    "isReal": false,
    "difficulty": "B1"
  },
  {
    "word": "authentical",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "hazardment",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "legitimative",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "manifestative",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "precisive",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "skeptity",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "thrivance",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "viabilityment",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "withstander",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "splendorousness",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "diplomatics",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "synonymousness",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "materialistical",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "intrusivenessly",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "tranquilful",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "eligibilityment",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "symbolicalness",
    "isReal": false,
    "difficulty": "B2"
  },
  {
    "word": "inconceivance",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "superficialityment",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "intensitude",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "constituentment",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "delineatory",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "elucidative",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "ephemeralness",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "meticulousity",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "pervasivenessly",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "pragmaticalness",
    "isReal": false,
    "difficulty": "C1"
  },
  {
    "word": "reciprocityment",
    "isReal": false,
    "difficulty": "C1"
  }
];

// fillBlanksBank
export const fillBlanksBank: FillBlanksQuestion[] = [
  {
    "id": "fb-1",
    "sentenceBefore": "Marine biologists have discovered that deep coral reefs are remarkably",
    "givenPrefix": "res",
    "missingLetters": "ilient",
    "sentenceAfter": "to rising water temperatures.",
    "fullWord": "resilient",
    "difficulty": "B2"
  },
  {
    "id": "fb-2",
    "sentenceBefore": "Urban planners emphasize that expanding",
    "givenPrefix": "met",
    "missingLetters": "ropolitan",
    "sentenceAfter": "rail networks reduces vehicular gridlock.",
    "fullWord": "metropolitan",
    "difficulty": "B2"
  },
  {
    "id": "fb-3",
    "sentenceBefore": "The transition toward",
    "givenPrefix": "ren",
    "missingLetters": "ewable",
    "sentenceAfter": "energy sources requires substantial capital investment from governments.",
    "fullWord": "renewable",
    "difficulty": "B1"
  },
  {
    "id": "fb-4",
    "sentenceBefore": "Cognitive psychologists suggest that sleep",
    "givenPrefix": "dep",
    "missingLetters": "rivation",
    "sentenceAfter": "impairs short-term memory consolidation.",
    "fullWord": "deprivation",
    "difficulty": "C1"
  },
  {
    "id": "fb-5",
    "sentenceBefore": "Early agricultural communities relied on",
    "givenPrefix": "art",
    "missingLetters": "ificial",
    "sentenceAfter": "irrigation channels to cultivate arid land.",
    "fullWord": "artificial",
    "difficulty": "B1"
  },
  {
    "id": "fb-6",
    "sentenceBefore": "Archaeologists uncovered ancient cuneiform tablets detailing",
    "givenPrefix": "agr",
    "missingLetters": "eements",
    "sentenceAfter": "between rival city-states.",
    "fullWord": "agreements",
    "difficulty": "B1"
  },
  {
    "id": "fb-7",
    "sentenceBefore": "Specialized enzymes",
    "givenPrefix": "acce",
    "missingLetters": "lerate",
    "sentenceAfter": "biochemical reactions without being consumed in the process.",
    "fullWord": "accelerate",
    "difficulty": "B2"
  },
  {
    "id": "fb-8",
    "sentenceBefore": "Metropolitan districts with abundant",
    "givenPrefix": "veg",
    "missingLetters": "etation",
    "sentenceAfter": "experience significantly lower average temperatures.",
    "fullWord": "vegetation",
    "difficulty": "B1"
  },
  {
    "id": "fb-9",
    "sentenceBefore": "International trade",
    "givenPrefix": "regu",
    "missingLetters": "lations",
    "sentenceAfter": "aim to prevent the exploitation of natural resources.",
    "fullWord": "regulations",
    "difficulty": "B2"
  },
  {
    "id": "fb-10",
    "sentenceBefore": "Sociological research demonstrates that",
    "givenPrefix": "comm",
    "missingLetters": "unity",
    "sentenceAfter": "cohesion fosters collective psychological resilience.",
    "fullWord": "community",
    "difficulty": "B1"
  },
  {
    "id": "fb-11",
    "sentenceBefore": "Industrial emissions of carbon dioxide continue to",
    "givenPrefix": "acce",
    "missingLetters": "lerate",
    "sentenceAfter": "oceanic acidification worldwide.",
    "fullWord": "accelerate",
    "difficulty": "B2"
  },
  {
    "id": "fb-12",
    "sentenceBefore": "The empirical experiment was",
    "givenPrefix": "rep",
    "missingLetters": "licated",
    "sentenceAfter": "across three independent university laboratories.",
    "fullWord": "replicated",
    "difficulty": "C1"
  },
  {
    "id": "fb-13",
    "sentenceBefore": "Linguistic anthropologists study how regional",
    "givenPrefix": "dial",
    "missingLetters": "ects",
    "sentenceAfter": "evolve in isolated mountain communities.",
    "fullWord": "dialects",
    "difficulty": "B2"
  },
  {
    "id": "fb-14",
    "sentenceBefore": "The sudden",
    "givenPrefix": "infl",
    "missingLetters": "ux",
    "sentenceAfter": "of migrant workers transformed the local manufacturing economy.",
    "fullWord": "influx",
    "difficulty": "C1"
  },
  {
    "id": "fb-15",
    "sentenceBefore": "Astronomers utilized space-based",
    "givenPrefix": "tel",
    "missingLetters": "escopes",
    "sentenceAfter": "to detect water vapor in an exoplanetary atmosphere.",
    "fullWord": "telescopes",
    "difficulty": "B1"
  },
  {
    "id": "fb-16",
    "sentenceBefore": "Modern architectural engineering prioritizes seismic",
    "givenPrefix": "sh",
    "missingLetters": "ock",
    "sentenceAfter": "absorbers in earthquake-prone zones.",
    "fullWord": "shock",
    "difficulty": "B2"
  },
  {
    "id": "fb-17",
    "sentenceBefore": "The economic downturn",
    "givenPrefix": "pro",
    "missingLetters": "voked",
    "sentenceAfter": "widespread discussions regarding central bank interest rates.",
    "fullWord": "provoked",
    "difficulty": "B2"
  },
  {
    "id": "fb-18",
    "sentenceBefore": "Neuroscientists observed that adult brains retain significant capacity for",
    "givenPrefix": "plas",
    "missingLetters": "ticity",
    "sentenceAfter": "following injury.",
    "fullWord": "plasticity",
    "difficulty": "C1"
  },
  {
    "id": "fb-19",
    "sentenceBefore": "Philosophical treatises often",
    "givenPrefix": "cont",
    "missingLetters": "emplate",
    "sentenceAfter": "the ethical boundaries of emerging autonomous technologies.",
    "fullWord": "contemplate",
    "difficulty": "C1"
  },
  {
    "id": "fb-20",
    "sentenceBefore": "Agricultural",
    "givenPrefix": "gen",
    "missingLetters": "etics",
    "sentenceAfter": "enable the cultivation of crops with heightened disease resistance.",
    "fullWord": "genetics",
    "difficulty": "B2"
  },
  {
    "id": "fb-21",
    "sentenceBefore": "The unprecedented drought",
    "givenPrefix": "threa",
    "missingLetters": "tened",
    "sentenceAfter": "municipal freshwater reserves throughout the province.",
    "fullWord": "threatened",
    "difficulty": "B1"
  },
  {
    "id": "fb-22",
    "sentenceBefore": "Subterranean fungal",
    "givenPrefix": "myce",
    "missingLetters": "lium",
    "sentenceAfter": "networks exchange vital nutrients with surrounding tree roots.",
    "fullWord": "mycelium",
    "difficulty": "C1"
  },
  {
    "id": "fb-23",
    "sentenceBefore": "The committee reached a",
    "givenPrefix": "cons",
    "missingLetters": "ensus",
    "sentenceAfter": "after extensive deliberative hearings on healthcare policy.",
    "fullWord": "consensus",
    "difficulty": "B2"
  },
  {
    "id": "fb-24",
    "sentenceBefore": "Public health initiatives",
    "givenPrefix": "foc",
    "missingLetters": "used",
    "sentenceAfter": "on preventative nutrition reduce long-term medical expenditures.",
    "fullWord": "focused",
    "difficulty": "B1"
  },
  {
    "id": "fb-25",
    "sentenceBefore": "Paleontologists discovered fossilized",
    "givenPrefix": "ske",
    "missingLetters": "letons",
    "sentenceAfter": "dating back to the late Cretaceous epoch.",
    "fullWord": "skeletons",
    "difficulty": "B1"
  },
  {
    "id": "fb-26",
    "sentenceBefore": "The sudden",
    "givenPrefix": "fluc",
    "missingLetters": "tuation",
    "sentenceAfter": "in currency values disrupted international supply chain logistics.",
    "fullWord": "fluctuation",
    "difficulty": "B2"
  },
  {
    "id": "fb-27",
    "sentenceBefore": "Renewable solar",
    "givenPrefix": "techn",
    "missingLetters": "ology",
    "sentenceAfter": "has achieved parity with fossil fuel generation in many regions.",
    "fullWord": "technology",
    "difficulty": "B1"
  },
  {
    "id": "fb-28",
    "sentenceBefore": "The rapid",
    "givenPrefix": "proli",
    "missingLetters": "feration",
    "sentenceAfter": "of digital devices has transformed childhood developmental patterns.",
    "fullWord": "proliferation",
    "difficulty": "C1"
  },
  {
    "id": "fb-29",
    "sentenceBefore": "Architectural acoustic",
    "givenPrefix": "des",
    "missingLetters": "ign",
    "sentenceAfter": "ensures that spoken lectures remain intelligible without amplification.",
    "fullWord": "design",
    "difficulty": "B1"
  },
  {
    "id": "fb-30",
    "sentenceBefore": "Glaciologists extracted ancient ice",
    "givenPrefix": "co",
    "missingLetters": "res",
    "sentenceAfter": "to measure atmospheric gas concentrations over millennia.",
    "fullWord": "cores",
    "difficulty": "B2"
  },
  {
    "id": "fb-31",
    "sentenceBefore": "The rigorous peer-",
    "givenPrefix": "rev",
    "missingLetters": "iew",
    "sentenceAfter": "process guarantees the empirical validity of scientific publications.",
    "fullWord": "review",
    "difficulty": "B1"
  },
  {
    "id": "fb-32",
    "sentenceBefore": "Urban heat islands exacerbate air",
    "givenPrefix": "pollu",
    "missingLetters": "tion",
    "sentenceAfter": "during peak summer heatwaves.",
    "fullWord": "pollution",
    "difficulty": "B1"
  },
  {
    "id": "fb-33",
    "sentenceBefore": "Volcanic eruptions eject massive",
    "givenPrefix": "quan",
    "missingLetters": "tities",
    "sentenceAfter": "of sulfur dioxide into the upper stratosphere.",
    "fullWord": "quantities",
    "difficulty": "B2"
  },
  {
    "id": "fb-34",
    "sentenceBefore": "Synthetic polymers do not readily",
    "givenPrefix": "biod",
    "missingLetters": "egrade",
    "sentenceAfter": "in natural marine environments.",
    "fullWord": "biodegrade",
    "difficulty": "B2"
  },
  {
    "id": "fb-35",
    "sentenceBefore": "The university provost",
    "givenPrefix": "anno",
    "missingLetters": "unced",
    "sentenceAfter": "the creation of an interdisciplinary environmental research center.",
    "fullWord": "announced",
    "difficulty": "B1"
  },
  {
    "id": "fb-36",
    "sentenceBefore": "Cognitive bias often",
    "givenPrefix": "predis",
    "missingLetters": "poses",
    "sentenceAfter": "investors to overestimate potential market returns.",
    "fullWord": "predisposes",
    "difficulty": "C1"
  },
  {
    "id": "fb-37",
    "sentenceBefore": "The medieval cathedral incorporated flying",
    "givenPrefix": "butt",
    "missingLetters": "resses",
    "sentenceAfter": "to support soaring vaulted ceilings.",
    "fullWord": "buttresses",
    "difficulty": "C1"
  },
  {
    "id": "fb-38",
    "sentenceBefore": "Marine sanctuaries provide safe",
    "givenPrefix": "habi",
    "missingLetters": "tats",
    "sentenceAfter": "for endangered marine mammals to reproduce.",
    "fullWord": "habitats",
    "difficulty": "B1"
  },
  {
    "id": "fb-39",
    "sentenceBefore": "Electrochemical",
    "givenPrefix": "batte",
    "missingLetters": "ries",
    "sentenceAfter": "are crucial components of decentralized microgrid systems.",
    "fullWord": "batteries",
    "difficulty": "B1"
  },
  {
    "id": "fb-40",
    "sentenceBefore": "The historical treaty",
    "givenPrefix": "esta",
    "missingLetters": "blished",
    "sentenceAfter": "lasting diplomatic relations between the rival empires.",
    "fullWord": "established",
    "difficulty": "B1"
  },
  {
    "id": "fb-41",
    "sentenceBefore": "Dendrochronological",
    "givenPrefix": "ana",
    "missingLetters": "lysis",
    "sentenceAfter": "of tree rings provides precise dates for ancient wooden artifacts.",
    "fullWord": "analysis",
    "difficulty": "B2"
  },
  {
    "id": "fb-42",
    "sentenceBefore": "Quantum computing algorithms",
    "givenPrefix": "pro",
    "missingLetters": "mise",
    "sentenceAfter": "to revolutionize cryptographic security models.",
    "fullWord": "promise",
    "difficulty": "B1"
  },
  {
    "id": "fb-43",
    "sentenceBefore": "Coastal mangrove forests",
    "givenPrefix": "pr",
    "missingLetters": "otect",
    "sentenceAfter": "shorelines from destructive hurricane storm surges.",
    "fullWord": "protect",
    "difficulty": "B1"
  },
  {
    "id": "fb-44",
    "sentenceBefore": "Educational sociologists",
    "givenPrefix": "ass",
    "missingLetters": "ert",
    "sentenceAfter": "that early literacy interventions yield profound lifelong benefits.",
    "fullWord": "assert",
    "difficulty": "B2"
  },
  {
    "id": "fb-45",
    "sentenceBefore": "The regional government",
    "givenPrefix": "imp",
    "missingLetters": "osed",
    "sentenceAfter": "stricter emissions standards on heavy freight vehicles.",
    "fullWord": "imposed",
    "difficulty": "B2"
  },
  {
    "id": "fb-46",
    "sentenceBefore": "Bioluminescent",
    "givenPrefix": "org",
    "missingLetters": "anisms",
    "sentenceAfter": "produce cold light through luciferin chemical reactions.",
    "fullWord": "organisms",
    "difficulty": "B2"
  },
  {
    "id": "fb-47",
    "sentenceBefore": "Economic globalization has",
    "givenPrefix": "inc",
    "missingLetters": "reased",
    "sentenceAfter": "interdependence among geographically distant market economies.",
    "fullWord": "increased",
    "difficulty": "B1"
  },
  {
    "id": "fb-48",
    "sentenceBefore": "The museum curator",
    "givenPrefix": "meti",
    "missingLetters": "culously",
    "sentenceAfter": "restored the damaged sixteenth-century oil portrait.",
    "fullWord": "meticulously",
    "difficulty": "C1"
  },
  {
    "id": "fb-49",
    "sentenceBefore": "Microplastic",
    "givenPrefix": "contami",
    "missingLetters": "nation",
    "sentenceAfter": "has been detected in virtually all terrestrial aquatic systems.",
    "fullWord": "contamination",
    "difficulty": "B2"
  },
  {
    "id": "fb-50",
    "sentenceBefore": "The clinical study",
    "givenPrefix": "subst",
    "missingLetters": "antiated",
    "sentenceAfter": "the hypothesis that regular exercise mitigates cardiovascular risk.",
    "fullWord": "substantiated",
    "difficulty": "C1"
  },
  {
    "id": "fb-51",
    "sentenceBefore": "Urban zoning regulations",
    "givenPrefix": "enc",
    "missingLetters": "ourage",
    "sentenceAfter": "mixed-use commercial and residential developments.",
    "fullWord": "encourage",
    "difficulty": "B1"
  },
  {
    "id": "fb-52",
    "sentenceBefore": "Cellular senescence is",
    "givenPrefix": "clo",
    "missingLetters": "sely",
    "sentenceAfter": "linked to physiological aging and chronic tissue inflammation.",
    "fullWord": "closely",
    "difficulty": "B1"
  },
  {
    "id": "fb-53",
    "sentenceBefore": "The diplomatic summit",
    "givenPrefix": "reso",
    "missingLetters": "lved",
    "sentenceAfter": "contentious territorial disputes through bilateral compromises.",
    "fullWord": "resolved",
    "difficulty": "B2"
  },
  {
    "id": "fb-54",
    "sentenceBefore": "Deep groundwater",
    "givenPrefix": "aqui",
    "missingLetters": "fers",
    "sentenceAfter": "take centuries to recharge after intensive industrial extraction.",
    "fullWord": "aquifers",
    "difficulty": "C1"
  },
  {
    "id": "fb-55",
    "sentenceBefore": "The experimental apparatus",
    "givenPrefix": "det",
    "missingLetters": "ected",
    "sentenceAfter": "minute gravitational oscillations from distant stellar collisions.",
    "fullWord": "detected",
    "difficulty": "B2"
  }
];

// cTestBank
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
        "suffix": "advancements in"
      },
      {
        "prefix": "photov",
        "missing": "oltaic",
        "suffix": "technology"
      },
      {
        "prefix": "ha",
        "missing": "ve",
        "suffix": "dramatically"
      },
      {
        "prefix": "lowe",
        "missing": "red",
        "suffix": "equipment"
      },
      {
        "prefix": "manufac",
        "missing": "turing",
        "suffix": "expenses for"
      },
      {
        "prefix": "homeo",
        "missing": "wners",
        "suffix": "."
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
        "missing": "ge",
        "suffix": "municipal"
      },
      {
        "prefix": "par",
        "missing": "ks",
        "suffix": "provide"
      },
      {
        "prefix": "sa",
        "missing": "fe",
        "suffix": "shelters for"
      },
      {
        "prefix": "bir",
        "missing": "ds",
        "suffix": "and"
      },
      {
        "prefix": "pollin",
        "missing": "ators",
        "suffix": "that"
      },
      {
        "prefix": "pl",
        "missing": "ay",
        "suffix": "vital"
      },
      {
        "prefix": "ecolo",
        "missing": "gical",
        "suffix": "roles in neighborhoods."
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
        "missing": "omous",
        "suffix": "robotic"
      },
      {
        "prefix": "vehi",
        "missing": "cles",
        "suffix": "navigate"
      },
      {
        "prefix": "inte",
        "missing": "nse",
        "suffix": "hydrostatic"
      },
      {
        "prefix": "press",
        "missing": "ures",
        "suffix": "to"
      },
      {
        "prefix": "capt",
        "missing": "ure",
        "suffix": "detailed"
      },
      {
        "prefix": "imag",
        "missing": "ery",
        "suffix": "along"
      },
      {
        "prefix": "abys",
        "missing": "sal",
        "suffix": "seabed trenches."
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
        "missing": "en",
        "suffix": "individuals"
      },
      {
        "prefix": "conf",
        "missing": "ront",
        "suffix": "complicated"
      },
      {
        "prefix": "finan",
        "missing": "cial",
        "suffix": "dilemmas,"
      },
      {
        "prefix": "th",
        "missing": "ey",
        "suffix": "frequently"
      },
      {
        "prefix": "re",
        "missing": "ly",
        "suffix": "on"
      },
      {
        "prefix": "intui",
        "missing": "tive",
        "suffix": "mental"
      },
      {
        "prefix": "short",
        "missing": "cuts",
        "suffix": "rather than mathematical logic."
      }
    ],
    "lastSentence": "Researchers emphasize that recognizing these irrational tendencies enables citizens to make prudent investments."
  },
  {
    "id": "ct-5",
    "title": "Glacial Geology & Climate Records",
    "difficulty": "C1",
    "firstSentence": "Deep ice cores extracted from polar ice sheets provide invaluable archives of terrestrial atmospheric history.",
    "damagedTokens": [
      {
        "prefix": "Analy",
        "missing": "zing",
        "suffix": "ancient air"
      },
      {
        "prefix": "bubb",
        "missing": "les",
        "suffix": "preserved in"
      },
      {
        "prefix": "glac",
        "missing": "ial",
        "suffix": "ice"
      },
      {
        "prefix": "lay",
        "missing": "ers",
        "suffix": "helps"
      },
      {
        "prefix": "scien",
        "missing": "tists",
        "suffix": "reconstruct"
      },
      {
        "prefix": "histo",
        "missing": "rical",
        "suffix": "greenhouse gas"
      },
      {
        "prefix": "concent",
        "missing": "rations",
        "suffix": "over millennia."
      }
    ],
    "lastSentence": "These empirical records indicate that industrial greenhouse emissions are altering global climate at an unprecedented rate."
  },
  {
    "id": "ct-6",
    "title": "Agricultural Biodiversity & Food Security",
    "difficulty": "B2",
    "firstSentence": "Modern agricultural monocultures are remarkably vulnerable to emergent fungal pathogens and unpredictable weather fluctuations.",
    "damagedTokens": [
      {
        "prefix": "Prese",
        "missing": "rving",
        "suffix": "ancestral"
      },
      {
        "prefix": "heir",
        "missing": "loom",
        "suffix": "seeds in"
      },
      {
        "prefix": "regi",
        "missing": "onal",
        "suffix": "germplasm"
      },
      {
        "prefix": "reposi",
        "missing": "tories",
        "suffix": "ensures"
      },
      {
        "prefix": "th",
        "missing": "at",
        "suffix": "plant"
      },
      {
        "prefix": "geneti",
        "missing": "cists",
        "suffix": "retain"
      },
      {
        "prefix": "acc",
        "missing": "ess",
        "suffix": "to resilient traits."
      }
    ],
    "lastSentence": "Agronomists contend that cultivating diverse botanical species guarantees long term resilience against catastrophic harvest failures."
  },
  {
    "id": "ct-7",
    "title": "Ancient Metallurgy and Civilization",
    "difficulty": "C1",
    "firstSentence": "The discovery of bronze alloy production marked a pivotal transition in ancient Eurasian societal organization.",
    "damagedTokens": [
      {
        "prefix": "Smel",
        "missing": "ting",
        "suffix": "native"
      },
      {
        "prefix": "cop",
        "missing": "per",
        "suffix": "ore"
      },
      {
        "prefix": "wi",
        "missing": "th",
        "suffix": "imported tin"
      },
      {
        "prefix": "requ",
        "missing": "ired",
        "suffix": "extensive"
      },
      {
        "prefix": "transcon",
        "missing": "tinental",
        "suffix": "trade"
      },
      {
        "prefix": "netw",
        "missing": "orks",
        "suffix": "across"
      },
      {
        "prefix": "mounta",
        "missing": "inous",
        "suffix": "provinces."
      }
    ],
    "lastSentence": "Consequently, administrative elites emerged to control the distribution of valuable metallic ingots and weapons."
  },
  {
    "id": "ct-8",
    "title": "Cognitive Linguistics and Metaphor",
    "difficulty": "B2",
    "firstSentence": "Linguists argue that metaphorical expressions are not merely decorative figures of speech.",
    "damagedTokens": [
      {
        "prefix": "Inst",
        "missing": "ead",
        "suffix": ", conceptual"
      },
      {
        "prefix": "metap",
        "missing": "hors",
        "suffix": "structure how"
      },
      {
        "prefix": "hum",
        "missing": "ans",
        "suffix": "perceive"
      },
      {
        "prefix": "abst",
        "missing": "ract",
        "suffix": "ideas"
      },
      {
        "prefix": "su",
        "missing": "ch",
        "suffix": "as"
      },
      {
        "prefix": "temp",
        "missing": "oral",
        "suffix": "duration and"
      },
      {
        "prefix": "interpe",
        "missing": "rsonal",
        "suffix": "conflict."
      }
    ],
    "lastSentence": "For instance, conceptualizing time as money fundamentally shapes how individuals prioritize daily professional duties."
  },
  {
    "id": "ct-9",
    "title": "Coral Reef Acidification",
    "difficulty": "B2",
    "firstSentence": "Elevated concentrations of atmospheric carbon dioxide are driving progressive chemical shifts in marine environments.",
    "damagedTokens": [
      {
        "prefix": "Wh",
        "missing": "en",
        "suffix": "ocean"
      },
      {
        "prefix": "wat",
        "missing": "ers",
        "suffix": "absorb"
      },
      {
        "prefix": "exc",
        "missing": "ess",
        "suffix": "carbon"
      },
      {
        "prefix": "emiss",
        "missing": "ions",
        "suffix": ", surface"
      },
      {
        "prefix": "seaw",
        "missing": "ater",
        "suffix": "becomes"
      },
      {
        "prefix": "increa",
        "missing": "singly",
        "suffix": "acidic and"
      },
      {
        "prefix": "depr",
        "missing": "ives",
        "suffix": "mollusks of calcium."
      }
    ],
    "lastSentence": "This acidification severely inhibits the calcification processes necessary for reef building corals to construct durable skeletons."
  },
  {
    "id": "ct-10",
    "title": "Autonomous Transportation Infrastructure",
    "difficulty": "B2",
    "firstSentence": "Self-driving vehicles rely on complex sensor arrays to navigate unpredictable urban traffic conditions safely.",
    "damagedTokens": [
      {
        "prefix": "Opti",
        "missing": "cal",
        "suffix": "video"
      },
      {
        "prefix": "came",
        "missing": "ras",
        "suffix": "and"
      },
      {
        "prefix": "rad",
        "missing": "ar",
        "suffix": "scanners"
      },
      {
        "prefix": "det",
        "missing": "ect",
        "suffix": "nearby"
      },
      {
        "prefix": "pedest",
        "missing": "rians",
        "suffix": ", cyclists, and"
      },
      {
        "prefix": "la",
        "missing": "ne",
        "suffix": "boundaries"
      },
      {
        "prefix": "wit",
        "missing": "hin",
        "suffix": "fractions of a second."
      }
    ],
    "lastSentence": "Urban planners project that widespread vehicular automation could drastically reduce collision rates and roadway fatalities."
  },
  {
    "id": "ct-11",
    "title": "Astrophysics of Exoplanetary Atmospheres",
    "difficulty": "C1",
    "firstSentence": "Astronomers utilize transit spectroscopy to examine the chemical composition of planets orbiting distant stars.",
    "damagedTokens": [
      {
        "prefix": "When",
        "missing": "ever",
        "suffix": "an"
      },
      {
        "prefix": "exopl",
        "missing": "anet",
        "suffix": "transits"
      },
      {
        "prefix": "acr",
        "missing": "oss",
        "suffix": "its"
      },
      {
        "prefix": "ho",
        "missing": "st",
        "suffix": "star,"
      },
      {
        "prefix": "starl",
        "missing": "ight",
        "suffix": "filters"
      },
      {
        "prefix": "thro",
        "missing": "ugh",
        "suffix": "gaseous"
      },
      {
        "prefix": "upp",
        "missing": "er",
        "suffix": "atmospheric layers toward sensitive orbital telescopes."
      }
    ],
    "lastSentence": "By analyzing distinct molecular absorption lines, researchers can detect water vapor, methane, and atmospheric carbon."
  },
  {
    "id": "ct-12",
    "title": "The Architecture of Medieval Cathedrals",
    "difficulty": "B2",
    "firstSentence": "Gothic master builders revolutionized structural engineering to maximize interior natural illumination.",
    "damagedTokens": [
      {
        "prefix": "Poin",
        "missing": "ted",
        "suffix": "stone"
      },
      {
        "prefix": "arc",
        "missing": "hes",
        "suffix": "and"
      },
      {
        "prefix": "rib",
        "missing": "bed",
        "suffix": "ceiling"
      },
      {
        "prefix": "vau",
        "missing": "lts",
        "suffix": "distributed"
      },
      {
        "prefix": "hea",
        "missing": "vy",
        "suffix": "masonry"
      },
      {
        "prefix": "wei",
        "missing": "ght",
        "suffix": "outward"
      },
      {
        "prefix": "tow",
        "missing": "ard",
        "suffix": "external supporting buttresses."
      }
    ],
    "lastSentence": "This enabled master masons to replace thick stone fortifications with expansive stained glass windows."
  },
  {
    "id": "ct-13",
    "title": "Synthetic Biology and Enzyme Engineering",
    "difficulty": "C1",
    "firstSentence": "Bioengineers are redesigning natural catalytic enzymes to decompose persistent industrial pollutants in soil.",
    "damagedTokens": [
      {
        "prefix": "Computa",
        "missing": "tional",
        "suffix": "molecular"
      },
      {
        "prefix": "mode",
        "missing": "ling",
        "suffix": "predicts"
      },
      {
        "prefix": "opti",
        "missing": "mal",
        "suffix": "amino"
      },
      {
        "prefix": "ac",
        "missing": "id",
        "suffix": "sequences"
      },
      {
        "prefix": "th",
        "missing": "at",
        "suffix": "stabilize"
      },
      {
        "prefix": "prot",
        "missing": "ein",
        "suffix": "structures"
      },
      {
        "prefix": "und",
        "missing": "er",
        "suffix": "extreme temperatures."
      }
    ],
    "lastSentence": "These engineered biocatalysts can break down non-biodegradable plastics into harmless organic compounds."
  },
  {
    "id": "ct-14",
    "title": "Urban Heat Islands and Microclimates",
    "difficulty": "B1",
    "firstSentence": "Densely built metropolitan zones absorb and re-emit solar radiation far more than rural surroundings.",
    "damagedTokens": [
      {
        "prefix": "Da",
        "missing": "rk",
        "suffix": "asphalt"
      },
      {
        "prefix": "pavem",
        "missing": "ents",
        "suffix": "and"
      },
      {
        "prefix": "conc",
        "missing": "rete",
        "suffix": "structures"
      },
      {
        "prefix": "tr",
        "missing": "ap",
        "suffix": "thermal"
      },
      {
        "prefix": "ene",
        "missing": "rgy",
        "suffix": "during"
      },
      {
        "prefix": "dayt",
        "missing": "ime",
        "suffix": "hours and"
      },
      {
        "prefix": "rele",
        "missing": "ase",
        "suffix": "it slowly throughout the night."
      }
    ],
    "lastSentence": "Installing reflective roofing and planting street trees substantially alleviates nocturnal heat stress for city inhabitants."
  },
  {
    "id": "ct-15",
    "title": "Neural Plasticity and Lifelong Learning",
    "difficulty": "B2",
    "firstSentence": "Neurobiological discoveries demonstrate that mature brains continue forming novel synaptic connections throughout adulthood.",
    "damagedTokens": [
      {
        "prefix": "Acqui",
        "missing": "ring",
        "suffix": "unfamiliar"
      },
      {
        "prefix": "langu",
        "missing": "ages",
        "suffix": "stimulates"
      },
      {
        "prefix": "dendr",
        "missing": "itic",
        "suffix": "growth and"
      },
      {
        "prefix": "reinf",
        "missing": "orces",
        "suffix": "neural"
      },
      {
        "prefix": "path",
        "missing": "ways",
        "suffix": "across"
      },
      {
        "prefix": "bo",
        "missing": "th",
        "suffix": "cerebral"
      },
      {
        "prefix": "hemisp",
        "missing": "heres",
        "suffix": "."
      }
    ],
    "lastSentence": "Regular cognitive engagement thereby builds a cognitive reserve that mitigates age-related memory deterioration."
  },
  {
    "id": "ct-16",
    "title": "Volcanic Ash and Global Temperature",
    "difficulty": "B2",
    "firstSentence": "Cataclysmic volcanic eruptions can alter hemispheric weather patterns for several consecutive years.",
    "damagedTokens": [
      {
        "prefix": "Explo",
        "missing": "sive",
        "suffix": "eruption"
      },
      {
        "prefix": "plu",
        "missing": "mes",
        "suffix": "inject"
      },
      {
        "prefix": "sul",
        "missing": "fur",
        "suffix": "dioxide"
      },
      {
        "prefix": "aero",
        "missing": "sols",
        "suffix": "directly"
      },
      {
        "prefix": "in",
        "missing": "to",
        "suffix": "the"
      },
      {
        "prefix": "strato",
        "missing": "sphere",
        "suffix": ", forming"
      },
      {
        "prefix": "refle",
        "missing": "ctive",
        "suffix": "microscopic droplet veils."
      }
    ],
    "lastSentence": "These airborne aerosol particles reflect incoming sunlight back into space, triggering temporary global cooling anomalies."
  },
  {
    "id": "ct-17",
    "title": "The Economics of Circular Waste Management",
    "difficulty": "C1",
    "firstSentence": "Traditional linear manufacturing models follow an unsustainable pattern of resource extraction and disposal.",
    "damagedTokens": [
      {
        "prefix": "Circ",
        "missing": "ular",
        "suffix": "economic"
      },
      {
        "prefix": "frame",
        "missing": "works",
        "suffix": "recover"
      },
      {
        "prefix": "valu",
        "missing": "able",
        "suffix": "metals and"
      },
      {
        "prefix": "poly",
        "missing": "mers",
        "suffix": "from"
      },
      {
        "prefix": "disca",
        "missing": "rded",
        "suffix": "electronics for"
      },
      {
        "prefix": "remanufa",
        "missing": "cturing",
        "suffix": "into"
      },
      {
        "prefix": "cons",
        "missing": "umer",
        "suffix": "devices."
      }
    ],
    "lastSentence": "By recycling rare minerals and synthetic compounds, industrial firms simultaneously reduce raw procurement costs and pollution."
  },
  {
    "id": "ct-18",
    "title": "Marine Acoustic Ecology and Cetaceans",
    "difficulty": "C1",
    "firstSentence": "Whales and dolphins depend on acoustic echolocation for navigation and long distance communication.",
    "damagedTokens": [
      {
        "prefix": "Comme",
        "missing": "rcial",
        "suffix": "cargo"
      },
      {
        "prefix": "shi",
        "missing": "ps",
        "suffix": "generate"
      },
      {
        "prefix": "inte",
        "missing": "nse",
        "suffix": "low-frequency noise"
      },
      {
        "prefix": "th",
        "missing": "at",
        "suffix": "disrupts"
      },
      {
        "prefix": "ceta",
        "missing": "cean",
        "suffix": "vocalizations"
      },
      {
        "prefix": "acr",
        "missing": "oss",
        "suffix": "entire"
      },
      {
        "prefix": "oce",
        "missing": "an",
        "suffix": "basins."
      }
    ],
    "lastSentence": "This chronic anthropomorphic acoustic disturbance impairs foraging efficiency and elevates physiological stress hormones in marine mammals."
  },
  {
    "id": "ct-19",
    "title": "Dendrochronology and Ancient Climate Patterns",
    "difficulty": "B2",
    "firstSentence": "Concentric growth rings preserved inside ancient trees document annual local hydrological variations.",
    "damagedTokens": [
      {
        "prefix": "Wi",
        "missing": "de",
        "suffix": "annular"
      },
      {
        "prefix": "rin",
        "missing": "gs",
        "suffix": "indicate"
      },
      {
        "prefix": "peri",
        "missing": "ods",
        "suffix": "of"
      },
      {
        "prefix": "abun",
        "missing": "dant",
        "suffix": "precipitation,"
      },
      {
        "prefix": "wher",
        "missing": "eas",
        "suffix": "narrow"
      },
      {
        "prefix": "rin",
        "missing": "gs",
        "suffix": "correspond to"
      },
      {
        "prefix": "sev",
        "missing": "ere",
        "suffix": "regional drought conditions."
      }
    ],
    "lastSentence": "By cross-dating timber across multiple historic archaeological sites, paleoclimatologists reconstruct precipitation records spanning millennia."
  },
  {
    "id": "ct-20",
    "title": "Quantum Computing and Cryptography",
    "difficulty": "C1",
    "firstSentence": "Quantum computing architectures exploit superposition and entanglement to solve computational problems at extraordinary speeds.",
    "damagedTokens": [
      {
        "prefix": "Theore",
        "missing": "tical",
        "suffix": "quantum"
      },
      {
        "prefix": "proce",
        "missing": "ssors",
        "suffix": "could"
      },
      {
        "prefix": "fac",
        "missing": "tor",
        "suffix": "large"
      },
      {
        "prefix": "pri",
        "missing": "me",
        "suffix": "numbers"
      },
      {
        "prefix": "quic",
        "missing": "kly",
        "suffix": ", rendering"
      },
      {
        "prefix": "conven",
        "missing": "tional",
        "suffix": "public-key encryption"
      },
      {
        "prefix": "stand",
        "missing": "ards",
        "suffix": "obsolete."
      }
    ],
    "lastSentence": "Consequently, cybersecurity mathematicians are rapidly establishing quantum-resistant cryptographic algorithms to safeguard future global communications."
  },
  {
    "id": "ct-21",
    "title": "The Restoration of Historic Wetland Ecosystems",
    "difficulty": "B2",
    "firstSentence": "Ecological restoration teams are dismantling artificial dikes to reconnect inland rivers with natural floodplains.",
    "damagedTokens": [
      {
        "prefix": "Rejuve",
        "missing": "nated",
        "suffix": "marshland"
      },
      {
        "prefix": "ecosy",
        "missing": "stems",
        "suffix": "filter"
      },
      {
        "prefix": "agricu",
        "missing": "ltural",
        "suffix": "runoff and"
      },
      {
        "prefix": "sedi",
        "missing": "ment",
        "suffix": "naturally"
      },
      {
        "prefix": "bef",
        "missing": "ore",
        "suffix": "fresh"
      },
      {
        "prefix": "wat",
        "missing": "er",
        "suffix": "empties"
      },
      {
        "prefix": "in",
        "missing": "to",
        "suffix": "coastal estuaries."
      }
    ],
    "lastSentence": "Restored wetlands also serve as vital buffers that absorb catastrophic floods while creating sanctuaries for migratory waterfowl."
  },
  {
    "id": "ct-22",
    "title": "Microscopic Fungi and Forest Mycelial Networks",
    "difficulty": "C1",
    "firstSentence": "Beneath the forest floor, vast mycorrhizal networks link individual trees into cooperative biological communities.",
    "damagedTokens": [
      {
        "prefix": "Subter",
        "missing": "ranean",
        "suffix": "fungal"
      },
      {
        "prefix": "thre",
        "missing": "ads",
        "suffix": "transport"
      },
      {
        "prefix": "essen",
        "missing": "tial",
        "suffix": "phosphorus and"
      },
      {
        "prefix": "nitr",
        "missing": "ogen",
        "suffix": "between"
      },
      {
        "prefix": "neighb",
        "missing": "oring",
        "suffix": "trees in"
      },
      {
        "prefix": "exch",
        "missing": "ange",
        "suffix": "for"
      },
      {
        "prefix": "photosy",
        "missing": "nthetic",
        "suffix": "carbohydrates."
      }
    ],
    "lastSentence": "In return, mature canopy trees supply the subterranean fungi with photosynthetic sugars, sustaining the entire forest biome."
  }
];

// listenTypeBank
export const listenTypeBank: ListenTypeQuestion[] = [
  {
    "id": "lt-1",
    "audioSentence": "The university library will extend its opening hours during the upcoming examination period.",
    "difficulty": "B1"
  },
  {
    "id": "lt-2",
    "audioSentence": "Scientific researchers must substantiate their theoretical hypotheses with verifiable empirical data.",
    "difficulty": "C1"
  },
  {
    "id": "lt-3",
    "audioSentence": "Recent advancements in renewable technology have significantly reduced solar panel manufacturing costs.",
    "difficulty": "B2"
  },
  {
    "id": "lt-4",
    "audioSentence": "Urban planners are designing dedicated cycling lanes to minimize morning traffic congestion.",
    "difficulty": "B1"
  },
  {
    "id": "lt-5",
    "audioSentence": "Marine biologists observed unexpected behavioral changes among apex predators in the sanctuary.",
    "difficulty": "B2"
  },
  {
    "id": "lt-6",
    "audioSentence": "The sudden economic downturn prompted international monetary authorities to reconsider interest rates.",
    "difficulty": "B2"
  },
  {
    "id": "lt-7",
    "audioSentence": "Deep ice core samples provide invaluable historical records of prehistoric atmospheric composition.",
    "difficulty": "C1"
  },
  {
    "id": "lt-8",
    "audioSentence": "All undergraduate students must submit their laboratory safety protocols before conducting experiments.",
    "difficulty": "B1"
  },
  {
    "id": "lt-9",
    "audioSentence": "Glacial melting in polar regions directly contributes to rising global sea levels.",
    "difficulty": "B1"
  },
  {
    "id": "lt-10",
    "audioSentence": "Cognitive psychology explores how subconscious biases alter human decision-making processes.",
    "difficulty": "B2"
  },
  {
    "id": "lt-11",
    "audioSentence": "The newly appointed dean delivered an inspiring keynote lecture on academic integrity.",
    "difficulty": "B2"
  },
  {
    "id": "lt-12",
    "audioSentence": "Technological disruption has fundamentally reshaped contemporary communication across global networks.",
    "difficulty": "B2"
  },
  {
    "id": "lt-13",
    "audioSentence": "Ancient agricultural settlements relied on systematic irrigation systems to cultivate arid landscapes.",
    "difficulty": "B2"
  },
  {
    "id": "lt-14",
    "audioSentence": "The research committee agreed that further clinical trials are necessary to verify the treatment.",
    "difficulty": "B2"
  },
  {
    "id": "lt-15",
    "audioSentence": "Metropolitan districts with green rooftop gardens report significantly lower ambient temperatures.",
    "difficulty": "B2"
  },
  {
    "id": "lt-16",
    "audioSentence": "Students who encounter difficulties with the syllabus should consult their academic advisors.",
    "difficulty": "B1"
  },
  {
    "id": "lt-17",
    "audioSentence": "The archaeological expedition uncovered ceramic artifacts dating back to the third century.",
    "difficulty": "B2"
  },
  {
    "id": "lt-18",
    "audioSentence": "Industrial manufacturing facilities must strictly comply with regional environmental regulations.",
    "difficulty": "B2"
  },
  {
    "id": "lt-19",
    "audioSentence": "The transition to electric transportation requires substantial investments in charging infrastructure.",
    "difficulty": "B2"
  },
  {
    "id": "lt-20",
    "audioSentence": "Several prominent international economists debated the long-term consequences of fiscal inflation.",
    "difficulty": "C1"
  },
  {
    "id": "lt-21",
    "audioSentence": "Microscopic analysis revealed that the bacterial culture had developed resistance to antibiotics.",
    "difficulty": "B2"
  },
  {
    "id": "lt-22",
    "audioSentence": "The faculty symposium on artificial intelligence attracted scholars from various scientific disciplines.",
    "difficulty": "C1"
  },
  {
    "id": "lt-23",
    "audioSentence": "A substantial majority of registered voters favored the constitutional amendment on public education.",
    "difficulty": "B2"
  },
  {
    "id": "lt-24",
    "audioSentence": "Satellite telemetry allows climatologists to track migratory patterns of endangered wildlife species.",
    "difficulty": "C1"
  },
  {
    "id": "lt-25",
    "audioSentence": "The historical manuscript was carefully preserved inside a temperature-controlled archival vault.",
    "difficulty": "B2"
  },
  {
    "id": "lt-26",
    "audioSentence": "Regular cardiovascular exercise has been shown to enhance cognitive function in older adults.",
    "difficulty": "B1"
  },
  {
    "id": "lt-27",
    "audioSentence": "The department will host an orientation workshop for incoming international graduate students.",
    "difficulty": "B1"
  },
  {
    "id": "lt-28",
    "audioSentence": "Coastal communities face increasing flood risks due to intensified storm surges and rising tides.",
    "difficulty": "B2"
  },
  {
    "id": "lt-29",
    "audioSentence": "Interdisciplinary collaboration between engineers and biologists has yielded innovative medical devices.",
    "difficulty": "C1"
  },
  {
    "id": "lt-30",
    "audioSentence": "The peer review process ensures that published research adheres to rigorous academic standards.",
    "difficulty": "B2"
  },
  {
    "id": "lt-31",
    "audioSentence": "Volcanic ash clouds can disrupt commercial aviation routes across vast geographic distances.",
    "difficulty": "B2"
  },
  {
    "id": "lt-32",
    "audioSentence": "The scholarship committee evaluates applicants based on academic excellence and community service.",
    "difficulty": "B1"
  },
  {
    "id": "lt-33",
    "audioSentence": "Synthetic polymers take several hundred years to decompose under natural environmental conditions.",
    "difficulty": "B2"
  },
  {
    "id": "lt-34",
    "audioSentence": "The visiting professor will conduct a series of specialized seminars on quantum thermodynamics.",
    "difficulty": "C1"
  },
  {
    "id": "lt-35",
    "audioSentence": "Public transit subsidies encourage metropolitan residents to leave private vehicles at home.",
    "difficulty": "B1"
  },
  {
    "id": "lt-36",
    "audioSentence": "Botanical researchers have classified several previously unknown plant species in the rainforest.",
    "difficulty": "B2"
  },
  {
    "id": "lt-37",
    "audioSentence": "The architecture of ancient amphitheaters was engineered to amplify natural acoustic resonance.",
    "difficulty": "C1"
  },
  {
    "id": "lt-38",
    "audioSentence": "Graduate teaching assistants are scheduled to hold office hours twice every week.",
    "difficulty": "B1"
  },
  {
    "id": "lt-39",
    "audioSentence": "The introduction of automated harvesting machinery revolutionized nineteenth-century agriculture.",
    "difficulty": "B2"
  },
  {
    "id": "lt-40",
    "audioSentence": "Neuroimaging studies demonstrate that musical training alters structural brain connectivity.",
    "difficulty": "C1"
  },
  {
    "id": "lt-41",
    "audioSentence": "The municipal council approved the construction of a new pedestrian bridge downtown.",
    "difficulty": "B1"
  },
  {
    "id": "lt-42",
    "audioSentence": "Atmospheric carbon concentrations have exceeded levels recorded over the past millennium.",
    "difficulty": "B2"
  },
  {
    "id": "lt-43",
    "audioSentence": "Students must complete all prerequisite coursework prior to registering for advanced seminars.",
    "difficulty": "B2"
  },
  {
    "id": "lt-44",
    "audioSentence": "The laboratory technician calibrated the diagnostic apparatus before commencing the experiment.",
    "difficulty": "C1"
  },
  {
    "id": "lt-45",
    "audioSentence": "Renewable offshore wind farms generate clean electricity without emitting greenhouse gases.",
    "difficulty": "B1"
  },
  {
    "id": "lt-46",
    "audioSentence": "The philosophical debate examined whether moral obligations are universal or culturally contingent.",
    "difficulty": "C1"
  },
  {
    "id": "lt-47",
    "audioSentence": "Marine protected reserves have allowed depleted commercial fish stocks to recover steadily.",
    "difficulty": "B2"
  },
  {
    "id": "lt-48",
    "audioSentence": "The final draft of the dissertation must include a comprehensive bibliography of primary sources.",
    "difficulty": "B2"
  },
  {
    "id": "lt-49",
    "audioSentence": "Dendrochronology uses annual growth rings in trees to reconstruct past climatic fluctuations.",
    "difficulty": "C1"
  },
  {
    "id": "lt-50",
    "audioSentence": "The global transition toward sustainable energy represents an urgent technological challenge.",
    "difficulty": "B2"
  }
];

// interactiveReadingBank
export const interactiveReadingBank: InteractiveReadingBlock[] = [
  {
    "id": "ir-1",
    "passageTitle": "Origins of Agricultural Domestication in the Fertile Crescent",
    "passageText": "The transition from nomadic foraging to settled agrarian communities represented one of the most transformative revolutions in human prehistory. Approximately eleven thousand years ago across the Fertile Crescent, hunter-gatherer bands began systematically cultivating wild grasses such as einkorn wheat and barley. Rather than exhausting geographical areas and continually migrating, human populations established permanent mud-brick villages near perennial riverbeds.\n\nOver successive centuries, artificial selective breeding fundamentally transformed wild botanical species. Farmers systematically harvested grains with non-shattering seed stalks, ensuring that seeds remained attached to the ear until collected. Furthermore, communal grain silos enabled long-term caloric storage, supporting specialized artisans, builders, and administrators whose labor was detached from direct food extraction.",
    "difficulty": "B2",
    "gapSentence": {
      "before": "Hunter-gatherer bands began systematically cultivating wild grasses such as einkorn wheat and barley, which gradually",
      "options": [
        "diminished",
        "incentivized",
        "interrupted",
        "disbanded"
      ],
      "correct": "incentivized",
      "after": "permanent settlement."
    },
    "sentenceOptions": {
      "options": [
        "Nevertheless, modern agricultural methods remain largely unchanged from prehistoric techniques.",
        "This structural shift in food production profoundly altered ancient demographic patterns and technological specialization.",
        "Nomadic foragers, however, refused to abandon their seasonal migration circuits across high alpine plateaus.",
        "Consequently, metal tools completely disappeared from archaeological strata for several centuries."
      ],
      "correctIndex": 1
    },
    "highlightPrompt": "Highlight the specific botanical trait that prehistoric farmers selected to ensure seeds stayed on the plant until harvesting.",
    "highlightCorrectSubstring": "non-shattering seed stalks",
    "mainIdeaQuestion": {
      "question": "What is the primary thesis of the passage regarding the agricultural revolution in the Fertile Crescent?",
      "options": [
        "Early agricultural methods were less reliable than nomadic foraging for human nutrition.",
        "Communal grain silos were developed primarily for military fortification against rival tribes.",
        "The shift to plant cultivation fostered permanent settlements, selective breeding, and socioeconomic specialization.",
        "Hunter-gatherers were forced into farming solely due to abrupt climate cooling events."
      ],
      "correctIndex": 2
    },
    "titleQuestion": {
      "question": "Which title best captures the overarching theme of this passage?",
      "options": [
        "The Nutritional Limitations of Prehistoric Wheat Cultivation",
        "Nomadic Hunting Tactics in Ancient Mesopotamia",
        "The Decline of Urban Centers in the Fertile Crescent",
        "From Foraging to Farming: The Dawn of Sedentary Civilization"
      ],
      "correctIndex": 3
    }
  },
  {
    "id": "ir-2",
    "passageTitle": "Bioluminescence and Ecological Signaling in Abyssal Ecosystems",
    "passageText": "In the perpetual darkness of the deep oceanic bathypelagic zone, sunlight cannot penetrate beyond a depth of one thousand meters. Consequently, more than ninety percent of marine fauna inhabiting these abyssal waters have evolved intrinsic bioluminescent capabilities. Through controlled enzymatic reactions involving luciferin and luciferase, organisms produce cold biochemical light without wasting energy as heat.\n\nBioluminescent emissions serve diverse evolutionary survival strategies in the bathypelagic realm. Many predatory species, such as anglerfish, utilize glowing photophore lures suspended over their jaws to entice inquisitive prey. Conversely, smaller organisms employ counterillumination, emitting ventral light that matches the faint downwelling ambient glow from the surface, effectively camouflaging their silhouettes from predators hunting from below.",
    "difficulty": "C1",
    "gapSentence": {
      "before": "Through controlled enzymatic reactions involving luciferin and luciferase, abyssal organisms produce cold biochemical light",
      "options": [
        "efficiently",
        "accidentally",
        "superficially",
        "reluctantly"
      ],
      "correct": "efficiently",
      "after": "without wasting metabolic energy."
    },
    "sentenceOptions": {
      "options": [
        "As a result, deep sea animals rely exclusively on auditory echolocation rather than luminescence.",
        "Consequently, deep sea water temperatures remain consistently near the boiling threshold.",
        "These adaptive optical emissions demonstrate that vision remains paramount even in aphotic environments.",
        "However, photosynthesis continues to operate efficiently at depths exceeding two thousand meters."
      ],
      "correctIndex": 2
    },
    "highlightPrompt": "Highlight the technique used by smaller abyssal organisms to match downwelling light and conceal their silhouette from predators below.",
    "highlightCorrectSubstring": "counterillumination",
    "mainIdeaQuestion": {
      "question": "What does the author identify as the primary ecological significance of bioluminescence in deep-sea organisms?",
      "options": [
        "It serves solely to elevate body temperature in cold bathypelagic waters.",
        "It represents an unintended metabolic byproduct with no adaptive advantages.",
        "It acts exclusively as a warning signal to deter apex terrestrial predators.",
        "It provides critical evolutionary functions for predation, camouflage, and survival in sunless oceanic depths."
      ],
      "correctIndex": 3
    },
    "titleQuestion": {
      "question": "Choose the most appropriate title for this passage:",
      "options": [
        "Lighting the Abyss: The Adaptive Functions of Marine Bioluminescence",
        "The Disappearance of Optical Systems in Deep-Water Fish",
        "Commercial Fisheries in the Bathypelagic Zone",
        "Chemical Pollution in Oceanic Trenches"
      ],
      "correctIndex": 0
    }
  },
  {
    "id": "ir-3",
    "passageTitle": "The Engineering Revolution of Roman Pozzolanic Concrete",
    "passageText": "The enduring grandeur of Roman monumental architecture was fundamentally underpinned by a singular material innovation: opus caementicium. Unlike modern Portland cement, ancient Roman concrete utilized a reactive mixture of slaked lime and volcanic ash gathered from the volcanic slopes near Pozzuoli. This pozzolanic ash contained reactive silica and alumina that chemically combined with lime to generate an extraordinarily durable crystalline matrix.\n\nRemarkably, Roman maritime concrete gained structural toughness over centuries when exposed to seawater. Chemical analysis reveals that saltwater dissolves volcanic minerals within the concrete, triggering the post-curing precipitation of aluminum tobermorite and phillipsite crystals. This self-healing chemical mechanism prevented microcracks from propagating into catastrophic structural failures, enabling harbor piers and domes like the Pantheon to endure for over two millennia.",
    "difficulty": "C1",
    "gapSentence": {
      "before": "This pozzolanic ash chemically combined with slaked lime to create an exceptionally",
      "options": [
        "impervious",
        "fragile",
        "combustible",
        "ephemeral"
      ],
      "correct": "impervious",
      "after": "and durable structural matrix."
    },
    "sentenceOptions": {
      "options": [
        "Consequently, Roman architects ceased constructing stone arches and vaulted ceilings.",
        "Modern engineers, however, consider volcanic materials completely unsuitable for civil infrastructure.",
        "Nonetheless, the Pantheon collapsed shortly after its initial dedication in Rome.",
        "This chemical resilience explains why classical maritime structures outlast modern unreinforced marine concrete."
      ],
      "correctIndex": 3
    },
    "highlightPrompt": "Highlight the specific chemical reaction crystals that precipitate when Roman maritime concrete interacts with seawater.",
    "highlightCorrectSubstring": "aluminum tobermorite and phillipsite crystals",
    "mainIdeaQuestion": {
      "question": "According to the passage, what made Roman pozzolanic concrete unique compared to modern cement?",
      "options": [
        "Its volcanic mineral formulation allowed it to chemically self-heal and strengthen when exposed to seawater.",
        "It was significantly lighter and cheaper than ordinary quarried limestone blocks.",
        "It required no water or lime during the initial mixing process.",
        "It deteriorated rapidly unless continuously sealed with waterproof varnishes."
      ],
      "correctIndex": 0
    },
    "titleQuestion": {
      "question": "Select the best title for the passage:",
      "options": [
        "The Manufacturing Economics of Modern Portland Cement",
        "Pozzolanic Alchemy: The Enduring Science of Roman Concrete",
        "The Aesthetic Decline of Classical Italian Architecture",
        "Volcanic Hazards Threatening Ancient Mediterranean Harbors"
      ],
      "correctIndex": 1
    }
  },
  {
    "id": "ir-4",
    "passageTitle": "Cognitive Biases and Heuristic Fallacies in Financial Markets",
    "passageText": "Classical neoclassical economic models long operated on the assumption of the 'rational actor'—an agent who processes all accessible market data objectively to maximize expected utility. However, behavioral economics has empirically refuted this assumption by documenting pervasive cognitive distortions that systematically impair investor judgment. When confronted with volatile market conditions, market participants frequently substitute complex statistical calculations with fast, intuitive mental shortcuts known as heuristics.\n\nAmong the most disruptive cognitive distortions is loss aversion, whereby the psychological pain of suffering an economic loss is experienced approximately twice as intensely as the pleasure of an equivalent gain. Consequently, investors tend to hold depreciating assets excessively long in the vain hope of breaking even, while prematurely liquidating appreciating stocks to lock in modest profits. This asymmetric risk perception creates systemic market inefficiencies that defy classical equilibrium theory.",
    "difficulty": "B2",
    "gapSentence": {
      "before": "Market participants frequently substitute complex statistical evaluations with intuitive mental shortcuts known as",
      "options": [
        "algorithms",
        "heuristics",
        "derivations",
        "concessions"
      ],
      "correct": "heuristics",
      "after": "which often generate systematic forecasting errors."
    },
    "sentenceOptions": {
      "options": [
        "These subconscious biases explain why financial bubbles and panic selling recur with predictable regularity.",
        "Therefore, algorithmic high-frequency trading has been completely outlawed across all global stock exchanges.",
        "In contrast, amateur retail traders consistently outperform professional fund managers during recessions.",
        "As a result, economic recessions have become entirely obsolete in modern industrialized nations."
      ],
      "correctIndex": 0
    },
    "highlightPrompt": "Highlight the cognitive distortion where the psychological pain of a loss is felt twice as intensely as the pleasure of a gain.",
    "highlightCorrectSubstring": "loss aversion",
    "mainIdeaQuestion": {
      "question": "What is the primary conclusion drawn by behavioral economists in this text?",
      "options": [
        "Holding depreciating stocks indefinitely is the most effective wealth-building strategy.",
        "Subconscious heuristic biases like loss aversion systematically skew financial decision-making away from rational theory.",
        "Investors are strictly rational mathematical calculators who always optimize long-term portfolio yields.",
        "Market volatility is primarily driven by external weather events rather than human psychology."
      ],
      "correctIndex": 1
    },
    "titleQuestion": {
      "question": "Choose the most fitting title for this text:",
      "options": [
        "Neoclassical Mathematical Equilibrium in Commodity Trading",
        "A Guide to Day Trading for Inexperienced Retail Investors",
        "The Flawed Rationalist: Behavioral Biases in Financial Decision Making",
        "The Complete Elimination of Risk in Contemporary Stock Markets"
      ],
      "correctIndex": 2
    }
  },
  {
    "id": "ir-5",
    "passageTitle": "Pollinator Decline and Global Agricultural Security",
    "passageText": "Animal pollination is a vital ecological service that underpins terrestrial plant biodiversity and human food production. Approximately three-quarters of the leading global crop species—including fruits, nuts, oilseeds, and vegetables—depend partially or entirely on animal vectors for successful fruit set and seed production. Wild bees, hoverflies, butterflies, and bats facilitate genetic recombination across agricultural habitats that would otherwise suffer reproductive collapse.\n\nIn recent decades, however, managed honeybee colonies and native pollinator populations have suffered precipitous declines across several continents. Entomologists attribute this crisis to a lethal synergy of anthropogenic stressors: widespread application of systemic neonicotinoid pesticides, habitat fragmentation caused by urban expansion, and pathogen transmission. Without coordinated agricultural policy reforms promoting flower-rich habitat corridors, global supplies of micronutrient-dense foods face profound jeopardy.",
    "difficulty": "B2",
    "gapSentence": {
      "before": "Wild bees and other insect vectors facilitate essential genetic recombination across habitats that would otherwise suffer",
      "options": [
        "prosperity",
        "reproductive",
        "technological",
        "commercial"
      ],
      "correct": "reproductive",
      "after": "collapse."
    },
    "sentenceOptions": {
      "options": [
        "Therefore, global pesticide manufacturing has been permanently suspended by international treaties.",
        "The compounding reduction in pollinator numbers threatens not only ecological balance but also macroeconomic food stability.",
        "Fortunately, robotic mechanical drones have already completely replaced biological bees across all agricultural sectors.",
        "Conversely, grain crops such as wheat and corn rely exclusively on insect vectors rather than wind dispersal."
      ],
      "correctIndex": 1
    },
    "highlightPrompt": "Highlight the class of systemic pesticides identified in the passage as contributing to pollinator mortality.",
    "highlightCorrectSubstring": "neonicotinoid pesticides",
    "mainIdeaQuestion": {
      "question": "What is the central warning articulated by the author regarding pollinators?",
      "options": [
        "Agricultural crops no longer require insect pollination due to genetic engineering innovations.",
        "Urban expansion has successfully created optimal alternative sanctuaries for all native insect species.",
        "Widespread pollinator decline driven by pesticides and habitat loss threatens global crop reproduction and human nutrition.",
        "Domestic honeybees are expanding aggressively and outcompeting wild pollinator species worldwide."
      ],
      "correctIndex": 2
    },
    "titleQuestion": {
      "question": "Identify the best title for the text:",
      "options": [
        "The Advantages of Monoculture Farming in Modern Agribusiness",
        "Chemical Synthesis of Novel Commercial Insecticides",
        "Wind Dispersal Mechanics in Cereal Crop Agronomy",
        "Vanishing Vectors: The Ecological and Agricultural Threat of Pollinator Decline"
      ],
      "correctIndex": 3
    }
  },
  {
    "id": "ir-6",
    "passageTitle": "Glacial Meltwater Dynamics and Alpine Hydroelectric Power",
    "passageText": "Alpine glaciers function as colossal frozen hydrological reservoirs, storing winter precipitation and releasing steady meltwater during warm summer months. This seasonal glacial discharge provides reliable baseflow for rivers that drive hydroelectric turbines across mountainous regions such as the European Alps, Scandinavia, and the Andes. Hydroelectric infrastructure relies on predictable seasonal runoff curves to balance peak electricity demand during dry seasons.\n\nHowever, accelerated climatic warming is rapidly altering the mass balance of alpine glaciers. While retreating glaciers initially yield increased summer meltwater volumes—a temporary phenomenon known as 'peak water'—this surge inevitably peaks and declines as ice volume dwindles. Hydrologists project that within decades, dwindling glacial reservoirs will exacerbate severe seasonal water deficits, threatening both renewable energy generation and downstream municipal consumption.",
    "difficulty": "C1",
    "gapSentence": {
      "before": "Hydroelectric infrastructure relies on predictable seasonal runoff patterns to",
      "options": [
        "destabilize",
        "balance",
        "postpone",
        "extinguish"
      ],
      "correct": "balance",
      "after": "peak consumer energy demand."
    },
    "sentenceOptions": {
      "options": [
        "Consequently, fossil fuel coal power plants will completely replace all alpine hydroelectric dams by next year.",
        "As a result, downstream river navigation has become permanently impossible across Western Europe.",
        "This long-term hydrological transition will require alpine nations to overhaul their renewable grid strategies.",
        "Nevertheless, permanent snowpacks are expanding rapidly across all major European mountain ranges."
      ],
      "correctIndex": 2
    },
    "highlightPrompt": "Highlight the term used to describe the temporary surge in meltwater volume before glacial ice volume irreversibly dwindles.",
    "highlightCorrectSubstring": "peak water",
    "mainIdeaQuestion": {
      "question": "What primary risk does glacial retreat present to alpine hydroelectric power generation?",
      "options": [
        "Expanding glaciers will structurally crush concrete turbine intakes and dam walls.",
        "Glacial meltwater contains chemical toxins that corrode electrical generating equipment.",
        "Hydroelectric power generation is unaffected because rainfall completely offsets glacial runoff losses.",
        "The temporary surge of meltwater will give way to severe long-term water deficits, undermining reliable power generation."
      ],
      "correctIndex": 3
    },
    "titleQuestion": {
      "question": "Which title best represents the article's subject?",
      "options": [
        "Melting Reservoirs: The Future of Alpine Glaciers and Hydroelectric Stability",
        "The Thermal Insulation Properties of Arctic Permafrost",
        "Navigating Inland Riverways During Winter Freezes",
        "The Construction of Underground Geothermal Plants"
      ],
      "correctIndex": 0
    }
  },
  {
    "id": "ir-7",
    "passageTitle": "The Sociological Transformation of Urban Commuting and Public Transit",
    "passageText": "The spatial configuration of modern metropolitan areas has historically been dictated by transportation technologies. In the early twentieth century, the proliferation of personal automobiles encouraged extensive suburban sprawl, separating residential neighborhoods from commercial downtown employment centers by vast highway networks. While this model initially promised individual autonomy, it precipitated chronic vehicular congestion, air pollution, and geographic isolation for non-driving demographics.\n\nIn response to these infrastructural gridlocks, urban planners are executing a paradigm shift toward transit-oriented development. By integrating high-frequency electrified light rail, dedicated bus rapid transit corridors, and safe protected pedestrian pathways, progressive municipalities incentivize active transit. Cities that subsidize public transit and restrict private automobile access report measurable improvements in civic health, economic vibrancy, and social equity.",
    "difficulty": "B2",
    "gapSentence": {
      "before": "By integrating high-frequency electrified light rail and protected pathways, progressive municipalities",
      "options": [
        "penalize",
        "incentivize",
        "discourage",
        "confound"
      ],
      "correct": "incentivize",
      "after": "active multimodal commuting."
    },
    "sentenceOptions": {
      "options": [
        "Consequently, highway expansion projects have successfully solved vehicular traffic in all major cities.",
        "However, urban citizens universally reject subway systems in favor of personal sports utility vehicles.",
        "Therefore, commercial city centers have been entirely abandoned by corporate employers.",
        "These comprehensive transit networks demonstrate that human-scale urban design fosters resilient community cohesion."
      ],
      "correctIndex": 3
    },
    "highlightPrompt": "Highlight the urban planning paradigm that integrates high-frequency public transit with compact, walkable neighborhood design.",
    "highlightCorrectSubstring": "transit-oriented development",
    "mainIdeaQuestion": {
      "question": "What core transition in modern urban transit planning is emphasized in this passage?",
      "options": [
        "Shifting away from automobile-dominated suburban sprawl toward accessible, transit-oriented multimodal urban design.",
        "Promoting larger highways and subsidized petroleum fuels to eliminate commuting delays.",
        "Relocating all residential housing into remote rural villages without public transit connections.",
        "Discontinuing passenger bus routes to prioritize commercial freight trucking."
      ],
      "correctIndex": 0
    },
    "titleQuestion": {
      "question": "Choose the best title for this passage:",
      "options": [
        "The Complete Abolition of Public Transit in Global Capitals",
        "Reclaiming the Streets: From Suburban Sprawl to Transit-Oriented Urbanism",
        "The Undeniable Supremacy of Automobile Transportation",
        "Architectural Styles of Early Twentieth-Century Garages"
      ],
      "correctIndex": 1
    }
  },
  {
    "id": "ir-8",
    "passageTitle": "Mycorrhizal Networks and the Underground Economy of Forests",
    "passageText": "For centuries, traditional forestry models conceptualized woodland ecosystems primarily as arenas of ruthless competition, where individual trees battled neighbors for canopy sunlight, soil moisture, and mineral nutrients. Groundbreaking ecological research over the past three decades has radically revised this Darwinian view by uncovering subterranean mycorrhizal networks. These subterranean networks—comprising microscopic fungal hyphae woven into root tissues—physically link distinct tree species into cooperative biological communities.\n\nThrough these symbiotic conduits, trees actively exchange life-sustaining resources based on source-sink gradients. Mature 'mother trees' channel surplus carbon sugars synthesized through canopy photosynthesis to shaded saplings struggling on the forest floor. In return, the fungal partners extract phosphorus and nitrogen from mineral soil particles that plant roots cannot access autonomously, demonstrating that forest resilience relies as much on cooperation as competition.",
    "difficulty": "C1",
    "gapSentence": {
      "before": "These subterranean fungal networks actively channel life-sustaining resources based on physiological",
      "options": [
        "gradients",
        "coincidences",
        "impediments",
        "deceptions"
      ],
      "correct": "gradients",
      "after": "between mature trees and developing seedlings."
    },
    "sentenceOptions": {
      "options": [
        "This mutualistic subterranean web highlights the complex cooperative interdependence of forest biomes.",
        "Conversely, fungal organisms act exclusively as lethal parasites that destroy living timber.",
        "Consequently, modern foresters recommend clear-cutting all old-growth trees to foster sapling growth.",
        "As a result, photosynthetic carbon synthesis ceases entirely in mature forest canopies."
      ],
      "correctIndex": 0
    },
    "highlightPrompt": "Highlight the term used in the passage to designate mature canopy trees that nourish shaded saplings through fungal networks.",
    "highlightCorrectSubstring": "mother trees",
    "mainIdeaQuestion": {
      "question": "What revolutionary insight about forest ecosystems is detailed in this passage?",
      "options": [
        "Photosynthesis in shaded understory saplings is more efficient than in mature canopy trees.",
        "Subterranean fungal mycorrhizal networks enable trees to share carbon and nutrients cooperatively rather than purely competing.",
        "Forest ecosystems are dominated entirely by competitive elimination without biological symbiosis.",
        "Fungi are harmful pathogens that prevent tree roots from absorbing vital soil moisture."
      ],
      "correctIndex": 1
    },
    "titleQuestion": {
      "question": "Select the best title for this passage:",
      "options": [
        "Fungal Infections Threatening North American Orchards",
        "Canopy Sunlight Absorption in Monoculture Forestry",
        "The Wood Wide Web: Mycorrhizal Symbiosis and Forest Interdependence",
        "The Mechanical Harvesting of Commercial Pine Timber"
      ],
      "correctIndex": 2
    }
  }
];

// interactiveListeningBank
export const interactiveListeningBank: InteractiveListeningBlock[] = [
  {
    "id": "il-1",
    "scenario": "You are meeting with your biology professor, Dr. Vance, during office hours to discuss narrowing your semester research topic on marine microplastics.",
    "difficulty": "B2",
    "turns": [
      {
        "speaker": "Dr. Vance",
        "speakerAudioText": "Hello! Come in and take a seat. I received your email about your marine biology term paper. How are your initial literature searches coming along?",
        "options": [
          "Could you tell me what time the final exam is scheduled next month?",
          "Thank you, Dr. Vance. I have gathered plenty of general background, but I am struggling to narrow down the scope of my thesis.",
          "I think biology is very interesting, especially when we study large mammals in the ocean.",
          "I already finished writing the entire paper yesterday, so I just wanted to say hello."
        ],
        "correctIndex": 1
      },
      {
        "speaker": "Dr. Vance",
        "speakerAudioText": "That is a very common challenge. Examining global marine plastic pollution as a whole is too vast for an eight-page paper. Have you considered focusing on a specific trophic level or geographic estuary?",
        "options": [
          "I don't think plastic pollution is actually a serious problem in modern waters.",
          "Let's change the topic completely to terrestrial desert reptiles instead.",
          "I was considering investigating how microplastics bioaccumulate in filter-feeding bivalves within coastal estuaries.",
          "I could write about every ocean on Earth including the Arctic and Antarctic in equal detail."
        ],
        "correctIndex": 2
      },
      {
        "speaker": "Dr. Vance",
        "speakerAudioText": "That would be an excellent focus! There is a robust body of empirical research on mussels and oysters from the Puget Sound estuary. You could examine cellular uptake and toxin concentration.",
        "options": [
          "I prefer to only use newspaper articles and blog posts as my primary citations.",
          "Puget Sound is too far away, so I will not look at any data from that region.",
          "Does our university library have any books about general chemistry?",
          "That sounds ideal. Should I also incorporate recent laboratory studies on enzymatic degradation?"
        ],
        "correctIndex": 3
      },
      {
        "speaker": "Dr. Vance",
        "speakerAudioText": "Yes, absolutely. Comparing field data with controlled laboratory biodegradation studies will give your paper real analytical depth. Draft a two-page proposal by next Tuesday and we will review it.",
        "options": [
          "Understood! I will synthesize those sources and submit the formal proposal by Tuesday. Thank you for your guidance!",
          "I might submit it in three weeks if I find some spare time during the weekend.",
          "I don't think drafting a proposal is necessary before writing the entire draft.",
          "Can I just give an oral presentation instead of writing any proposal?"
        ],
        "correctIndex": 0
      }
    ],
    "summaryPrompt": "Write a 3-sentence summary of the conversation with Dr. Vance. Explain why you came to the office, what advice the professor provided, and what subsequent steps you agreed to take."
  },
  {
    "id": "il-2",
    "scenario": "You are speaking with your architecture studio instructor, Professor Sterling, to receive feedback on your draft schematics for an urban community library project.",
    "difficulty": "C1",
    "turns": [
      {
        "speaker": "Professor Sterling",
        "speakerAudioText": "Good afternoon. I reviewed your digital site models for the civic library project. You have developed a compelling aesthetic, but I have concerns regarding pedestrian circulation.",
        "options": [
          "I forgot to save the latest files on my flash drive, so those models are outdated.",
          "Is the studio critique going to be graded on a curve this semester?",
          "Thank you for looking over them, Professor. Could you clarify where the primary circulation bottleneck occurs?",
          "I think the building looks wonderful from the exterior, so the interior does not matter as much."
        ],
        "correctIndex": 2
      },
      {
        "speaker": "Professor Sterling",
        "speakerAudioText": "Specifically, the central atrium funnels all visitor traffic toward a single stairwell, which will cause severe congestion during peak community events.",
        "options": [
          "People can simply wait in line at the bottom of the stairs until the crowd clears.",
          "I should remove all stairs and elevators from the building to maximize book storage.",
          "Let us abandon the library project and design a commercial warehouse instead.",
          "I see what you mean. What if I introduced a secondary egress ramp along the glazed southern facade?"
        ],
        "correctIndex": 3
      },
      {
        "speaker": "Professor Sterling",
        "speakerAudioText": "A glazed southern ramp would solve the egress issue while taking advantage of passive solar daylighting. Make sure it complies with universal accessibility standards.",
        "options": [
          "I will ensure the ramp gradient adheres strictly to universal accessibility codes and integrates shading louvers.",
          "Accessibility standards are optional for student conceptual projects, right?",
          "Southern sunlight will be too harsh, so I will replace all windows with solid concrete walls.",
          "Can I borrow your laptop to print out some unrelated documents?"
        ],
        "correctIndex": 0
      },
      {
        "speaker": "Professor Sterling",
        "speakerAudioText": "Precisely. Incorporate those structural revisions into your section drawings for Thursday's formal studio review.",
        "options": [
          "Will you give me an automatic grade without seeing the revised drawings?",
          "I will update the section elevations and present the revised circulation scheme on Thursday. Thank you, Professor Sterling!",
          "I probably cannot attend the studio review on Thursday due to personal commitments.",
          "I think section drawings are too difficult to generate in computer software."
        ],
        "correctIndex": 1
      }
    ],
    "summaryPrompt": "Write a 3-sentence summary of the studio critique with Professor Sterling. Detail the original design flaw identified, the agreed architectural solution, and the deadline for presenting revised drawings."
  },
  {
    "id": "il-3",
    "scenario": "You are speaking with the university housing coordinator, Marcus, regarding an ongoing heating malfunction and room change request in your dormitory.",
    "difficulty": "B1",
    "turns": [
      {
        "speaker": "Marcus",
        "speakerAudioText": "Hello! Welcome to the student residential life office. How can I assist you today?",
        "options": [
          "I would like to purchase a parking pass for the campus north visitor garage.",
          "Can you tell me what the cafeteria menu is serving for dinner tonight?",
          "I am looking for the main chemistry lecture auditorium on this floor.",
          "Hello Marcus. I submitted a maintenance ticket three days ago about the heating in room 412, but the radiator is still completely cold."
        ],
        "correctIndex": 3
      },
      {
        "speaker": "Marcus",
        "speakerAudioText": "I am so sorry to hear that. With temperatures dropping below freezing tonight, living without heat is unacceptable. Let me check the facilities dispatch log right away.",
        "options": [
          "Thank you. It has been difficult to sleep or study in the room due to the severe chill.",
          "It is not that cold, so there is no real rush to fix it this week.",
          "I broke the radiator myself because it was making a buzzing sound.",
          "Do you know when the university summer vacation officially begins?"
        ],
        "correctIndex": 0
      },
      {
        "speaker": "Marcus",
        "speakerAudioText": "I see the issue—a main valve failed in the east wing. Facilities has ordered the replacement valve, but it will take until tomorrow afternoon to complete repairs. We can offer you temporary relocation to a guest suite tonight.",
        "options": [
          "Can my friend from another university move into the suite with me permanently?",
          "A temporary guest suite for tonight would be wonderful! That will allow me to study comfortably.",
          "No thank you, I prefer to sleep outside on the campus quadrangle lawn.",
          "I demand that you replace the entire dormitory building immediately."
        ],
        "correctIndex": 1
      },
      {
        "speaker": "Marcus",
        "speakerAudioText": "Great, here is the temporary electronic keycard for suite 108. You can stay there until facilities notifies you tomorrow afternoon that your room heating is restored.",
        "options": [
          "Is there a microwave inside the dormitory administrative storage closet?",
          "Can you also help me register for my academic courses for next semester?",
          "Thank you so much for resolving this quickly, Marcus. I will return the keycard once my room is warm.",
          "I will keep this keycard forever and never return to my assigned room."
        ],
        "correctIndex": 2
      }
    ],
    "summaryPrompt": "Write a 3-sentence summary of the housing inquiry. Summarize the initial complaint regarding room heating, the temporary arrangement provided by Marcus, and the expected resolution timeline."
  },
  {
    "id": "il-4",
    "scenario": "You are meeting with your psychology academic advisor, Dr. Martinez, to discuss registering for an independent research study in cognitive neuroscience.",
    "difficulty": "B2",
    "turns": [
      {
        "speaker": "Dr. Martinez",
        "speakerAudioText": "Welcome! I see from your academic record that you have completed all core research methods courses with honors. Are you interested in enrolling in an independent study next term?",
        "options": [
          "Yes, Dr. Martinez! I am eager to gain hands-on laboratory experience in cognitive electrophysiology under faculty supervision.",
          "I only want to take introductory courses that require no homework or exams.",
          "I was hoping to drop out of university and become a professional musician instead.",
          "Do you know where the lost and found department is located on campus?"
        ],
        "correctIndex": 0
      },
      {
        "speaker": "Dr. Martinez",
        "speakerAudioText": "Dr. Chen's EEG laboratory is currently seeking an undergraduate research assistant for a project studying working memory consolidation during sleep. Would that align with your interests?",
        "options": [
          "I have never heard of the human brain before, so that sounds unfamiliar.",
          "That aligns perfectly with my career aspirations in clinical neuroscience and sleep research.",
          "I find working memory research extremely boring and would rather not do it.",
          "Does Dr. Chen's laboratory allow students to sleep during daytime experiments?"
        ],
        "correctIndex": 1
      },
      {
        "speaker": "Dr. Martinez",
        "speakerAudioText": "Dr. Chen requires a brief research statement and a faculty recommendation before approving the registration form. Can you prepare those documents by Friday?",
        "options": [
          "Recommendations are unnecessary because Dr. Chen already knows who I am.",
          "Can you write the entire research statement for me instead?",
          "Yes, I can draft the research statement and ask Dr. Vance for a letter of recommendation by Thursday afternoon.",
          "Friday is too soon, so I will probably submit them in three months."
        ],
        "correctIndex": 2
      },
      {
        "speaker": "Dr. Martinez",
        "speakerAudioText": "Excellent. Once I receive Dr. Chen's signed approval, I will issue the departmental enrollment override so you can register for credit.",
        "options": [
          "I don't need any course credits to graduate, so the override doesn't matter.",
          "Can I also register for fifteen additional courses this semester?",
          "Where is the campus bookstore where they sell university sweaters?",
          "Thank you very much, Dr. Martinez. I will have all required materials submitted to you promptly."
        ],
        "correctIndex": 3
      }
    ],
    "summaryPrompt": "Write a 3-sentence summary of the advising session with Dr. Martinez. Detail your research objective, the specific laboratory placement recommended, and the necessary paperwork agreed upon."
  },
  {
    "id": "il-5",
    "scenario": "You are consulting with university archivist, Eleanor Cole, to request access to restricted nineteenth-century historical manuscripts for your honors thesis.",
    "difficulty": "C1",
    "turns": [
      {
        "speaker": "Eleanor Cole",
        "speakerAudioText": "Good morning. Welcome to Special Collections and University Archives. How may I assist your research today?",
        "options": [
          "I am looking for recent popular magazines and fiction paperbacks.",
          "Good morning, Ms. Cole. I am writing an honors thesis on industrial labor movements and wish to consult the restricted diary collection of union organizer Samuel Morse.",
          "I want to borrow twenty rare books and take them to my dormitory room for the weekend.",
          "Can you show me where the public photocopy machines are in the basement?"
        ],
        "correctIndex": 1
      },
      {
        "speaker": "Eleanor Cole",
        "speakerAudioText": "The Morse papers are held in our climate-controlled vault due to fragile paper degradation. To access them, you will need a faculty authorization form and must examine the folios in our supervised reading room.",
        "options": [
          "Can I use highlighters and pens directly on the nineteenth-century manuscript pages?",
          "I will just search for digital scans on public internet websites instead.",
          "I completely understand the preservation protocols. I brought a signed authorization letter from my thesis advisor, Professor Davis.",
          "Preservation rules are inconvenient, so I would rather handle them without supervision."
        ],
        "correctIndex": 2
      },
      {
        "speaker": "Eleanor Cole",
        "speakerAudioText": "Thank you, this letter is in order. Please place all coats and bags in the lockers. Only pencils, loose notes, and laptops without cases are permitted at the archival desks.",
        "options": [
          "I must keep my hot coffee and sandwich on the desk while reading the manuscripts.",
          "Why can't I use permanent ink markers to take notes in the archive?",
          "Can you leave the archive room unattended so I can browse the vault alone?",
          "Understood. I will secure my belongings in the locker and retrieve my pencil and notebook."
        ],
        "correctIndex": 3
      },
      {
        "speaker": "Eleanor Cole",
        "speakerAudioText": "I will retrieve Box Four containing Morse's 1886 correspondence files. You will have until four o'clock today before the reading room closes.",
        "options": [
          "Thank you very much for your assistance, Ms. Cole. I will begin reviewing the correspondence immediately.",
          "I plan to stay until midnight even if the building is locked and dark.",
          "Could you read the handwriting for me and write my honors thesis chapters?",
          "Where can I buy antique furniture on campus?"
        ],
        "correctIndex": 0
      }
    ],
    "summaryPrompt": "Write a 3-sentence summary of the archival research consultation. Describe the specific collection requested, the preservation protocols explained by Ms. Cole, and the agreed access arrangement."
  },
  {
    "id": "il-6",
    "scenario": "You are speaking with career services advisor, Sarah Jenkins, to prepare your application portfolio for a competitive software engineering internship.",
    "difficulty": "B2",
    "turns": [
      {
        "speaker": "Sarah Jenkins",
        "speakerAudioText": "Hello! Thanks for coming in. I looked over your technical resume for the summer software engineering internship. You have solid programming skills, but your project descriptions need quantification.",
        "options": [
          "Companies do not care about measurable results as long as you know programming syntax.",
          "Can you call the hiring manager directly and tell them to hire me today?",
          "Thank you for the feedback, Sarah. How should I quantify the impact of my open-source projects?",
          "I think having two pages of personal hobbies is more important than technical projects."
        ],
        "correctIndex": 2
      },
      {
        "speaker": "Sarah Jenkins",
        "speakerAudioText": "Instead of saying 'helped build a web app,' write 'engineered a microservice handling ten thousand daily requests and reduced API latency by thirty percent.' Tech recruiters look for metric-driven achievements.",
        "options": [
          "I will invent fictitious numbers to make the projects look ten times larger than they were.",
          "Writing metrics takes too much effort, so I will leave the bullet points unchanged.",
          "Do software engineers need to write resumes, or do they only take coding quizzes?",
          "That makes a dramatic difference! I can incorporate benchmarks from our automated test suite and database profiling."
        ],
        "correctIndex": 3
      },
      {
        "speaker": "Sarah Jenkins",
        "speakerAudioText": "Exactly. Furthermore, highlight your team collaboration and Git version control workflows, as modern companies prioritize cooperative engineering practices.",
        "options": [
          "I will add bullet points detailing code reviews, agile sprints, and pull request workflows in our group capstone.",
          "I prefer to claim that I wrote all software entirely alone without any teammates.",
          "Version control tools like Git are outdated, so I will not mention them.",
          "Can we discuss how to negotiate executive stock options for an entry-level internship?"
        ],
        "correctIndex": 0
      },
      {
        "speaker": "Sarah Jenkins",
        "speakerAudioText": "Great! Revise your resume with those metric enhancements and send it to me by Thursday morning for a final polish before the submission deadline.",
        "options": [
          "Where can I find free lunch on campus this afternoon?",
          "I will revise the bullet points tonight and send the updated draft by Thursday morning. Thank you, Sarah!",
          "I will submit the application without revising anything since the deadline is far away.",
          "Can you rewrite all the bullet points for me before Thursday?"
        ],
        "correctIndex": 1
      }
    ],
    "summaryPrompt": "Write a 3-sentence summary of the career counseling meeting. Outline the critique regarding resume bullet points, the specific revisions recommended by Sarah, and the timeline for submitting the polished draft."
  },
  {
    "id": "il-7",
    "scenario": "You are meeting with campus laboratory safety officer, Arthur Pendelton, to renew your biohazard and chemical disposal credentials before starting senior thesis experiments.",
    "difficulty": "B2",
    "turns": [
      {
        "speaker": "Arthur Pendelton",
        "speakerAudioText": "Good morning. Before you can begin unsupervised work in the chemical synthesis lab, we need to verify your annual hazardous waste disposal training module.",
        "options": [
          "I have been working with chemicals for a long time, so I don't need any safety training.",
          "Can I pour solvent waste directly into the ordinary sanitary sewer sink?",
          "Is the laboratory open during university winter holidays for social gatherings?",
          "Good morning, Officer Pendelton. I completed the online safety modules yesterday and brought my completion certificates."
        ],
        "correctIndex": 3
      },
      {
        "speaker": "Arthur Pendelton",
        "speakerAudioText": "Excellent, your digital certificates are verified in our database. Now, let's review the emergency eyewash and fume hood airflow inspection protocols.",
        "options": [
          "Of course. I know that eyewash stations must be flushed weekly and fume hood sashes kept below the marked indicator line.",
          "Fume hoods are completely unnecessary if you keep the room windows wide open.",
          "Eyewash stations should only be inspected once every five years.",
          "Can we skip the safety review and talk about athletic sports instead?"
        ],
        "correctIndex": 0
      },
      {
        "speaker": "Arthur Pendelton",
        "speakerAudioText": "Correct. Also remember that chlorinated solvents must never be combined with organic flammable solvents in the secondary containment carboys.",
        "options": [
          "Can I take hazardous reagents home to perform reactions in my kitchen?",
          "I will ensure all halogenated and non-halogenated waste carboys are clearly labeled and segregated.",
          "Mixing all chemicals together in one container saves storage space in the lab.",
          "Labeling chemical containers is optional if you can recognize them by their smell."
        ],
        "correctIndex": 1
      },
      {
        "speaker": "Arthur Pendelton",
        "speakerAudioText": "Here is your updated laboratory badge with level-three clearance. It activates your electronic key access to the synthesis suite starting tomorrow morning.",
        "options": [
          "Does this clearance badge also grant free admission to the campus cinema?",
          "I will probably never use the synthesis suite anyway.",
          "Thank you, Officer Pendelton. I appreciate your thorough review and will adhere strictly to all safety standards.",
          "I will lend this electronic badge to all my friends so they can enter the lab."
        ],
        "correctIndex": 2
      }
    ],
    "summaryPrompt": "Write a 3-sentence summary of the laboratory safety briefing. Summarize the credentials presented to Officer Pendelton, the chemical segregation protocols reviewed, and the clearance granted."
  },
  {
    "id": "il-8",
    "scenario": "You are discussing your interdisciplinary environmental policy proposal with faculty mentor, Dr. Rebecca Albright, regarding urban wetland reclamation.",
    "difficulty": "C1",
    "turns": [
      {
        "speaker": "Dr. Rebecca Albright",
        "speakerAudioText": "Hello! I read your draft proposal advocating for the ecological reclamation of the industrial canal wetlands. The policy mechanism is strong, but how do you address municipal zoning resistance?",
        "options": [
          "Thank you, Dr. Albright. I propose balancing industrial property interests by creating a transferable development rights framework for adjacent inland parcels.",
          "We should simply ignore all local businesses and confiscate their commercial waterfront land.",
          "Can you tell me if this paper will count toward my elective general education requirements?",
          "I don't think environmental policy has any connection to urban economics."
        ],
        "correctIndex": 0
      },
      {
        "speaker": "Dr. Rebecca Albright",
        "speakerAudioText": "Transferable development rights are a sophisticated market-based tool. It incentivizes private landowners to trade riparian rights in exchange for increased building height allowances downtown.",
        "options": [
          "Why do we need wetlands when we can build concrete sea walls along the coast?",
          "Exactly, which protects municipal tax revenues while restoring contiguous wetland hydrological buffers against coastal flooding.",
          "I think building height limits should be abolished everywhere without any environmental trade-offs.",
          "Private landowners will never agree to trade anything under any circumstances."
        ],
        "correctIndex": 1
      },
      {
        "speaker": "Dr. Rebecca Albright",
        "speakerAudioText": "I recommend including an economic cost-benefit chapter comparing the long-term maintenance of concrete dikes versus natural wetland storm surge dissipation.",
        "options": [
          "Rotterdam and New Orleans have nothing in common with coastal water management.",
          "Can you write the comparative cost-benefit chapter on my behalf?",
          "I will gather municipal engineering data from New Orleans and Rotterdam to model those comparative lifecycle expenditures.",
          "Lifecycle expenditures are too complicated to calculate, so I will omit all economic data."
        ],
        "correctIndex": 2
      },
      {
        "speaker": "Dr. Rebecca Albright",
        "speakerAudioText": "Superb. Incorporate that comparative economic modeling into your revised thesis proposal by next Friday, and we can submit it to the university grant committee.",
        "options": [
          "I don't think applying for university research grants is worth the paperwork.",
          "Can we postpone this meeting until the end of next academic year?",
          "Where is the nearest campus coffee shop open after five o'clock?",
          "I will complete the economic modeling and have the proposal polished by Friday. Thank you for the invaluable feedback, Dr. Albright!"
        ],
        "correctIndex": 3
      }
    ],
    "summaryPrompt": "Write a 3-sentence summary of the policy thesis consultation with Dr. Albright. Outline the policy mechanism discussed for wetland reclamation, the economic comparison recommended, and the submission deadline for the grant proposal."
  }
];

// writePhotoBank
export const writePhotoBank: WritePhotoQuestion[] = [
  {
    "id": "wp-1",
    "imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "altText": "A focused biochemical researcher manipulating micro-pipettes inside a sterile laboratory",
    "difficulty": "B2"
  },
  {
    "id": "wp-2",
    "imageUrl": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    "altText": "A diverse group of university students collaborating over notebooks and laptops in a campus library",
    "difficulty": "B1"
  },
  {
    "id": "wp-3",
    "imageUrl": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    "altText": "A civil engineer wearing a high-visibility vest inspecting blueprints at an active urban construction site",
    "difficulty": "B2"
  },
  {
    "id": "wp-4",
    "imageUrl": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    "altText": "Two software specialists analyzing data visualizations and code on multi-monitor workstations",
    "difficulty": "C1"
  },
  {
    "id": "wp-5",
    "imageUrl": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
    "altText": "A ceramic artisan shaping clay pottery on a spinning wheel in an illuminated rustic workshop",
    "difficulty": "B2"
  },
  {
    "id": "wp-6",
    "imageUrl": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
    "altText": "Botanical researchers inspecting rows of vibrant hydroponic crops inside an automated greenhouse",
    "difficulty": "B2"
  },
  {
    "id": "wp-7",
    "imageUrl": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    "altText": "Automated warehouse logistics with robotic sorting units and organized tiered shelving",
    "difficulty": "C1"
  },
  {
    "id": "wp-8",
    "imageUrl": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
    "altText": "A medical surgical team in protective scrubs performing a delicate procedure under bright surgical lamps",
    "difficulty": "C1"
  },
  {
    "id": "wp-9",
    "imageUrl": "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
    "altText": "Commuters waiting along an illuminated underground subway platform as a train approaches the station",
    "difficulty": "B1"
  },
  {
    "id": "wp-10",
    "imageUrl": "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
    "altText": "Solar energy technicians installing photovoltaic panels across an expansive desert utility farm",
    "difficulty": "B2"
  },
  {
    "id": "wp-11",
    "imageUrl": "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=800&q=80",
    "altText": "An archaeological research team meticulously brushing soil away from ancient masonry ruins",
    "difficulty": "B2"
  },
  {
    "id": "wp-12",
    "imageUrl": "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80",
    "altText": "An industrial wind turbine maintenance specialist suspended alongside immense composite rotor blades",
    "difficulty": "C1"
  },
  {
    "id": "wp-13",
    "imageUrl": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80",
    "altText": "Professional chefs plating gourmet dishes with culinary tweezers in a bustling restaurant kitchen",
    "difficulty": "B2"
  },
  {
    "id": "wp-14",
    "imageUrl": "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=800&q=80",
    "altText": "A conservation forester examining coniferous tree bark inside a foggy old-growth woodland preserve",
    "difficulty": "B1"
  },
  {
    "id": "wp-15",
    "imageUrl": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    "altText": "Marine scientific divers recording ecological data on a submerged coral reef transect line",
    "difficulty": "C1"
  },
  {
    "id": "wp-16",
    "imageUrl": "https://images.unsplash.com/photo-1517976487502-55a0b777a82c?auto=format&fit=crop&w=800&q=80",
    "altText": "Aerospace propulsion engineers testing a jet turbine inside a specialized acoustic wind tunnel",
    "difficulty": "C1"
  },
  {
    "id": "wp-17",
    "imageUrl": "https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80",
    "altText": "An astronomer adjusting optical controls beside an astronomical telescope inside a mountaintop observatory",
    "difficulty": "B2"
  },
  {
    "id": "wp-18",
    "imageUrl": "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80",
    "altText": "Landscape architects reviewing architectural blueprints atop an urban rooftop garden overlooking skyscrapers",
    "difficulty": "B2"
  },
  {
    "id": "wp-19",
    "imageUrl": "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80",
    "altText": "A fine art conservator using magnifying tools to clean pigments on an antique oil canvas painting",
    "difficulty": "C1"
  },
  {
    "id": "wp-20",
    "imageUrl": "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    "altText": "Chemical engineering students observing fractional distillation columns in an academic pilot plant",
    "difficulty": "B2"
  },
  {
    "id": "wp-21",
    "imageUrl": "https://images.unsplash.com/photo-1508873696983-2df57046475a?auto=format&fit=crop&w=800&q=80",
    "altText": "A field geologist tapping sedimentary rock strata with a rock hammer along an exposed mountain cliff",
    "difficulty": "B2"
  },
  {
    "id": "wp-22",
    "imageUrl": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    "altText": "A cross-functional startup team engaged in an animated brainstorming session in front of a glass whiteboard",
    "difficulty": "B1"
  }
];

// interactiveWritingBank
export const interactiveWritingBank: InteractiveWritingQuestion[] = [
  {
    "id": "iw-1",
    "part1Prompt": "Some educators advocate for replacing traditional physical textbooks entirely with interactive digital tablets and online resources. Others argue that physical printed books facilitate deeper comprehension and memory retention. Discuss both perspectives and state your own view.",
    "part2Prompt": "Considering your previous response, how might socioeconomic disparities between students impact a school district's decision to adopt a fully digital curriculum?",
    "difficulty": "B2"
  },
  {
    "id": "iw-2",
    "part1Prompt": "With the rise of telecommuting and remote work platforms, many corporations have downsized physical office headquarters. To what extent do you believe remote work benefits employee productivity and corporate culture?",
    "part2Prompt": "In light of your argument, what specific policies should management implement to prevent professional isolation and maintain team camaraderie among remote staff?",
    "difficulty": "B2"
  },
  {
    "id": "iw-3",
    "part1Prompt": "Metropolitan governments often face a choice between funding large-scale public transit networks or expanding highway capacity for private vehicles. Which investment strategy yields greater long-term societal and economic benefits?",
    "part2Prompt": "Building on your stance, how can urban planners ensure that public transit systems remain financially solvent during periods of fluctuating ridership?",
    "difficulty": "C1"
  },
  {
    "id": "iw-4",
    "part1Prompt": "Recent advancements in generative artificial intelligence enable algorithms to produce music, literature, and visual artwork. Can machine-generated content ever possess genuine artistic value, or is human intention essential to art?",
    "part2Prompt": "Following your line of reasoning, how should copyright and intellectual property laws be modernized to protect human creators in an AI-dominated creative landscape?",
    "difficulty": "C1"
  },
  {
    "id": "iw-5",
    "part1Prompt": "Governments spend billions of dollars annually on space exploration and planetary science missions. Critics contend that these fiscal resources should be redirected toward domestic poverty alleviation and climate mitigation. Do you agree or disagree?",
    "part2Prompt": "Reflecting on your initial argument, what technological or scientific spin-offs from aerospace research justify or undermine public funding for space initiatives?",
    "difficulty": "B2"
  },
  {
    "id": "iw-6",
    "part1Prompt": "Several nations have enacted complete bans on single-use plastic packaging, mandating biodegradable or reusable alternatives. Discuss the environmental efficacy versus the economic burdens of such regulations on small businesses.",
    "part2Prompt": "Taking into account your perspective, what government subsidies or tax incentives could ease the transition for commercial retail vendors?",
    "difficulty": "B2"
  },
  {
    "id": "iw-7",
    "part1Prompt": "The concept of Universal Basic Income (UBI)—providing all adult citizens with unconditional financial payments—has garnered significant global debate. Does UBI represent a viable safety net for an automated economy or a disincentive to labor?",
    "part2Prompt": "Considering your earlier points, how might the implementation of a UBI impact national inflation rates and consumer purchasing behavior?",
    "difficulty": "C1"
  },
  {
    "id": "iw-8",
    "part1Prompt": "In rapidly growing historic cities, developers frequently advocate demolishing aged heritage architecture to construct high-density modern residential towers. How should municipalities balance architectural heritage preservation with affordable housing shortages?",
    "part2Prompt": "Expanding on your argument, what architectural design strategies can successfully integrate historic building facades with contemporary structural expansions?",
    "difficulty": "B2"
  },
  {
    "id": "iw-9",
    "part1Prompt": "Genetically modified crops engineered for drought tolerance and pest resistance could significantly alleviate global hunger. However, concerns remain regarding ecological biodiversity and seed corporate monopolies. What is your position on agricultural biotechnology?",
    "part2Prompt": "In connection with your stance, how can regulatory frameworks ensure that smallholder farmers in developing nations retain affordable access to patent-protected agricultural seeds?",
    "difficulty": "C1"
  },
  {
    "id": "iw-10",
    "part1Prompt": "Many primary schools are implementing mandatory dual-language immersion programs where students learn core subjects in two languages simultaneously. Discuss the cognitive advantages and potential developmental hurdles of bilingual curricula.",
    "part2Prompt": "Based on your view, how can schools recruit and retain qualified multilingual educators to sustain rigorous bilingual instruction?",
    "difficulty": "B1"
  },
  {
    "id": "iw-11",
    "part1Prompt": "Standardized entrance examinations have long been utilized as the primary metric for university admissions. Critics argue they perpetuate socioeconomic inequalities, while proponents claim they offer an objective benchmark. What is your opinion?",
    "part2Prompt": "Building upon your thesis, what holistic admissions criteria—such as portfolio reviews or practical interviews—should complement or replace standardized testing?",
    "difficulty": "B2"
  },
  {
    "id": "iw-12",
    "part1Prompt": "Social media recommendation algorithms are engineered to maximize user engagement by amplifying polarizing content. To what extent should regulatory authorities impose algorithmic transparency and neutrality requirements on tech platforms?",
    "part2Prompt": "Considering your answer, how can governments balance regulatory oversight of digital algorithms with the fundamental right to free expression?",
    "difficulty": "C1"
  },
  {
    "id": "iw-13",
    "part1Prompt": "Many countries are debating whether to mandate that all new automobiles sold after 2035 must be fully electric. Discuss the environmental benefits and infrastructural obstacles associated with rapid vehicular electrification.",
    "part2Prompt": "In light of your points, how should energy utility companies prepare national power grids for the immense surge in electricity demand caused by electric vehicle charging?",
    "difficulty": "B2"
  },
  {
    "id": "iw-14",
    "part1Prompt": "International tourism generates crucial foreign exchange revenues for developing regions but frequently causes environmental degradation and cultural commodification. How can destinations achieve genuinely sustainable cultural ecotourism?",
    "part2Prompt": "Reflecting on your previous response, what role should indigenous local communities play in managing visitor capacities and preserving sacred heritage monuments?",
    "difficulty": "B2"
  },
  {
    "id": "iw-15",
    "part1Prompt": "Urban pedestrianization initiatives—closing downtown commercial streets to private motor vehicles—often meet resistance from local retail shop owners. Does pedestrianization ultimately harm or revitalize downtown commercial districts?",
    "part2Prompt": "Based on your perspective, how can municipal logistics accommodate essential freight deliveries and emergency services in car-free urban centers?",
    "difficulty": "C1"
  }
];

// writingSampleBank
export const writingSampleBank: WritingSampleQuestion[] = [
  {
    "id": "ws-1",
    "prompt": "Some argue that higher education should be treated as an essential public good financed entirely by general taxation, ensuring tuition-free access for all citizens. Others contend that students should fund their own tuition since they personally capture higher career earnings. Discuss both viewpoints and articulate your own reasoned perspective.",
    "difficulty": "C1"
  },
  {
    "id": "ws-2",
    "prompt": "Rapid advancements in autonomous artificial intelligence and automated robotics threaten to displace routine cognitive and manual professions. What responsibilities do national governments and corporate employers hold in retraining and supporting displaced workers?",
    "difficulty": "C1"
  },
  {
    "id": "ws-3",
    "prompt": "In an era of global pandemics and lifestyle-induced chronic illnesses, should governments enact mandatory public health measures—such as high taxation on sugary products or mandatory physical fitness programs—even if they restrict individual autonomy?",
    "difficulty": "B2"
  },
  {
    "id": "ws-4",
    "prompt": "Many argue that the environmental damage caused by industrial consumerism can only be reversed if individuals voluntarily adopt minimalistic, low-consumption lifestyles. Others assert that only strict governmental regulatory mandates on corporations can avert ecological collapse. Evaluate both perspectives.",
    "difficulty": "C1"
  },
  {
    "id": "ws-5",
    "prompt": "Digital communication technologies have made human connectivity instantaneous across continents. However, sociologists observe rising rates of loneliness and social alienation among urban youth. Has modern digital hyperconnectivity enriched or impoverished genuine human relationships?",
    "difficulty": "B2"
  },
  {
    "id": "ws-6",
    "prompt": "Should scientific research concerning potentially dangerous technologies—such as autonomous bioweapons or synthetic pathogens—be subjected to strict international government censorship, or should scientific inquiry remain universally open and transparent?",
    "difficulty": "C1"
  },
  {
    "id": "ws-7",
    "prompt": "Many historical artifacts currently exhibited in major Western metropolitan museums were acquired during colonial occupations. Should cultural institutions unconditionally repatriate these treasures to their countries of origin, or does global museum curation protect world heritage?",
    "difficulty": "C1"
  },
  {
    "id": "ws-8",
    "prompt": "Some educational philosophers maintain that competitive grading systems foster academic excellence and prepare students for competitive economies. Others claim that letter grades induce debilitating anxiety and stifle intrinsic intellectual curiosity. What is your stance?",
    "difficulty": "B2"
  },
  {
    "id": "ws-9",
    "prompt": "The rapid expansion of artificial intelligence tools in academic writing and programming has raised ethical dilemmas in universities. Should educational institutions prohibit student use of generative AI tools, or should they formally integrate them into curricula?",
    "difficulty": "B2"
  },
  {
    "id": "ws-10",
    "prompt": "Is economic globalization still an engine of international prosperity and poverty reduction, or has it exacerbated economic inequality and rendered sovereign nations dangerously vulnerable to global supply chain shocks?",
    "difficulty": "C1"
  },
  {
    "id": "ws-11",
    "prompt": "Many scientists advocate for large-scale geoengineering interventions—such as stratospheric aerosol injection to reflect solar radiation—as a necessary back-up mechanism against catastrophic climate change. Do the potential ecological risks outweigh the climate benefits?",
    "difficulty": "C1"
  },
  {
    "id": "ws-12",
    "prompt": "Do public figures and celebrity influencers have an ethical obligation to use their digital platforms to advocate for social and political causes, or should they remain neutral entertainers?",
    "difficulty": "B1"
  },
  {
    "id": "ws-13",
    "prompt": "As urban centers become increasingly expensive, many young professionals are migrating to secondary rural towns. Will this decentralization rejuvenate rural economies, or will it trigger gentrification and displace long-term local populations?",
    "difficulty": "B2"
  },
  {
    "id": "ws-14",
    "prompt": "Should pharmaceutical patents on life-saving vaccinations and therapeutic medications be waived during global healthcare emergencies to guarantee universal affordability, even if it reduces corporate incentives for future drug development?",
    "difficulty": "C1"
  },
  {
    "id": "ws-15",
    "prompt": "Many countries are considering lowering the legal voting age to sixteen to empower youth in political decisions that directly affect their ecological future. Discuss the arguments for and against lowering the voting age.",
    "difficulty": "B2"
  },
  {
    "id": "ws-16",
    "prompt": "Does the widespread adoption of remote telework represent a permanent elevation of personal work-life balance, or will it ultimately erode professional boundaries and lead to chronic occupational burnout?",
    "difficulty": "B2"
  },
  {
    "id": "ws-17",
    "prompt": "Should governments invest heavily in preserving dying minority languages through subsidized cultural schools, or is linguistic homogenization an inevitable and pragmatic feature of global communication?",
    "difficulty": "C1"
  },
  {
    "id": "ws-18",
    "prompt": "The commercialization of space exploration by private aerospace corporations is accelerating orbital launches. Should outer space exploration be managed primarily by private commercial enterprise or by multinational public consortia?",
    "difficulty": "C1"
  },
  {
    "id": "ws-19",
    "prompt": "Some argue that artistic expression should never be restricted by censorship or public funding conditions, regardless of controversial content. Others believe public subsidies should carry civic responsibilities. What is your position?",
    "difficulty": "B2"
  },
  {
    "id": "ws-20",
    "prompt": "In an era of widespread automated facial recognition and digital surveillance, how should modern democracies balance national security imperatives against citizens' constitutional privacy rights?",
    "difficulty": "C1"
  }
];

// speakPhotoBank
export const speakPhotoBank: SpeakAboutPhotoQuestion[] = [
  {
    "id": "sp-1",
    "imageUrl": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    "altText": "A scientist in protective equipment conducting research in a modern laboratory",
    "topic": "Laboratory Science & Biochemical Research",
    "difficulty": "B2",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "sterile environment",
      "laboratory technician",
      "precision diagnostic apparatus",
      "scientific rigor"
    ],
    "modelTranscript": "This photograph captures a focused scientific researcher working inside a cutting-edge biochemistry laboratory. She is dressed in full protective gear, including gloves and a lab coat, carefully manipulating precision instruments. In the background, modern diagnostic screens and refrigerated chemical storage units suggest she is analyzing biological specimens. Overall, the scene emphasizes rigorous methodology and clinical focus in contemporary scientific experimentation."
  },
  {
    "id": "sp-2",
    "imageUrl": "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
    "altText": "University students studying collaboratively around a library table",
    "topic": "Higher Education & Collaborative Learning",
    "difficulty": "B2",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "undergraduate collaboration",
      "library atmosphere",
      "digital laptops and textbooks",
      "academic engagement"
    ],
    "modelTranscript": "This image depicts a dynamic group of undergraduate students collaborating around a wooden table in an academic library. They are interacting enthusiastically while referencing digital laptops and printed study guides. Surrounding tall bookshelves and abundant natural sunlight create an intellectually stimulating environment. This highlights the growing importance of cooperative group dynamics and peer exchange in modern university curricula."
  },
  {
    "id": "sp-3",
    "imageUrl": "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    "altText": "An engineer inspecting structural blueprints on a busy urban construction site",
    "topic": "Civil Engineering & Infrastructure Development",
    "difficulty": "C1",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "civil engineer",
      "safety helmet and vest",
      "architectural schematics",
      "urban modernization"
    ],
    "modelTranscript": "In this compelling image, an experienced civil engineer wearing high-visibility gear and a protective hard hat is inspecting architectural schematics on an active construction site. In the midground, reinforced concrete beams and heavy scaffolding indicate that a major infrastructural project is underway. His attentive posture suggests meticulous quality control to ensure structural integrity and compliance with rigorous engineering standards."
  },
  {
    "id": "sp-4",
    "imageUrl": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80",
    "altText": "Two software specialists discussing complex algorithms in front of illuminated monitor displays",
    "topic": "Information Technology & Data Analysis",
    "difficulty": "C1",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "software engineering",
      "data analytics",
      "code review",
      "collaborative problem-solving"
    ],
    "modelTranscript": "This photograph illustrates two technology professionals engaged in an analytical discussion in front of multi-monitor workstations displaying intricate code and data visualizations. Their focused expressions suggest they are troubleshooting algorithmic bottlenecks or reviewing systemic architecture. The ambient modern office lighting reinforces the fast-paced, collaborative nature of contemporary software engineering."
  },
  {
    "id": "sp-5",
    "imageUrl": "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?auto=format&fit=crop&w=800&q=80",
    "altText": "A ceramic artisan shaping clay pottery on a spinning wheel in an illuminated rustic workshop",
    "topic": "Traditional Craftsmanship & Ceramic Art",
    "difficulty": "B2",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "pottery wheel",
      "artisan craftsmanship",
      "tactile creativity",
      "rustic studio ambience"
    ],
    "modelTranscript": "This evocative photograph showcases a skilled ceramic artisan molding wet clay on a rotating pottery wheel inside a sunlit studio. Her hands are coated in earthen slip, demonstrating remarkable dexterity and concentration as the vessel takes shape. In the background, finished terracotta vases and sculpting tools line wooden shelving. The image celebrates the enduring heritage of manual artisanal craft in an increasingly automated world."
  },
  {
    "id": "sp-6",
    "imageUrl": "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?auto=format&fit=crop&w=800&q=80",
    "altText": "Botanical researchers inspecting rows of vibrant hydroponic crops inside an automated greenhouse",
    "topic": "Sustainable Agribusiness & Hydroponic Horticulture",
    "difficulty": "B2",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "hydroponic cultivation",
      "controlled environment agriculture",
      "agricultural technology",
      "food sustainability"
    ],
    "modelTranscript": "This image portrays agricultural scientists conducting quality inspections in an advanced commercial greenhouse equipped with vertical hydroponic racks. The lush green foliage contrasts strikingly with the clean industrial piping delivering automated nutrient solutions. The researchers are examining plant leaves for signs of nutrient deficiencies. This scene highlights how controlled environmental agriculture can conserve water and land while feeding urban populations."
  },
  {
    "id": "sp-7",
    "imageUrl": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80",
    "altText": "Automated warehouse logistics with robotic sorting units and organized tiered shelving",
    "topic": "Supply Chain Automation & Industrial Logistics",
    "difficulty": "C1",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "autonomous mobile robots",
      "supply chain efficiency",
      "warehouse fulfillment",
      "smart automation"
    ],
    "modelTranscript": "This photograph depicts a cutting-edge distribution fulfillment center operated by autonomous mobile robots navigating between towering storage shelves. Pallets of inventory are arranged in geometric precision under industrial fluorescent lighting. The absence of manual forklifts emphasizes the rapid shift toward algorithmic inventory management. The overall setting underscores the unprecedented speed and precision driving global e-commerce supply chains."
  },
  {
    "id": "sp-8",
    "imageUrl": "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80",
    "altText": "A medical surgical team in protective scrubs performing a delicate procedure under bright surgical lamps",
    "topic": "Healthcare Sciences & Surgical Precision",
    "difficulty": "C1",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "surgical theater",
      "sterile protocols",
      "interdisciplinary medical team",
      "clinical concentration"
    ],
    "modelTranscript": "In this compelling clinical setting, a surgical team composed of surgeons, anesthesiologists, and nurses is performing a delicate medical operation under high-intensity theater lamps. All personnel are clad in sterile protective gowns, caps, and masks, maintaining strict aseptic protocol. In the background, patient telemetry monitors track vital signs in real time. The solemn concentration evident in their posture highlights the immense skill and responsibility required in contemporary acute healthcare."
  },
  {
    "id": "sp-9",
    "imageUrl": "https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=800&q=80",
    "altText": "Commuters waiting along an illuminated underground subway platform as a train approaches the station",
    "topic": "Urban Transit Systems & Metropolitan Commuting",
    "difficulty": "B1",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "rapid transit platform",
      "urban commuters",
      "metropolitan infrastructure",
      "daily mobility"
    ],
    "modelTranscript": "This image captures city commuters standing patiently along a modern underground subway platform as headlights from an arriving train illuminate the subterranean tunnel. Passengers are carrying backpacks and reading smartphones, reflecting the familiar rhythm of morning rush hour. The sleek tile walls and clear digital directional signage emphasize efficient public infrastructure. It illustrates how mass transit systems remain the indispensable circulatory lifeblood of thriving global cities."
  },
  {
    "id": "sp-10",
    "imageUrl": "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80",
    "altText": "Solar energy technicians installing photovoltaic panels across an expansive desert utility farm",
    "topic": "Renewable Energy Transition & Solar Engineering",
    "difficulty": "B2",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "photovoltaic utility arrays",
      "clean energy infrastructure",
      "field technicians",
      "decarbonization"
    ],
    "modelTranscript": "This expansive photograph showcases renewable energy technicians assembling solar photovoltaic panels across an arid landscape. Hundreds of aligned solar arrays stretch toward the horizon under a clear blue sky, capturing abundant solar radiation. The technicians, wearing protective helmets and gloves, are securing electrical cabling. This image represents the monumental engineering scale required to transition national energy grids away from fossil fuels toward clean, sustainable electricity."
  },
  {
    "id": "sp-11",
    "imageUrl": "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=800&q=80",
    "altText": "An archaeological research team meticulously brushing soil away from ancient masonry ruins",
    "topic": "Historical Archaeology & Cultural Preservation",
    "difficulty": "B2",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "archaeological excavation",
      "stratigraphic documentation",
      "ancient heritage",
      "historical inquiry"
    ],
    "modelTranscript": "This photograph depicts archaeologists kneeling beside an excavation trench, using fine brushes and trowels to uncover ancient stone foundations. Measuring markers and coordinate grid lines surround the dig site, illustrating rigorous stratigraphic methodology. In the background, weathered ancient arches hint at a forgotten classical settlement. The careful, patient labor captured here demonstrates how physical material culture is preserved to illuminate the shared history of human civilization."
  },
  {
    "id": "sp-12",
    "imageUrl": "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80",
    "altText": "An industrial wind turbine maintenance specialist suspended alongside immense composite rotor blades",
    "topic": "Offshore & Onshore Wind Energy Engineering",
    "difficulty": "C1",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "wind turbine technician",
      "industrial rope access",
      "renewable maintenance",
      "extreme environments"
    ],
    "modelTranscript": "This dramatic shot illustrates an industrial wind technician suspended hundreds of feet in the air via specialized rope access systems to inspect a colossal wind turbine blade. Against an expansive overcast sky, the scale of the composite aerofoil dwarfs the worker, highlighting the audacious engineering of modern wind power. The specialist is inspecting the blade surface for microscopic fractures or erosion. It emphasizes the bravery and specialized technical training underpinning clean energy infrastructure."
  },
  {
    "id": "sp-13",
    "imageUrl": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80",
    "altText": "Professional chefs plating gourmet dishes with culinary tweezers in a bustling restaurant kitchen",
    "topic": "Gastronomy & High-Paced Culinary Arts",
    "difficulty": "B2",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "culinary artistry",
      "commercial kitchen brigade",
      "precision plating",
      "gastronomic teamwork"
    ],
    "modelTranscript": "In this dynamic kitchen environment, professional chefs in white jackets are meticulously garnishing plates with microgreens using culinary tweezers. Stainless steel workstations, copper cookware, and warm overhead heat lamps create an atmosphere of intense artistic focus. Each member of the culinary brigade plays a synchronized role in assembling high-end cuisine. The image exemplifies the intersection of artistic presentation, speed, and discipline in modern gastronomy."
  },
  {
    "id": "sp-14",
    "imageUrl": "https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80",
    "altText": "Marine scientific divers recording ecological data on a submerged coral reef transect line",
    "topic": "Marine Conservation & Coral Reef Ecology",
    "difficulty": "C1",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "marine biologists",
      "underwater survey",
      "coral reef biodiversity",
      "ecological monitoring"
    ],
    "modelTranscript": "This underwater photograph captures two marine biologists conducting an ecological survey along a coral reef transect. Equipped with scuba gear and waterproof clipboards, they are methodically logging fish populations and coral colony health. Surrounding them, colorful anthias fish and branching acropora corals create a vibrant marine ecosystem. The scene underscores the critical fieldwork scientists undertake beneath the waves to assess the ecological impacts of ocean warming and acidification."
  },
  {
    "id": "sp-15",
    "imageUrl": "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
    "altText": "A cross-functional startup team engaged in an animated brainstorming session in front of a glass whiteboard",
    "topic": "Collaborative Innovation & Enterprise Brainstorming",
    "difficulty": "B1",
    "prepTimeSec": 20,
    "speakTimeSec": 90,
    "keyThemes": [
      "brainstorming workshop",
      "collaborative problem-solving",
      "glass whiteboard ideation",
      "team culture"
    ],
    "modelTranscript": "This lively photograph portrays a multidisciplinary startup team clustered around a transparent glass whiteboard covered in colorful diagrams, arrows, and strategic bullet points. The participants are smiling and gesturing energetically as they debate concepts for an upcoming product launch. Natural daylight floods their open-plan workspace, creating an inviting, collaborative atmosphere. It highlights how transparent visual brainstorming and diverse perspectives drive creative innovation in modern knowledge enterprises."
  }
];

// speakingSampleBank
export const speakingSampleBank: SpeakingSampleQuestion[] = [
  {
    "id": "ss-1",
    "prompt": "Some people argue that university education should be completely tuition-free for all students, funded through general taxation. Others believe students should bear the financial burden since they personally reap the career rewards. Discuss both sides and state your own reasoned opinion.",
    "topic": "Higher Education Financing & Social Equity",
    "difficulty": "C1",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "equal opportunity",
      "taxpayer burden",
      "meritocracy",
      "economic mobility"
    ],
    "modelTranscript": "The question of whether university education should be publicly funded through taxation or financed by individual tuition fees is a central debate in modern educational policy. Proponents of tuition-free tertiary education contend that higher learning is a public good rather than a private luxury. Removing financial barriers fosters upward socioeconomic mobility and ensures that gifted candidates from underprivileged backgrounds can contribute their intellectual talents to society. On the other hand, critics argue that completely subsidized education places an unsustainable strain on state budgets and may disproportionately benefit higher-income demographics who are more likely to attend university. From my perspective, a hybrid framework is optimal: university tuition should be heavily subsidized, paired with need-based grants and income-contingent loans, ensuring that no qualified scholar is excluded due to financial hardship while preserving institutional quality."
  },
  {
    "id": "ss-2",
    "prompt": "Rapid advances in artificial intelligence and automation are predicted to eliminate millions of routine jobs while simultaneously creating new technical professions. How should educational institutions adapt their curricula to prepare the next generation for this transition?",
    "topic": "Artificial Intelligence, Automation & Labor Markets",
    "difficulty": "C1",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "adaptability",
      "interdisciplinary problem solving",
      "algorithmic literacy",
      "human-centric empathy"
    ],
    "modelTranscript": "As artificial intelligence and automated systems fundamentally reshape global labor markets, traditional educational models centered around rote memorization are becoming obsolete. To prepare students for this unprecedented landscape, schools and universities must fundamentally pivot toward cultivating durable, human-centric competencies. First and foremost, curricula must emphasize critical thinking, philosophical reasoning, and creative problem-solving—skills that algorithmic models cannot easily replicate. Furthermore, educational systems must cultivate algorithmic literacy, ensuring that graduates know how to leverage AI tools ethically and productively rather than competing with them. Ultimately, lifelong adaptability and continuous retraining will be the most valuable assets in the twenty-first-century workplace."
  },
  {
    "id": "ss-3",
    "prompt": "Do you believe governments have a responsibility to pass laws restricting personal choices for public health reasons, such as imposing taxes on sugary beverages or mandating health warnings? Support your stance with specific reasons and examples.",
    "topic": "Public Health Regulations & Individual Liberty",
    "difficulty": "B2",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "healthcare expenditure",
      "individual autonomy",
      "preventative intervention",
      "informed choice"
    ],
    "modelTranscript": "The balance between governmental public health interventions and individual autonomy is a delicate ethical question. While libertarian philosophies argue that consenting adults should retain full sovereignty over their dietary habits, I firmly maintain that targeted governmental regulations, such as sugar taxes and transparent labeling, are entirely justified. Preventable lifestyle ailments like diabetes and cardiovascular disease impose immense fiscal strain on publicly funded healthcare systems, meaning individual dietary choices create negative societal externalities. Implementing fiscal disincentives on harmful goods and using those revenues to subsidize nutritious alternatives encourages healthier behavioral patterns without outright banning products. Therefore, reasonable regulation represents a pragmatic defense of collective societal well-being."
  },
  {
    "id": "ss-4",
    "prompt": "Many cultural landmarks around the world are suffering physical degradation due to mass international tourism. Should authorities impose strict daily quotas on visitors to preserve historical sites, even if it harms local businesses? Explain your view.",
    "topic": "Heritage Conservation & Overtourism",
    "difficulty": "B2",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "overtourism",
      "structural preservation",
      "local economic livelihood",
      "sustainable quotas"
    ],
    "modelTranscript": "The tension between commercial tourism revenues and the preservation of irreplaceable world heritage sites has reached a critical juncture. Historic landmarks such as Venice, Machu Picchu, and ancient Egyptian tombs were simply never engineered to endure millions of annual visitors without irreversible structural wear. In my judgment, municipal authorities must enact strict daily visitor quotas and timed ticketing frameworks. While local hospitality merchants may express initial concerns regarding reduced revenues, unrestricted overtourism inevitably destroys the very cultural authenticity that attracts visitors in the first place. Preserving these monuments ensures long-term economic sustainability over decades rather than short-sighted exploitation over a few seasons. Consequently, responsible preservation must take precedence over unchecked foot traffic."
  },
  {
    "id": "ss-5",
    "prompt": "Some believe that scientific researchers should have complete freedom to pursue any line of inquiry without external ethical oversight, while others argue that society must regulate scientific experiments to prevent harmful consequences. What is your position?",
    "topic": "Ethics in Scientific Inquiry & Biotechnology",
    "difficulty": "C1",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "academic freedom",
      "bioethics",
      "unintended consequences",
      "societal accountability"
    ],
    "modelTranscript": "The boundary between unrestricted intellectual curiosity and societal ethical oversight is one of the most consequential dilemmas of our era. Historically, unfettered scientific pursuit has led to monumental medical discoveries; however, contemporary frontiers such as human germline genetic editing, autonomous lethal weaponry, and synthetic biology present catastrophic risks if left completely unregulated. It is my firm conviction that independent multidisciplinary ethics boards—comprising ethicists, sociologists, and legal scholars alongside scientists—must govern high-risk research. Transparent oversight does not stifle legitimate discovery; rather, it ensures that technological breakthroughs are channeled toward the alleviation of human suffering rather than the creation of uncontrolled existential hazards."
  },
  {
    "id": "ss-6",
    "prompt": "With the rise of digital reading and audiobooks, some commentators argue that public libraries have become obsolete and should be defunded to save municipal budgets. Do you agree or disagree with this perspective?",
    "topic": "Public Libraries as Community Infrastructure",
    "difficulty": "B1",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "civic equality",
      "digital divide",
      "community spaces",
      "lifelong learning"
    ],
    "modelTranscript": "I strongly disagree with the notion that public libraries have become obsolete in the digital era. While it is true that commercial ebooks and audiobooks are widely accessible to affluent populations, public libraries serve as indispensable civic sanctuaries for entire communities. Beyond lending physical books, modern libraries provide free high-speed internet access, digital literacy workshops for seniors, quiet study sanctuaries for low-income students, and immigration integration resources. Defunding public libraries would severely widen the socioeconomic digital divide, depriving underprivileged citizens of the tools required to participate in modern knowledge economies. Therefore, libraries should not be viewed as outdated book warehouses, but rather as essential pillars of democratic equality and social mobility."
  },
  {
    "id": "ss-7",
    "prompt": "Some people believe that living in large metropolitan cities offers the best opportunities for personal and professional growth. Others argue that rural or small-town living provides a far healthier and more balanced lifestyle. Which environment do you prefer and why?",
    "topic": "Urbanism vs Rural Quality of Life",
    "difficulty": "B2",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "career agglomeration",
      "cultural dynamism",
      "pace of life",
      "mental well-being"
    ],
    "modelTranscript": "The choice between metropolitan living and rural tranquility involves an intrinsic trade-off between professional velocity and holistic personal well-being. From my perspective, urban centers offer unparalleled advantages, particularly during the formative stages of one's career. Large cities concentrate diverse global industries, cultural institutions, and academic centers, creating dense professional networks and intellectual stimulation that small towns simply cannot replicate. While urban living undoubtedly introduces challenges such as elevated living costs, sensory overload, and vehicular congestion, the sheer diversity of experiences and career serendipity far outweighs these drawbacks. By intentionally cultivating personal downtime, one can thrive amid the dynamic pulse of a global metropolis."
  },
  {
    "id": "ss-8",
    "prompt": "Should students be required to study a foreign language throughout their primary and secondary education, or should languages be entirely elective? Defend your position with specific arguments.",
    "topic": "Mandatory Foreign Language Education",
    "difficulty": "B2",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "cognitive flexibility",
      "cultural empathy",
      "global commerce",
      "pedagogical mandate"
    ],
    "modelTranscript": "In an increasingly interconnected global economy, foreign language education should unequivocally remain a mandatory component of primary and secondary curricula. First and foremost, developmental neuroscience proves that learning a second language at an early age enhances cognitive flexibility, executive functioning, and abstract problem-solving skills that benefit mathematics and native language literacy alike. Furthermore, acquiring another tongue breaks down ethnocentric biases, fostering deep cultural empathy and international understanding among young scholars. In a globalized professional landscape, multilingual individuals enjoy distinct advantages in diplomacy, international trade, and scientific collaboration. Making languages elective would deprive millions of students of these transformative developmental benefits."
  },
  {
    "id": "ss-9",
    "prompt": "Is space tourism a legitimate milestone of human aerospace advancement or an irresponsible luxury that squanders resources and harms the atmosphere? What is your perspective?",
    "topic": "Commercial Space Tourism & Ecological Cost",
    "difficulty": "C1",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "aerospace innovation",
      "carbon footprint",
      "wealth inequality",
      "commercial viability"
    ],
    "modelTranscript": "The emergence of commercial suborbital space tourism for ultra-wealthy individuals is a deeply polarized topic. Proponents argue that commercial passenger flights accelerate technological maturation, lowering launch costs and driving innovation in reusable rocketry that will ultimately benefit planetary climate monitoring. Conversely, critics rightly point out that launching wealthy tourists into suborbital space generates massive black carbon emissions directly into the delicate stratosphere for mere minutes of recreational weightlessness. In my view, while aerospace innovation is admirable, suborbital tourism in its present form represents an irresponsible ecological indulgence during a global climate emergency. Until launch systems transition to carbon-neutral propellants, regulatory frameworks should tax recreational space flights heavily and redirect those funds toward terrestrial ecological protection."
  },
  {
    "id": "ss-10",
    "prompt": "Should high school curricula include mandatory practical life skills courses—such as personal financial budgeting, basic tax preparation, and emotional self-regulation—alongside academic subjects? Discuss.",
    "topic": "Life Skills Education & Curricular Reform",
    "difficulty": "B1",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "financial literacy",
      "emotional resilience",
      "practical adulthood",
      "holistic education"
    ],
    "modelTranscript": "I whole-heartedly endorse the integration of mandatory practical life skills into standard high school curricula. Traditional secondary education often focuses exclusively on abstract academic disciplines like trigonometry and ancient history, while neglecting the fundamental competencies required to navigate modern adult life. Consequently, millions of young adults enter university and the workforce without understanding basic personal budgeting, compound interest, rental contracts, or tax compliance, leading to avoidable indebtedness and psychological stress. Introducing dedicated courses in financial literacy, critical media evaluation, and emotional resilience equips students with practical tools to achieve independence and stability. Such instruction complements academic scholarship and produces far more grounded, capable citizens."
  },
  {
    "id": "ss-11",
    "prompt": "Do you believe that public figures, such as artists and professional athletes, should be judged primarily by their professional talents, or should their private personal conduct be factored into their public legacy?",
    "topic": "Public Legacy vs Personal Conduct",
    "difficulty": "B2",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "role models",
      "separation of art and artist",
      "moral accountability",
      "cultural legacy"
    ],
    "modelTranscript": "The question of whether to separate an individual's extraordinary professional talent from their personal moral conduct is an enduring cultural conundrum. While classical aesthetics suggests that an artwork or athletic achievement should be evaluated purely on its intrinsic technical merits, we must recognize that modern public figures occupy influential positions as societal role models. When an individual commands immense celebrity status and commercial sponsorships, their private behavior sends powerful behavioral signals across society. While historical figures must be evaluated with nuanced historical context, contemporary institutions cannot completely ignore egregious misconduct in the name of exceptional talent. Holding prominent individuals morally accountable reinforces core communal standards."
  },
  {
    "id": "ss-12",
    "prompt": "Some argue that competitive team sports are the best way to teach children cooperation and resilience. Others believe cooperative non-competitive activities are healthier for psychological development. Which approach do you support?",
    "topic": "Youth Sports & Character Formation",
    "difficulty": "B1",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "sportsmanship",
      "healthy competition",
      "psychological pressure",
      "cooperative play"
    ],
    "modelTranscript": "Both competitive sports and cooperative activities offer distinct pedagogical advantages, but in my experience, structured competitive team sports provide uniquely powerful developmental lessons for young people. When children participate in team sports like soccer, basketball, or rowing, they learn firsthand how to subordinate individual ego for collective triumph. Crucially, sports teach youth how to process defeat with grace and resilience—a life lesson that purely non-competitive activities cannot replicate. Experiencing a painful loss and returning to practice the next morning to improve builds durable emotional tenacity. Provided that coaches emphasize sportsmanship and effort over ruthless winning, team sports foster invaluable character traits that serve children throughout their lives."
  },
  {
    "id": "ss-13",
    "prompt": "Should governments invest in massive infrastructure projects like high-speed bullet train networks between cities, or should they prioritize maintaining and repairing existing regional roads and bridges?",
    "topic": "Infrastructural Strategy: High-Speed Rail vs Maintenance",
    "difficulty": "C1",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "high-speed rail",
      "deferred maintenance",
      "carbon efficiency",
      "macroeconomic strategy"
    ],
    "modelTranscript": "Strategic national infrastructural planning requires balancing visionary long-term modernization with the pragmatic maintenance of legacy assets. While repairing crumbling bridges and local roads is an immediate public safety imperative that cannot be ignored, I argue that investing aggressively in electrified high-speed rail corridors represents the single most transformative investment a modern economy can make. High-speed rail connects regional economic hubs, reduces domestic aviation emissions by up to ninety percent, and provides reliable, weather-resilient mass transit. Nations like Japan, France, and China have demonstrated that high-speed rail networks unleash immense decentralized economic growth. Governments must allocate funds to eliminate critical maintenance backlogs while simultaneously financing high-speed rail to secure an environmentally sustainable future."
  },
  {
    "id": "ss-14",
    "prompt": "In an increasingly cashless society where transactions occur via smartphones and credit cards, what are the primary advantages and potential social risks for vulnerable populations?",
    "topic": "The Cashless Economy & Financial Inclusion",
    "difficulty": "B2",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "digital payments",
      "unbanked populations",
      "financial privacy",
      "systemic resilience"
    ],
    "modelTranscript": "The rapid global transition toward a cashless economic architecture delivers undeniable convenience, reduced retail transaction friction, and greater transparency in combating tax evasion and money laundering. However, this digital transformation introduces profound societal risks that policymakers frequently overlook. Specifically, elderly citizens, unbanked low-income families, and rural residents without reliable smartphone connectivity risk severe financial disenfranchisement when physical cash is refused by businesses. Furthermore, an entirely digital payments ecosystem creates vulnerabilities to catastrophic power outages, cyber disruptions, and state surveillance. Therefore, while embracing digital transaction technologies, governments must legally preserve the acceptance of physical legal tender as a fundamental economic safety net."
  },
  {
    "id": "ss-15",
    "prompt": "If you had the authority and resources to solve one global crisis over the next decade—such as climate change, poverty, or epidemic disease—which would you prioritize and why?",
    "topic": "Global Priority Setting & Existential Crises",
    "difficulty": "C1",
    "prepTimeSec": 30,
    "speakTimeSec": 180,
    "keyThemes": [
      "climate crisis",
      "root cause analysis",
      "ecological stability",
      "interconnected global challenges"
    ],
    "modelTranscript": "While humanity confronts an array of deeply urgent crises, including extreme poverty, educational inequality, and epidemic disease, I would unequivocally prioritize the global climate and biodiversity crisis. The foundational rationale is that ecological stability is the prerequisite for solving every other human challenge. If runaway global heating triggers widespread desertification, sea-level rise, and catastrophic agricultural collapses, international poverty and refugee displacement will escalate by orders of magnitude. Furthermore, ecological degradation accelerates zoonotic disease transmission and ignites conflicts over dwindling freshwater aquifers. By investing all resources into clean energy transitions, ecological restoration, and carbon removal, we preserve the biosphere upon which all human prosperity, public health, and social justice ultimately depend."
  }
];
