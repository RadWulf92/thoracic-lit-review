import { useEffect, useRef, useState } from 'react';
import { useFilterStore } from '../../stores/filterStore';
import {
  ALL_PRIORITY_LEVELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  type PaperPriority,
} from '../../types/paper';

export function PriorityFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const selected = useFilterStore(s => s.filters.priority);
  const setPriorityFilter = useFilterStore(s => s.setPriorityFilter);
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

  const toggle = (level: PaperPriority) => {
    if (selected.includes(level)) {
      setPriorityFilter(selected.filter(l => l !== level));
    } else {
      setPriorityFilter([...selected, level]);
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75l2.142 4.339 4.79.696-3.466 3.378.818 4.771L12 14.681l-4.284 2.253.818-4.771-3.466-3.378 4.79-.696L12 3.75z" />
        </svg>
        Priority
        {selected.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-cyan-600 text-white rounded-full">
            {selected.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2">
          <div className="px-3 pb-2 mb-2 border-b border-gray-100 flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Filter by priority</span>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setPriorityFilter([])}
                className="text-xs text-cyan-600 hover:text-cyan-800"
              >
                Clear all
              </button>
            )}
          </div>
          {ALL_PRIORITY_LEVELS.map(level => (
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
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[level]}`}>
                {PRIORITY_LABELS[level]}
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
