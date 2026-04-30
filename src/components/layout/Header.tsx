import { useState } from 'react';
import { usePaperStore } from '../../stores/paperStore';
import { useTrackingStore } from '../../stores/trackingStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { useAuthStore } from '../../stores/authStore';
import { exportPapersAsCsv } from '../../utils/exportCsv';
import { subWeeks } from 'date-fns';
import type { Collection } from '../../utils/queryBuilder';

interface HeaderProps {
  onOpenSettings: () => void;
  activeCollection: Collection;
  onCollectionChange: (c: Collection) => void;
}

const COLLECTION_CONFIG: Record<Collection, { label: string; shortLabel: string; color: string; activeColor: string }> = {
  'thoracic': {
    label: 'Thoracic Oncology',
    shortLabel: 'Thoracic',
    color: 'border-cyan-200 text-cyan-700 bg-cyan-50 hover:bg-cyan-100',
    activeColor: 'border-cyan-600 bg-cyan-600 text-white',
  },
  'acute-oncology': {
    label: 'Acute Oncology',
    shortLabel: 'Acute Onc',
    color: 'border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100',
    activeColor: 'border-orange-600 bg-orange-600 text-white',
  },
};

export function Header({ onOpenSettings, activeCollection, onCollectionChange }: HeaderProps) {
  const { isLoading, progressMessage, lastFetchedAt, papers, fetchPapers } = usePaperStore();
  const tracking = useTrackingStore(s => s.tracking);
  const journals = useSettingsStore(s => s.journals);
  const acuteJournals = useSettingsStore(s => s.acuteJournals);
  const { user, syncStatus } = useAuthStore();

  const [weeksBack, setWeeksBack] = useState(4);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const readCount = papers.filter(p => tracking[p.pmid]?.isRead).length;
  const totalCount = papers.length;
  const newestPaperDate = papers.reduce<string | null>(
    (latest, paper) => (!latest || paper.pubDate > latest ? paper.pubDate : latest),
    null
  );

  const handleFetch = () => {
    const now = new Date();
    const from = subWeeks(now, weeksBack);
    const journalList = activeCollection === 'acute-oncology' ? acuteJournals : journals;
    fetchPapers(from, now, journalList, activeCollection);
  };

  const handleExport = () => {
    if (papers.length === 0) return;
    exportPapersAsCsv(papers, tracking);
  };

  const lastFetchDisplay = lastFetchedAt
    ? new Date(lastFetchedAt).toLocaleString()
    : 'Never';
  const newestPaperDisplay = newestPaperDate
    ? new Date(`${newestPaperDate}T00:00:00`).toLocaleDateString()
    : 'None';

  const collConfig = COLLECTION_CONFIG[activeCollection];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          {/* Title and stats */}
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold text-gray-900 truncate">
              {collConfig.label} Lit Review
            </h1>
            <div className="flex items-center gap-2 sm:gap-3 mt-0.5 text-[11px] sm:text-xs text-gray-500">
              <span>{totalCount} papers</span>
              <span className="text-gray-300">|</span>
              <span className="text-green-600">{readCount} read</span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="hidden sm:inline">{totalCount - readCount} unread</span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="hidden sm:inline">Newest: {newestPaperDisplay}</span>
              <span className="hidden sm:inline text-gray-300">|</span>
              <span className="hidden sm:inline">Last fetch: {lastFetchDisplay}</span>
            </div>
          </div>

          {/* Desktop fetch controls */}
          <div className="hidden sm:flex items-center gap-2">
            {/* Collection toggle */}
            <div className="flex items-center rounded-lg overflow-hidden">
              {(Object.keys(COLLECTION_CONFIG) as Collection[]).map(coll => {
                const cfg = COLLECTION_CONFIG[coll];
                return (
                  <button
                    key={coll}
                    type="button"
                    onClick={() => onCollectionChange(coll)}
                    className={`px-3 py-1.5 text-xs font-medium border transition-colors ${
                      activeCollection === coll ? cfg.activeColor : cfg.color
                    }`}
                  >
                    {cfg.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Sync status indicator */}
            {user && (
              <div
                className="p-2 text-gray-400 relative"
                title={syncStatus === 'synced' ? 'Cloud sync active' : syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'error' ? 'Sync error' : 'Not syncing'}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
                </svg>
                <span className={`absolute top-1.5 right-1.5 inline-block h-2.5 w-2.5 rounded-full border-2 border-white ${
                  syncStatus === 'synced' ? 'bg-green-500' :
                  syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' :
                  syncStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                }`} />
              </div>
            )}

            {papers.length > 0 && (
              <button
                type="button"
                onClick={handleExport}
                title="Export as CSV"
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenSettings}
              title="Settings"
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            <select
              value={weeksBack}
              onChange={(e) => setWeeksBack(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white text-gray-600 focus:border-cyan-500 focus:outline-none"
              disabled={isLoading}
            >
              <option value={1}>Last week</option>
              <option value={2}>Last 2 weeks</option>
              <option value={4}>Last 4 weeks</option>
              <option value={8}>Last 8 weeks</option>
              <option value={12}>Last 12 weeks</option>
            </select>
            <button
              type="button"
              onClick={handleFetch}
              disabled={isLoading}
              className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                activeCollection === 'acute-oncology'
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-cyan-600 hover:bg-cyan-700'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Fetching...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                  </svg>
                  Fetch Papers
                </>
              )}
            </button>
          </div>

          {/* Mobile action buttons */}
          <div className="flex sm:hidden items-center gap-1">
            <button
              type="button"
              onClick={handleFetch}
              disabled={isLoading}
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                activeCollection === 'acute-oncology'
                  ? 'bg-orange-600'
                  : 'bg-cyan-600'
              }`}
            >
              {isLoading ? (
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                </svg>
              )}
              Fetch
            </button>
            <button
              type="button"
              onClick={onOpenSettings}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile expanded menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden mt-3 pt-3 border-t border-gray-100 space-y-3">
            {/* Collection toggle mobile */}
            <div className="flex items-center gap-2">
              {(Object.keys(COLLECTION_CONFIG) as Collection[]).map(coll => {
                const cfg = COLLECTION_CONFIG[coll];
                return (
                  <button
                    key={coll}
                    type="button"
                    onClick={() => onCollectionChange(coll)}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${
                      activeCollection === coll ? cfg.activeColor : cfg.color
                    }`}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>

            <div className="text-xs text-gray-500">
              Newest paper: {newestPaperDisplay}
            </div>
            <div className="text-xs text-gray-500">
              Last fetch: {lastFetchDisplay}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={weeksBack}
                onChange={(e) => setWeeksBack(Number(e.target.value))}
                className="text-sm border border-gray-200 rounded-lg px-2 py-2 bg-white text-gray-600 focus:border-cyan-500 focus:outline-none flex-1"
                disabled={isLoading}
              >
                <option value={1}>Last week</option>
                <option value={2}>Last 2 weeks</option>
                <option value={4}>Last 4 weeks</option>
                <option value={8}>Last 8 weeks</option>
                <option value={12}>Last 12 weeks</option>
              </select>
              <button
                type="button"
                onClick={() => { handleFetch(); setMobileMenuOpen(false); }}
                disabled={isLoading}
                className={`flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                  activeCollection === 'acute-oncology'
                    ? 'bg-orange-600 hover:bg-orange-700'
                    : 'bg-cyan-600 hover:bg-cyan-700'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Fetching...
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
                    </svg>
                    Fetch
                  </>
                )}
              </button>
            </div>
            {papers.length > 0 && (
              <button
                type="button"
                onClick={() => { handleExport(); setMobileMenuOpen(false); }}
                className="flex items-center gap-2 text-sm text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Export as CSV
              </button>
            )}
          </div>
        )}

        {/* Progress bar */}
        {progressMessage && (
          <div className="mt-3 flex items-center gap-2 text-xs text-cyan-600 bg-cyan-50 px-3 py-2 rounded-lg">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
            {progressMessage}
          </div>
        )}
      </div>
    </header>
  );
}
