export interface JournalInfo {
  full: string;
  abbrev: string;
  issn: string;
  color: string;
  isThoracicSpecific: boolean;
}

export const TARGET_JOURNALS: JournalInfo[] = [
  // Thoracic-specific — fetch ALL papers, no topic filter needed
  { full: 'Journal of Thoracic Oncology', abbrev: 'J Thorac Oncol', issn: '1556-0864', color: 'journal-jto', isThoracicSpecific: true },
  { full: 'Lung Cancer', abbrev: 'Lung Cancer', issn: '0169-5002', color: 'journal-lung-cancer', isThoracicSpecific: true },
  { full: 'Clinical Lung Cancer', abbrev: 'Clin Lung Cancer', issn: '1525-7304', color: 'journal-clin-lung', isThoracicSpecific: true },
  { full: 'Translational Lung Cancer Research', abbrev: 'Transl Lung Cancer Res', issn: '2218-6751', color: 'journal-transl-lung', isThoracicSpecific: true },
  { full: 'Journal of Thoracic and Cardiovascular Surgery', abbrev: 'J Thorac Cardiovasc Surg', issn: '0022-5223', color: 'journal-jtcvs', isThoracicSpecific: true },
  { full: 'Annals of Thoracic Surgery', abbrev: 'Ann Thorac Surg', issn: '0003-4975', color: 'journal-ann-thorac', isThoracicSpecific: true },
  { full: 'European Journal of Cardio-Thoracic Surgery', abbrev: 'Eur J Cardiothorac Surg', issn: '1010-7940', color: 'journal-ejcts', isThoracicSpecific: true },
  { full: 'Thorax', abbrev: 'Thorax', issn: '0040-6376', color: 'journal-thorax', isThoracicSpecific: true },
  { full: 'Respiratory Medicine', abbrev: 'Respir Med', issn: '0954-6111', color: 'journal-respir-med', isThoracicSpecific: true },
  { full: 'Journal of Thoracic Disease', abbrev: 'J Thorac Dis', issn: '2072-1439', color: 'journal-jtd', isThoracicSpecific: true },
  { full: 'Thoracic Cancer', abbrev: 'Thorac Cancer', issn: '1759-7706', color: 'journal-thorac-cancer', isThoracicSpecific: true },
  { full: 'Current Opinion in Pulmonary Medicine', abbrev: 'Curr Opin Pulm Med', issn: '1070-5287', color: 'journal-curr-opin-pulm', isThoracicSpecific: true },
  // Broad journals — filtered by thoracic topic terms
  { full: 'New England Journal of Medicine', abbrev: 'N Engl J Med', issn: '0028-4793', color: 'journal-nejm', isThoracicSpecific: false },
  { full: 'The Lancet Oncology', abbrev: 'Lancet Oncol', issn: '1470-2045', color: 'journal-lancet-oncol', isThoracicSpecific: false },
  { full: 'Journal of Clinical Oncology', abbrev: 'J Clin Oncol', issn: '0732-183X', color: 'journal-jco', isThoracicSpecific: false },
  { full: 'Annals of Oncology', abbrev: 'Ann Oncol', issn: '0923-7534', color: 'journal-ann-oncol', isThoracicSpecific: false },
  { full: 'JAMA Oncology', abbrev: 'JAMA Oncol', issn: '2374-2437', color: 'journal-jama-oncol', isThoracicSpecific: false },
  { full: 'Nature Reviews Clinical Oncology', abbrev: 'Nat Rev Clin Oncol', issn: '1759-4774', color: 'journal-nat-rev-clin-oncol', isThoracicSpecific: false },
  { full: 'European Journal of Cancer', abbrev: 'Eur J Cancer', issn: '0959-8049', color: 'journal-ejc', isThoracicSpecific: false },
  { full: 'British Journal of Cancer', abbrev: 'Br J Cancer', issn: '0007-0920', color: 'journal-bjc', isThoracicSpecific: false },
  { full: 'ESMO Open', abbrev: 'ESMO Open', issn: '2059-7029', color: 'journal-esmo-open', isThoracicSpecific: false },
  { full: 'Journal for ImmunoTherapy of Cancer', abbrev: 'J Immunother Cancer', issn: '2051-1426', color: 'journal-jitc', isThoracicSpecific: false },
  { full: 'eClinicalMedicine', abbrev: 'EClinicalMedicine', issn: '2589-5370', color: 'journal-eclinmed', isThoracicSpecific: false },
  { full: 'The Lancet', abbrev: 'Lancet', issn: '0140-6736', color: 'journal-lancet', isThoracicSpecific: false },
  { full: 'Chest', abbrev: 'Chest', issn: '0012-3692', color: 'journal-chest', isThoracicSpecific: false },
  { full: 'European Respiratory Journal', abbrev: 'Eur Respir J', issn: '0903-1936', color: 'journal-erj', isThoracicSpecific: false },
  { full: 'JCO Oncology Practice', abbrev: 'JCO Oncol Pract', issn: '2688-1527', color: 'journal-jco-pract', isThoracicSpecific: false },
  { full: 'Clinical Cancer Research', abbrev: 'Clin Cancer Res', issn: '1078-0432', color: 'journal-ccr', isThoracicSpecific: false },
  { full: 'Nature Medicine', abbrev: 'Nat Med', issn: '1078-8956', color: 'journal-nat-med', isThoracicSpecific: false },
  { full: 'Cancer Discovery', abbrev: 'Cancer Discov', issn: '2159-8274', color: 'journal-cancer-discov', isThoracicSpecific: false },
  { full: 'Cancer Cell', abbrev: 'Cancer Cell', issn: '1535-6108', color: 'journal-cancer-cell', isThoracicSpecific: false },
  { full: 'Cancer Research', abbrev: 'Cancer Res', issn: '0008-5472', color: 'journal-cancer-res', isThoracicSpecific: false },
  { full: 'International Journal of Radiation Oncology, Biology, Physics', abbrev: 'Int J Radiat Oncol Biol Phys', issn: '0360-3016', color: 'journal-red', isThoracicSpecific: false },
  { full: 'Radiotherapy and Oncology', abbrev: 'Radiother Oncol', issn: '0167-8140', color: 'journal-green', isThoracicSpecific: false },
  { full: 'JAMA', abbrev: 'JAMA', issn: '0098-7484', color: 'journal-jama', isThoracicSpecific: false },
  { full: 'BMJ', abbrev: 'BMJ', issn: '0959-8138', color: 'journal-bmj', isThoracicSpecific: false },
];

