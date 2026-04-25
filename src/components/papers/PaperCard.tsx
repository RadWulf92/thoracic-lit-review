import { useState } from 'react';
import type { Paper } from '../../types/paper';
import { useTrackingStore } from '../../stores/trackingStore';
import { useFilterStore } from '../../stores/filterStore';
import { useReadingListStore } from '../../stores/readingListStore';
import { JournalBadge, PaperTypeBadge, AheadOfPrintBadge } from '../common/Badge';
import { StarRating } from '../tracking/StarRating';
import { ReadStatusBadge } from '../tracking/ReadStatusBadge';
import { NotesEditor, NotesIndicator } from '../tracking/NotesEditor';
import { TagInput, TagsDisplay } from '../tracking/TagInput';
import { RelevanceSelector, RelevanceBadge } from '../tracking/RelevanceSelector';
import { PrioritySelector, PriorityBadge } from '../tracking/PrioritySelector';
import { TakeawayField, TakeawayDisplay } from '../tracking/TakeawayField';
import { TrialDataEditor } from '../tracking/TrialDataEditor';
import { TrialDataSummary } from '../tracking/TrialDataSummary';
import { classifyPaper } from '../../utils/paperClassifier';
import { HighlightedText } from '../../utils/highlighter';
import { getCardBorderClass } from '../../utils/journalStyles';
import { format, parseISO } from 'date-fns';

interface PaperCardProps {
  paper: Paper;
  showReadingListRemove?: boolean;
}

function formatAuthors(authors: Paper['authors']): string {
  if (authors.length === 0) return 'Unknown authors';
  if (authors.length <= 3) {
    return authors.map(a => `${a.lastName} ${a.initials}`).join(', ');
  }
  return `${authors[0].lastName} ${authors[0].initials} et al.`;
}

