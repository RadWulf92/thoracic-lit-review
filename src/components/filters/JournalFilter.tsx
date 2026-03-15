import { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../../stores/settingsStore';
import { useFilterStore } from '../../stores/filterStore';

export function JournalFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const allJournals = useSettingsStore(s => s.journals);
  const journals = useFilterStore(s => s.filters.journals);
  const setJournals = useFilterStore(s => s.setJournals);
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

  const toggle = (abbrev: string) => {
    if (journals.includes(abbrev)) {
      setJournals(journals.filter(j => j !== abbrev));
    } else {
      setJournals([...journals, abbrev]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-3 py-2 text-sm border rounded-lg transition-colors ${
          journals.length > 0
            ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        Journals
        {journals.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-cyan-600 text-white rounded-full">
            {journals.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2 max-h-80 overflow-y-auto">
          <div className="px-3 pb-2 mb-2 border-b border-gray-100 flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Select journals</span>
            {journals.length > 0 && (
              <button
                type="button"
                onClick={() => setJournals([])}
                className="text-xs text-cyan-600 hover:text-cyan-800"
              >
                Clear all
              </button>
            )}
          </div>
          {allJournals.map(journal => (
            <label
              key={journal.abbrev}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={journals.includes(journal.abbrev)}
                onChange={() => toggle(journal.abbrev)}
                className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm text-gray-700 truncate">{journal.full}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
