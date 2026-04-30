import { create } from 'zustand';
import type { Paper } from '../types/paper';
import { fetchPapersForDateRange } from '../services/pubmedApi';
import { getCachedPapers } from '../services/paperCache';
import { formatDateISO } from '../utils/dateUtils';
import type { JournalInfo } from '../constants/journals';
import type { Collection } from '../utils/queryBuilder';

interface PaperStore {
  papers: Paper[];
  isLoading: boolean;
  error: string | null;
  progressMessage: string | null;
  lastFetchedAt: string | null;
  activeDateFrom: string | null;
  activeDateTo: string | null;
  activeJournalAbbrevs: string[];

  fetchPapers: (from: Date, to: Date, journals?: JournalInfo[], collection?: Collection) => Promise<void>;
  loadCachedPapers: (journalAbbrevs?: string[]) => Promise<void>;
  setActiveJournals: (abbrevs: string[]) => void;
  clearError: () => void;
}

function filterByDateRange(papers: Paper[], from: string | null, to: string | null): Paper[] {
  let result = papers;
  if (from) result = result.filter(p => p.pubDate >= from);
  if (to) result = result.filter(p => p.pubDate <= to);
  return result;
}

export const usePaperStore = create<PaperStore>((set, get) => ({
  papers: [],
  isLoading: false,
  error: null,
  progressMessage: null,
  lastFetchedAt: localStorage.getItem('thoracic-lit-last-fetch'),
  activeDateFrom: null,
  activeDateTo: null,
  activeJournalAbbrevs: [],

  fetchPapers: async (from: Date, to: Date, journals?: JournalInfo[], collection?: Collection) => {
    const journalAbbrevs = journals ? journals.map(j => j.abbrev) : [];
    const dateFromISO = formatDateISO(from);
    const dateToISO = formatDateISO(to);

    set({
      isLoading: true,
      error: null,
      progressMessage: 'Starting fetch...',
      activeDateFrom: dateFromISO,
      activeDateTo: dateToISO,
    });

    try {
      const newPapers = await fetchPapersForDateRange(
        from,
        to,
        (msg) => set({ progressMessage: msg }),
        journals,
        collection
      );

      // Load ALL cached papers, then filter to active range and journals for display
      const cached = await getCachedPapers();
      const paperMap = new Map<string, Paper>();
      for (const p of cached) paperMap.set(p.pmid, p);
      for (const p of newPapers) paperMap.set(p.pmid, p);

      let allPapersArr = Array.from(paperMap.values());

      // Filter by active journals if set
      if (journalAbbrevs.length > 0) {
        const abbrevSet = new Set(journalAbbrevs);
        allPapersArr = allPapersArr.filter(p => abbrevSet.has(p.journalAbbrev));
      }

      const allInRange = filterByDateRange(
        allPapersArr,
        dateFromISO,
        dateToISO
      ).sort((a, b) => b.pubDate.localeCompare(a.pubDate));

      const now = new Date().toISOString();
      localStorage.setItem('thoracic-lit-last-fetch', now);

      set({
        papers: allInRange,
        isLoading: false,
        progressMessage: null,
        lastFetchedAt: now,
        activeJournalAbbrevs: journalAbbrevs,
      });
    } catch (err) {
      const message = err instanceof TypeError
        ? 'Could not reach PubMed. Check the phone network connection, disable content blockers for this site, then try Fetch again.'
        : err instanceof Error
          ? err.message
          : 'Failed to fetch papers';

      set({
        isLoading: false,
        progressMessage: null,
        error: message,
      });
    }
  },

  loadCachedPapers: async (journalAbbrevs?: string[]) => {
    try {
      const cached = await getCachedPapers();
      const { activeDateFrom, activeDateTo, activeJournalAbbrevs } = get();
      const abbrevs = journalAbbrevs ?? activeJournalAbbrevs;

      let filtered = filterByDateRange(cached, activeDateFrom, activeDateTo);
      if (abbrevs.length > 0) {
        const abbrevSet = new Set(abbrevs);
        filtered = filtered.filter(p => abbrevSet.has(p.journalAbbrev));
      }
      const sorted = filtered.sort((a, b) => b.pubDate.localeCompare(a.pubDate));
      set({ papers: sorted, activeJournalAbbrevs: abbrevs });
    } catch (err) {
      console.error('Failed to load cached papers:', err);
    }
  },

  setActiveJournals: (abbrevs: string[]) => {
    set({ activeJournalAbbrevs: abbrevs });
  },

  clearError: () => set({ error: null }),
}));
