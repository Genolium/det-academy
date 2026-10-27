#!/usr/bin/env node
/**
 * Every image referenced by a seeded question must exist in public/.
 * A missing file renders a broken task, which is exactly the class of bug the
 * seed files used to contain.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const seeds = [
  'backend/db/init.sql',
  'backend/db/03-content-seed.sql',
  'backend/db/05-productive-question-bank.sql',
  'backend/db/06-level-bank.sql',
  'backend/db/07-theory-content.sql',
  'backend/db/08-productive-bank.sql',
];

const referenced = new Set();
for (const seed of seeds) {
  const file = path.join(root, seed);
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(/"(?:imageUrl|audioUrl)"\s*:\s*"([^"]+)"/g)) {
    if (match[1].startsWith('/')) referenced.add(match[1]);
  }
}

const missing = [...referenced].filter((url) => !fs.existsSync(path.join(root, 'public', url.replace(/^\//, ''))));
if (missing.length > 0) {
  console.error('missing image files referenced by seed questions:');
  for (const url of missing) console.error('  ' + url);
  process.exit(1);
}
console.log(`question images verified: ${referenced.size} files exist`);
