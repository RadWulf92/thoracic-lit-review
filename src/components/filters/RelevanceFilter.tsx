import { useState, useRef, useEffect } from 'react';
import { useFilterStore } from '../../stores/filterStore';
import { ALL_RELEVANCE_LEVELS, RELEVANCE_LABELS, RELEVANCE_COLORS, type ClinicalRelevance } from '../../types/paper';

export function RelevanceFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const selected = useFilterStore(s => s.filters.relevance);
  const setRelevanceFilter = useFilterStore(s => s.setRelevanceFilter);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (level: ClinicalRelevance) => {
    if (selected.includes(level)) {
      setRelevanceFilter(selected.filter(l => l !== level));
    } else {
      setRelevanceFilter([...selected, level]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-3 py-2 text-sm border rounded-lg transition-colors ${
          selected.length > 0
            ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
        Relevance
        {selected.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-cyan-600 text-white rounded-full">
            {selected.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2">
          <div className="px-3 pb-2 mb-2 border-b border-gray-100 flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Filter by relevance</span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setRelevanceFilter([])}
                className="text-xs text-cyan-600 hover:text-cyan-800"
              >
                Clear all
              </button>
            )}
          </div>
          {ALL_RELEVANCE_LEVELS.map(level => {
            const colorClass = RELEVANCE_COLORS[level];
            return (
              <label
                key={level}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(level)}
                  onChange={() => toggle(level)}
                  className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                />
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colorClass}`}>
                  {RELEVANCE_LABELS[level]}
                </span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
