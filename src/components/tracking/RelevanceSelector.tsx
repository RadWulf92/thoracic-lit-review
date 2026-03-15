import {
  ALL_RELEVANCE_LEVELS,
  RELEVANCE_LABELS,
  RELEVANCE_COLORS,
  type ClinicalRelevance,
} from '../../types/paper';

interface RelevanceSelectorProps {
  value: ClinicalRelevance | undefined;
  onChange: (relevance: ClinicalRelevance | undefined) => void;
}

export function RelevanceSelector({ value, onChange }: RelevanceSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {ALL_RELEVANCE_LEVELS.map(level => {
        const isActive = value === level;
        const colorClass = isActive
          ? RELEVANCE_COLORS[level]
          : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100';

        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(isActive ? undefined : level)}
            className={`px-2 py-0.5 text-[11px] font-medium border rounded-full transition-colors ${colorClass}`}
            title={isActive ? 'Click to clear' : `Mark as ${RELEVANCE_LABELS[level]}`}
          >
            {RELEVANCE_LABELS[level]}
          </button>
        );
      })}
    </div>
  );
}

/** Compact badge shown on collapsed card */
export function RelevanceBadge({ relevance }: { relevance: ClinicalRelevance }) {
  const colorClass = RELEVANCE_COLORS[relevance];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colorClass}`}>
      {RELEVANCE_LABELS[relevance]}
    </span>
  );
}
