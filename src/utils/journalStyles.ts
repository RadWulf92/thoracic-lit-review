import { TARGET_JOURNALS } from '../constants/journals';

const BORDER_COLORS: Record<string, string> = {
  'journal-jto': 'border-l-cyan-600',
  'journal-lung-cancer': 'border-l-violet-600',
  'journal-lancet-oncol': 'border-l-red-600',
  'journal-jco': 'border-l-blue-600',
  'journal-ann-oncol': 'border-l-emerald-600',
  'journal-nejm': 'border-l-red-700',
  'journal-chest': 'border-l-amber-600',
  'journal-erj': 'border-l-indigo-600',
  'journal-clin-lung': 'border-l-teal-600',
  'journal-transl-lung': 'border-l-purple-600',
};

export function getCardBorderClass(abbrev: string): string {
  const journal = TARGET_JOURNALS.find(j => j.abbrev === abbrev);
  return journal ? (BORDER_COLORS[journal.color] ?? 'border-l-gray-300') : 'border-l-gray-300';
}
