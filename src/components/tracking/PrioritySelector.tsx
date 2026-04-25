import {
  ALL_PRIORITY_LEVELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  type PaperPriority,
} from '../../types/paper';

interface PrioritySelectorProps {
  value: PaperPriority | undefined;
  onChange: (priority: PaperPriority | undefined) => void;
}

export function PrioritySelector({ value, onChange }: PrioritySelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {ALL_PRIORITY_LEVELS.map(level => {
        const isActive = value === level;
        const colorClass = isActive
          ? PRIORITY_COLORS[level]
          : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100';

        return (
          <button
            key={level}
            type="button"
            onClick={() => onChange(isActive ? undefined : level)}
            className={`px-2 py-0.5 text-[11px] font-medium border rounded-full transition-colors ${colorClass}`}
            title={isActive ? 'Click to clear' : `Mark as ${PRIORITY_LABELS[level]}`}
          >
            {PRIORITY_LABELS[level]}
          </button>
        );
      })}
    </div>
  );
}

export function PriorityBadge({ priority }: { priority: PaperPriority }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${PRIORITY_COLORS[priority]}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
