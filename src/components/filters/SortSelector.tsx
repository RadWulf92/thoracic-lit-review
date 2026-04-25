import { useFilterStore } from '../../stores/filterStore';
import type { SortField } from '../../types/filters';

const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: 'date', label: 'Date' },
  { value: 'rating', label: 'Rating' },
  { value: 'readStatus', label: 'Read Status' },
  { value: 'journal', label: 'Journal' },
  { value: 'relevance', label: 'Relevance' },
  { value: 'priority', label: 'Priority' },
];

export function SortSelector() {
  const sortField = useFilterStore(s => s.filters.sortField);
  const sortDirection = useFilterStore(s => s.filters.sortDirection);
  const setSort = useFilterStore(s => s.setSort);

  return (
    <div className="flex items-center gap-1">
      <select
        value={sortField}
        onChange={(e) => setSort(e.target.value as SortField, sortDirection)}
        className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white text-gray-600 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
      >
        {SORT_OPTIONS.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => setSort(sortField, sortDirection === 'asc' ? 'desc' : 'asc')}
        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
      >
        {sortDirection === 'asc' ? (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0l-3.75-3.75M17.25 21L21 17.25" />
          </svg>
        )}
      </button>
    </div>
  );
}
