import { useCallback, useMemo, useState } from 'react';
import { usePaperStore } from '../../stores/paperStore';
import { useTrackingStore } from '../../stores/trackingStore';
import type { ClinicalRelevance, Paper, PaperPriority, PaperTracking } from '../../types/paper';
import {
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  RELEVANCE_COLORS,
  RELEVANCE_LABELS,
} from '../../types/paper';
import { TrialDataSummary } from '../tracking/TrialDataSummary';
import { TrialResultsViz } from '../tracking/TrialResultsViz';
import { classifyPaper, CATEGORY_COLORS } from '../../utils/paperClassifier';
import { getPaperImpactProfile, hasRecordedTrialData } from '../../utils/priority';
import {
  extractTrialDataFromPaper,
  mergeTrialDataBlanks,
  TRIAL_FIELD_LABELS,
} from '../../utils/trialDataExtractor';
import { hasVisualizableTrialResults, trialCompleteness } from '../../utils/trialMetrics';

type StudyDeck = 'smart' | 'trials' | 'gaps' | 'marked' | 'read' | 'starred';
type StudyTask = 'recall' | 'trial-drill' | 'journal-club' | 'complete';

const DECKS: Array<{ id: StudyDeck; label: string }> = [
  { id: 'smart', label: 'Read First' },
  { id: 'trials', label: 'Trials' },
  { id: 'gaps', label: 'Needs Work' },
  { id: 'marked', label: 'Marked' },
  { id: 'read', label: 'Read' },
  { id: 'starred', label: '4+ Stars' },
];

const TASKS: Array<{ id: StudyTask; label: string; prompt: string }> = [
  { id: 'recall', label: 'Recall', prompt: 'Remember the clinical point before opening the answer.' },
  { id: 'trial-drill', label: 'Trial Drill', prompt: 'Name the population, arms, endpoint, effect size, and toxicity.' },
  { id: 'journal-club', label: 'Journal Club', prompt: 'Build a 60-second critique and practice point.' },
  { id: 'complete', label: 'Complete', prompt: 'Fill the missing review fields while the paper is in front of you.' },
];

function seededShuffleScore(pmid: string, seed: number): number {
  let hash = seed;
  for (let i = 0; i < pmid.length; i++) {
    hash = (hash * 31 + pmid.charCodeAt(i)) % 1_000_003;
  }
  return hash;
}

function hasUsefulTracking(tracking: PaperTracking | undefined): boolean {
  if (!tracking) return false;
  return Boolean(
    tracking.isRead ||
    tracking.priority ||
    tracking.relevance ||
    tracking.rating > 0 ||
    tracking.takeaway?.trim() ||
    tracking.notes?.trim() ||
    hasRecordedTrialData(tracking)
  );
}

function isTrialLike(paper: Paper, tracking: PaperTracking | undefined): boolean {
  if (classifyPaper(paper.pubTypes) === 'Clinical Trial') return true;
  if (hasRecordedTrialData(tracking)) return true;
  const text = `${paper.title} ${paper.abstract} ${paper.pubTypes.join(' ')}`;
  return /\b(?:clinical trial|phase\s+(?:i\/ii|ii\/iii|[ivx]+|[1-4])|randomi[sz]ed\s+(?:controlled\s+)?trial|patients\s+(?:were\s+)?(?:enrolled|assigned)|participants\s+(?:were\s+)?(?:enrolled|assigned)|assigned\s+to\s+receive)\b/i.test(text);
}

function authorLine(paper: Paper): string {
  if (paper.authors.length === 0) return 'No authors listed';
  if (paper.authors.length > 3) {
    const first = paper.authors[0];
    return `${first.lastName} ${first.initials} et al.`;
  }
  return paper.authors.map(author => `${author.lastName} ${author.initials}`).join(', ');
}

function fieldDone(value: unknown): boolean {
  return Boolean(value && String(value).trim());
}

function completionItems(paper: Paper, tracking: PaperTracking | undefined) {
  const trialLike = isTrialLike(paper, tracking);
  return [
    { label: 'Read', done: tracking?.isRead ?? false },
    { label: 'Priority', done: fieldDone(tracking?.priority) },
    { label: 'Clinical relevance', done: fieldDone(tracking?.relevance) },
    { label: 'Takeaway', done: fieldDone(tracking?.takeaway) },
    { label: 'Trial fields', done: !trialLike || hasRecordedTrialData(tracking) },
  ];
}

