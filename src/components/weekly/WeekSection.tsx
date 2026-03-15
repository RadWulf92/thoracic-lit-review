import { useState } from 'react';
import type { WeekGroup } from '../../hooks/useWeeklyPapers';
import { PaperCard } from '../papers/PaperCard';

interface WeekSectionProps {
  week: WeekGroup;
  defaultExpanded?: boolean;
}

export function WeekSection({ week, defaultExpanded = false }: WeekSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            Week of {week.label}
          </span>
        </div>
        <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
          {week.papers.length} paper{week.papers.length !== 1 ? 's' : ''}
        </span>
      </button>

      {isExpanded && (
        <div className="p-4 space-y-3 bg-white">
          {week.papers.map(paper => (
            <PaperCard key={paper.pmid} paper={paper} />
          ))}
        </div>
      )}
    </div>
  );
}
