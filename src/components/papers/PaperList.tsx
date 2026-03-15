import type { Paper } from '../../types/paper';
import { PaperCard } from './PaperCard';
import { EmptyState } from '../common/EmptyState';

interface PaperListProps {
  papers: Paper[];
}

export function PaperList({ papers }: PaperListProps) {
  if (papers.length === 0) {
    return <EmptyState message="No papers found. Try adjusting your filters or fetch new papers." />;
  }

  return (
    <div className="space-y-3">
      {papers.map((paper) => (
        <PaperCard key={paper.pmid} paper={paper} />
      ))}
    </div>
  );
}
