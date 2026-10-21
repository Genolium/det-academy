#!/usr/bin/env node
/**
 * Directus production readiness preflight.
 * Checks URL scheme, authentication, vocabulary collection, fields and public read permission.
 */
const production = process.argv.includes('--production');
const base = (process.env.DIRECTUS_URL || '').replace(/\/$/, '');
const token = process.env.DIRECTUS_TOKEN || '';
const email = process.env.DIRECTUS_EMAIL || '';
const password = process.env.DIRECTUS_PASSWORD || '';

const fail = (message) => {
  console.error(`BLOCKED: ${message}`);
  process.exit(1);
};

if (!base) fail('DIRECTUS_URL is required');
if (production && !base.startsWith('https://')) fail('production Directus must use https://');
if (!token && !(email && password)) fail('DIRECTUS_TOKEN or DIRECTUS_EMAIL/PASSWORD is required');

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { ...options, headers: { ...(options.headers || {}) } });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { response, body };
}

let accessToken = token;
if (!accessToken) {
  const login = await request('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!login.response.ok) fail(`Directus login failed (${login.response.status})`);
  accessToken = login.body?.data?.access_token;
  if (!accessToken) fail('Directus login returned no access token');
}

const headers = { Authorization: `Bearer ${accessToken}` };
const collection = await request('/collections/vocabulary_publication', { headers });
if (!collection.response.ok) fail('collection vocabulary_publication is missing');

for (const field of ['word', 'status', 'external_id', 'collaborations']) {
  if (field === 'collaborations') continue;
  const result = await request(`/fields/vocabulary_publication/${field}`, { headers });
  if (!result.response.ok) fail(`field ${field} is missing`);
}

const permissions = await request('/permissions?limit=200', { headers });
if (!permissions.response.ok) fail('cannot read Directus permissions');
const publicRead = (permissions.body?.data || []).some(
  (item) => item.collection === 'vocabulary_publication' && item.action === 'read' && item.permissions?.status?._eq === 'published'
);
if (!publicRead) fail('public read permission for vocabulary_publication/status=published is missing');

console.log(JSON.stringify({
  status: 'ok',
  url: base,
  production,
  collection: 'vocabulary_publication',
  publicRead,
}, null, 2));
