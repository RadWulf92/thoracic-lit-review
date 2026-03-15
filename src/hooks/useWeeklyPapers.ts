import { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { getWeekKey, getWeekLabel } from '../utils/dateUtils';
import type { Paper } from '../types/paper';

export interface WeekGroup {
  key: string;
  label: string;
  papers: Paper[];
}

export function useWeeklyPapers(papers: Paper[]): WeekGroup[] {
  return useMemo(() => {
    const groups = new Map<string, { label: string; papers: Paper[] }>();

    for (const paper of papers) {
      if (!paper.pubDate) continue;
      const date = parseISO(paper.pubDate);
      const key = getWeekKey(date);

      if (!groups.has(key)) {
        groups.set(key, { label: getWeekLabel(date), papers: [] });
      }
      groups.get(key)!.papers.push(paper);
    }

    return Array.from(groups.entries())
      .map(([key, { label, papers }]) => ({ key, label, papers }))
      .sort((a, b) => b.key.localeCompare(a.key));
  }, [papers]);
}
