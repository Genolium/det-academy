#!/usr/bin/env node
/**
 * Idempotent Directus schema sync for the vocabulary publishing model.
 *
 * Required:
 *   DIRECTUS_URL=https://cms.example.com
 *   DIRECTUS_TOKEN=<admin static token>
 *
 * The script creates the collection and fields; it also attempts to grant the
 * public role read access filtered to status=published. If your Directus
 * version uses policies instead of roles, finish the public permission in the
 * Directus UI and keep the same filter.
 */
const base = process.env.DIRECTUS_URL?.replace(/\/$/, '');
const token = process.env.DIRECTUS_TOKEN;
if (!base || !token) {
  console.error('DIRECTUS_URL and DIRECTUS_TOKEN are required');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, { headers, ...options });
  const text = await response.text();
  let body = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  return { response, body };
}

const fields = [
  { field: 'external_id', type: 'string', schema: { is_nullable: false, length: 100 } },
  { field: 'word', type: 'string', schema: { is_nullable: false } },
  { field: 'ipa', type: 'string' },
  { field: 'pos', type: 'string' },
  { field: 'level', type: 'string' },
  { field: 'meaning_ru', type: 'text' },
  { field: 'definition_en', type: 'text' },
  { field: 'example', type: 'text' },
  { field: 'collocations', type: 'json' },
  { field: 'source', type: 'text' },
  { field: 'source_url', type: 'string' },
  { field: 'status', type: 'string', schema: { default_value: 'draft' } },
  { field: 'version', type: 'string' },
  { field: 'reviewed_at', type: 'timestamp' },
];

async function ensureCollection() {
  const existing = await request('/collections/vocabulary_publication');
  if (existing.response.ok) {
    console.log('collection vocabulary_publication already exists');
    return;
  }
  const created = await request('/collections', {
    method: 'POST',
    body: JSON.stringify({
      collection: 'vocabulary_publication',
      meta: { icon: 'menu_book', note: 'Published academic vocabulary' },
      schema: {},
    }),
  });
  if (!created.response.ok) {
    throw new Error(`failed to create collection: ${JSON.stringify(created.body)}`);
  }
  console.log('created collection vocabulary_publication');
}

async function ensureFields() {
  for (const field of fields) {
    const existing = await request(`/fields/vocabulary_publication/${field.field}`);
    if (existing.response.ok) continue;
    const created = await request('/fields/vocabulary_publication', {
      method: 'POST',
      body: JSON.stringify(field),
    });
    if (!created.response.ok) {
      throw new Error(`failed to create field ${field.field}: ${JSON.stringify(created.body)}`);
    }
    console.log(`created field ${field.field}`);
  }
}

async function ensurePublicRead() {
  const roles = await request('/roles?limit=100');
  if (!roles.response.ok) {
    console.warn('could not read roles; configure public read permission manually');
    return;
  }
  const publicRole = (roles.body?.data || []).find((role) => role.name === 'Public' || role.name === 'public');
  const policies = await request('/policies?limit=100');
  const publicPolicy = (policies.body?.data || []).find(
    (policy) => policy.name === '$t:public_label' || policy.name === 'Public' || policy.name === 'public'
  );
  const target = publicRole?.id || publicPolicy?.id;
  if (!target) {
    console.warn('Public role/policy not found; configure read permission manually for status=published');
    return;
  }
  const payload = {
    ...(publicRole ? { role: publicRole.id } : { policy: publicPolicy.id }),
    collection: 'vocabulary_publication',
    action: 'read',
    permissions: { status: { _eq: 'published' } },
    validation: null,
    presets: null,
    fields: ['*'],
  };
  const created = await request('/permissions', { method: 'POST', body: JSON.stringify(payload) });
  if (!created.response.ok) {
    console.warn(`public permission was not created: ${JSON.stringify(created.body)}`);
  } else {
    console.log('public read permission created (status=published)');
  }
}

try {
  await ensureCollection();
  await ensureFields();
  await ensurePublicRead();
  console.log('Directus vocabulary schema sync complete');
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
