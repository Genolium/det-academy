#!/usr/bin/env node
/**
 * External integration preflight. It never calls paid providers; it only checks
 * that the required credentials/configuration are present.
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
  ['RESEND_API_KEY', 'email verification'],
  ['AI_BASE_URL', 'neural evaluator'],
  ['AI_MODEL', 'neural evaluator'],
  ['AI_STT_ENABLED', 'server STT'],
  ['SENTRY_DSN', 'error tracking'],
];

const missing = required.filter(([key]) => !process.env[key]?.trim());
const requireAll = process.argv.includes('--require');

if (missing.length === 0) {
  console.log(JSON.stringify({ status: 'ok', configured: required.map(([key]) => key) }, null, 2));
  process.exit(0);
}

const payload = {
  status: 'blocked',
  missing: missing.map(([key, purpose]) => ({ key, purpose })),
  hint: 'Set these secrets in the deployment environment. Never commit them to the repository.',
};
console.log(JSON.stringify(payload, null, 2));
process.exit(requireAll ? 1 : 2);
