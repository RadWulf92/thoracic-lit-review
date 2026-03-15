export const PUBMED_BASE_URL = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
export const PUBMED_ESEARCH = `${PUBMED_BASE_URL}/esearch.fcgi`;
export const PUBMED_EFETCH = `${PUBMED_BASE_URL}/efetch.fcgi`;

export const REQUESTS_PER_SECOND = 3;
export const EFETCH_BATCH_SIZE = 200;
export const DEFAULT_RETMAX = 500;

export const STORAGE_KEYS = {
  tracking: 'thoracic-lit-tracking',
  lastFetch: 'thoracic-lit-last-fetch',
  filterPrefs: 'thoracic-lit-filters',
} as const;

export const IDB_NAME = 'thoracic-oncology-lit-review';
export const IDB_VERSION = 1;