function buildStudyPrompts(task: StudyTask, paper: Paper, tracking: PaperTracking | undefined): string[] {
  const trialLike = isTrialLike(paper, tracking);

  if (task === 'trial-drill') {
    return trialLike
      ? [
          'What was the population and treatment setting?',
          'What were the experimental and control arms?',
          'What was the primary endpoint and headline effect size?',
          'What toxicity would you mention before recommending this?',
        ]
      : [
          'Is this really a trial, or should it be moved to another deck?',
          'What result would change your practice, if any?',
        ];
  }

  if (task === 'journal-club') {
    return [
      'What is the one-sentence clinical question?',
      'What is the main result and how large is the effect?',
      'What is the most important limitation?',
      'What would you say in MDT or clinic tomorrow?',
    ];
  }

  if (task === 'complete') {
    return [
      'Which fields are missing from this review card?',
      'Can the abstract fill any trial fields?',
      'What is the shortest useful takeaway?',
    ];
  }

  return [
    'What is this paper about without looking at the abstract?',
    'What should you remember in three months?',
    'Is this practice changing, clinically relevant, or background?',
  ];
}

function buildTemplate(kind: 'pico' | 'practice' | 'safety', paper: Paper, tracking: PaperTracking | undefined): string {
  const td = tracking?.trialData;
  if (kind === 'pico') {
    return [
      `Population: ${td?.histology ?? 'patients'}${td?.stage ? `, ${td.stage}` : ''}${td?.setting ? `, ${td.setting}` : ''}.`,
      `Intervention: ${td?.experimentalArm ?? 'experimental approach'}${td?.controlArm ? ` vs ${td.controlArm}` : ''}.`,
      `Result: ${td?.primaryEndpoint ?? 'primary endpoint'}${td?.hazardRatio ? ` HR ${td.hazardRatio}` : ''}${td?.medianExpArm && td?.medianCtrlArm ? `, ${td.medianExpArm} vs ${td.medianCtrlArm}` : ''}.`,
      'Practice point: ',
    ].join(' ');
  }

  if (kind === 'safety') {
    return `Safety note: ${td?.keyToxicities ?? td?.grade3PlusRate ?? 'key toxicities'}${td?.discontinuationRate ? `; discontinuation ${td.discontinuationRate}` : ''}. Clinical use: `;
  }

  const category = classifyPaper(paper.pubTypes);
  return `${category}: ${paper.title.replace(/\.$/, '')}. Main clinical takeaway: `;
}

function StatTile({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      <p className="mt-1 text-xs text-gray-500">{detail}</p>
    </div>
  );
}

