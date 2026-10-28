#!/usr/bin/env node
/**
 * Warms the permanent TTS cache for the dictation bank.
 *
 * Calls the running backend once per unique sentence, so every file is
 * synthesised a single time and served from disk afterwards. Safe to re-run:
 * cached sentences are answered instantly.
 *
 *   TTS_PREGEN_BASE_URL=http://127.0.0.1:18080 node scripts/pregenerate_tts.mjs [--words]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const baseURL = (process.env.TTS_PREGEN_BASE_URL || 'http://127.0.0.1:18080').replace(/\/+$/, '');
const includeWords = process.argv.includes('--words');

const texts = new Set();

for (const seed of ['backend/db/07-theory-content.sql', 'backend/db/08-productive-bank.sql', 'backend/db/09-interactive-bank.sql']) {
  const file = path.join(root, seed);
  if (!fs.existsSync(file)) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const match of content.matchAll(/"audioSentence"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
    texts.add(JSON.parse(`"${match[1]}"`));
  }
  // Interactive listening turns are spoken through the same cached voice.
  for (const match of content.matchAll(/"speakerAudioText"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
    texts.add(JSON.parse(`"${match[1]}"`));
  }
}

if (includeWords) {
  const source = fs.readFileSync(path.join(root, 'src/data/theoryVocabulary.ts'), 'utf8');
  const match = /export const theoryWords: string\[\] = (\[[\s\S]*?\]);/.exec(source);
  if (match) {
    for (const word of JSON.parse(match[1])) texts.add(word);
  }
}

const queue = [...texts];
console.log(`warming ${queue.length} phrases via ${baseURL}`);

let ok = 0;
let failed = 0;
const concurrency = 4;

async function worker() {
  while (queue.length > 0) {
    const text = queue.shift();
    if (!text) return;
    try {
      const response = await fetch(`${baseURL}/api/v1/tts?text=${encodeURIComponent(text)}`);
      if (!response.ok) throw new Error(`status ${response.status}`);
      await response.arrayBuffer();
      ok += 1;
    } catch (error) {
      failed += 1;
      console.error(`failed: ${text.slice(0, 60)} — ${error.message}`);
    }
  }
}

await Promise.all(Array.from({ length: concurrency }, worker));
console.log(`done: ${ok} cached, ${failed} failed`);
if (failed > 0) process.exit(1);
