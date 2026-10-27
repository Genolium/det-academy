#!/usr/bin/env node
/**
 * AI provider preflight.
 *
 * Verifies that the configured OpenAI-compatible endpoint can answer a chat
 * request (and, when AI_STT_ENABLED=true, transcribe a short silent WAV).
 * It never prints the API key and spends only a negligible amount of tokens.
 *
 * Usage:
 *   AI_BASE_URL=... AI_API_KEY=... AI_MODEL=... node scripts/ai_preflight.mjs
 *   node --env-file-if-exists=.env scripts/ai_preflight.mjs
 */
const baseUrl = (process.env.AI_BASE_URL || '').replace(/\/+$/, '');
const apiKey = process.env.AI_API_KEY || '';
const model = process.env.AI_MODEL || '';
const sttEnabled = (process.env.AI_STT_ENABLED || '').toLowerCase() === 'true';
const timeoutMs = Number(process.env.AI_PREFLIGHT_TIMEOUT_MS || 20000);

function fail(message) {
  console.error(`✗ ${message}`);
  process.exitCode = 1;
}

function ok(message) {
  console.log(`✓ ${message}`);
}

if (!baseUrl || !model) {
  console.error('AI_BASE_URL and AI_MODEL are required (AI_API_KEY is required for hosted providers).');
  process.exit(2);
}

const folderId = process.env.AI_FOLDER_ID || '';
const headers = { 'Content-Type': 'application/json' };
if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
if (folderId) headers['x-folder-id'] = folderId;

async function withTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// A 0.25 s mono 16-bit silent WAV, enough for a transcription endpoint probe.
function silentWav() {
  const sampleRate = 8000;
  const samples = 2000;
  const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

async function checkChat() {
  const response = await withTimeout(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      max_tokens: 8,
      temperature: 0,
      messages: [
        { role: 'system', content: 'Reply with the single word: ready' },
        { role: 'user', content: 'ping' },
      ],
    }),
  });
  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    fail(`chat endpoint returned ${response.status}: ${body}`);
    return;
  }
  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;
  ok(`chat endpoint answered with model "${model}" (${typeof content === 'string' ? content.trim().slice(0, 40) : 'no content'})`);
}

async function checkStt() {
  const form = new FormData();
  form.append('file', new Blob([silentWav()], { type: 'audio/wav' }), 'probe.wav');
  form.append('model', process.env.AI_STT_MODEL || 'whisper-1');
  const sttHeaders = apiKey ? { Authorization: `Bearer ${apiKey}` } : {};

  const response = await withTimeout(`${baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: sttHeaders,
    body: form,
  });
  if (!response.ok) {
    const body = (await response.text()).slice(0, 300);
    fail(`STT endpoint returned ${response.status}: ${body}`);
    return;
  }
  const payload = await response.json();
  ok(`STT endpoint answered (text: ${JSON.stringify(payload?.text ?? '')})`);
}

try {
  await checkChat();
  if (sttEnabled) {
    await checkStt();
  } else {
    console.log('• STT check skipped (AI_STT_ENABLED is not true)');
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

if (process.exitCode) {
  console.error('AI preflight failed.');
}
