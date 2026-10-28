#!/usr/bin/env node
/**
 * Structural and provenance audit for the DET institution catalogue.
 *
 * The catalogue combines three hand-maintained files:
 *   src/data/duolingoInstitutions.json  - institutions listed by the official
 *                                         DET registry (acceptance, not scores)
 *   src/data/institution-metadata.json  - platform reference thresholds,
 *                                         categories, acceptance rates
 *   src/data/institution-locations.json - English city/state/country labels
 *
 * The official registry says that an institution accepts the DET. It does not
 * publish a minimum DET score. A threshold is therefore only reported as
 * verified when the dataset itself carries an institution-specific source URL
 * and a checked date. Everything else is a platform estimate or unknown.
 *
 * Usage:
 *   node scripts/verify_institutions.mjs            # human-readable report
 *   node scripts/verify_institutions.mjs --check    # CI: non-zero on structural errors
 *   node scripts/verify_institutions.mjs --check --online --sample=50
 *   node scripts/verify_institutions.mjs --online --all --concurrency=12
 *   node scripts/verify_institutions.mjs --json
 *
 * Exit codes:
 *   0  no structural errors
 *   1  structural errors found (only when --check is passed)
 *   2  the script could not read/parse its inputs, or invalid arguments
 *
 * Network access is never used unless --online is passed explicitly.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const FILES = {
  institutions: 'src/data/duolingoInstitutions.json',
  metadata: 'src/data/institution-metadata.json',
  locations: 'src/data/institution-locations.json',
  coordinates: 'src/data/verified-university-coordinates.json',
};

const DET_REGISTRY_HOSTS = new Set(['englishtest.duolingo.com', 'duolingo.com', 'www.duolingo.com']);
const REQUIREMENT_STATUSES = new Set(['verified', 'platform-estimate', 'reference', 'unknown']);
const CYRILLIC = /[А-Яа-яЁё]/;
const NAME_STOP_WORDS = new Set([
  'university', 'college', 'school', 'institute', 'institution', 'academy', 'polytechnic',
  'of', 'the', 'and', 'in', 'at', 'for', 'de', 'du', 'des', 'la', 'le', 'di', 'da', 'do',
  'national', 'international', 'state', 'campus', 'center', 'centre', 'higher', 'education',
  'studies', 'science', 'sciences', 'arts', 'art', 'business', 'technology', 'technical',
  'research', 'community', 'saint', 'st',
]);
const VALID_SCORE_MIN = 10;
const VALID_SCORE_MAX = 160;
const SCORE_STEP = 5;
const DAYS_MS = 24 * 60 * 60 * 1000;
const USER_AGENT = 'det-academy-institution-audit/1.0 (+data verification; no credentials)';

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function usage(message) {
  if (message) console.error(`error: ${message}\n`);
  console.error(`DET institution catalogue audit

Usage: node scripts/verify_institutions.mjs [options]

Options:
  --check                Exit 1 when structural errors are found (CI mode).
  --online               Check website URLs over the network (HEAD requests).
  --all                  With --online, check every unique website URL.
  --sample=N             With --online, check N evenly spaced URLs (default 50).
  --concurrency=N        Network concurrency (default 8, max 32).
  --timeout-ms=N         Per-request timeout (default 8000).
  --strict-online        Treat timeouts/5xx/DNS failures as errors too.
  --json                 Print machine-readable JSON instead of a report.
  -h, --help             Show this help.

Network is off by default. Unknown thresholds are never an error.`);
  process.exit(2);
}

function parseArgs(argv) {
  const opts = {
    check: false,
    online: false,
    all: false,
    sample: 50,
    concurrency: 8,
    timeoutMs: 8000,
    strictOnline: false,
    json: false,
  };

  for (const arg of argv) {
    if (arg === '--check') opts.check = true;
    else if (arg === '--online') opts.online = true;
    else if (arg === '--all') opts.all = true;
    else if (arg === '--strict-online') opts.strictOnline = true;
    else if (arg === '--json') opts.json = true;
    else if (arg === '-h' || arg === '--help') usage();
    else if (arg.startsWith('--sample=')) {
      opts.sample = Number(arg.slice('--sample='.length));
      if (!Number.isInteger(opts.sample) || opts.sample < 1) usage('--sample must be a positive integer');
    } else if (arg.startsWith('--concurrency=')) {
      opts.concurrency = Number(arg.slice('--concurrency='.length));
      if (!Number.isInteger(opts.concurrency) || opts.concurrency < 1 || opts.concurrency > 32) {
        usage('--concurrency must be an integer between 1 and 32');
      }
    } else if (arg.startsWith('--timeout-ms=')) {
      opts.timeoutMs = Number(arg.slice('--timeout-ms='.length));
      if (!Number.isInteger(opts.timeoutMs) || opts.timeoutMs < 500 || opts.timeoutMs > 60000) {
        usage('--timeout-ms must be an integer between 500 and 60000');
      }
    } else {
      usage(`unknown option: ${arg}`);
    }
  }

  if (opts.all) opts.online = true;
  if (opts.strictOnline) opts.online = true;
  return opts;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

function readJson(relativePath, expected) {
  const absolute = path.join(root, relativePath);
  let raw;
  try {
    raw = fs.readFileSync(absolute, 'utf8');
  } catch (err) {
    throw new Error(`${relativePath}: cannot read file (${err.message})`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error(`${relativePath}: invalid JSON (${err.message})`);
  }
  if (expected === 'array' && !Array.isArray(parsed)) throw new Error(`${relativePath}: expected a JSON array`);
  if (expected === 'object' && !isObject(parsed)) throw new Error(`${relativePath}: expected a JSON object keyed by institution name`);
  return parsed;
}

function normalizeUrl(value) {
  const url = String(value || '').trim();
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const schemeWithoutSlashes = url.match(/^(https?):(.+)$/i);
  if (schemeWithoutSlashes) return `${schemeWithoutSlashes[1].toLowerCase()}://${schemeWithoutSlashes[2].replace(/^\/+/, '')}`;
  if (url.startsWith('//')) return `https:${url}`;
  return `https://${url.replace(/^\/+/, '')}`;
}

function parseUrl(value) {
  const normalized = normalizeUrl(value);
  if (!normalized) return null;
  try {
    const url = new URL(normalized);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (!url.hostname || !url.hostname.includes('.')) return null;
    return url;
  } catch {
    return null;
  }
}

function isValidHttpUrl(value) {
  return parseUrl(value) !== null;
}

function urlHost(value) {
  const url = parseUrl(value);
  return url ? url.hostname.toLowerCase().replace(/^www\./, '') : '';
}

function isRegistryUrl(value) {
  const url = parseUrl(value);
  if (!url) return false;
  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  return DET_REGISTRY_HOSTS.has(host) || DET_REGISTRY_HOSTS.has(`www.${host}`);
}

function isIsoDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function isValidScore(value) {
  if (value === undefined || value === null || value === 0) return true;
  return Number.isInteger(value) && value >= VALID_SCORE_MIN && value <= VALID_SCORE_MAX && value % SCORE_STEP === 0;
}

function daysBetween(a, b) {
  return Math.abs(a.getTime() - b.getTime()) / DAYS_MS;
}

function nameTokens(value) {
  return new Set(
    String(value || '')
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9 ]/g, ' ')
      .split(/\s+/)
      .filter((token) => token.length > 2 && !NAME_STOP_WORDS.has(token))
  );
}

function loadCountryNameMap() {
  try {
    const text = fs.readFileSync(path.join(root, 'src/lib/countryNames.ts'), 'utf8');
    const map = {};
    for (const match of text.matchAll(/'([^']+)':\s*'([^']+)'/g)) map[match[1]] = match[2];
    return map;
  } catch {
    return {};
  }
}

function normalizeCountryName(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/^the\s+/, '')
    .replace(/^people's republic of china$/, 'china')
    .replace(/^united states of america$/, 'united states')
    .replace(/^usa$/, 'united states')
    .replace(/^uk$/, 'united kingdom')
    .replace(/^czech republic$/, 'czechia')
    .replace(/^hong kong sar$/, 'hong kong')
    .replace(/^macao sar$/, 'macao')
    .replace(/^cote d'ivoire$/, 'ivory coast')
    .replace(/^côte d’ivoire$/, 'ivory coast')
    .trim();
}

// ---------------------------------------------------------------------------
// Diagnostics
// ---------------------------------------------------------------------------

function createReporter() {
  const errors = [];
  const warnings = [];
  const infos = [];

  function add(severity, code, message, detail) {
    const entry = { severity, code, message };
    if (detail !== undefined) entry.detail = detail;
    if (severity === 'error') errors.push(entry);
    else if (severity === 'warning') warnings.push(entry);
    else infos.push(entry);
  }

  return {
    errors,
    warnings,
    infos,
    error: (code, message, detail) => add('error', code, message, detail),
    warn: (code, message, detail) => add('warning', code, message, detail),
    info: (code, message, detail) => add('info', code, message, detail),
  };
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function audit({ institutions, metadata, locations, coordinates, countryMap }) {
  const report = createReporter();
  const today = new Date();
  const todayIso = today.toISOString().slice(0, 10);
  const isUsableCheckedAt = (value) => isIsoDate(value) && value <= todayIso;

  const institutionNames = new Set();
  const institutionById = new Map();
  const websiteByName = new Map();
  const accountIds = new Map();
  const nameCountry = new Map();
  const registryCountries = new Set();
  const countryMismatches = [];

  let satisfiesRequirement = 0;
  let doesNotSatisfyRequirement = 0;
  let missingWebsite = 0;
  let nonHttpWebsite = 0;
  let malformedWebsite = 0;
  let missingLocation = 0;
  let missingCoordinates = 0;
  let missingMetadata = 0;
  let cyrillicRegistryCountries = 0;
  let cyrillicLocationCountries = 0;
  let emptyCity = 0;
  let emptyLocationCountry = 0;
  let duplicateCoordinatePairs = 0;

  // --- institutions ------------------------------------------------------
  for (let index = 0; index < institutions.length; index += 1) {
    const inst = institutions[index];
    const label = isObject(inst) && isNonEmptyString(inst.name) ? inst.name : `institutions[${index}]`;

    if (!isObject(inst)) {
      report.error('institution.not-an-object', `${label}: entry is not an object`);
      continue;
    }

    if (!isNonEmptyString(inst.id)) {
      report.error('institution.missing-id', `${label}: id is missing or not a string`);
    } else if (institutionById.has(inst.id)) {
      report.error(
        'institution.duplicate-id',
        `${label}: duplicate id "${inst.id}" (also used by "${institutionById.get(inst.id)}")`
      );
    } else {
      institutionById.set(inst.id, label);
    }

    if (isNonEmptyString(inst.accountId)) {
      const seen = accountIds.get(inst.accountId);
      if (seen) {
        report.warn(
          'institution.duplicate-account-id',
          `${label}: accountId "${inst.accountId}" is also used by "${seen}"`
        );
      } else {
        accountIds.set(inst.accountId, label);
      }
    }

    if (!isNonEmptyString(inst.name)) {
      report.error('institution.missing-name', `${label}: name is missing or empty`);
    } else {
      institutionNames.add(inst.name);
      if (isNonEmptyString(inst.websiteUrl) && !websiteByName.has(inst.name)) {
        websiteByName.set(inst.name, inst.websiteUrl);
      }
    }

    if (!isNonEmptyString(inst.country)) {
      report.error('institution.missing-country', `${label}: country is missing or empty`);
    } else {
      registryCountries.add(inst.country);
      if (CYRILLIC.test(inst.country)) cyrillicRegistryCountries += 1;
    }

    if (inst.fulfillsRequirement === true) satisfiesRequirement += 1;
    else if (inst.fulfillsRequirement === false) doesNotSatisfyRequirement += 1;
    else {
      report.warn('institution.missing-fulfills-requirement', `${label}: fulfillsRequirement is not a boolean`);
    }

    if (!isNonEmptyString(inst.websiteUrl)) {
      missingWebsite += 1;
    } else {
      const url = parseUrl(inst.websiteUrl);
      if (!url) {
        malformedWebsite += 1;
        report.warn(
          'institution.malformed-website',
          `${label}: websiteUrl cannot be normalized to an http(s) URL`,
          inst.websiteUrl
        );
      } else if (!/^https?:\/\//i.test(inst.websiteUrl.trim())) {
        nonHttpWebsite += 1;
      }
    }

    if (inst.programTypes !== undefined && !Array.isArray(inst.programTypes)) {
      report.warn('institution.program-types', `${label}: programTypes is not an array`);
    }
    if (inst.programs !== undefined) {
      if (!Array.isArray(inst.programs)) {
        report.warn('institution.programs', `${label}: programs is not an array`);
      } else if (Number.isInteger(inst.programsCount) && inst.programsCount !== inst.programs.length) {
        report.warn(
          'institution.programs-count',
          `${label}: programsCount (${inst.programsCount}) does not match programs.length (${inst.programs.length})`
        );
      }
    }

    if (isNonEmptyString(inst.name) && isNonEmptyString(inst.country)) {
      const key = `${inst.name.trim().toLowerCase()}|${inst.country.trim().toLowerCase()}`;
      if (!nameCountry.has(key)) nameCountry.set(key, []);
      nameCountry.get(key).push(label);
    }

    if (!metadata[inst.name]) missingMetadata += 1;
    if (!locations[inst.name]) missingLocation += 1;
    if (!coordinates[inst.name]) missingCoordinates += 1;

    const locationRow = locations[inst.name];
    const registryEnglish = isObject(countryMap) ? countryMap[inst.country] : undefined;
    if (
      isNonEmptyString(inst.country) &&
      registryEnglish &&
      isObject(locationRow) &&
      isNonEmptyString(locationRow.country) &&
      normalizeCountryName(registryEnglish) !== normalizeCountryName(locationRow.country)
    ) {
      countryMismatches.push(`${inst.name}: registry "${registryEnglish}" vs location "${locationRow.country}"`);
    }
  }

  for (const [key, names] of nameCountry) {
    if (names.length < 2) continue;
    const [name, country] = key.split('|');
    report.warn(
      'institution.duplicate-name-country',
      `${names.length} registry rows share the name "${name}" in the same country ("${country}"); ids differ, so both are preserved. Merge or relabel at the source.`,
      names.join(', ')
    );
  }

  if (countryMismatches.length > 0) {
    report.warn(
      'institution.country-vs-location',
      `${countryMismatches.length} institutions have a registry country that differs from the English location country. Some are legitimate multi-country programs (Georgetown Qatar, Cornell's China program, Puerto Rico); others are data errors (Mayen is a Turkish provider mapped to a German town). Confirm the campus the row is meant to describe.`,
      countryMismatches.slice(0, 12).join(' | ')
    );
  }

  // --- thresholds and provenance -----------------------------------------
  const metadataNames = Object.keys(metadata);
  let thresholdVerified = 0;
  let thresholdEstimate = 0;
  let thresholdUnknown = 0;
  let withThresholdRecords = 0;
  let withSubscoreRecords = 0;
  let verifiedFlagCount = 0;
  let invalidVerifiedClaims = 0;
  let sourceCount = 0;
  let sourceRegistryCount = 0;
  let sourceInstitutionCount = 0;
  let statusVerifiedCount = 0;
  let statusEstimateCount = 0;
  let statusReferenceCount = 0;
  let statusUnknownCount = 0;
  let checkedAtCount = 0;
  let subscoreReqsCount = 0;
  let subscoreRussian = 0;
  let subscoreNonRussian = 0;
  let acceptanceRateCount = 0;
  let invalidAcceptanceRate = 0;
  let categoryCount = 0;
  let minScoreCount = 0;

  for (const name of metadataNames.sort()) {
    const label = `metadata["${name}"]`;
    if (!institutionNames.has(name)) {
      report.error('metadata.orphan', `${label}: no institution with this exact name exists`);
    }

    const meta = metadata[name];
    if (!isObject(meta)) {
      report.error('metadata.not-an-object', `${label}: entry is not an object`);
      continue;
    }

    for (const field of ['minScore', 'minLiteracy', 'minComprehension', 'minProduction', 'minConversation']) {
      const value = meta[field];
      if (!isValidScore(value)) {
        report.error(
          'metadata.invalid-score',
          `${label}.${field}: ${JSON.stringify(value)} is not 0 or a ${SCORE_STEP}-point DET band between ${VALID_SCORE_MIN} and ${VALID_SCORE_MAX}`
        );
      }
    }

    const minScore = meta.minScore;
    if (typeof minScore === 'number' && minScore > 0) minScoreCount += 1;
    const subscores = ['minLiteracy', 'minComprehension', 'minProduction', 'minConversation']
      .map((field) => meta[field])
      .filter((value) => typeof value === 'number' && value > 0);
    if ((!Number.isFinite(minScore) || minScore <= 0) && subscores.length > 0) {
      report.warn(
        'metadata.subscores-without-overall',
        `${label}: subscores are present but minScore is missing or unknown; the entry cannot be compared`
      );
    }
    if (subscores.some((value) => value > minScore)) {
      report.warn(
        'metadata.subscore-above-overall',
        `${label}: a subscore is above minScore; confirm the intended rule`,
        `${JSON.stringify(meta)}`
      );
    }

    if (meta.subscoreReqs !== undefined) {
      if (typeof meta.subscoreReqs !== 'string') {
        report.error('metadata.subscore-reqs-type', `${label}.subscoreReqs: expected a string`);
      } else if (meta.subscoreReqs.trim()) {
        subscoreReqsCount += 1;
        if (CYRILLIC.test(meta.subscoreReqs)) subscoreRussian += 1;
        else {
          subscoreNonRussian += 1;
          report.info(
            'metadata.subscore-reqs-language',
            `${label}.subscoreReqs is not in Russian while the rest of the catalogue is; confirm the intended language`,
            meta.subscoreReqs
          );
        }
      }
    }

    if (meta.acceptanceRate !== undefined) {
      const raw = meta.acceptanceRate;
      acceptanceRateCount += 1;
      if (typeof raw !== 'string' || !/^\d{1,3}(\.\d+)?%$/.test(raw.trim())) {
        invalidAcceptanceRate += 1;
        report.error('metadata.acceptance-rate-format', `${label}.acceptanceRate: expected "N%" or "N.N%"`, raw);
      } else {
        const value = Number(raw.replace('%', ''));
        if (value < 0 || value > 100) {
          invalidAcceptanceRate += 1;
          report.error('metadata.acceptance-rate-range', `${label}.acceptanceRate: ${raw} is outside 0-100%`);
        }
      }
    }

    if (meta.category !== undefined) {
      if (!isNonEmptyString(meta.category)) {
        report.warn('metadata.category', `${label}.category: expected a non-empty string`);
      } else {
        categoryCount += 1;
      }
    }

    // requirement provenance
    if (meta.requirementVerified !== undefined && typeof meta.requirementVerified !== 'boolean') {
      report.error('requirement.verified-type', `${label}.requirementVerified: expected a boolean`);
    }
    const verifiedFlag = meta.requirementVerified === true;
    if (verifiedFlag) verifiedFlagCount += 1;

    if (meta.requirementStatus !== undefined && !REQUIREMENT_STATUSES.has(meta.requirementStatus)) {
      report.error(
        'requirement.status-value',
        `${label}.requirementStatus: expected one of ${[...REQUIREMENT_STATUSES].join(', ')}`
      );
    } else if (meta.requirementStatus === 'platform-estimate') {
      statusEstimateCount += 1;
    } else if (meta.requirementStatus === 'reference') {
      statusReferenceCount += 1;
    } else if (meta.requirementStatus === 'unknown') {
      statusUnknownCount += 1;
    } else if (meta.requirementStatus === 'verified') {
      statusVerifiedCount += 1;
    }

    let source = '';
    if (meta.requirementSource !== undefined && meta.requirementSource !== null) {
      if (typeof meta.requirementSource !== 'string') {
        report.error('requirement.source-type', `${label}.requirementSource: expected a URL string or null`);
      } else {
        source = meta.requirementSource.trim();
      }
    }
    if (source) {
      sourceCount += 1;
      if (!isValidHttpUrl(source)) {
        report.error('requirement.source-url', `${label}.requirementSource: not a valid http(s) URL`, source);
      } else if (isRegistryUrl(source)) {
        sourceRegistryCount += 1;
      } else {
        sourceInstitutionCount += 1;
      }
    }

    let checkedAt = '';
    if (meta.requirementCheckedAt !== undefined && meta.requirementCheckedAt !== null) {
      if (typeof meta.requirementCheckedAt !== 'string') {
        report.error('requirement.checked-at-type', `${label}.requirementCheckedAt: expected YYYY-MM-DD or null`);
      } else {
        checkedAt = meta.requirementCheckedAt.trim();
      }
    }
    if (checkedAt) {
      checkedAtCount += 1;
      if (!isIsoDate(checkedAt)) {
        report.error('requirement.checked-at-date', `${label}.requirementCheckedAt: expected a real YYYY-MM-DD date`, checkedAt);
      } else if (checkedAt > todayIso) {
        report.error('requirement.checked-at-future', `${label}.requirementCheckedAt: date is in the future`, checkedAt);
      } else if (daysBetween(today, new Date(`${checkedAt}T00:00:00.000Z`)) > 730) {
        report.warn('requirement.checked-at-stale', `${label}.requirementCheckedAt: older than two years`, checkedAt);
      }
    }

    const hasEvidence = isValidHttpUrl(source) && !isRegistryUrl(source) && isUsableCheckedAt(checkedAt);
    if (meta.requirementStatus === 'platform-estimate' && hasEvidence) {
      report.warn(
        'requirement.status-estimate-with-evidence',
        `${label}.requirementStatus says platform-estimate but complete evidence is present; promote it or remove the source`
      );
    }
    if (meta.requirementStatus === 'unknown' && minScore > 0) {
      report.warn(
        'requirement.status-unknown-with-score',
        `${label}.requirementStatus says unknown but minScore is ${minScore}`
      );
    }
    const claimsVerified = verifiedFlag || meta.requirementStatus === 'verified';
    if (claimsVerified) {
      if (!hasEvidence) {
        invalidVerifiedClaims += 1;
        const missing = [];
        if (!source) missing.push('requirementSource');
        if (!checkedAt) missing.push('requirementCheckedAt');
        if (source && isRegistryUrl(source)) missing.push('an institution-specific source (the DET registry does not publish thresholds)');
        report.error(
          'requirement.verified-without-evidence',
          `${label}: marked verified without ${missing.join(' + ') || 'valid evidence'}; the entry must be treated as a platform estimate`
        );
        if (meta.requirementStatus === 'verified') {
          report.error(
            'requirement.status-verified-without-evidence',
            `${label}.requirementStatus is "verified" but the evidence is incomplete`
          );
        }
      } else {
        const siteHost = urlHost(websiteByName.get(name));
        const sourceHost = urlHost(source);
        if (siteHost && sourceHost && sourceHost !== siteHost && !sourceHost.endsWith(`.${siteHost}`) && !siteHost.endsWith(`.${sourceHost}`)) {
          report.warn(
            'requirement.source-host-mismatch',
            `${label}: requirement source host (${sourceHost}) differs from the institution website host (${siteHost})`
          );
        }
      }
    } else {
      if (meta.requirementStatus === 'verified') {
        report.error(
          'requirement.status-verified-without-flag',
          `${label}.requirementStatus is "verified" but requirementVerified is not true`
        );
      }
      if (source && !checkedAt) {
        report.warn('requirement.source-without-date', `${label}: requirementSource is present without requirementCheckedAt`);
      }
      if (source && !isRegistryUrl(source)) {
        report.warn(
          'requirement.unverified-source',
          `${label}: has a source but is not marked verified; classify it as reference or estimate`
        );
      }
    }
  }

  // Classify every registry row, not every metadata key. Duplicate registry
  // rows (same name, different id) share one metadata entry and must still add
  // up to the full institution count.
  for (const inst of institutions) {
    if (!isObject(inst) || !isNonEmptyString(inst.name)) {
      thresholdUnknown += 1;
      continue;
    }
    const meta = metadata[inst.name];
    if (!isObject(meta) || !(meta.minScore > 0)) {
      thresholdUnknown += 1;
      continue;
    }
    withThresholdRecords += 1;
    if (['minLiteracy', 'minComprehension', 'minProduction', 'minConversation'].some((field) => meta[field] > 0)) {
      withSubscoreRecords += 1;
    }
    const hasEvidence =
      meta.requirementVerified === true &&
      typeof meta.requirementSource === 'string' &&
      isValidHttpUrl(meta.requirementSource) &&
      !isRegistryUrl(meta.requirementSource) &&
      isUsableCheckedAt(meta.requirementCheckedAt);
    if (hasEvidence) thresholdVerified += 1;
    else thresholdEstimate += 1;
  }

  // --- locations ----------------------------------------------------------
  for (const name of Object.keys(locations).sort()) {
    const label = `locations["${name}"]`;
    if (!institutionNames.has(name)) {
      report.error('location.orphan', `${label}: no institution with this exact name exists`);
    }
    const location = locations[name];
    if (!isObject(location)) {
      report.error('location.not-an-object', `${label}: entry is not an object`);
      continue;
    }
    if (!isNonEmptyString(location.country)) {
      emptyLocationCountry += 1;
      report.error('location.missing-country', `${label}.country: missing or empty`);
    } else {
      if (CYRILLIC.test(location.country)) {
        cyrillicLocationCountries += 1;
        report.warn(
          'location.cyrillic-country',
          `${label}.country is not in English: "${location.country}" (the display layer expects an English country name)`
        );
      }
      if (location.country.trim().length < 2 || location.country.trim().length > 80) {
        report.warn('location.country-length', `${label}.country: implausible length`, location.country);
      }
    }
    if (!isNonEmptyString(location.city)) {
      emptyCity += 1;
    } else if (location.city.trim().length > 120) {
      report.warn('location.city-length', `${label}.city: implausible length`, location.city);
    }
    if (location.state !== undefined && typeof location.state !== 'string') {
      report.warn('location.state-type', `${label}.state: expected a string`);
    }
    if (location.region !== undefined && typeof location.region !== 'string') {
      report.warn('location.region-type', `${label}.region: expected a string`);
    }
  }

  // --- coordinates --------------------------------------------------------
  const coordinatePairs = new Map();
  for (const name of Object.keys(coordinates).sort()) {
    const label = `coordinates["${name}"]`;
    if (!institutionNames.has(name)) {
      report.error('coordinate.orphan', `${label}: no institution with this exact name exists`);
    }
    const coordinate = coordinates[name];
    if (!isObject(coordinate)) {
      report.error('coordinate.not-an-object', `${label}: entry is not an object`);
      continue;
    }

    const lat = coordinate.latitude;
    const lon = coordinate.longitude;
    if (!Number.isFinite(lat) || Math.abs(lat) > 90) {
      report.error('coordinate.latitude', `${label}.latitude: expected a number between -90 and 90`, lat);
    }
    if (!Number.isFinite(lon) || Math.abs(lon) > 180) {
      report.error('coordinate.longitude', `${label}.longitude: expected a number between -180 and 180`, lon);
    }
    if (lat === 0 && lon === 0) {
      report.error('coordinate.zero', `${label}: latitude/longitude are 0,0 (null island)`);
    }
    if (lat === 90 || lat === -90 || lon === 180 || lon === -180) {
      report.warn('coordinate.boundary', `${label}: coordinate sits exactly on the world boundary`, `${lat},${lon}`);
    }
    if (!isNonEmptyString(coordinate.title)) {
      report.warn('coordinate.missing-title', `${label}.title: missing; the Wikipedia article is unknown`);
    } else {
      const ownTokens = nameTokens(name);
      const titleTokens = nameTokens(coordinate.title);
      const sharesToken = [...ownTokens].some((token) => titleTokens.has(token));
      if (ownTokens.size > 0 && titleTokens.size > 0 && !sharesToken) {
        report.warn(
          'coordinate.title-mismatch',
          `${label}: coordinate title "${coordinate.title}" shares no distinctive word with the institution name; confirm it is the institution and not a city/region`
        );
      }
    }
    if (!isNonEmptyString(coordinate.sourceUrl)) {
      report.warn('coordinate.missing-source', `${label}.sourceUrl: missing`);
    } else if (!isValidHttpUrl(coordinate.sourceUrl)) {
      report.error('coordinate.source-url', `${label}.sourceUrl: not a valid http(s) URL`, coordinate.sourceUrl);
    }
    if (!isNonEmptyString(coordinate.wikidataId)) {
      report.warn('coordinate.missing-wikidata', `${label}.wikidataId: missing`);
    } else if (!/^Q\d+$/.test(coordinate.wikidataId)) {
      report.warn('coordinate.wikidata-format', `${label}.wikidataId: expected Q followed by digits`, coordinate.wikidataId);
    }

    if (Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0)) {
      const pair = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      if (!coordinatePairs.has(pair)) coordinatePairs.set(pair, []);
      coordinatePairs.get(pair).push(name);
    }
  }

  for (const names of coordinatePairs.values()) {
    if (names.length < 2) continue;
    duplicateCoordinatePairs += 1;
    report.info(
      'coordinate.shared',
      `${names.length} institutions share one coordinate (often an old and a new name); confirm it is intentional`,
      names.join(', ')
    );
  }

  // --- coverage / country sanity -----------------------------------------
  if (cyrillicRegistryCountries > 0) {
    report.info(
      'institution.cyrillic-country',
      `${cyrillicRegistryCountries}/${institutions.length} registry country values are Russian ("Соединенные Штаты"). This is a scrape-locale artifact; the English label lives in institution-locations.json. It is allowed, but the display layer must not treat it as an English-only field.`
    );
  }

  if (missingLocation > 0) {
    report.warn(
      'coverage.location',
      `${missingLocation} institutions have no row in institution-locations.json (city/English country unknown)`
    );
  }
  if (missingCoordinates > 0) {
    report.warn(
      'coverage.coordinates',
      `${missingCoordinates} institutions have no verified coordinate and are therefore absent from the map`
    );
  }
  if (missingMetadata > 0) {
    report.info(
      'coverage.threshold',
      `${missingMetadata} institutions have no threshold entry; they are reported as unknown, never as 0`
    );
  }
  if (missingWebsite > 0) {
    report.warn('coverage.website', `${missingWebsite} institutions have no websiteUrl`);
  }
  if (nonHttpWebsite > 0) {
    report.info(
      'coverage.website-scheme',
      `${nonHttpWebsite} websiteUrl values have no scheme; the catalogue normalizer prepends https://`
    );
  }
  if (malformedWebsite > 0) {
    report.warn('coverage.website-malformed', `${malformedWebsite} websiteUrl values cannot be parsed even after normalization`);
  }
  if (emptyCity > 0) {
    report.warn('coverage.city', `${emptyCity} location rows have an empty city`);
  }
  if (emptyLocationCountry > 0) {
    report.warn('coverage.country', `${emptyLocationCountry} location rows have an empty country`);
  }
  if (cyrillicLocationCountries > 0) {
    report.warn(
      'location.cyrillic-country-count',
      `${cyrillicLocationCountries} location country values are Cyrillic; replace them with the English names used by the rest of the file`
    );
  }
  if (acceptanceRateCount > 0) {
    report.warn(
      'metadata.acceptance-rate-unsourced',
      `${acceptanceRateCount} acceptanceRate values are present, but no source field or checked date exists for them. They are not DET thresholds and must not be presented as verified; several elite values are visibly implausible.`
    );
  }
  if (categoryCount > 0) {
    report.warn(
      'metadata.category-unsourced',
      `${categoryCount} category values are present without a source field. Categories such as "Ivy League"/"Top STEM" are editorial labels, not registry facts.`
    );
  }
  if (invalidAcceptanceRate > 0) {
    report.error('metadata.acceptance-rate-invalid', `${invalidAcceptanceRate} acceptanceRate values are malformed or out of range`);
  }

  const warningsByCode = groupByCode(report.warnings);
  const infosByCode = groupByCode(report.infos);

  return {
    counts: {
      institutions: institutions.length,
      uniqueIds: institutionById.size,
      uniqueNames: institutionNames.size,
      uniqueRegistryCountries: registryCountries.size,
      accountIds: accountIds.size,
      satisfiesRequirement,
      doesNotSatisfyRequirement,
      metadataEntries: metadataNames.length,
      locationEntries: Object.keys(locations).length,
      coordinateEntries: Object.keys(coordinates).length,
      duplicateCoordinatePairs,
      countryMismatches: countryMismatches.length,
    },
    fields: {
      minScore: minScoreCount,
      subscoreReqs: subscoreReqsCount,
      subscoreReqsRussian: subscoreRussian,
      subscoreReqsNonRussian: subscoreNonRussian,
      acceptanceRate: acceptanceRateCount,
      category: categoryCount,
      requirementSource: sourceCount,
      requirementSourceRegistry: sourceRegistryCount,
      requirementSourceInstitution: sourceInstitutionCount,
      requirementCheckedAt: checkedAtCount,
      requirementStatus: statusVerifiedCount + statusEstimateCount + statusReferenceCount + statusUnknownCount,
      requirementStatusVerified: statusVerifiedCount,
      requirementStatusEstimate: statusEstimateCount,
      requirementStatusReference: statusReferenceCount,
      requirementStatusUnknown: statusUnknownCount,
      requirementVerifiedTrue: verifiedFlagCount,
      invalidVerifiedClaims,
    },
    thresholds: {
      verified: thresholdVerified,
      platformEstimate: thresholdEstimate,
      unknown: thresholdUnknown,
      registryBacked: 0,
      registryListed: institutions.length,
    },
    coverage: {
      withThreshold: withThresholdRecords,
      withLocation: institutions.length - missingLocation,
      withCoordinates: institutions.length - missingCoordinates,
      withCity: institutions.length - missingLocation - emptyCity,
      withSubscores: withSubscoreRecords,
    },
    missing: {
      location: missingLocation,
      coordinates: missingCoordinates,
      threshold: missingMetadata,
      website: missingWebsite,
    },
    diagnostics: {
      errors: report.errors,
      warnings: warningsByCode,
      infos: infosByCode,
    },
    raw: {
      warnings: report.warnings,
      infos: report.infos,
    },
  };
}

function groupByCode(entries) {
  const groups = new Map();
  for (const entry of entries) {
    if (!groups.has(entry.code)) {
      groups.set(entry.code, { code: entry.code, count: 0, messages: [] });
    }
    const group = groups.get(entry.code);
    group.count += 1;
    if (group.messages.length < 12) {
      group.messages.push(entry.detail ? `${entry.message} [${entry.detail}]` : entry.message);
    }
  }
  return [...groups.values()].sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));
}

// ---------------------------------------------------------------------------
// Online URL check (opt-in)
// ---------------------------------------------------------------------------

function selectSample(urls, sample) {
  const sorted = [...urls].sort();
  if (sorted.length <= sample) return sorted;
  const step = sorted.length / sample;
  const picked = [];
  for (let i = 0; i < sample; i += 1) picked.push(sorted[Math.floor(i * step)]);
  return [...new Set(picked)];
}

async function probe(url, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const headers = { 'User-Agent': USER_AGENT, Accept: 'text/html,application/xhtml+xml' };

  try {
    let response = await fetch(url, { method: 'HEAD', redirect: 'follow', signal: controller.signal, headers });
    if (response.status === 405 || response.status === 501) {
      try {
        await response.body?.cancel();
      } catch {
        /* ignore */
      }
      response = await fetch(url, {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
        headers: { ...headers, Range: 'bytes=0-2048' },
      });
      try {
        await response.body?.cancel();
      } catch {
        /* ignore */
      }
    }
    return classifyStatus(response.status);
  } catch (err) {
    if (err?.name === 'AbortError') return { kind: 'unreachable', reason: 'timeout' };
    return { kind: 'unreachable', reason: String(err?.message || err).slice(0, 160) };
  } finally {
    clearTimeout(timer);
  }
}

