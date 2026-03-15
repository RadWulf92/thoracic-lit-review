export type PaperCategory =
  | 'Clinical Trial'
  | 'Meta-Analysis'
  | 'Review'
  | 'Guideline'
  | 'Case Report'
  | 'Editorial'
  | 'Original Research';

export const ALL_PAPER_CATEGORIES: PaperCategory[] = [
  'Clinical Trial',
  'Meta-Analysis',
  'Review',
  'Guideline',
  'Case Report',
  'Editorial',
  'Original Research',
];

const CATEGORY_RULES: Array<{ category: PaperCategory; patterns: string[] }> = [
  {
    category: 'Clinical Trial',
    patterns: [
      'Clinical Trial', 'Clinical Trial, Phase I', 'Clinical Trial, Phase II',
      'Clinical Trial, Phase III', 'Clinical Trial, Phase IV',
      'Randomized Controlled Trial', 'Pragmatic Clinical Trial',
      'Controlled Clinical Trial', 'Equivalence Trial',
    ],
  },
  {
    category: 'Meta-Analysis',
    patterns: ['Meta-Analysis', 'Systematic Review'],
  },
  {
    category: 'Review',
    patterns: ['Review'],
  },
  {
    category: 'Guideline',
    patterns: ['Practice Guideline', 'Guideline', 'Consensus Development Conference'],
  },
  {
    category: 'Case Report',
    patterns: ['Case Reports'],
  },
  {
    category: 'Editorial',
    patterns: ['Editorial', 'Comment', 'Letter', 'Published Erratum', 'Retraction of Publication'],
  },
];

export function classifyPaper(pubTypes: string[]): PaperCategory {
  const normalized = pubTypes.map(t => t.trim());

  for (const rule of CATEGORY_RULES) {
    if (normalized.some(pt => rule.patterns.some(p => pt.startsWith(p)))) {
      return rule.category;
    }
  }

  return 'Original Research';
}

export const CATEGORY_COLORS: Record<PaperCategory, string> = {
  'Clinical Trial': 'bg-blue-100 text-blue-700 border-blue-300',
  'Meta-Analysis': 'bg-purple-100 text-purple-700 border-purple-300',
  'Review': 'bg-amber-100 text-amber-700 border-amber-300',
  'Guideline': 'bg-red-100 text-red-700 border-red-300',
  'Case Report': 'bg-teal-100 text-teal-700 border-teal-300',
  'Editorial': 'bg-gray-100 text-gray-600 border-gray-300',
  'Original Research': 'bg-emerald-100 text-emerald-700 border-emerald-300',
};
