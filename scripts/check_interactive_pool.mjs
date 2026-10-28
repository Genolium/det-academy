#!/usr/bin/env node
/**
 * Asserts that each interactive stage has a pool at least three times the
 * number of items the blueprint draws in one exam. This keeps the no-repeat
 * policy viable when several candidates take the same form.
 *
 * Per-stage item counts are read from backend/internal/models/models.go so
 * this check fails if the blueprint and the bank drift apart.
 *
 *   node scripts/check_interactive_pool.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readingPassages, cTestPassages } from './content/interactive-passages.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const bankPath = path.join(root, 'backend/db/09-interactive-bank.sql');
const modelsPath = path.join(root, 'backend/internal/models/models.go');

const TYPES = [
  'INTERACTIVE_READING',
  'C_TEST',
  'INTERACTIVE_LISTENING',
  'READ_THEN_SPEAK',
  'INTERACTIVE_SPEAKING',
];

const bank = fs.readFileSync(bankPath, 'utf8');
const counts = {};
for (const match of bank.matchAll(/VALUES \(\s*'[^']+',\s*'([A-Z_]+)'/g)) {
  counts[match[1]] = (counts[match[1]] ?? 0) + 1;
}

const models = fs.readFileSync(modelsPath, 'utf8');
const itemCounts = new Map();
for (const match of models.matchAll(/StageName:\s+"([A-Z_]+)",[\s\S]*?ItemCount:\s+(\d+)/g)) {
  itemCounts.set(match[1], Number(match[2]));
}

let failed = false;
for (const type of TYPES) {
  const pool = counts[type] ?? 0;
  const perStage = itemCounts.get(type);
  if (!perStage) {
    console.error(`FAIL ${type}: no ItemCount found in models.go`);
    failed = true;
    continue;
  }
  const required = perStage * 3;
  const ratio = pool / perStage;
  const ok = pool >= required;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${type}: pool ${pool}, per stage ${perStage}, required ${required} (${ratio.toFixed(1)}x)`);
  if (!ok) failed = true;
}

const cTestTexts = [...readingPassages, ...cTestPassages].map((passage) =>
  passage.text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
);
const uniqueCTestTexts = new Set(cTestTexts).size;
const cTestOk = uniqueCTestTexts >= 100 && counts.C_TEST === uniqueCTestTexts;
console.log(
  `${cTestOk ? 'ok  ' : 'FAIL'} C_TEST unique texts: ${uniqueCTestTexts}, rows ${counts.C_TEST ?? 0} (one text per item)`
);
if (!cTestOk) failed = true;

process.exit(failed ? 1 : 0);
