import { TARGET_JOURNALS } from '../../constants/journals';
import { type PaperCategory, CATEGORY_COLORS } from '../../utils/paperClassifier';

const COLOR_CLASSES: Record<string, string> = {
  'journal-jto': 'bg-cyan-100 text-cyan-800 border-cyan-300',
  'journal-lung-cancer': 'bg-violet-100 text-violet-800 border-violet-300',
  'journal-lancet-oncol': 'bg-red-100 text-red-800 border-red-300',
  'journal-jco': 'bg-blue-100 text-blue-800 border-blue-300',
  'journal-ann-oncol': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'journal-nejm': 'bg-red-100 text-red-900 border-red-400',
  'journal-chest': 'bg-amber-100 text-amber-800 border-amber-300',
  'journal-erj': 'bg-indigo-100 text-indigo-800 border-indigo-300',
  'journal-clin-lung': 'bg-teal-100 text-teal-800 border-teal-300',
  'journal-transl-lung': 'bg-purple-100 text-purple-800 border-purple-300',
};

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

export function JournalBadge({ abbrev }: { abbrev: string }) {
  const journal = TARGET_JOURNALS.find(j => j.abbrev === abbrev);
  const colorClass = journal ? (COLOR_CLASSES[journal.color] ?? 'bg-gray-100 text-gray-700 border-gray-300') : 'bg-gray-100 text-gray-700 border-gray-300';

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
      {abbrev}
    </span>
  );
}

export function PaperTypeBadge({ category }: { category: PaperCategory }) {
  const colorClass = CATEGORY_COLORS[category];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>
      {category}
    </span>
  );
}

export function AheadOfPrintBadge() {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border bg-orange-50 text-orange-700 border-orange-300">
      Ahead of Print
    </span>
  );
}

export function getCardBorderClass(abbrev: string): string {
  const journal = TARGET_JOURNALS.find(j => j.abbrev === abbrev);
  return journal ? (BORDER_COLORS[journal.color] ?? 'border-l-gray-300') : 'border-l-gray-300';
}