function CompletionChecklist({ items }: { items: Array<{ label: string; done: boolean }> }) {
  return (
    <div className="space-y-2">
      {items.map(item => (
        <div key={item.label} className="flex items-center justify-between gap-2 text-xs">
          <span className="text-gray-600">{item.label}</span>
          <span className={`rounded-full px-2 py-0.5 font-medium ${item.done ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            {item.done ? 'Done' : 'Missing'}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ReviewMode() {
  const papers = usePaperStore(s => s.papers);
  const tracking = useTrackingStore(s => s.tracking);
  const toggleRead = useTrackingStore(s => s.toggleRead);
  const setPriority = useTrackingStore(s => s.setPriority);
  const setRelevance = useTrackingStore(s => s.setRelevance);
  const setTakeaway = useTrackingStore(s => s.setTakeaway);
  const setTrialData = useTrackingStore(s => s.setTrialData);

  const [deck, setDeck] = useState<StudyDeck>('smart');
  const [task, setTask] = useState<StudyTask>('recall');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [shuffled, setShuffled] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(1);
  const [takeawayDraftState, setTakeawayDraftState] = useState({ pmid: '', value: '' });
  const [actionMessage, setActionMessage] = useState('');

  const deckStats = useMemo(() => {
    const trialCount = papers.filter(paper => isTrialLike(paper, tracking[paper.pmid])).length;
    const markedCount = papers.filter(paper => hasUsefulTracking(tracking[paper.pmid])).length;
    const missingTakeaway = papers.filter(paper => {
      const t = tracking[paper.pmid];
      const profile = getPaperImpactProfile(paper, t);
      return profile.level !== 'low' && !t?.takeaway?.trim();
    }).length;
    const visualCount = papers.filter(paper => hasVisualizableTrialResults(tracking[paper.pmid]?.trialData)).length;

    return { trialCount, markedCount, missingTakeaway, visualCount };
  }, [papers, tracking]);

  const reviewPapers = useMemo(() => {
    const enriched = papers.map(paper => {
      const t = tracking[paper.pmid];
      return {
        paper,
        tracking: t,
        profile: getPaperImpactProfile(paper, t),
        trialLike: isTrialLike(paper, t),
      };
    });

    let filtered = enriched.filter(item => {
      switch (deck) {
        case 'trials':
          return item.trialLike;
        case 'gaps':
          return (item.profile.level !== 'low' && !item.tracking?.takeaway?.trim()) ||
            (item.trialLike && !hasRecordedTrialData(item.tracking));
        case 'marked':
          return hasUsefulTracking(item.tracking);
        case 'read':
          return item.tracking?.isRead;
        case 'starred':
          return (item.tracking?.rating ?? 0) >= 4;
        default:
          return item.profile.level !== 'low' || item.trialLike || hasUsefulTracking(item.tracking);
      }
    });

    if (deck === 'smart' && filtered.length === 0) {
      filtered = enriched
        .sort((a, b) => b.profile.score - a.profile.score)
        .slice(0, 40);
    }

    const sorted = [...filtered].sort((a, b) => {
      if (shuffled) {
        return seededShuffleScore(a.paper.pmid, shuffleSeed) - seededShuffleScore(b.paper.pmid, shuffleSeed);
      }
      const scoreDiff = b.profile.score - a.profile.score;
      if (scoreDiff !== 0) return scoreDiff;
      return b.paper.pubDate.localeCompare(a.paper.pubDate);
    });

    return sorted.map(item => item.paper);
  }, [papers, tracking, deck, shuffled, shuffleSeed]);

  const safeIndex = reviewPapers.length > 0 ? Math.min(currentIndex, reviewPapers.length - 1) : 0;
  const currentPaper = reviewPapers[safeIndex];
  const currentTracking = currentPaper ? tracking[currentPaper.pmid] : undefined;
  const currentProfile = currentPaper ? getPaperImpactProfile(currentPaper, currentTracking) : undefined;
  const category = currentPaper ? classifyPaper(currentPaper.pubTypes) : undefined;
  const trialData = currentTracking?.trialData;
  const trialLike = currentPaper ? isTrialLike(currentPaper, currentTracking) : false;
  const hasTrialData = hasRecordedTrialData(currentTracking);
  const extractedTrialData = currentPaper ? extractTrialDataFromPaper(currentPaper) : undefined;
  const items = currentPaper ? completionItems(currentPaper, currentTracking) : [];
  const completionPercent = items.length > 0
    ? Math.round((items.filter(item => item.done).length / items.length) * 100)
    : 0;
  const currentPmid = currentPaper?.pmid ?? '';
  const takeawayDraft = takeawayDraftState.pmid === currentPmid
    ? takeawayDraftState.value
    : currentTracking?.takeaway ?? '';
  const updateTakeawayDraft = (value: string) => {
    setTakeawayDraftState({ pmid: currentPmid, value });
  };

  const resetDeck = (nextDeck: StudyDeck) => {
    setDeck(nextDeck);
    setCurrentIndex(0);
    setRevealed(false);
  };

  const resetTask = (nextTask: StudyTask) => {
    setTask(nextTask);
    setRevealed(false);
  };

  const goNext = useCallback(() => {
    setRevealed(false);
    setActionMessage('');
    setCurrentIndex(Math.min(safeIndex + 1, reviewPapers.length - 1));
  }, [reviewPapers.length, safeIndex]);

  const goPrev = useCallback(() => {
    setRevealed(false);
    setActionMessage('');
    setCurrentIndex(Math.max(safeIndex - 1, 0));
  }, [safeIndex]);

  const handleShuffle = () => {
    const nextShuffled = !shuffled;
    setShuffled(nextShuffled);
    if (nextShuffled) setShuffleSeed(Date.now());
    setCurrentIndex(0);
    setRevealed(false);
  };

  const saveCurrentTakeaway = () => {
    if (!currentPaper) return;
    setTakeaway(currentPaper.pmid, takeawayDraft.trim());
    setActionMessage('Takeaway saved.');
  };

  const markCurrentRead = () => {
    if (!currentPaper || currentTracking?.isRead) return;
    toggleRead(currentPaper.pmid);
    setActionMessage('Marked as read.');
  };

  const handleAutoFillTrial = () => {
    if (!currentPaper || !extractedTrialData) return;
    if (extractedTrialData.fields.length === 0) {
      setActionMessage('No trial fields found in the abstract.');
      return;
    }

    const merged = mergeTrialDataBlanks(currentTracking?.trialData, extractedTrialData.data);
    if (merged.fields.length === 0) {
      setActionMessage('Existing trial fields were kept.');
      return;
    }

    setTrialData(currentPaper.pmid, merged.data);
    setActionMessage(
      `Filled ${merged.fields
        .slice(0, 3)
        .map(field => TRIAL_FIELD_LABELS[field] ?? field)
        .join(', ')}${merged.fields.length > 3 ? ` and ${merged.fields.length - 3} more` : ''}.`
    );
  };

  if (papers.length === 0) {
    return (
      <div className="py-12 text-center">
        <svg className="mx-auto mb-3 h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
        </svg>
        <p className="text-sm text-gray-500">Fetch or load papers to build a study deck.</p>
      </div>
    );
  }

  if (!currentPaper || !currentProfile || !category) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex flex-wrap gap-2">
          {DECKS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => resetDeck(item.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                deck === item.id ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-gray-200 bg-white text-gray-600'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <p className="text-sm text-gray-500">No cards match this deck yet.</p>
        </div>
      </div>
    );
  }

  const prompts = buildStudyPrompts(task, currentPaper, currentTracking);

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Study Mode</h2>
          <p className="text-sm text-gray-500">{TASKS.find(item => item.id === task)?.prompt}</p>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span>{safeIndex + 1} / {reviewPapers.length}</span>
          <button
            type="button"
            onClick={handleShuffle}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              shuffled ? 'border-violet-600 bg-violet-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
            }`}
          >
            Shuffle
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Deck" value={String(reviewPapers.length)} detail={DECKS.find(item => item.id === deck)?.label ?? 'Cards'} />
        <StatTile label="Trial signals" value={String(deckStats.trialCount)} detail="Trials or phase studies" />
        <StatTile label="Needs takeaway" value={String(deckStats.missingTakeaway)} detail="High-value gaps" />
        <StatTile label="Visual results" value={String(deckStats.visualCount)} detail="Trials with plottable data" />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <div className="flex flex-wrap gap-2">
          {TASKS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => resetTask(item.id)}
              className={`rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                task === item.id ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {DECKS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => resetDeck(item.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                deck === item.id ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
        <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 bg-white p-4 sm:p-5">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{currentPaper.journalAbbrev}</span>
              <span className={`rounded-full border px-2 py-0.5 text-xs ${CATEGORY_COLORS[category]}`}>{category}</span>
              <span className="text-xs text-gray-400">{currentPaper.pubDate?.slice(0, 10)}</span>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                currentProfile.level === 'high' ? 'bg-red-50 text-red-700' : currentProfile.level === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {currentProfile.level === 'high' ? 'Read first' : currentProfile.level === 'medium' ? 'Worth scanning' : 'Background'}
              </span>
            </div>

            <h3 className="text-base font-semibold leading-snug text-gray-950 sm:text-lg">
              {currentPaper.title}
            </h3>
            <p className="mt-2 text-xs text-gray-500">{authorLine(currentPaper)}</p>

            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Study prompt</p>
              <ul className="mt-2 space-y-1.5 text-sm text-gray-700">
                {prompts.map(prompt => (
                  <li key={prompt} className="flex gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-500" />
                    <span>{prompt}</span>
                  </li>
                ))}
              </ul>
            </div>

            {!revealed && (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="mt-4 w-full rounded-lg bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-cyan-700 sm:w-auto"
              >
                Reveal Study Notes
              </button>
            )}
          </div>

          {revealed && (
            <div className="space-y-4 bg-gray-50 p-4 sm:p-5">
              {currentTracking?.takeaway && (
                <section>
                  <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Takeaway</h4>
                  <p className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800">
                    {currentTracking.takeaway}
                  </p>
                </section>
              )}

              {hasTrialData && trialData && (
                <section className="space-y-3">
                  <div>
                    <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Trial Card</h4>
                    <TrialDataSummary data={trialData} />
                  </div>
                  {hasVisualizableTrialResults(trialData) && <TrialResultsViz data={trialData} />}
                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    {trialData.experimentalArm && (
                      <p className="rounded-lg border border-gray-200 bg-white px-3 py-2"><span className="font-medium text-gray-500">Experimental:</span> {trialData.experimentalArm}</p>
                    )}
                    {trialData.controlArm && (
                      <p className="rounded-lg border border-gray-200 bg-white px-3 py-2"><span className="font-medium text-gray-500">Control:</span> {trialData.controlArm}</p>
                    )}
                    {trialData.keyToxicities && (
                      <p className="rounded-lg border border-gray-200 bg-white px-3 py-2 sm:col-span-2"><span className="font-medium text-gray-500">Toxicity:</span> {trialData.keyToxicities}</p>
                    )}
                  </div>
                </section>
              )}

              <section>
                <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Abstract Anchors</h4>
                <div className="space-y-2 rounded-lg border border-gray-200 bg-white px-3 py-2">
                  {currentPaper.abstractSections.length > 0 ? (
                    currentPaper.abstractSections.slice(0, 4).map(section => (
                      <p key={`${section.label}-${section.text.slice(0, 16)}`} className="text-xs leading-relaxed text-gray-700">
                        <span className="font-semibold text-gray-500">{section.label}: </span>
                        {section.text}
                      </p>
                    ))
                  ) : (
                    <p className="text-xs leading-relaxed text-gray-700">{currentPaper.abstract}</p>
                  )}
                </div>
              </section>

              {currentTracking?.notes && (
                <section>
                  <h4 className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">Notes</h4>
                  <p className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700">
                    {currentTracking.notes}
                  </p>
                </section>
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={safeIndex === 0}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Previous
            </button>
            <div className="min-w-28">
              <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full rounded-full bg-cyan-600" style={{ width: `${((safeIndex + 1) / reviewPapers.length) * 100}%` }} />
              </div>
            </div>
            <button
              type="button"
              onClick={goNext}
              disabled={safeIndex === reviewPapers.length - 1}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </article>

        <aside className="space-y-4">
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">Card Completion</h3>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">{completionPercent}%</span>
            </div>
            <CompletionChecklist items={items} />
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={markCurrentRead}
                disabled={currentTracking?.isRead}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:bg-gray-200 disabled:text-gray-500"
              >
                {currentTracking?.isRead ? 'Read' : 'Mark read'}
              </button>
              {(['must-read', 'important', 'later', 'reference'] as PaperPriority[]).map(priority => (
                <button
                  key={priority}
                  type="button"
                  onClick={() => { setPriority(currentPaper.pmid, priority); setActionMessage(`${PRIORITY_LABELS[priority]} saved.`); }}
                  className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-medium transition-colors ${
                    currentTracking?.priority === priority ? PRIORITY_COLORS[priority] : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {PRIORITY_LABELS[priority]}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(['practice-changing', 'clinically-relevant', 'hypothesis-generating', 'background'] as ClinicalRelevance[]).map(relevance => (
                <button
                  key={relevance}
                  type="button"
                  onClick={() => { setRelevance(currentPaper.pmid, relevance); setActionMessage(`${RELEVANCE_LABELS[relevance]} saved.`); }}
                  className={`rounded-lg border px-2 py-1.5 text-[11px] font-medium transition-colors ${
                    currentTracking?.relevance === relevance ? RELEVANCE_COLORS[relevance] : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {RELEVANCE_LABELS[relevance]}
                </button>
              ))}
            </div>
          </section>

          {trialLike && (
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900">Trial Assist</h3>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {trialCompleteness(trialData)}%
                </span>
              </div>
              <button
                type="button"
                onClick={handleAutoFillTrial}
                className="w-full rounded-lg bg-cyan-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-cyan-700"
              >
                Auto-fill blank trial fields
              </button>
              {extractedTrialData && extractedTrialData.fields.length > 0 && (
                <p className="mt-2 text-xs text-gray-500">
                  Found: {extractedTrialData.fields.slice(0, 4).map(field => TRIAL_FIELD_LABELS[field] ?? field).join(', ')}
                  {extractedTrialData.fields.length > 4 ? ` and ${extractedTrialData.fields.length - 4} more` : ''}
                </p>
              )}
            </section>
          )}

          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Takeaway Composer</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={() => updateTakeawayDraft(buildTemplate('pico', currentPaper, currentTracking))} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200">
                PICO
              </button>
              <button type="button" onClick={() => updateTakeawayDraft(buildTemplate('practice', currentPaper, currentTracking))} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200">
                Practice point
              </button>
              <button type="button" onClick={() => updateTakeawayDraft(buildTemplate('safety', currentPaper, currentTracking))} className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-200">
                Safety
              </button>
            </div>
            <textarea
              value={takeawayDraft}
              onChange={(event) => updateTakeawayDraft(event.target.value)}
              rows={5}
              className="mt-3 w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder:text-gray-300 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              placeholder="One memorable clinical takeaway..."
            />
            <button
              type="button"
              onClick={saveCurrentTakeaway}
              className="mt-2 w-full rounded-lg bg-gray-900 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gray-800"
            >
              Save takeaway
            </button>
            {actionMessage && (
              <p className="mt-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                {actionMessage}
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
