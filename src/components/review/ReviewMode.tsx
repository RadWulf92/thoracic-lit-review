import { useState, useMemo, useCallback } from 'react';
import { usePaperStore } from '../../stores/paperStore';
import { useTrackingStore } from '../../stores/trackingStore';
import type { Paper } from '../../types/paper';
import { TrialDataSummary } from '../tracking/TrialDataSummary';
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  RELEVANCE_LABELS,
  RELEVANCE_COLORS,
  type ClinicalRelevance,
  type PaperPriority,
} from '../../types/paper';

type ReviewFilter = 'all-reviewed' | 'must-read' | 'practice-changing' | 'clinically-relevant' | 'starred' | 'with-trial-data';

const FILTERS: { id: ReviewFilter; label: string }[] = [
  { id: 'all-reviewed', label: 'All Reviewed' },
  { id: 'must-read', label: 'Must Read' },
  { id: 'practice-changing', label: 'Practice Changing' },
  { id: 'clinically-relevant', label: 'Clinically Relevant' },
  { id: 'starred', label: '4+ Stars' },
  { id: 'with-trial-data', label: 'With Trial Data' },
];

function seededShuffleScore(pmid: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < pmid.length; i++) {
    hash = (hash * 31 + pmid.charCodeAt(i)) % 1_000_003;
  }
  return hash;
}

