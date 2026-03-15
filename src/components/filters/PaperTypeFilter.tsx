import { useState, useRef, useEffect } from 'react';
import { useFilterStore } from '../../stores/filterStore';
import { usePaperStore } from '../../stores/paperStore';
import { ALL_PAPER_CATEGORIES, classifyPaper, CATEGORY_COLORS, type PaperCategory } from '../../utils/paperClassifier';

export function PaperTypeFilter() {
  const [isOpen, setIsOpen] = useState(false);
  const paperTypes = useFilterStore(s => s.filters.paperTypes);
  const setPaperTypes = useFilterStore(s => s.setPaperTypes);
  const papers = usePaperStore(s => s.papers);
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

  // Count papers per type
  const typeCounts = new Map<PaperCategory, number>();
  for (const cat of ALL_PAPER_CATEGORIES) typeCounts.set(cat, 0);
  for (const paper of papers) {
    const cat = classifyPaper(paper.pubTypes);
    typeCounts.set(cat, (typeCounts.get(cat) ?? 0) + 1);
  }

  const toggle = (type: PaperCategory) => {
    if (paperTypes.includes(type)) {
      setPaperTypes(paperTypes.filter(t => t !== type));
    } else {
      setPaperTypes([...paperTypes, type]);
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1 px-3 py-2 text-sm border rounded-lg transition-colors ${
          paperTypes.length > 0
            ? 'border-cyan-300 bg-cyan-50 text-cyan-700'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
        }`}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" />
        </svg>
        Type
        {paperTypes.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 text-xs bg-cyan-600 text-white rounded-full">
            {paperTypes.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 py-2">
          <div className="px-3 pb-2 mb-2 border-b border-gray-100 flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Filter by paper type</span>
            {paperTypes.length > 0 && (
              <button
                type="button"
                onClick={() => setPaperTypes([])}
                className="text-xs text-cyan-600 hover:text-cyan-800"
              >
                Clear all
              </button>
            )}
          </div>
          {ALL_PAPER_CATEGORIES.map(type => {
            const count = typeCounts.get(type) ?? 0;
            const colorClass = CATEGORY_COLORS[type];
            return (
              <label
                key={type}
                className="flex items-center justify-between px-3 py-1.5 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={paperTypes.includes(type)}
                    onChange={() => toggle(type)}
                    className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${colorClass}`}>{type}</span>
                </div>
                <span className="text-xs text-gray-400">{count}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
