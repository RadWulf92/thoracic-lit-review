import type { Paper } from '../../types/paper';
import { useWeeklyPapers } from '../../hooks/useWeeklyPapers';
import { WeekSection } from './WeekSection';
import { EmptyState } from '../common/EmptyState';

interface WeeklyViewProps {
  papers: Paper[];
}

export function WeeklyView({ papers }: WeeklyViewProps) {
  const weeks = useWeeklyPapers(papers);

  if (weeks.length === 0) {
    return <EmptyState message="No papers to display in weekly view." />;
  }

  return (
    <div className="space-y-3">
      {weeks.map((week, i) => (
        <WeekSection key={week.key} week={week} defaultExpanded={i === 0} />
      ))}
    </div>
  );
}
