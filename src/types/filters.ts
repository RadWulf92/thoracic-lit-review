import type { PaperCategory } from '../utils/paperClassifier';
import type { ClinicalRelevance, PaperPriority } from './paper';

export type SortField = 'date' | 'rating' | 'readStatus' | 'journal' | 'relevance' | 'priority';
export type SortDirection = 'asc' | 'desc';

export interface FilterState {
  journals: string[];
  paperTypes: PaperCategory[];
  dateFrom: string | null;
  dateTo: string | null;
  searchQuery: string;
  readStatus: 'all' | 'read' | 'unread';
  ratingMin: number;
  tags: string[];
  relevance: ClinicalRelevance[];
  priority: PaperPriority[];
  sortField: SortField;
  sortDirection: SortDirection;
}
