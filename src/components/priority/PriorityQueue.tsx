import { useMemo, useState } from 'react';
import { usePaperStore } from '../../stores/paperStore';
import { useTrackingStore } from '../../stores/trackingStore';
import { PaperCard } from '../papers/PaperCard';
import { EmptyState } from '../common/EmptyState';
import { classifyPaper } from '../../utils/paperClassifier';
import { getPaperImpactProfile, type PaperImpactProfile } from '../../utils/priority';
import type { Paper } from '../../types/paper';

type QueueFilter =
  | 'all'
  | 'high-impact'
  | 'unread'
  | 'must-read'
  | 'trials'
  | 'guidelines'
  | 'needs-takeaway';

interface PriorityItem {
  paper: Paper;
  profile: PaperImpactProfile;
}

const FILTER_LABELS: Record<QueueFilter, string> = {
  all: 'All',
  'high-impact': 'Read First',
  unread: 'Unread',
  'must-read': 'Must Read',
  trials: 'Trials',
  guidelines: 'Guidelines',
  'needs-takeaway': 'Needs Takeaway',
};

const FILTERS: QueueFilter[] = [
  'all',
  'high-impact',
  'unread',
  'must-read',
  'trials',
  'guidelines',
  'needs-takeaway',
];

function filterItem(item: PriorityItem, filter: QueueFilter, tracking: ReturnType<typeof useTrackingStore.getState>['tracking']) {
  const t = tracking[item.paper.pmid];
  const category = classifyPaper(item.paper.pubTypes);

  switch (filter) {
    case 'high-impact':
      return item.profile.level === 'high';
    case 'unread':
      return item.profile.isUnread;
    case 'must-read':
      return t?.priority === 'must-read' || t?.priority === 'important';
    case 'trials':
      return category === 'Clinical Trial' || item.profile.hasTrialData;
    case 'guidelines':
      return category === 'Guideline' || category === 'Meta-Analysis';
    case 'needs-takeaway':
      return item.profile.needsTakeaway && item.profile.score >= 35;
    default:
      return true;
  }
}

function levelClass(level: PaperImpactProfile['level']) {
  switch (level) {
    case 'high':
      return 'bg-red-50 text-red-700 border-red-200';
    case 'medium':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200';
  }
}

function levelLabel(level: PaperImpactProfile['level']) {
  switch (level) {
    case 'high':
      return 'Read first';
    case 'medium':
      return 'Worth reading';
    default:
      return 'Routine scan';
  }
}

export function PriorityQueue() {
  const papers = usePaperStore(s => s.papers);
  const tracking = useTrackingStore(s => s.tracking);
  const [activeFilter, setActiveFilter] = useState<QueueFilter>('all');

  const items = useMemo<PriorityItem[]>(() => {
    return papers
      .map(paper => ({
        paper,
        profile: getPaperImpactProfile(paper, tracking[paper.pmid]),
      }))
      .sort((a, b) => {
        const scoreDiff = b.profile.score - a.profile.score;
        if (scoreDiff !== 0) return scoreDiff;
        return b.paper.pubDate.localeCompare(a.paper.pubDate);
      });
  }, [papers, tracking]);

  const counts = useMemo(() => {
    const map = new Map<QueueFilter, number>();
    for (const filter of FILTERS) {
      map.set(filter, items.filter(item => filterItem(item, filter, tracking)).length);
    }
    return map;
  }, [items, tracking]);

  const visibleItems = items.filter(item => filterItem(item, activeFilter, tracking));
  const readFirstUnread = items.filter(item => item.profile.level === 'high' && item.profile.isUnread).length;
  const needsTakeaway = items.filter(item => item.profile.needsTakeaway && item.profile.score >= 35).length;
  const explicitPriorities = items.filter(item => {
    const priority = tracking[item.paper.pmid]?.priority;
    return priority === 'must-read' || priority === 'important';
  }).length;
  const trialDataCount = items.filter(item => item.profile.hasTrialData).length;

  if (papers.length === 0) {
    return <EmptyState message="No papers found. Fetch or load a collection to build a priority queue." />;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Priority Queue</h2>
          <p className="text-sm text-gray-500">{visibleItems.length} papers</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
            <p className="text-[11px] text-gray-400">Read first</p>
            <p className="text-lg font-semibold text-red-600">{readFirstUnread}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
            <p className="text-[11px] text-gray-400">Needs takeaway</p>
            <p className="text-lg font-semibold text-cyan-700">{needsTakeaway}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
            <p className="text-[11px] text-gray-400">Marked priority</p>
            <p className="text-lg font-semibold text-amber-600">{explicitPriorities}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-3 py-2">
            <p className="text-[11px] text-gray-400">Trial data</p>
            <p className="text-lg font-semibold text-emerald-600">{trialDataCount}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map(filter => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={`shrink-0 px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              activeFilter === filter
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {FILTER_LABELS[filter]}
            <span className={activeFilter === filter ? 'ml-1 text-cyan-100' : 'ml-1 text-gray-400'}>
              {counts.get(filter) ?? 0}
            </span>
          </button>
        ))}
      </div>

      {visibleItems.length === 0 ? (
        <EmptyState message="No papers match this priority filter." />
      ) : (
        <div className="space-y-4">
          {visibleItems.map(({ paper, profile }) => (
            <div key={paper.pmid} className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5 px-1 text-xs">
                <span className={`inline-flex items-center rounded-full border px-2 py-0.5 font-medium ${levelClass(profile.level)}`}>
                  {levelLabel(profile.level)}
                </span>
                {profile.reasons.length > 0 && (
                  <span className="text-gray-400">Why:</span>
                )}
                {profile.reasons.map(reason => (
                  <span key={reason} className="inline-flex items-center rounded-full bg-white border border-gray-200 px-2 py-0.5 text-gray-500">
                    {reason}
                  </span>
                ))}
              </div>
              <PaperCard paper={paper} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
