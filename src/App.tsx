import { useEffect, useRef, useState } from 'react';
import { usePaperStore } from './stores/paperStore';
import { useReadingListStore } from './stores/readingListStore';
import { useAuthStore } from './stores/authStore';
import { useSettingsStore } from './stores/settingsStore';
import { startSync } from './services/firestoreSync';
import { useFilteredPapers } from './hooks/useFilteredPapers';
import { Header } from './components/layout/Header';
import { FilterBar } from './components/filters/FilterBar';
import { PaperList } from './components/papers/PaperList';
import { PriorityQueue } from './components/priority/PriorityQueue';
import { InsightsPanel } from './components/insights/InsightsPanel';
import { WeeklyView } from './components/weekly/WeeklyView';
import { ArticleSearch } from './components/search/ArticleSearch';
import { ReadingListView } from './components/search/ReadingListView';
import { ReviewMode } from './components/review/ReviewMode';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { StatsPanel } from './components/dashboard/StatsPanel';
import type { Collection } from './utils/queryBuilder';

type ViewMode = 'priority' | 'insights' | 'list' | 'weekly' | 'search' | 'reading-list' | 'review';

const NAV_ITEMS: { id: ViewMode; label: string; mobileLabel: string; icon: React.ReactNode }[] = [
  {
    id: 'priority',
    label: 'Priority',
    mobileLabel: 'Top',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.75l2.142 4.339 4.79.696-3.466 3.378.818 4.771L12 14.681l-4.284 2.253.818-4.771-3.466-3.378 4.79-.696L12 3.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75v1.5m-5.25-1.5l-1.061 1.061m11.561-1.061l1.061 1.061" />
      </svg>
    ),
  },
  {
    id: 'insights',
    label: 'Insights',
    mobileLabel: 'Charts',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    id: 'list',
    label: 'List',
    mobileLabel: 'List',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  },
  {
    id: 'weekly',
    label: 'Weekly',
    mobileLabel: 'Weekly',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
  },
  {
    id: 'search',
    label: 'Search PubMed',
    mobileLabel: 'Search',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    ),
  },
  {
    id: 'reading-list',
    label: 'Reading List',
    mobileLabel: 'Saved',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
      </svg>
    ),
  },
  {
    id: 'review',
    label: 'Study Mode',
    mobileLabel: 'Study',
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
      </svg>
    ),
  },
];

function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('priority');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [activeCollection, setActiveCollection] = useState<Collection>('thoracic');
  const loadCachedPapers = usePaperStore(s => s.loadCachedPapers);
  const journals = useSettingsStore(s => s.journals);
  const acuteJournals = useSettingsStore(s => s.acuteJournals);
  const error = usePaperStore(s => s.error);
  const clearError = usePaperStore(s => s.clearError);
  const isLoading = usePaperStore(s => s.isLoading);
  const papers = usePaperStore(s => s.papers);
  const readingListCount = useReadingListStore(s => s.pmids.length);
  const user = useAuthStore(s => s.user);

  const filteredPapers = useFilteredPapers();
  const stopSyncRef = useRef<(() => void) | null>(null);

  const handleCollectionChange = (coll: Collection) => {
    setActiveCollection(coll);
    const journalList = coll === 'acute-oncology' ? acuteJournals : journals;
    const abbrevs = journalList.map(j => j.abbrev);
    loadCachedPapers(abbrevs);
  };

  // Load cached papers on mount, filtered by the current collection.
  useEffect(() => {
    const journalList = activeCollection === 'acute-oncology' ? acuteJournals : journals;
    loadCachedPapers(journalList.map(j => j.abbrev));
  }, [activeCollection, acuteJournals, journals, loadCachedPapers]);

  // Start/stop Firestore sync when auth state changes
  useEffect(() => {
    if (user) {
      stopSyncRef.current = startSync(user.uid);
    } else {
      stopSyncRef.current?.();
      stopSyncRef.current = null;
    }
    return () => {
      stopSyncRef.current?.();
      stopSyncRef.current = null;
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0">
      <Header
        onOpenSettings={() => setSettingsOpen(true)}
        activeCollection={activeCollection}
        onCollectionChange={handleCollectionChange}
      />
      <SettingsPanel isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} activeCollection={activeCollection} />

      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-6">
        {/* Error banner */}
        {error && (
          <div className="mb-4 flex items-center justify-between bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <span>{error}</span>
            <button
              type="button"
              onClick={clearError}
              className="text-red-500 hover:text-red-700"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Desktop tab navigation */}
        <div className="hidden sm:flex items-center gap-1 mb-5 border-b border-gray-200">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setViewMode(item.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                viewMode === item.id
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {item.icon}
              {item.label}
              {item.id === 'reading-list' && readingListCount > 0 && (
                <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-cyan-100 text-cyan-700">
                  {readingListCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Paper views: stats, filters, count */}
        {(viewMode === 'list' || viewMode === 'weekly') && (
          <>
            <StatsPanel />
            <div className="mb-4">
              <FilterBar />
            </div>
            <p className="text-sm text-gray-500 mb-3">
              Showing {filteredPapers.length} of {papers.length} papers
            </p>
          </>
        )}

        {/* Content */}
        {viewMode === 'priority' && (
          isLoading && papers.length === 0
            ? <LoadingSpinner message="Loading papers..." />
            : <PriorityQueue />
        )}
        {viewMode === 'insights' && (
          isLoading && papers.length === 0
            ? <LoadingSpinner message="Loading papers..." />
            : <InsightsPanel />
        )}
        {viewMode === 'search' && <ArticleSearch />}
        {viewMode === 'reading-list' && <ReadingListView />}
        {viewMode === 'review' && <ReviewMode />}
        {viewMode === 'list' && (
          isLoading && papers.length === 0
            ? <LoadingSpinner message="Loading papers..." />
            : <PaperList papers={filteredPapers} />
        )}
        {viewMode === 'weekly' && (
          isLoading && papers.length === 0
            ? <LoadingSpinner message="Loading papers..." />
            : <WeeklyView papers={filteredPapers} />
        )}
      </main>

      {/* Mobile bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-[env(safe-area-inset-bottom)] sm:hidden z-20">
        <div className="grid grid-cols-7">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setViewMode(item.id)}
              className={`relative flex min-w-0 flex-col items-center gap-0.5 px-1 py-2 text-[10px] leading-none transition-colors ${
                viewMode === item.id
                  ? 'text-cyan-600'
                  : 'text-gray-400'
              }`}
            >
              {item.icon}
              <span className="w-full truncate text-center">{item.mobileLabel}</span>
              {item.id === 'reading-list' && readingListCount > 0 && (
                <span className="absolute -top-0.5 right-0.5 bg-cyan-600 text-white text-[10px] min-w-[16px] h-4 flex items-center justify-center rounded-full px-1">
                  {readingListCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default App;
