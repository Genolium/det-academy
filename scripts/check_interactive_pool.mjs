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

// The generator can validate its source objects, but the SQL file is what
// actually ships. Parse the payloads back and prove that no student can meet
// the same passage or dialogue twice in a row-level pool.
const rows = [...bank.matchAll(/VALUES \(\s*'([^']+)',\s*'([A-Z_]+)',\s*'[^']*',\s*'(\{[\s\S]*?\})',/g)];
const normalized = (value) => String(value ?? '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const uniqueness = {
  INTERACTIVE_READING: { field: 'passageText', label: 'passage text' },
  INTERACTIVE_LISTENING: { field: 'scenario', label: 'dialogue scenario' },
  C_TEST: { field: 'title', label: 'C-Test title' },
};
for (const [type, spec] of Object.entries(uniqueness)) {
  const values = rows
    .filter((match) => match[2] === type)
    .map((match) => normalized(JSON.parse(match[3])[spec.field]));
  const unique = new Set(values).size;
  const ok = values.length === (counts[type] ?? 0) && unique === values.length;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${type} unique ${spec.label}s: ${unique}, rows ${values.length}`);
  if (!ok) failed = true;
}

process.exit(failed ? 1 : 0);
