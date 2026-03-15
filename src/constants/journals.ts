export interface JournalInfo {
  full: string;
  abbrev: string;
  issn: string;
  color: string;
  isThoracicSpecific: boolean;
}

export const TARGET_JOURNALS: JournalInfo[] = [
  { full: 'Journal of Thoracic Oncology', abbrev: 'J Thorac Oncol', issn: '1556-0864', color: 'journal-jto', isThoracicSpecific: true },
  { full: 'Lung Cancer', abbrev: 'Lung Cancer', issn: '0169-5002', color: 'journal-lung-cancer', isThoracicSpecific: true },
  { full: 'The Lancet Oncology', abbrev: 'Lancet Oncol', issn: '1470-2045', color: 'journal-lancet-oncol', isThoracicSpecific: false },
  { full: 'Journal of Clinical Oncology', abbrev: 'J Clin Oncol', issn: '0732-183X', color: 'journal-jco', isThoracicSpecific: false },
  { full: 'Annals of Oncology', abbrev: 'Ann Oncol', issn: '0923-7534', color: 'journal-ann-oncol', isThoracicSpecific: false },
  { full: 'New England Journal of Medicine', abbrev: 'N Engl J Med', issn: '0028-4793', color: 'journal-nejm', isThoracicSpecific: false },
  { full: 'Chest', abbrev: 'Chest', issn: '0012-3692', color: 'journal-chest', isThoracicSpecific: false },
  { full: 'European Respiratory Journal', abbrev: 'Eur Respir J', issn: '0903-1936', color: 'journal-erj', isThoracicSpecific: false },
  { full: 'Clinical Lung Cancer', abbrev: 'Clin Lung Cancer', issn: '1525-7304', color: 'journal-clin-lung', isThoracicSpecific: true },
  { full: 'Translational Lung Cancer Research', abbrev: 'Transl Lung Cancer Res', issn: '2218-6751', color: 'journal-transl-lung', isThoracicSpecific: true },
];

export const JOURNAL_COLOR_MAP: Record<string, string> = Object.fromEntries(
  TARGET_JOURNALS.map(j => [j.abbrev, j.color])
);

export function getJournalColor(abbrev: string): string {
  return JOURNAL_COLOR_MAP[abbrev] ?? 'gray-400';
}