export function ReviewMode() {
  const papers = usePaperStore(s => s.papers);
  const tracking = useTrackingStore(s => s.tracking);
  const [filter, setFilter] = useState<ReviewFilter>('all-reviewed');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(1);

  const reviewPapers = useMemo(() => {
    let filtered: Paper[] = [];

    switch (filter) {
      case 'must-read':
        filtered = papers.filter(p => {
          const priority = tracking[p.pmid]?.priority;
          return priority === 'must-read' || priority === 'important';
        });
        break;
      case 'practice-changing':
        filtered = papers.filter(p => tracking[p.pmid]?.relevance === 'practice-changing');
        break;
      case 'clinically-relevant':
        filtered = papers.filter(p => {
          const rel = tracking[p.pmid]?.relevance;
          return rel === 'practice-changing' || rel === 'clinically-relevant';
        });
        break;
      case 'starred':
        filtered = papers.filter(p => (tracking[p.pmid]?.rating ?? 0) >= 4);
        break;
      case 'with-trial-data':
        filtered = papers.filter(p => {
          const td = tracking[p.pmid]?.trialData;
          return td && Object.entries(td).some(([k, v]) => k !== 'trialDataUpdatedAt' && v && String(v).trim());
        });
        break;
      default:
        filtered = papers.filter(p => {
          const t = tracking[p.pmid];
          return t && (t.isRead || t.priority || t.relevance || (t.rating && t.rating > 0) || t.takeaway || t.trialData);
        });
    }

    if (shuffled) {
      return [...filtered].sort(
        (a, b) => seededShuffleScore(a.pmid, shuffleSeed) - seededShuffleScore(b.pmid, shuffleSeed)
      );
    }
    return filtered;
  }, [papers, tracking, filter, shuffled, shuffleSeed]);

  const currentPaper = reviewPapers[currentIndex];
  const currentTracking = currentPaper ? tracking[currentPaper.pmid] : undefined;
  const trialData = currentTracking?.trialData;
  const hasTrialData = trialData && Object.entries(trialData).some(([k, v]) => k !== 'trialDataUpdatedAt' && v && String(v).trim());

  const goNext = useCallback(() => {
    setRevealed(false);
    setCurrentIndex(i => Math.min(i + 1, reviewPapers.length - 1));
  }, [reviewPapers.length]);

  const goPrev = useCallback(() => {
    setRevealed(false);
    setCurrentIndex(i => Math.max(i - 1, 0));
  }, []);

  const handleShuffle = () => {
    const nextShuffled = !shuffled;
    setShuffled(nextShuffled);
    if (nextShuffled) setShuffleSeed(Date.now());
    setCurrentIndex(0);
    setRevealed(false);
  };

  if (reviewPapers.length === 0) {
    return (
      <div className="text-center py-12">
        <svg className="h-12 w-12 text-gray-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
        </svg>
        <p className="text-gray-500 text-sm">No papers to review yet.</p>
        <p className="text-gray-400 text-xs mt-1">
          Rate papers, set clinical relevance, or add trial data to build your review deck.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Study Mode</h2>
        <span className="text-sm text-gray-500">{currentIndex + 1} / {reviewPapers.length}</span>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => { setFilter(f.id); setCurrentIndex(0); setRevealed(false); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              filter === f.id
                ? 'bg-cyan-600 text-white border-cyan-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {f.label}
          </button>
        ))}
        <button
          type="button"
          onClick={handleShuffle}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            shuffled
              ? 'bg-violet-600 text-white border-violet-600'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          Shuffle
        </button>
      </div>

      {/* Flashcard */}
      {currentPaper && (
        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          {/* Question side */}
          <div className="p-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{currentPaper.journalAbbrev}</span>
              <span className="text-xs text-gray-400">{currentPaper.pubDate?.slice(0, 10)}</span>
              {currentTracking?.relevance && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${RELEVANCE_COLORS[currentTracking.relevance as ClinicalRelevance]}`}>
                  {RELEVANCE_LABELS[currentTracking.relevance as ClinicalRelevance]}
                </span>
              )}
              {currentTracking?.priority && (
                <span className={`text-xs px-2 py-0.5 rounded-full border ${PRIORITY_COLORS[currentTracking.priority as PaperPriority]}`}>
                  {PRIORITY_LABELS[currentTracking.priority as PaperPriority]}
                </span>
              )}
              {currentTracking?.rating && currentTracking.rating > 0 && (
                <span className="text-xs text-amber-600">{currentTracking.rating}/5 stars</span>
              )}
            </div>

            <h3 className="text-base font-semibold text-gray-900 leading-snug mb-2">
              {currentPaper.title}
            </h3>

            <p className="text-xs text-gray-500">
              {currentPaper.authors.length > 3
                ? `${currentPaper.authors[0].lastName} ${currentPaper.authors[0].initials} et al.`
                : currentPaper.authors.map(a => `${a.lastName} ${a.initials}`).join(', ')}
            </p>

            {/* Prompt */}
            {!revealed && (
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-400 italic mb-3">
                  What are the key findings and takeaways?
                </p>
                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="px-6 py-2.5 bg-cyan-600 text-white text-sm font-medium rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  Reveal Answer
                </button>
              </div>
            )}
          </div>

          {/* Answer side */}
          {revealed && (
            <div className="border-t border-gray-200 bg-gray-50 p-6 space-y-4">
              {/* Takeaway */}
              {currentTracking?.takeaway && (
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Key Takeaway</h4>
                  <p className="text-sm text-gray-800 bg-white border border-gray-200 rounded-lg px-3 py-2">
                    {currentTracking.takeaway}
                  </p>
                </div>
              )}

              {/* Trial Data */}
              {hasTrialData && trialData && (
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Trial Results</h4>
                  <div className="bg-white border border-gray-200 rounded-lg px-3 py-2 space-y-2">
                    <TrialDataSummary data={trialData} />

                    {/* Detailed fields */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      {trialData.experimentalArm && (
                        <div><span className="text-gray-400">Exp:</span> <span className="text-gray-700">{trialData.experimentalArm}</span></div>
                      )}
                      {trialData.controlArm && (
                        <div><span className="text-gray-400">Ctrl:</span> <span className="text-gray-700">{trialData.controlArm}</span></div>
                      )}
                      {trialData.orrExpArm && (
                        <div><span className="text-gray-400">ORR (Exp):</span> <span className="text-gray-700">{trialData.orrExpArm}</span></div>
                      )}
                      {trialData.orrCtrlArm && (
                        <div><span className="text-gray-400">ORR (Ctrl):</span> <span className="text-gray-700">{trialData.orrCtrlArm}</span></div>
                      )}
                      {trialData.grade3PlusRate && (
                        <div className="col-span-2"><span className="text-gray-400">Gr 3+ AE:</span> <span className="text-gray-700">{trialData.grade3PlusRate}</span></div>
                      )}
                    </div>

                    {trialData.secondaryResults && (
                      <p className="text-xs text-gray-600">{trialData.secondaryResults}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {currentTracking?.notes && (
                <div>
                  <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</h4>
                  <p className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 whitespace-pre-wrap">
                    {currentTracking.notes}
                  </p>
                </div>
              )}

              {/* Tags */}
              {currentTracking?.tags && currentTracking.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {currentTracking.tags.map(tag => (
                    <span key={tag} className="text-xs bg-cyan-50 text-cyan-700 px-2 py-0.5 rounded-full">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* No data message */}
              {!currentTracking?.takeaway && !hasTrialData && !currentTracking?.notes && (
                <p className="text-sm text-gray-400 italic">
                  No takeaway or trial data recorded yet. Expand this paper in the list view to add details.
                </p>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Previous
            </button>

            {/* Progress dots */}
            <div className="flex items-center gap-1">
              {reviewPapers.length <= 20 ? (
                reviewPapers.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setCurrentIndex(i); setRevealed(false); }}
                    className={`h-2 w-2 rounded-full transition-colors ${
                      i === currentIndex ? 'bg-cyan-600' : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  />
                ))
              ) : (
                <span className="text-xs text-gray-400">{currentIndex + 1} of {reviewPapers.length}</span>
              )}
            </div>

            <button
              type="button"
              onClick={goNext}
              disabled={currentIndex === reviewPapers.length - 1}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
