export interface CTestGap {
  index: number;
  prefix: string;
  missing: string;
  suffix: string;
  fullWord: string;
  clue?: string;
}

export type CTestSegment =
  | { type: 'text'; content: string }
  | { type: 'gap'; gap: CTestGap };

export interface GeneratedCTest {
  id: string;
  title: string;
  difficulty: 'A2' | 'B1' | 'B2' | 'C1';
  segments: CTestSegment[];
  gaps: CTestGap[];
  fullText: string;
}

// Rich academic passages from 5 C test easy/hard & full tests with ample context (80-120 words)
export const academicPassages = [
  {
    title: 'The Psychology of Decision Making',
    difficulty: 'B2' as const,
    fullText: 'Cognitive psychologists investigate how subconscious biases influence economic choices. When individuals confront complex dilemmas, they frequently rely on intuitive heuristics rather than systematic mathematical calculations. Consequently, emotional framing can dramatically alter consumer behavior in modern retail markets. Researchers emphasize that recognizing these irrational tendencies enables citizens to make significantly more prudent financial investments.',
  },
  {
    title: 'Marine Microplastics & Food Webs',
    difficulty: 'B2' as const,
    fullText: 'Synthetic polymer contamination represents a formidable challenge to oceanic life. Industrial runoff deposits microscopic plastic particles into coastal waters, where they are inadvertently ingested by plankton and juvenile fish. Because these synthetic contaminants resist biological degradation, chemical toxins accumulate up the trophic hierarchy into apex predators. Conservation biologists urge international regulatory bodies to enforce comprehensive plastic packaging restrictions.',
  },
  {
    title: 'The Evolution of Written Language',
    difficulty: 'C1' as const,
    fullText: 'Ancient civilizations developed structured writing systems to preserve administrative and agricultural records. Early cuneiform tablets in Mesopotamia recorded grain transactions before expanding into legal treaties and monumental literature. Anthropologists assert that written symbols allowed human communities to transmit empirical knowledge across successive generations without relying exclusively on fragile oral traditions.',
  },
  {
    title: 'Sustainable Urban Transportation',
    difficulty: 'B1' as const,
    fullText: 'Metropolitan planners are redesigning road networks to prioritize pedestrians and cycling infrastructure. Expanding dedicated electric bus routes substantially reduces vehicular congestion during morning rush hours. Furthermore, cleaner air quality in downtown districts encourages local commerce and fosters a vibrant community lifestyle for urban residents.',
  },
  {
    title: 'Glacial Geology & Climate Records',
    difficulty: 'C1' as const,
    fullText: 'Deep ice cores extracted from polar ice sheets provide invaluable archives of terrestrial atmospheric history. By analyzing trapped atmospheric gas bubbles preserved in ancient ice layers, paleoclimatologists reconstruct prehistoric temperature oscillations and carbon concentrations. These empirical paleoclimate records indicate that current industrial emissions are altering global climate dynamics at an unprecedented velocity.',
  },
  {
    title: 'Agricultural Biodiversity & Food Security',
    difficulty: 'B2' as const,
    fullText: 'Modern agricultural monocultures are remarkably vulnerable to emergent fungal pathogens and unpredictable weather fluctuations. Preserving ancestral crop seed varieties in international gene banks ensures that plant geneticists retain access to disease resistant traits. Agronomists contend that cultivating diverse botanical species guarantees long term resilience against catastrophic harvest failures worldwide.',
  },
  {
    title: 'Renewable Energy Innovation',
    difficulty: 'B2' as const,
    fullText: 'Solar panels have transformed how communities produce clean energy worldwide. Recent advancements in photovoltaic cells have dramatically lowered manufacturing costs across several industrial nations. As a result, clean power is now more affordable than traditional fossil fuels. Environmental scientists emphasize that transitioning to solar infrastructure will significantly reduce global greenhouse gas emissions over the next decade.',
  },
  {
    title: 'Urban Ecology & Green Spaces',
    difficulty: 'B1' as const,
    fullText: 'Modern cities are creating greener spaces to support local wildlife and improve community health. Large public parks provide safe shelters for birds and insects that play vital roles in plant pollination. These green corridors also help reduce urban heat and give residents peaceful areas to exercise and relax after working hours.',
  },
  {
    title: 'Deep Ocean Exploration',
    difficulty: 'C1' as const,
    fullText: 'Specialized submersibles have unlocked unprecedented insights into underwater geological formations. Autonomous marine vehicles navigate extreme water pressure and darkness to capture high resolution imagery of marine habitats. Astrobiologists study these mysterious ecosystems because hydrothermal vents support life without sunlight, offering clues about life on distant icy planets.',
  },
  {
    title: 'Bilingual Brain & Memory',
    difficulty: 'B2' as const,
    fullText: 'Speaking multiple languages enhances cognitive flexibility and mental focus throughout adult life. Neuroscientists observed that bilingual individuals demonstrate stronger memory retention and superior problem solving skills in workplace settings. Regular language practice builds neural connections and may even delay symptoms of cognitive decline in elderly populations.',
  },
  {
    title: 'Artificial Intelligence in Medicine',
    difficulty: 'B2' as const,
    fullText: 'Diagnostic healthcare has benefited immensely from modern computer vision systems. Deep learning models analyze hospital scans with extraordinary precision to detect microscopic tumors at very early stages. Medical doctors can therefore prescribe targeted therapies sooner, substantially increasing survival rates for vulnerable patients.',
  },
  {
    title: 'Architectural Preservation',
    difficulty: 'B1' as const,
    fullText: 'Historic buildings represent the cultural identity and creative craftsmanship of previous centuries. Restoring old stone libraries requires careful masonry techniques rather than destructive chemical washing. Preserving these historic monuments fosters civic pride and attracts visitors who appreciate authentic urban architecture.',
  },
  {
    title: 'Ancient Metallurgy and Civilization',
    difficulty: 'C1' as const,
    fullText: 'The discovery of bronze alloy production marked a pivotal transition in ancient Eurasian societal organization. Smelting native copper ore with imported tin required extensive transcontinental trade networks across mountainous provinces. Consequently, administrative elites emerged to control the distribution of valuable metallic ingots and weapons.',
  },
  {
    title: 'Cognitive Linguistics and Metaphor',
    difficulty: 'B2' as const,
    fullText: 'Linguists argue that metaphorical expressions are not merely decorative figures of speech. Instead, conceptual metaphors structure how humans perceive abstract ideas such as temporal duration and interpersonal conflict. For instance, conceptualizing time as money fundamentally shapes how individuals prioritize daily professional duties.',
  },
  {
    title: 'Coral Reef Acidification',
    difficulty: 'B2' as const,
    fullText: 'Elevated concentrations of atmospheric carbon dioxide are driving progressive chemical shifts in marine environments. When ocean waters absorb excess carbon emissions, surface seawater becomes increasingly acidic and deprives mollusks of calcium. This acidification severely inhibits the calcification processes necessary for reef building corals to construct durable skeletons.',
  },
  {
    title: 'Autonomous Transportation Infrastructure',
    difficulty: 'B2' as const,
    fullText: 'Self-driving vehicles rely on complex sensor arrays to navigate unpredictable urban traffic conditions safely. Optical video cameras and radar scanners detect nearby pedestrians, cyclists, and lane boundaries within fractions of a second. Urban planners project that widespread vehicular automation could drastically reduce collision rates and roadway fatalities.',
  },
  {
    title: 'Astrophysics of Exoplanetary Atmospheres',
    difficulty: 'C1' as const,
    fullText: 'Astronomers utilize transit spectroscopy to examine the chemical composition of planets orbiting distant stars. Whenever an exoplanet transits across its host star, starlight filters through gaseous upper atmospheric layers toward sensitive orbital telescopes. By analyzing distinct molecular absorption lines, researchers can detect water vapor, methane, and atmospheric carbon.',
  },
  {
    title: 'The Architecture of Medieval Cathedrals',
    difficulty: 'B2' as const,
    fullText: 'Gothic master builders revolutionized structural engineering to maximize interior natural illumination. Pointed stone arches and ribbed ceiling vaults distributed heavy masonry weight outward toward external supporting buttresses. This enabled master masons to replace thick stone fortifications with expansive stained glass windows.',
  },
  {
    title: 'Synthetic Biology and Enzyme Engineering',
    difficulty: 'C1' as const,
    fullText: 'Bioengineers are redesigning natural catalytic enzymes to decompose persistent industrial pollutants in soil. Computational molecular modeling predicts optimal amino acid sequences that stabilize protein structures under extreme temperatures. These engineered biocatalysts can break down non-biodegradable plastics into harmless organic compounds.',
  },
  {
    title: 'Urban Heat Islands and Microclimates',
    difficulty: 'B1' as const,
    fullText: 'Densely built metropolitan zones absorb and re-emit solar radiation far more than rural surroundings. Dark asphalt pavements and concrete structures trap thermal energy during daytime hours and release it slowly throughout the night. Installing reflective roofing and planting street trees substantially alleviates nocturnal heat stress for city inhabitants.',
  },
  {
    title: 'Neural Plasticity and Lifelong Learning',
    difficulty: 'B2' as const,
    fullText: 'Neurobiological discoveries demonstrate that mature brains continue forming novel synaptic connections throughout adulthood. Acquiring unfamiliar languages stimulates dendritic growth and reinforces neural pathways across both cerebral hemispheres. Regular cognitive engagement thereby builds a cognitive reserve that mitigates age-related memory deterioration.',
  },
  {
    title: 'Volcanic Ash and Global Temperature',
    difficulty: 'B2' as const,
    fullText: 'Cataclysmic volcanic eruptions can alter hemispheric weather patterns for several consecutive years. Explosive eruption plumes inject sulfur dioxide aerosols directly into the stratosphere, forming reflective microscopic droplet veils. These airborne aerosol particles reflect incoming sunlight back into space, triggering temporary global cooling anomalies.',
  },
  {
    title: 'The Economics of Circular Waste Management',
    difficulty: 'C1' as const,
    fullText: 'Traditional linear manufacturing models follow an unsustainable pattern of resource extraction and disposal. Circular economic frameworks recover valuable metals and polymers from discarded electronics for remanufacturing into consumer devices. By recycling rare minerals and synthetic compounds, industrial firms simultaneously reduce raw procurement costs and pollution.',
  },
  {
    title: 'Marine Acoustic Ecology and Cetaceans',
    difficulty: 'C1' as const,
    fullText: 'Whales and dolphins depend on acoustic echolocation for navigation and long distance communication. Commercial cargo ships generate intense low-frequency noise that disrupts cetacean vocalizations across entire ocean basins. This chronic anthropomorphic acoustic disturbance impairs foraging efficiency and elevates physiological stress hormones in marine mammals.',
  },
  {
    title: 'Dendrochronology and Ancient Climate Patterns',
    difficulty: 'B2' as const,
    fullText: 'Concentric growth rings preserved inside ancient trees document annual local hydrological variations. Wide annular rings indicate periods of abundant precipitation, whereas narrow rings correspond to severe regional drought conditions. By cross-dating timber across multiple historic archaeological sites, paleoclimatologists reconstruct precipitation records spanning millennia.',
  },
  {
    title: 'Quantum Computing and Cryptography',
    difficulty: 'C1' as const,
    fullText: 'Quantum computing architectures exploit superposition and entanglement to solve computational problems at extraordinary speeds. Theoretical quantum processors could factor large prime numbers quickly, rendering conventional public-key encryption standards obsolete. Consequently, cybersecurity mathematicians are rapidly establishing quantum-resistant cryptographic algorithms to safeguard future global communications.',
  },
  {
    title: 'The Restoration of Historic Wetland Ecosystems',
    difficulty: 'B2' as const,
    fullText: 'Ecological restoration teams are dismantling artificial dikes to reconnect inland rivers with natural floodplains. Rejuvenated marshland ecosystems filter agricultural runoff and sediment naturally before fresh water empties into coastal estuaries. Restored wetlands also serve as vital buffers that absorb catastrophic floods while creating sanctuaries for migratory waterfowl.',
  },
  {
    title: 'Microscopic Fungi and Forest Mycelial Networks',
    difficulty: 'C1' as const,
    fullText: 'Beneath the forest floor, vast mycorrhizal networks link individual trees into cooperative biological communities. Subterranean fungal threads transport essential phosphorus and nitrogen between neighboring trees in exchange for photosynthetic carbohydrates. In return, mature canopy trees supply the subterranean fungi with photosynthetic sugars, sustaining the entire forest biome.',
  },
];

