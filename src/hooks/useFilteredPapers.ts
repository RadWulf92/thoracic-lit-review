import { useMemo } from 'react';
import { usePaperStore } from '../stores/paperStore';
import { useTrackingStore } from '../stores/trackingStore';
import { useFilterStore } from '../stores/filterStore';
import { classifyPaper } from '../utils/paperClassifier';
import { ALL_RELEVANCE_LEVELS } from '../types/paper';
import type { Paper } from '../types/paper';

export function useFilteredPapers(): Paper[] {
  const papers = usePaperStore(s => s.papers);
  const tracking = useTrackingStore(s => s.tracking);
  const filters = useFilterStore(s => s.filters);

  return useMemo(() => {
    let result = [...papers];

    // Journal filter
    if (filters.journals.length > 0) {
      result = result.filter(p => filters.journals.includes(p.journalAbbrev));
    }

    // Paper type filter
    if (filters.paperTypes.length > 0) {
      result = result.filter(p => filters.paperTypes.includes(classifyPaper(p.pubTypes)));
    }

    // Date range filter
    if (filters.dateFrom) {
      result = result.filter(p => p.pubDate >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      result = result.filter(p => p.pubDate <= filters.dateTo!);
    }

    // Search query (also searches tags and takeaways)
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(p => {
        const t = tracking[p.pmid];
        return (
          p.title.toLowerCase().includes(q) ||
          p.abstract.toLowerCase().includes(q) ||
          p.authors.some(a =>
            `${a.lastName} ${a.foreName}`.toLowerCase().includes(q)
          ) ||
          (t?.tags ?? []).some(tag => tag.includes(q)) ||
          (t?.takeaway ?? '').toLowerCase().includes(q)
        );
      });
    }

    // Read status filter
    if (filters.readStatus !== 'all') {
      result = result.filter(p => {
        const t = tracking[p.pmid];
        const isRead = t?.isRead ?? false;
        return filters.readStatus === 'read' ? isRead : !isRead;
      });
    }

    // Rating minimum
    if (filters.ratingMin > 0) {
      result = result.filter(p => {
        const t = tracking[p.pmid];
        return (t?.rating ?? 0) >= filters.ratingMin;
      });
    }

    // Tag filter
    if (filters.tags.length > 0) {
      result = result.filter(p => {
        const t = tracking[p.pmid];
        const paperTags = t?.tags ?? [];
        return filters.tags.some(ft => paperTags.includes(ft));
      });
    }

    // Relevance filter
    if (filters.relevance.length > 0) {
      result = result.filter(p => {
        const t = tracking[p.pmid];
        return t?.relevance != null && filters.relevance.includes(t.relevance);
      });
    }

    // Sort
    result.sort((a, b) => {
      const dir = filters.sortDirection === 'asc' ? 1 : -1;

      switch (filters.sortField) {
        case 'date':
          return dir * a.pubDate.localeCompare(b.pubDate);
        case 'rating': {
          const ra = tracking[a.pmid]?.rating ?? 0;
          const rb = tracking[b.pmid]?.rating ?? 0;
          return dir * (ra - rb);
        }
        case 'readStatus': {
          const readA = tracking[a.pmid]?.isRead ? 1 : 0;
          const readB = tracking[b.pmid]?.isRead ? 1 : 0;
          return dir * (readA - readB);
        }
        case 'journal':
          return dir * a.journalAbbrev.localeCompare(b.journalAbbrev);
        case 'relevance': {
          const relOrder = ALL_RELEVANCE_LEVELS;
          const ra = tracking[a.pmid]?.relevance;
          const rb = tracking[b.pmid]?.relevance;
          const ia = ra ? relOrder.indexOf(ra) : relOrder.length;
          const ib = rb ? relOrder.indexOf(rb) : relOrder.length;
          return dir * (ia - ib);
        }
        default:
          return 0;
      }
    });

    return result;
  }, [papers, tracking, filters]);
}
