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
  try {
    const response = await fetch(`${base}${path}`, { ...options, headers: { ...(options.headers || {}) } });
    const text = await response.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    return { response, body };
  } catch (error) {
    fail(`network/TLS error for ${base}${path}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const health = await request('/server/health');
if (!health.response.ok) fail(`Directus health endpoint returned ${health.response.status}`);

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

for (const field of ['word', 'status', 'external_id']) {
  const result = await request(`/fields/vocabulary_publication/${field}`, { headers });
  if (!result.response.ok) fail(`field ${field} is missing`);
}

// A permission entry is not enough: verify that an anonymous client can
// actually read a published row through the public API.
const publicItems = await request('/items/vocabulary_publication?limit=1&filter[status][_eq]=published', {
  headers: { 'Content-Type': 'application/json' },
});
if (!publicItems.response.ok) fail(`anonymous public read failed with ${publicItems.response.status}`);
if (!Array.isArray(publicItems.body?.data)) fail('anonymous public read returned an invalid payload');

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
  publicItems: publicItems.body.data.length,
}, null, 2));