/**
 * Splits text into sentences
 */
function splitIntoSentences(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!matches) return [text];
  return matches.map((s) => s.trim());
}

/**
 * Generates an authentic DET C-Test:
 * - First sentence is 100% intact.
 * - Last sentence is 100% intact.
 * - In middle sentences, only select content words (length >= 4) with generous spacing (2-4 intact words between gaps)
 *   are damaged by hiding the second half of letters (ceil(len/2) given, floor(len/2) missing).
 * - Total gaps: strictly 5-7 gaps per passage, ensuring plenty of surrounding context!
 */
export function generateAuthenticCTest(passage: typeof academicPassages[0]): GeneratedCTest {
  const sentences = splitIntoSentences(passage.fullText);
  if (sentences.length < 3) {
    // Fallback if short
    return {
      id: 'ctest-fb',
      title: passage.title,
      difficulty: passage.difficulty,
      segments: [{ type: 'text', content: passage.fullText }],
      gaps: [],
      fullText: passage.fullText,
    };
  }

  const firstSentence = sentences[0];
  const lastSentence = sentences[sentences.length - 1];
  const middleSentences = sentences.slice(1, sentences.length - 1);

  const segments: CTestSegment[] = [
    { type: 'text', content: firstSentence + ' ' },
  ];
  const gaps: CTestGap[] = [];

  let gapIndex = 0;
  let wordCounterSinceLastGap = 0;

  for (const sentence of middleSentences) {
    const rawWords = sentence.split(/\s+/);

    for (let w = 0; w < rawWords.length; w++) {
      const rawToken = rawWords[w];
      const match = rawToken.match(/^([a-zA-Z]+)([^a-zA-Z]*)$/);

      if (!match) {
        segments.push({ type: 'text', content: rawToken + ' ' });
        continue;
      }

      const word = match[1];
      const punctuation = match[2] || '';

      // Must have at least 2-3 intact words between gaps, word length >= 4, limit to 6 gaps total
      const isEligible = word.length >= 4 && wordCounterSinceLastGap >= 3 && gaps.length < 6;

      if (isEligible) {
        const prefixLen = Math.ceil(word.length / 2);
        const prefix = word.substring(0, prefixLen);
        const missing = word.substring(prefixLen).toLowerCase();

        const gapItem: CTestGap = {
          index: gapIndex,
          prefix,
          missing,
          suffix: punctuation,
          fullWord: word,
          clue: `Целое слово: "${word}" (${word.length} букв)`,
        };

        gaps.push(gapItem);
        segments.push({ type: 'gap', gap: gapItem });
        segments.push({ type: 'text', content: ' ' });

        gapIndex++;
        wordCounterSinceLastGap = 0;
      } else {
        segments.push({ type: 'text', content: rawToken + ' ' });
        wordCounterSinceLastGap++;
      }
    }
  }

  // Append last sentence untouched
  segments.push({ type: 'text', content: lastSentence });

  return {
    id: 'ctest-' + Math.random().toString(36).substring(2, 9),
    title: passage.title,
    difficulty: passage.difficulty,
    segments,
    gaps,
    fullText: passage.fullText,
  };
}

/**
 * Get random generated C-Test with proper spacing and high context
 */
export function getRandomGeneratedCTest(preferredDifficulty?: 'A2' | 'B1' | 'B2' | 'C1'): GeneratedCTest {
  let pool = academicPassages;
  if (preferredDifficulty) {
    const filtered = academicPassages.filter((p) => p.difficulty === preferredDifficulty);
    if (filtered.length > 0) pool = filtered;
  }

  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return generateAuthenticCTest(chosen);
}
