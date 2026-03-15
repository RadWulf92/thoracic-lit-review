import { useState, useEffect } from 'react';
import { useReadingListStore } from '../../stores/readingListStore';
import { getPaperByPmid } from '../../services/paperCache';
import { PaperCard } from '../papers/PaperCard';
import type { Paper } from '../../types/paper';

export function ReadingListView() {
  const pmids = useReadingListStore(s => s.pmids);
  const clearReadingList = useReadingListStore(s => s.clearReadingList);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPapers() {
      setIsLoading(true);
      const loaded: Paper[] = [];
      for (const pmid of pmids) {
        const paper = await getPaperByPmid(pmid);
        if (paper) loaded.push(paper);
      }
      if (!cancelled) {
        setPapers(loaded);
        setIsLoading(false);
      }
    }

    loadPapers();
    return () => { cancelled = true; };
  }, [pmids]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-gray-500">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent mr-3" />
        Loading reading list...
      </div>
    );
  }

  if (pmids.length === 0) {
    return (
      <div className="text-center py-16">
        <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
        </svg>
        <p className="text-gray-500 text-sm mb-2">Your reading list is empty</p>
        <p className="text-gray-400 text-xs">Search for articles and add them to your reading list.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reading List</h2>
          <p className="text-sm text-gray-500">{papers.length} articles</p>
        </div>
        {papers.length > 0 && (
          <button
            type="button"
            onClick={clearReadingList}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="space-y-3">
        {papers.map(paper => (
          <PaperCard key={paper.pmid} paper={paper} showReadingListRemove />
        ))}
      </div>
    </div>
  );
}
