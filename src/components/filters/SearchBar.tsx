import { useFilterStore } from '../../stores/filterStore';

export function SearchBar() {
  const value = useFilterStore(s => s.filters.searchQuery);
  const setSearchQuery = useFilterStore(s => s.setSearchQuery);

  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search titles, abstracts, authors..."
        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 placeholder:text-gray-400"
      />
      {value && (
        <button
          type="button"
          onClick={() => setSearchQuery('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