export const JOURNAL_COLOR_MAP: Record<string, string> = Object.fromEntries(
  TARGET_JOURNALS.map(j => [j.abbrev, j.color])
);

export function getJournalColor(abbrev: string): string {
  return JOURNAL_COLOR_MAP[abbrev] ?? 'gray-400';
}

export const ACUTE_ONCOLOGY_JOURNALS: JournalInfo[] = [
  { full: 'Annals of Oncology', abbrev: 'Ann Oncol', issn: '0923-7534', color: 'journal-ann-oncol', isThoracicSpecific: false },
  { full: 'Journal of Clinical Oncology', abbrev: 'J Clin Oncol', issn: '0732-183X', color: 'journal-jco', isThoracicSpecific: false },
  { full: 'New England Journal of Medicine', abbrev: 'N Engl J Med', issn: '0028-4793', color: 'journal-nejm', isThoracicSpecific: false },
  { full: 'The Lancet Oncology', abbrev: 'Lancet Oncol', issn: '1470-2045', color: 'journal-lancet-oncol', isThoracicSpecific: false },
  { full: 'Supportive Care in Cancer', abbrev: 'Support Care Cancer', issn: '0941-4355', color: 'journal-support-care', isThoracicSpecific: false },
  { full: 'JCO Oncology Practice', abbrev: 'JCO Oncol Pract', issn: '2688-1527', color: 'journal-jco-pract', isThoracicSpecific: false },
  { full: 'ESMO Open', abbrev: 'ESMO Open', issn: '2059-7029', color: 'journal-esmo-open', isThoracicSpecific: false },
  { full: 'Journal for ImmunoTherapy of Cancer', abbrev: 'J Immunother Cancer', issn: '2051-1426', color: 'journal-jitc', isThoracicSpecific: false },
  { full: 'European Journal of Cancer', abbrev: 'Eur J Cancer', issn: '0959-8049', color: 'journal-ejc', isThoracicSpecific: false },
  { full: 'Critical Care Medicine', abbrev: 'Crit Care Med', issn: '0090-3493', color: 'journal-crit-care', isThoracicSpecific: false },
  { full: 'Annals of Emergency Medicine', abbrev: 'Ann Emerg Med', issn: '0196-0644', color: 'journal-ann-emerg', isThoracicSpecific: false },
  { full: 'Nature Reviews Clinical Oncology', abbrev: 'Nat Rev Clin Oncol', issn: '1759-4774', color: 'journal-nat-rev-clin-oncol', isThoracicSpecific: false },
  { full: 'JAMA Oncology', abbrev: 'JAMA Oncol', issn: '2374-2437', color: 'journal-jama-oncol', isThoracicSpecific: false },
  { full: 'British Journal of Cancer', abbrev: 'Br J Cancer', issn: '0007-0920', color: 'journal-bjc', isThoracicSpecific: false },
  { full: 'Frontiers in Immunology', abbrev: 'Front Immunol', issn: '1664-3224', color: 'journal-front-immunol', isThoracicSpecific: false },
  { full: 'eClinicalMedicine', abbrev: 'EClinicalMedicine', issn: '2589-5370', color: 'journal-eclinmed', isThoracicSpecific: false },
];
