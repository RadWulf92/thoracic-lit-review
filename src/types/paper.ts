export interface Paper {
  pmid: string;
  title: string;
  abstract: string;
  abstractSections: AbstractSection[];
  authors: Author[];
  journal: string;
  journalAbbrev: string;
  pubDate: string;
  epubDate?: string;
  doi?: string;
  pmcid?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  pubTypes: string[];
  keywords: string[];
  pubStatus?: 'aheadofprint' | 'epublish' | 'ppublish';
  fetchedAt: string;
}

export interface AbstractSection {
  label: string;
  text: string;
}

export interface Author {
  lastName: string;
  foreName: string;
  initials: string;
  affiliation?: string;
}

export type ClinicalRelevance =
  | 'practice-changing'
  | 'clinically-relevant'
  | 'hypothesis-generating'
  | 'background';

export const ALL_RELEVANCE_LEVELS: ClinicalRelevance[] = [
  'practice-changing',
  'clinically-relevant',
  'hypothesis-generating',
  'background',
];

export const RELEVANCE_LABELS: Record<ClinicalRelevance, string> = {
  'practice-changing': 'Practice Changing',
  'clinically-relevant': 'Clinically Relevant',
  'hypothesis-generating': 'Hypothesis Generating',
  'background': 'Background',
};

export const RELEVANCE_COLORS: Record<ClinicalRelevance, string> = {
  'practice-changing': 'bg-red-100 text-red-700 border-red-400',
  'clinically-relevant': 'bg-blue-100 text-blue-700 border-blue-400',
  'hypothesis-generating': 'bg-amber-100 text-amber-700 border-amber-400',
  'background': 'bg-gray-100 text-gray-600 border-gray-300',
};

export interface PaperTracking {
  pmid: string;
  isRead: boolean;
  rating: number;
  notes: string;
  tags: string[];
  relevance?: ClinicalRelevance;
  takeaway: string;
  readAt?: string;
  notesUpdatedAt?: string;
  ratedAt?: string;
}
