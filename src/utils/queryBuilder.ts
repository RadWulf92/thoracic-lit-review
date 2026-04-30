import { TARGET_JOURNALS, type JournalInfo } from '../constants/journals';
import { TOPIC_TERMS, ACUTE_ONCOLOGY_TERMS } from '../constants/searchTerms';
import type { Paper } from '../types/paper';

export type Collection = 'thoracic' | 'acute-oncology';

export function buildPubMedQuery(dateFrom: string, dateTo: string, journals?: JournalInfo[], collection?: Collection): string {
  const journalList = journals ?? TARGET_JOURNALS;
  const terms = collection === 'acute-oncology' ? ACUTE_ONCOLOGY_TERMS : TOPIC_TERMS;

  const thoracicJournals = journalList
    .filter(j => j.isThoracicSpecific)
    .map(j => `"${j.abbrev}"[journal]`);

  const broadJournals = journalList
    .filter(j => !j.isThoracicSpecific)
    .map(j => `"${j.abbrev}"[journal]`);

  const topicQuery = terms
    .map(t => `"${t}"`)
    .join(' OR ');

  const dateRange = `${dateFrom}:${dateTo}[pdat]`;

  const parts: string[] = [];

  // For acute oncology, all journals are broad (topic-filtered)
  if (collection === 'acute-oncology') {
    const allJournals = [...thoracicJournals, ...broadJournals];
    if (allJournals.length > 0) {
      parts.push(`(${allJournals.join(' OR ')}) AND (${topicQuery}) AND ${dateRange}`);
    }
  } else {
    if (thoracicJournals.length > 0) {
      parts.push(`(${thoracicJournals.join(' OR ')}) AND ${dateRange}`);
    }

    if (broadJournals.length > 0) {
      parts.push(`(${broadJournals.join(' OR ')}) AND (${topicQuery}) AND ${dateRange}`);
    }
  }

  if (parts.length === 0) return '';
  return parts.length === 1 ? parts[0] : `(${parts.join(') OR (')})`;
}

export function formatDateForPubMed(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}/${m}/${d}`;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[‐‑‒–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

function paperContainsAnyTerm(paper: Paper, terms: string[]): boolean {
  const text = normalizeText(`${paper.title} ${paper.abstract} ${paper.keywords.join(' ')}`);
  return terms.some(term => text.includes(normalizeText(term)));
}

export function paperMatchesCollection(
  paper: Paper,
  journals?: JournalInfo[],
  collection?: Collection
): boolean {
  const journalList = journals ?? TARGET_JOURNALS;
  const journal = journalList.find(j => j.abbrev === paper.journalAbbrev);
  if (!journal) return false;

  if (collection === 'acute-oncology') {
    return paperContainsAnyTerm(paper, ACUTE_ONCOLOGY_TERMS);
  }

  if (journal.isThoracicSpecific) return true;
  return paperContainsAnyTerm(paper, TOPIC_TERMS);
}
