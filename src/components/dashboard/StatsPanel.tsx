import { useState, useMemo } from 'react';
import { usePaperStore } from '../../stores/paperStore';
import { useTrackingStore } from '../../stores/trackingStore';
import { classifyPaper, ALL_PAPER_CATEGORIES, CATEGORY_COLORS, type PaperCategory } from '../../utils/paperClassifier';
import { ALL_RELEVANCE_LEVELS, RELEVANCE_LABELS, RELEVANCE_COLORS, type ClinicalRelevance } from '../../types/paper';

export function StatsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const papers = usePaperStore(s => s.papers);
  const tracking = useTrackingStore(s => s.tracking);

  const stats = useMemo(() => {
    const byType = new Map<PaperCategory, number>();
    for (const cat of ALL_PAPER_CATEGORIES) byType.set(cat, 0);

    const byJournal = new Map<string, number>();
    const byRelevance = new Map<ClinicalRelevance, number>();
    for (const r of ALL_RELEVANCE_LEVELS) byRelevance.set(r, 0);

    const tagCounts = new Map<string, number>();
    let readCount = 0;
    let ratedCount = 0;
    let totalRating = 0;
    let taggedCount = 0;
    let relevanceCount = 0;
    let takeawayCount = 0;

    for (const paper of papers) {
      const cat = classifyPaper(paper.pubTypes);
      byType.set(cat, (byType.get(cat) ?? 0) + 1);
      byJournal.set(paper.journalAbbrev, (byJournal.get(paper.journalAbbrev) ?? 0) + 1);

      const t = tracking[paper.pmid];
      if (t?.isRead) readCount++;
      if (t?.rating && t.rating > 0) {
        ratedCount++;
        totalRating += t.rating;
      }
      if (t?.relevance) {
        byRelevance.set(t.relevance, (byRelevance.get(t.relevance) ?? 0) + 1);
        relevanceCount++;
      }
      if (t?.tags && t.tags.length > 0) {
        taggedCount++;
        for (const tag of t.tags) {
          tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
        }
      }
      if (t?.takeaway) takeawayCount++;
    }

    const topRated = papers
      .filter(p => (tracking[p.pmid]?.rating ?? 0) >= 4)
      .sort((a, b) => (tracking[b.pmid]?.rating ?? 0) - (tracking[a.pmid]?.rating ?? 0))
      .slice(0, 5);

    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);

    return {
      total: papers.length,
      readCount,
      ratedCount,
      taggedCount,
      relevanceCount,
      takeawayCount,
      avgRating: ratedCount > 0 ? (totalRating / ratedCount).toFixed(1) : '-',
      byType,
      byJournal: Array.from(byJournal.entries()).sort((a, b) => b[1] - a[1]),
      byRelevance,
      topTags,
      topRated,
      readPercent: papers.length > 0 ? Math.round((readCount / papers.length) * 100) : 0,
    };
  }, [papers, tracking]);

  if (papers.length === 0) return null;

  return (
    <div className="mb-6">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800 transition-colors mb-2"
      >
        <svg
          className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
        </svg>
        Dashboard
      </button>

      {isOpen && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
              <span>Reading Progress</span>
              <span>{stats.readCount}/{stats.total} ({stats.readPercent}%)</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-cyan-600 h-2 rounded-full transition-all"
                style={{ width: `${stats.readPercent}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* By type */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">By Type</h4>
              <div className="space-y-1">
                {ALL_PAPER_CATEGORIES.map(type => {
                  const count = stats.byType.get(type) ?? 0;
                  if (count === 0) return null;
                  const colorClass = CATEGORY_COLORS[type];
                  return (
                    <div key={type} className="flex items-center justify-between">
                      <span className={`text-xs px-1.5 py-0.5 rounded border ${colorClass}`}>{type}</span>
                      <span className="text-xs text-gray-500 font-medium">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By journal */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">By Journal</h4>
              <div className="space-y-1">
                {stats.byJournal.slice(0, 8).map(([abbrev, count]) => (
                  <div key={abbrev} className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 truncate mr-2">{abbrev}</span>
                    <span className="text-xs text-gray-500 font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* By clinical relevance */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">By Clinical Relevance</h4>
              <div className="space-y-1">
                {ALL_RELEVANCE_LEVELS.map(level => {
                  const count = stats.byRelevance.get(level) ?? 0;
                  if (count === 0) return null;
                  const colorClass = RELEVANCE_COLORS[level];
                  return (
                    <div key={level} className="flex items-center justify-between">
                      <span className={`text-xs px-1.5 py-0.5 rounded-full border ${colorClass}`}>
                        {RELEVANCE_LABELS[level]}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">{count}</span>
                    </div>
                  );
                })}
                {stats.relevanceCount === 0 && (
                  <p className="text-xs text-gray-400 italic">No papers rated yet</p>
                )}
              </div>

              {/* Top tags */}
              {stats.topTags.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Top Tags</h4>
                  <div className="space-y-1">
                    {stats.topTags.map(([tag, count]) => (
                      <div key={tag} className="flex items-center justify-between">
                        <span className="text-xs text-cyan-700">{tag}</span>
                        <span className="text-xs text-gray-500 font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Overview */}
            <div>
              <h4 className="text-xs font-medium text-gray-500 mb-2">Overview</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Total papers</span>
                  <span className="font-medium">{stats.total}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Read</span>
                  <span className="font-medium text-green-600">{stats.readCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Unread</span>
                  <span className="font-medium">{stats.total - stats.readCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Rated</span>
                  <span className="font-medium">{stats.ratedCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Avg rating</span>
                  <span className="font-medium text-amber-600">{stats.avgRating}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Tagged</span>
                  <span className="font-medium">{stats.taggedCount}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">With takeaway</span>
                  <span className="font-medium">{stats.takeawayCount}</span>
                </div>
              </div>

              {stats.topRated.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">Top Rated</h4>
                  {stats.topRated.map(p => (
                    <p key={p.pmid} className="text-xs text-gray-600 truncate" title={p.title}>
                      {'*'.repeat(tracking[p.pmid]?.rating ?? 0)} {p.title.slice(0, 60)}...
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
