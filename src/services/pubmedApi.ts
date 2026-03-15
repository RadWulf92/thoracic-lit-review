import { PUBMED_ESEARCH, PUBMED_EFETCH, REQUESTS_PER_SECOND, EFETCH_BATCH_SIZE, DEFAULT_RETMAX } from '../constants/config';
import { RateLimiter } from '../utils/rateLimiter';
import { parsePubMedXml } from '../utils/xmlParser';
import { buildPubMedQuery, formatDateForPubMed } from '../utils/queryBuilder';
import { cachePapers, getCachedPmids } from './paperCache';
import type { Paper } from '../types/paper';
import type { JournalInfo } from '../constants/journals';

const rateLimiter = new RateLimiter(REQUESTS_PER_SECOND);

function getApiKey(): string | undefined {
  return import.meta.env.VITE_PUBMED_API_KEY || undefined;
}

function appendApiKey(url: string): string {
  const key = getApiKey();
  if (key) {
    const sep = url.includes('?') ? '&' : '?';
    return `${url}${sep}api_key=${key}`;
  }
  return url;
}

async function esearch(query: string, retmax = DEFAULT_RETMAX): Promise<string[]> {
  const params = new URLSearchParams({
    db: 'pubmed',
    term: query,
    retmax: String(retmax),
    retmode: 'json',
  });

  const url = appendApiKey(`${PUBMED_ESEARCH}?${params}`);

  const response = await rateLimiter.enqueue(() => fetch(url));
  if (!response.ok) {
    throw new Error(`esearch failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.esearchresult?.idlist ?? [];
}

async function efetch(pmids: string[]): Promise<Paper[]> {
  if (pmids.length === 0) return [];

  const params = new URLSearchParams({
    db: 'pubmed',
    id: pmids.join(','),
    rettype: 'xml',
    retmode: 'xml',
  });

  const url = appendApiKey(`${PUBMED_EFETCH}?${params}`);

  const response = await rateLimiter.enqueue(() => fetch(url));
  if (!response.ok) {
    throw new Error(`efetch failed: ${response.status} ${response.statusText}`);
  }

  const xml = await response.text();
  return parsePubMedXml(xml);
}

export async function searchPubMed(query: string): Promise<Paper[]> {
  if (!query.trim()) return [];

  const pmids = await esearch(query.trim(), 20);
  if (pmids.length === 0) return [];

  const papers = await efetch(pmids);

  // Cache results so they're available offline / in reading list
  if (papers.length > 0) {
    await cachePapers(papers);
  }

  return papers;
}

export async function fetchPapersForDateRange(
  from: Date,
  to: Date,
  onProgress?: (msg: string) => void,
  journals?: JournalInfo[]
): Promise<Paper[]> {
  const dateFrom = formatDateForPubMed(from);
  const dateTo = formatDateForPubMed(to);
  const query = buildPubMedQuery(dateFrom, dateTo, journals);

  onProgress?.(`Searching PubMed...`);
  const pmids = await esearch(query);
  onProgress?.(`Found ${pmids.length} papers`);

  if (pmids.length === 0) return [];

  // Check cache to avoid re-fetching
  const cachedPmids = await getCachedPmids();
  const newPmids = pmids.filter(id => !cachedPmids.has(id));

  onProgress?.(`${newPmids.length} new papers to fetch (${pmids.length - newPmids.length} cached)`);

  if (newPmids.length === 0) return [];

  // Fetch in batches
  const allPapers: Paper[] = [];
  for (let i = 0; i < newPmids.length; i += EFETCH_BATCH_SIZE) {
    const batch = newPmids.slice(i, i + EFETCH_BATCH_SIZE);
    const batchNum = Math.floor(i / EFETCH_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(newPmids.length / EFETCH_BATCH_SIZE);
    onProgress?.(`Fetching batch ${batchNum}/${totalBatches}...`);

    const papers = await efetch(batch);
    allPapers.push(...papers);
  }

  // Cache new papers
  if (allPapers.length > 0) {
    await cachePapers(allPapers);
  }

  onProgress?.(`Fetched ${allPapers.length} new papers`);
  return allPapers;
}
