export interface SplitTaskPrompt {
  task: string;
  topic?: string;
  hints: string[];
}

const HINT_MARKERS = [
  'mention ',
  'key ideas:',
  'context:',
  'give reasons',
  'explain your reasons',
  'support your position',
  'explain why',
  'use specific examples',
];

const TOPIC_PATTERN = /^(.*?)\s*\(([^()]{3,80})\)\.?\s*/;

function splitHints(raw: string): string[] {
  const text = raw.trim();
  if (!text) return [];

  const ideasIndex = text.toLowerCase().indexOf('key ideas:');
  if (ideasIndex >= 0) {
    const before = text.slice(0, ideasIndex).trim();
    const ideas = text
      .slice(ideasIndex + 'key ideas:'.length)
      .replace(/\.$/, '')
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean);
    return [...(before ? [before] : []), ...ideas];
  }

  return text
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

/**
 * Keep the actual task on screen and move coaching text ("Mention…",
 * "Key ideas…", "Context…") behind an optional hint disclosure.
 */
export function splitTaskPrompt(prompt: string, explicitHints?: string[]): SplitTaskPrompt {
  let task = (prompt || '').trim();
  let topic: string | undefined;

  const topicMatch = task.match(TOPIC_PATTERN);
  if (topicMatch) {
    topic = topicMatch[2].trim();
    const rest = task.slice(topicMatch[0].length).trim();
    task = `${topicMatch[1].trim().replace(/[.\s]+$/, '')}.${rest ? ` ${rest}` : ''}`;
  }

  if (explicitHints && explicitHints.length > 0) {
    return {
      task,
      topic,
      hints: explicitHints.map((hint) => hint.trim()).filter(Boolean),
    };
  }

  const lower = task.toLowerCase();
  let cut = -1;
  for (const marker of HINT_MARKERS) {
    const index = lower.indexOf(marker);
    if (index > 0 && (cut === -1 || index < cut)) {
      cut = index;
    }
  }

  if (cut > 0) {
    const hints = splitHints(task.slice(cut));
    task = task.slice(0, cut).trim();
    return { task: ensureSentence(task), topic, hints };
  }

  return { task: ensureSentence(task), topic, hints: [] };
}

function ensureSentence(value: string): string {
  const text = value.trim();
  if (!text) return text;
  return /[.!?]$/.test(text) ? text : `${text}.`;
}
