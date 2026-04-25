import { useState } from 'react';
import { SearchBar } from './SearchBar';
import { JournalFilter } from './JournalFilter';
import { PaperTypeFilter } from './PaperTypeFilter';
import { TagFilter } from './TagFilter';
import { RelevanceFilter } from './RelevanceFilter';
import { PriorityFilter } from './PriorityFilter';
import { SortSelector } from './SortSelector';
import { useFilterStore } from '../../stores/filterStore';

export function FilterBar() {
  const readStatus = useFilterStore(s => s.filters.readStatus);
  const setReadStatus = useFilterStore(s => s.setReadStatus);
  const resetFilters = useFilterStore(s => s.resetFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);

  return (
    <div className="space-y-3">
      <SearchBar />

      {/* Mobile: toggle button for filters */}
      <button
        type="button"
        onClick={() => setFiltersOpen(!filtersOpen)}
        className="sm:hidden flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800"
      >
        <svg
          className={`h-4 w-4 transition-transform ${filtersOpen ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
        </svg>
        Filters
      </button>

      {/* Filters: always visible on desktop, toggled on mobile */}
      <div className={`${filtersOpen ? 'block' : 'hidden'} sm:block`}>
        <div className="flex flex-wrap items-center gap-2">
          <JournalFilter />
          <PaperTypeFilter />
          <PriorityFilter />
          <RelevanceFilter />
          <TagFilter />

          {/* Read status toggle */}
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            {(['all', 'unread', 'read'] as const).map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setReadStatus(status)}
                className={`px-3 py-2 text-sm transition-colors ${
                  readStatus === status
                    ? 'bg-cyan-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <SortSelector />

          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Reset filters
          </button>
        </div>
      </div>
    </div>
  );
}
