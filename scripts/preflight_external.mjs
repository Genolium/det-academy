#!/usr/bin/env node
/**
 * External integration preflight. It never calls providers and never prints
 * secret values; it only checks that required configuration is present and
 * plausible.
 *
 * Exit codes: 0 = all present, 1 = --require and missing, 2 = missing (BLOCKED).
 */
const required = [
  ['GOOGLE_CLIENT_ID', 'Google OAuth'],
  ['GOOGLE_CLIENT_SECRET', 'Google OAuth'],
  ['APPLE_CLIENT_ID', 'Apple OAuth'],
  ['APPLE_TEAM_ID', 'Apple OAuth code flow'],
  ['APPLE_KEY_ID', 'Apple OAuth code flow'],
  ['APPLE_PRIVATE_KEY', 'Apple OAuth code flow'],
  ['VK_CLIENT_SECRET', 'VK ID OAuth'],
  ['YANDEX_CLIENT_SECRET', 'Yandex ID OAuth'],
  ['AI_BASE_URL', 'neural evaluator'],
  ['AI_API_KEY', 'neural evaluator'],
  ['AI_MODEL', 'neural evaluator'],
  ['AI_STT_ENABLED', 'server STT'],
  ['REQUIRE_NEURAL_EVALUATION', 'authoritative neural evaluation'],
  ['SENTRY_DSN', 'error tracking'],
];

// Email delivery accepts either the SMTP account of the domain (Beget) or the
// Resend API. One complete alternative is enough.
const emailAlternatives = [
  ['SMTP_HOST', 'SMTP_USERNAME', 'SMTP_PASSWORD'],
  ['RESEND_API_KEY'],
];

const placeholders = /^(your[_-]|change[_-]?me|replace[_-]?me|\.\.\.|<.+>)$/i;
const read = (key) => (process.env[key] || '').trim();

function isConfigured(key, value) {
  if (!value) return false;
  if (placeholders.test(value)) return false;
  if (key === 'AI_STT_ENABLED' || key === 'REQUIRE_NEURAL_EVALUATION') {
    return value.toLowerCase() === 'true';
  }
  if (key === 'SENTRY_DSN') return /^https:\/\/.+@.+\/.+/.test(value);
  if (key === 'AI_BASE_URL') return /^https?:\/\//.test(value);
  return true;
}

const missing = required
  .map(([key, purpose]) => ({ key, purpose, value: read(key) }))
  .filter(({ key, value }) => !isConfigured(key, value))
  .map(({ key, purpose }) => ({ key, purpose }));

const emailReady = emailAlternatives.some((keys) =>
  keys.every((key) => isConfigured(key, read(key)))
);
if (!emailReady) {
  missing.push({ key: 'SMTP_HOST or RESEND_API_KEY', purpose: 'email verification' });
}

const senderIdentity = read('SMTP_FROM') || read('EMAIL_FROM');
if (!isConfigured('EMAIL_FROM', senderIdentity)) {
  missing.push({ key: 'EMAIL_FROM or SMTP_FROM', purpose: 'email sender identity' });
}

const requireAll = process.argv.includes('--require');

if (missing.length === 0) {
  console.log(
    JSON.stringify(
      { status: 'ok', configured: required.map(([key]) => key), providersCalled: false },
      null,
      2
    )
  );
  process.exit(0);
}

console.log(
  JSON.stringify(
    {
      status: 'blocked',
      providersCalled: false,
      missing,
      hint: 'Set these secrets in the deployment environment. Never commit them to the repository.',
    },
    null,
    2
  )
);
process.exit(requireAll ? 1 : 2);
