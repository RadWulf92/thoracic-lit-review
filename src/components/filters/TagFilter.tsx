import { useState, useRef, useEffect } from 'react';
import { useFilterStore } from '../../stores/filterStore';
import { useTrackingStore } from '../../stores/trackingStore';

export function TagFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const selectedTags = useFilterStore(s => s.filters.tags);
  const setTags = useFilterStore(s => s.setTags);
  const getAllTags = useTrackingStore(s => s.getAllTags);
  const ref = useRef<HTMLDivElement>(null);

  const allTags = getAllTags();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setTags(selectedTags.filter(t => t !== tag));
    } else {
      setTags([...selectedTags, tag]);
    }
  };

  // Don't render if no tags exist yet
  if (allTags.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-3 py-2 text-sm border rounded-lg transition-colors ${
          selectedTags.length > 0
            ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5l-3.9 19.5m-2.1-19.5l-3.9 19.5" />
        </svg>
        Tags
        {selectedTags.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-cyan-600 text-white rounded-full">
            {selectedTags.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2 max-h-60 overflow-y-auto">
          <div className="px-3 pb-2 mb-2 border-b border-gray-100 flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Filter by tag</span>
            {selectedTags.length > 0 && (
              <button
                type="button"
                onClick={() => setTags([])}
                className="text-xs text-cyan-600 hover:text-cyan-800"
              >
                Clear all
              </button>
            )}
          </div>
          {allTags.map(tag => (
            <label
              key={tag}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedTags.includes(tag)}
                onChange={() => toggle(tag)}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-700">{tag}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
