import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'https://englishtest.duolingo.com/data/institution_search';
const CONCURRENCY = 6;
const DELAY_BETWEEN_BATCHES_MS = 150;

async function fetchPage(page, retries = 3) {
  const url = `${BASE_URL}?page=${page}&page_length=10&ui_language=ru`;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': 'https://englishtest.duolingo.com/ru/institutions'
        }
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const data = await res.json();
      return data;
    } catch (err) {
      if (attempt === retries) throw err;
      const backoff = attempt * 600;
      console.warn(`[WARN] Page ${page} failed (attempt ${attempt}/${retries}): ${err.message}. Retrying in ${backoff}ms...`);
      await new Promise(r => setTimeout(r, backoff));
    }
  }
}

async function run() {
  console.log('🦉 [Pied Piper Duolingo Scraper] Starting institutional data extraction...');
  const t0 = Date.now();

  // 1. Fetch page 1 to get total count
  const initial = await fetchPage(1);
  const totalCount = initial.university_count || 4385;
  const totalPages = Math.ceil(totalCount / 10);
  console.log(`📊 Discovered ${totalCount} institutions across ${totalPages} pages.`);

  const allUniversities = [...(initial.universities || [])];
  const pagesToFetch = [];
  for (let p = 2; p <= totalPages; p++) {
    pagesToFetch.push(p);
  }

  // 2. Fetch in concurrent chunks
  for (let i = 0; i < pagesToFetch.length; i += CONCURRENCY) {
    const batch = pagesToFetch.slice(i, i + CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(async (page) => {
        try {
          const res = await fetchPage(page);
          return res.universities || [];
        } catch (e) {
          console.error(`[ERROR] Failed to fetch page ${page}:`, e.message);
          return [];
        }
      })
    );

    for (const unis of batchResults) {
      allUniversities.push(...unis);
    }

    const completed = 1 + Math.min(i + CONCURRENCY, pagesToFetch.length);
    const pct = ((completed / totalPages) * 100).toFixed(1);
    const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
    process.stdout.write(`\r🚀 Ingestion Progress: [${completed}/${totalPages}] (${pct}%) | Extracted: ${allUniversities.length} universities | Time: ${elapsedSec}s`);

    if (DELAY_BETWEEN_BATCHES_MS > 0) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES_MS));
    }
  }

  console.log('\n\n✅ [COMPLETE] Ingestion finished!');
  console.log(`⏱ Total Duration: ${((Date.now() - t0) / 1000).toFixed(2)} seconds.`);
  console.log(`🏛 Extracted Universities Count: ${allUniversities.length}`);

  // 3. Deduplicate by account_id and normalize
  const seenIds = new Set();
  const normalized = [];

  for (const u of allUniversities) {
    if (!u.account_id || seenIds.has(u.account_id)) continue;
    seenIds.add(u.account_id);

    // Extract primary profile & programs
    const programsList = u.programs || [];
    const primaryProgram = programsList[0] || {};
    const profile = primaryProgram.profile || {};

    const country = profile.country || 'Global';
    const state = profile.state || '';
    const link = profile.link || '';
    const programTypes = Array.from(new Set(programsList.map(p => p.institution_type).filter(Boolean)));
    const fulfillsReq = programsList.some(p => p.use_case === 'FULFILLS_REQUIREMENT');

    normalized.push({
      id: `duo-${u.account_id}`,
      accountId: u.account_id,
      name: u.account_name,
      country: country,
      state: state,
      websiteUrl: link,
      fulfillsRequirement: fulfillsReq,
      programTypes: programTypes,
      programsCount: programsList.length,
      programs: programsList.map(p => ({
        type: p.institution_type,
        name: p.profile?.name || u.account_name,
        country: p.profile?.country || country,
        state: p.profile?.state || state,
        link: p.profile?.link || '',
        useCase: p.use_case || 'FULFILLS_REQUIREMENT',
        applicantIdTypes: p.applicant_id_types || []
      }))
    });
  }

  console.log(`🧹 Deduplicated & Cleaned Dataset: ${normalized.length} unique universities.`);

  // 4. Save raw and normalized JSON files
  const dataDir = path.join(__dirname, '..', 'src', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const normalizedPath = path.join(dataDir, 'duolingoInstitutions.json');
  fs.writeFileSync(normalizedPath, JSON.stringify(normalized, null, 2), 'utf8');
  console.log(`💾 Saved normalized dataset to: ${normalizedPath} (${(fs.statSync(normalizedPath).size / (1024 * 1024)).toFixed(2)} MB)`);

  // 5. Generate summary statistics by country
  const countryCounts = {};
  for (const item of normalized) {
    countryCounts[item.country] = (countryCounts[item.country] || 0) + 1;
  }
  const topCountries = Object.entries(countryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  console.log('\nTop 15 Countries by Accepting Institutions:');
  console.table(topCountries.map(([c, count]) => ({ Country: c, Institutions: count })));
}

run().catch(err => {
  console.error('Fatal scrape error:', err);
  process.exit(1);
});