export function PaperCard({ paper, showReadingListRemove }: PaperCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const tracking = useTrackingStore(s => s.tracking[paper.pmid]);
  const toggleRead = useTrackingStore(s => s.toggleRead);
  const addToReadingList = useReadingListStore(s => s.addToReadingList);
  const removeFromReadingList = useReadingListStore(s => s.removeFromReadingList);
  const isInReadingList = useReadingListStore(s => s.isInReadingList);
  const setRating = useTrackingStore(s => s.setRating);
  const updateNotes = useTrackingStore(s => s.updateNotes);
  const setRelevance = useTrackingStore(s => s.setRelevance);
  const setPriority = useTrackingStore(s => s.setPriority);
  const setTakeaway = useTrackingStore(s => s.setTakeaway);
  const setTrialData = useTrackingStore(s => s.setTrialData);
  const searchQuery = useFilterStore(s => s.filters.searchQuery);

  const isRead = tracking?.isRead ?? false;
  const rating = tracking?.rating ?? 0;
  const notes = tracking?.notes ?? '';
  const tags = tracking?.tags ?? [];
  const relevance = tracking?.relevance;
  const priority = tracking?.priority;
  const takeaway = tracking?.takeaway ?? '';
  const trialData = tracking?.trialData;
  const savedForLater = isInReadingList(paper.pmid);

  const borderClass = getCardBorderClass(paper.journalAbbrev);
  const pubDate = paper.pubDate ? format(parseISO(paper.pubDate), 'MMM d, yyyy') : '';
  const category = classifyPaper(paper.pubTypes);

  return (
    <article
      className={`bg-white rounded-lg shadow-sm border border-gray-200 border-l-4 ${borderClass} transition-shadow hover:shadow-md ${
        isRead ? 'opacity-75' : ''
      }`}
    >
      <div className="p-4">
        {/* Header row: journal badge + type badge + relevance + date */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <JournalBadge abbrev={paper.journalAbbrev} />
            <PaperTypeBadge category={category} />
            {paper.pubStatus === 'aheadofprint' && <AheadOfPrintBadge />}
            {priority && <PriorityBadge priority={priority} />}
            {relevance && <RelevanceBadge relevance={relevance} />}
          </div>
          <span className="text-xs text-gray-400 shrink-0 ml-2">{pubDate}</span>
        </div>

        {/* Title */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-left w-full"
        >
          <h3 className={`text-sm font-semibold leading-snug ${isRead ? 'text-gray-500' : 'text-gray-900'} hover:text-cyan-700 transition-colors`}>
            <HighlightedText text={paper.title} query={searchQuery} />
          </h3>
        </button>

        {/* Authors */}
        <p className="text-xs text-gray-500 mt-1">{formatAuthors(paper.authors)}</p>

        {/* Key Takeaway (visible on collapsed card when set) */}
        {!isExpanded && takeaway && (
          <div className="mt-2">
            <TakeawayDisplay takeaway={takeaway} />
          </div>
        )}

        {/* Trial Data Summary (visible on collapsed card when data exists) */}
        {!isExpanded && trialData && (
          <div className="mt-1.5">
            <TrialDataSummary data={trialData} />
          </div>
        )}

        {/* Tags (visible on collapsed card when set) */}
        {!isExpanded && tags.length > 0 && (
          <div className="mt-1.5">
            <TagsDisplay tags={tags} />
          </div>
        )}

        {/* Actions row */}
        <div className="flex flex-col gap-3 mt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <ReadStatusBadge isRead={isRead} onToggle={() => toggleRead(paper.pmid)} />
            <StarRating rating={rating} onChange={(r) => setRating(paper.pmid, r)} />
            <NotesIndicator hasNotes={!!notes} onClick={() => setShowNotes(!showNotes)} />
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-end sm:justify-start">
            {!showReadingListRemove && (
              <button
                type="button"
                onClick={() => savedForLater ? removeFromReadingList(paper.pmid) : addToReadingList(paper.pmid)}
                className={`flex items-center gap-1 text-xs transition-colors ${
                  savedForLater
                    ? 'text-green-700 hover:text-red-600'
                    : 'text-cyan-600 hover:text-cyan-800'
                }`}
                title={savedForLater ? 'Remove from reading list' : 'Add to reading list'}
              >
                {savedForLater ? (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Saved
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Save
                  </>
                )}
              </button>
            )}
            {paper.doi && (
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-cyan-600 hover:text-cyan-800 hover:underline"
              >
                Full text
              </a>
            )}
            {showReadingListRemove && (
              <button
                type="button"
                onClick={() => removeFromReadingList(paper.pmid)}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                title="Remove from reading list"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Expanded content */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
            {/* Priority selector */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Reading Priority</label>
              <PrioritySelector
                value={priority}
                onChange={(p) => setPriority(paper.pmid, p)}
              />
            </div>

            {/* Clinical Relevance selector */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Clinical Relevance</label>
              <RelevanceSelector
                value={relevance}
                onChange={(r) => setRelevance(paper.pmid, r)}
              />
            </div>

            {/* Key Takeaway */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Key Takeaway</label>
              <TakeawayField
                value={takeaway}
                onSave={(v) => setTakeaway(paper.pmid, v)}
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-[11px] font-medium text-gray-500 mb-1">Tags</label>
              <TagInput pmid={paper.pmid} tags={tags} />
            </div>

            {/* Trial Data */}
            <TrialDataEditor
              data={trialData}
              onSave={(d) => setTrialData(paper.pmid, d)}
            />

            {/* Abstract */}
            {paper.abstract ? (
              <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                {paper.abstractSections.length > 1 ? (
                  paper.abstractSections.map((section, i) => (
                    <div key={i}>
                      {section.label && (
                        <span className="font-semibold text-gray-900">{section.label}: </span>
                      )}
                      <HighlightedText text={section.text} query={searchQuery} />
                    </div>
                  ))
                ) : (
                  <p><HighlightedText text={paper.abstract} query={searchQuery} /></p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No abstract available</p>
            )}

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-400">
              <span>PMID: {paper.pmid}</span>
              {paper.doi && <span>DOI: {paper.doi}</span>}
              {paper.volume && (
                <span>
                  Vol. {paper.volume}
                  {paper.issue && `(${paper.issue})`}
                  {paper.pages && `: ${paper.pages}`}
                </span>
              )}
            </div>

            {/* Publication types */}
            {paper.pubTypes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {paper.pubTypes.map((type, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                    {type}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Notes editor */}
        <NotesEditor
          notes={notes}
          onSave={(n) => updateNotes(paper.pmid, n)}
          isOpen={showNotes}
          onClose={() => setShowNotes(false)}
        />
      </div>
    </article>
  );
}