function classifyStatus(status) {
  if (status >= 200 && status < 400) return { kind: 'ok', status };
  if ([401, 402, 403, 405, 406, 429, 451, 999].includes(status)) return { kind: 'blocked', status };
  if ([404, 410].includes(status)) return { kind: 'dead', status };
  if (status >= 500) return { kind: 'unreachable', status, reason: `HTTP ${status}` };
  return { kind: 'blocked', status };
}

async function auditWebsites(institutions, options) {
  const allUrls = new Map();
  for (const inst of institutions) {
    if (!isObject(inst) || !isNonEmptyString(inst.websiteUrl)) continue;
    const url = normalizeUrl(inst.websiteUrl);
    if (!isValidHttpUrl(url)) continue;
    if (!allUrls.has(url)) allUrls.set(url, []);
    allUrls.get(url).push(inst.name);
  }

  const urls = options.all ? [...allUrls.keys()].sort() : selectSample([...allUrls.keys()], options.sample);
  const results = new Map();
  let cursor = 0;

  async function worker() {
    while (cursor < urls.length) {
      const index = cursor;
      cursor += 1;
      const url = urls[index];
      results.set(url, await probe(url, options.timeoutMs));
    }
  }

  await Promise.all(Array.from({ length: Math.min(options.concurrency, urls.length) }, worker));

  const summary = { checked: urls.length, totalUnique: allUrls.size, ok: 0, blocked: 0, dead: 0, unreachable: 0 };
  const dead = [];
  const blocked = [];
  const unreachable = [];
  for (const [url, result] of results) {
    summary[result.kind] += 1;
    if (result.kind === 'dead') dead.push({ url, status: result.status, institutions: allUrls.get(url) });
    else if (result.kind === 'blocked') blocked.push({ url, status: result.status, institutions: allUrls.get(url) });
    else if (result.kind === 'unreachable') unreachable.push({ url, reason: result.reason, institutions: allUrls.get(url) });
  }
  dead.sort((a, b) => a.url.localeCompare(b.url));
  blocked.sort((a, b) => a.url.localeCompare(b.url));
  unreachable.sort((a, b) => a.url.localeCompare(b.url));
  return { summary, dead, blocked, unreachable, sampled: !options.all && urls.length < allUrls.size };
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function formatReport(result, options) {
  const lines = [];
  const num = (value) => Number(value).toLocaleString('en-US');
  lines.push('DET institution catalogue audit');
  lines.push(`Generated: ${result.generatedAt}`);
  lines.push(`Mode: ${options.check ? 'check' : 'report'}${options.online ? ` + online (${options.all ? 'all' : `sample ${options.sample}`})` : ' (offline)'}`);
  lines.push('');
  lines.push('Dataset');
  lines.push(`  institutions:                 ${num(result.counts.institutions)}`);
  lines.push(`  unique ids:                   ${num(result.counts.uniqueIds)}`);
  lines.push(`  unique names:                 ${num(result.counts.uniqueNames)}`);
  lines.push(`  registry countries:           ${num(result.counts.uniqueRegistryCountries)}`);
  lines.push(`  fulfilsRequirement=true:      ${num(result.counts.satisfiesRequirement)}`);
  lines.push(`  fulfilsRequirement=false:     ${num(result.counts.doesNotSatisfyRequirement)}`);
  lines.push(`  metadata keys:                ${num(result.counts.metadataEntries)}`);
  lines.push(`  location rows:                ${num(result.counts.locationEntries)}`);
  lines.push(`  coordinate rows:              ${num(result.counts.coordinateEntries)}`);
  lines.push('');
  lines.push('Threshold provenance');
  lines.push(`  verified by a primary source: ${num(result.thresholds.verified)}`);
  lines.push(`  platform estimates (rows):    ${num(result.thresholds.platformEstimate)}`);
  lines.push(`  unknown (no threshold):       ${num(result.thresholds.unknown)}`);
  lines.push(`  backed by the DET registry:   0 (the registry publishes acceptance, not score thresholds)`);
  lines.push(`  registry-listed institutions: ${num(result.thresholds.registryListed)}`);
  lines.push('');
  lines.push('Fields present');
  lines.push(`  minScore > 0:                 ${num(result.fields.minScore)}`);
  lines.push(`  subscoreReqs:                 ${num(result.fields.subscoreReqs)} (Russian ${num(result.fields.subscoreReqsRussian)}, other ${num(result.fields.subscoreReqsNonRussian)})`);
  lines.push(`  acceptanceRate:               ${num(result.fields.acceptanceRate)} (all unsourced)`);
  lines.push(`  category:                     ${num(result.fields.category)} (all unsourced)`);
  lines.push(`  requirementSource:            ${num(result.fields.requirementSource)}`);
  lines.push(`  requirementCheckedAt:         ${num(result.fields.requirementCheckedAt)}`);
  lines.push(`  requirementStatus:            ${num(result.fields.requirementStatus)} (verified ${num(result.fields.requirementStatusVerified)}, estimate ${num(result.fields.requirementStatusEstimate)}, reference ${num(result.fields.requirementStatusReference)}, unknown ${num(result.fields.requirementStatusUnknown)})`);
  lines.push(`  requirementVerified=true:     ${num(result.fields.requirementVerifiedTrue)}`);
  lines.push(`  invalid verified claims:      ${num(result.fields.invalidVerifiedClaims)}`);
  lines.push('');
  lines.push('Coverage');
  lines.push(`  with a threshold:             ${num(result.coverage.withThreshold)} / ${num(result.counts.institutions)}`);
  lines.push(`  with subscores:               ${num(result.coverage.withSubscores)} / ${num(result.counts.institutions)}`);
  lines.push(`  with a location row:          ${num(result.coverage.withLocation)} / ${num(result.counts.institutions)}`);
  lines.push(`  with a non-empty city:        ${num(result.coverage.withCity)} / ${num(result.counts.institutions)}`);
  lines.push(`  with a verified coordinate:   ${num(result.coverage.withCoordinates)} / ${num(result.counts.institutions)}`);
  lines.push('');
  lines.push(`${options.online ? 'Errors (structural + online)' : 'Structural errors'}: ${num(result.diagnostics.errors.length)}`);
  if (result.diagnostics.errors.length > 0) {
    for (const entry of result.diagnostics.errors.slice(0, 80)) {
      lines.push(`  [error] ${entry.code}: ${entry.message}`);
    }
    if (result.diagnostics.errors.length > 80) {
      lines.push(`  ... ${num(result.diagnostics.errors.length - 80)} more errors (use --json for the full list)`);
    }
  }
  lines.push(`Warnings: ${num(result.raw.warnings.length)}`);
  for (const group of result.diagnostics.warnings) {
    lines.push(`  [warn] ${group.code} x${num(group.count)}: ${group.messages[0]}`);
    for (const message of group.messages.slice(1, 4)) lines.push(`         ${message}`);
    if (group.count > 4) lines.push(`         ... ${num(group.count - 4)} similar`);
  }
  if (result.diagnostics.infos.length > 0) {
    lines.push(`Notes: ${num(result.raw.infos.length)}`);
    for (const group of result.diagnostics.infos) {
      lines.push(`  [info] ${group.code} x${num(group.count)}: ${group.messages[0]}`);
    }
  }

  if (result.online) {
    const online = result.online;
    lines.push('');
    lines.push(`Website check (${online.sampled ? 'sample' : 'all'}): ${num(online.summary.checked)} / ${num(online.summary.totalUnique)} unique URLs`);
    lines.push(`  ok: ${num(online.summary.ok)}  blocked: ${num(online.summary.blocked)}  dead: ${num(online.summary.dead)}  unreachable: ${num(online.summary.unreachable)}`);
    for (const item of online.dead.slice(0, 20)) {
      lines.push(`  [dead ${item.status}] ${item.url} (${item.institutions.slice(0, 3).join(', ')})`);
    }
    if (online.dead.length > 20) lines.push(`  ... ${num(online.dead.length - 20)} more dead URLs`);
    for (const item of online.unreachable.slice(0, 5)) {
      lines.push(`  [unreachable] ${item.url} (${item.reason})`);
    }
  }

  lines.push('');
  if (result.diagnostics.errors.length > 0) {
    lines.push(options.check ? 'RESULT: FAIL (structural errors or dead URLs)' : 'RESULT: errors found (report-only mode exits 0; pass --check to fail)');
  } else {
    lines.push('RESULT: PASS (no structural errors; unknown thresholds are not an error)');
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const options = parseArgs(process.argv.slice(2));

  let data;
  try {
    data = {
      institutions: readJson(FILES.institutions, 'array'),
      metadata: readJson(FILES.metadata, 'object'),
      locations: readJson(FILES.locations, 'object'),
      coordinates: readJson(FILES.coordinates, 'object'),
    };
  } catch (err) {
    console.error(`FATAL: ${err.message}`);
    process.exit(2);
  }

  const result = audit({ ...data, countryMap: loadCountryNameMap() });
  result.generatedAt = new Date().toISOString();
  result.files = FILES;

  if (options.online) {
    const online = await auditWebsites(data.institutions, options);
    result.online = online;
    for (const item of online.dead) {
      result.diagnostics.errors.push({
        severity: 'error',
        code: 'website.dead',
        message: `${item.url}: HTTP ${item.status} (${item.institutions.slice(0, 3).join(', ')})`,
      });
    }
    for (const item of online.unreachable) {
      const entry = {
        severity: options.strictOnline ? 'error' : 'warning',
        code: 'website.unreachable',
        message: `${item.url}: ${item.reason}`,
      };
      if (options.strictOnline) result.diagnostics.errors.push(entry);
      else result.raw.warnings.push(entry);
    }
    if (online.summary.checked > 0 && online.summary.ok === 0 && online.summary.blocked === 0 && online.summary.dead === 0) {
      result.raw.warnings.push({
        severity: 'warning',
        code: 'website.network',
        message: 'every online request failed; the network may be unavailable, so no URL was proven dead',
      });
    }
    result.diagnostics.warnings = groupByCode(result.raw.warnings);
  }

  const exitCode = options.check && result.diagnostics.errors.length > 0 ? 1 : 0;

  if (options.json) {
    const output = {
      generatedAt: result.generatedAt,
      mode: { check: options.check, online: options.online, all: options.all, sample: options.sample },
      files: result.files,
      counts: result.counts,
      thresholds: result.thresholds,
      fields: result.fields,
      coverage: result.coverage,
      missing: result.missing,
      diagnostics: result.diagnostics,
      online: result.online || null,
      exitCode,
    };
    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } else {
    console.log(formatReport(result, options));
  }

  process.exit(exitCode);
}

main().catch((err) => {
  console.error(`FATAL: ${err?.stack || err}`);
  process.exit(2);
});
