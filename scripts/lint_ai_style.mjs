#!/usr/bin/env node
/**
 * Flags the style patterns that make Russian copy read as machine-generated:
 * formulaic "не только… но и", "играет важную роль", "важно отметить",
 * conclusion sections, vague authorities and em-dash density.
 *
 * It scans course copy and interface text, never the tasks themselves
 * (question banks, drills and generated dictionary definitions are excluded).
 *
 *   node scripts/lint_ai_style.mjs          # fail on hard markers
 *   node scripts/lint_ai_style.mjs --warn   # print but exit 0
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const targets = [
  'src/data/theoryContent.ts',
  'src/lib/translations.ts',
  ...walk('src/app').filter((file) => file.endsWith('/page.tsx')),
  ...walk('src/components/landing'),
  ...walk('src/components/dashboard'),
  ...walk('src/components/institutions'),
  ...walk('src/components/vocabulary'),
];

function walk(dir) {
  const absolute = path.join(root, dir);
  if (!fs.existsSync(absolute)) return [];
  const result = [];
  for (const entry of fs.readdirSync(absolute, { withFileTypes: true })) {
    const relative = `${dir}/${entry.name}`;
    if (entry.isDirectory()) result.push(...walk(relative));
    else if (/\.(ts|tsx)$/.test(entry.name)) result.push(relative);
  }
  return result;
}

const hard = [
  [/не только[^.!?]{0,100}но и/gi, 'конструкция «не только… но и»'],
  [/это не [^.!?]{0,100},\s*а\s/gi, 'конструкция «это не X, а Y»'],
  [/играет[^.!?]{0,60}роль/gi, '«играет роль»'],
  [/важно отметить|стоит отметить|стоит учитывать|важно помнить/gi, 'редакционная оговорка'],
  [/в заключение|подводя итог|вкратце/gi, 'раздел-заключение'],
  [/символизир\w*/gi, '«символизирует»'],
  [/по состоянию на/gi, 'оговорка о дате знаний'],
  [/эксперты (считают|утверждают)|критики (считают|утверждают)/gi, 'ссылка на безымянных экспертов'],
  [/ключев(ая|ой) (роль|момент|фактор)/gi, '«ключевая роль/момент»'],
];

const soft = [
  [/демонстрир\w*/gi, '«демонстрирует»'],
  [/отражает/gi, '«отражает»'],
  [/обеспечива\w*/gi, '«обеспечивает»'],
  [/способству\w*/gi, '«способствует»'],
  [/подч[её]ркива\w*/gi, '«подчёркивает»'],
];

function scan(file) {
  const text = fs.readFileSync(path.join(root, file), 'utf8');
  const lines = text.split('\n');
  const hardHits = [];
  const softHits = [];

  for (const [pattern, label] of hard) {
    for (const match of text.matchAll(pattern)) {
      const line = text.slice(0, match.index).split('\n').length;
      hardHits.push({ file, line, label, snippet: lines[line - 1]?.trim().slice(0, 160) });
    }
  }
  for (const [pattern, label] of soft) {
    for (const match of text.matchAll(pattern)) {
      const line = text.slice(0, match.index).split('\n').length;
      softHits.push({ file, line, label, snippet: lines[line - 1]?.trim().slice(0, 160) });
    }
  }

  // Em dashes are fine in moderation; a dense cluster is a style signal.
  const dashes = (text.match(/—/g) || []).length;
  const density = dashes / Math.max(1, text.length / 1000);
  if (dashes >= 10 && density > 2.2) {
    hardHits.push({
      file,
      line: 1,
      label: `слишком много длинных тире: ${dashes} на ${Math.round(text.length / 1000)}k символов`,
      snippet: '',
    });
  }

  return { hardHits, softHits };
}

const hardHits = [];
const softHits = [];
for (const file of [...new Set(targets)]) {
  const result = scan(file);
  hardHits.push(...result.hardHits);
  softHits.push(...result.softHits);
}

for (const hit of hardHits) {
  console.error(`${hit.file}:${hit.line} — ${hit.label}`);
  if (hit.snippet) console.error(`  ${hit.snippet}`);
}
for (const hit of softHits) {
  console.warn(`${hit.file}:${hit.line} — мягкий маркер: ${hit.label}`);
  if (hit.snippet) console.warn(`  ${hit.snippet}`);
}

console.log(`\nAI-style check: ${hardHits.length} hard, ${softHits.length} soft marker(s).`);

if (hardHits.length > 0 && !process.argv.includes('--warn')) {
  process.exit(1);
}
