import { create } from 'zustand';
import type { FilterState, SortField, SortDirection } from '../types/filters';
import type { PaperCategory } from '../utils/paperClassifier';
import type { ClinicalRelevance, PaperPriority } from '../types/paper';

interface FilterStore {
  filters: FilterState;

  setJournals: (journals: string[]) => void;
  setPaperTypes: (types: PaperCategory[]) => void;
  setDateRange: (from: string | null, to: string | null) => void;
  setSearchQuery: (query: string) => void;
  setReadStatus: (status: 'all' | 'read' | 'unread') => void;
  setRatingMin: (min: number) => void;
  setTags: (tags: string[]) => void;
  setRelevanceFilter: (relevance: ClinicalRelevance[]) => void;
  setPriorityFilter: (priority: PaperPriority[]) => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  resetFilters: () => void;
}

const defaultFilters: FilterState = {
  journals: [],
  paperTypes: [],
  dateFrom: null,
  dateTo: null,
  searchQuery: '',
  readStatus: 'all',
  ratingMin: 0,
  tags: [],
  relevance: [],
  priority: [],
  sortField: 'date',
  sortDirection: 'desc',
};

export const useFilterStore = create<FilterStore>((set) => ({
  filters: { ...defaultFilters },

  setJournals: (journals) =>
    set(s => ({ filters: { ...s.filters, journals } })),

  setPaperTypes: (types) =>
    set(s => ({ filters: { ...s.filters, paperTypes: types } })),

  setDateRange: (from, to) =>
    set(s => ({ filters: { ...s.filters, dateFrom: from, dateTo: to } })),

  setSearchQuery: (query) =>
    set(s => ({ filters: { ...s.filters, searchQuery: query } })),

  setReadStatus: (status) =>
    set(s => ({ filters: { ...s.filters, readStatus: status } })),

  setRatingMin: (min) =>
    set(s => ({ filters: { ...s.filters, ratingMin: min } })),

  setTags: (tags) =>
    set(s => ({ filters: { ...s.filters, tags } })),

  setRelevanceFilter: (relevance) =>
    set(s => ({ filters: { ...s.filters, relevance } })),

  setPriorityFilter: (priority) =>
    set(s => ({ filters: { ...s.filters, priority } })),

  setSort: (field, direction) =>
    set(s => ({ filters: { ...s.filters, sortField: field, sortDirection: direction } })),

  resetFilters: () =>
    set({ filters: { ...defaultFilters } }),
}));
