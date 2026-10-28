#!/usr/bin/env node
/**
 * Regenerates src/data/vocabulary-awl.json from the published vocabulary seed.
 *
 * The seed is SQL, so the public dictionary page cannot read it at runtime.
 * This script keeps the JSON mirror deterministic; run it after editing
 * backend/db/04-vocabulary-seed.sql.
 *
 *   node scripts/generate_awl_vocabulary.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sqlPath = path.join(root, 'backend/db/04-vocabulary-seed.sql');
const outPath = path.join(root, 'src/data/vocabulary-awl.json');

const sql = fs.readFileSync(sqlPath, 'utf8');
const tuple = /\('voc-(\d+)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)'::jsonb,\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*'((?:[^']|'')*)',\s*NOW\(\)\)/g;

const unquote = (value) => value.replace(/''/g, "'");

const entries = [];
for (const match of sql.matchAll(tuple)) {
  const [, id, word, ipa, pos, level, meaningRu, definitionEn, example, collocations, source, sourceUrl, status, version] = match;
  let parsedCollocations;
  try {
    parsedCollocations = JSON.parse(unquote(collocations));
  } catch {
    throw new Error(`Invalid collocations JSON for ${word}`);
  }
  entries.push({
    id: `voc-${id}`,
    word: unquote(word),
    ipa: unquote(ipa),
    pos: unquote(pos),
    level: unquote(level),
    meaningRu: unquote(meaningRu),
    definitionEn: unquote(definitionEn),
    example: unquote(example),
    collocations: parsedCollocations,
    source: unquote(source),
    sourceUrl: unquote(sourceUrl),
    status: unquote(status),
    version: unquote(version),
  });
}

if (entries.length === 0) {
  throw new Error('No vocabulary tuples found in the seed SQL');
}

fs.writeFileSync(outPath, `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Wrote ${entries.length} entries to ${path.relative(root, outPath)}`);
