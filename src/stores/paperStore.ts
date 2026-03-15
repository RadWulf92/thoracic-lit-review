import { create } from 'zustand';
import type { Paper } from '../types/paper';
import { fetchPapersForDateRange } from '../services/pubmedApi';
import { getCachedPapers } from '../services/paperCache';
import { formatDateISO } from '../utils/dateUtils';
import type { JournalInfo } from '../constants/journals';

interface PaperStore {
  papers: Paper[];
  isLoading: boolean;
  error: string | null;
  progressMessage: string | null;
  lastFetchedAt: string | null;
  activeDateFrom: string | null;
  activeDateTo: string | null;

  fetchPapers: (from: Date, to: Date, journals?: JournalInfo[]) => Promise<void>;
  loadCachedPapers: () => Promise<void>;
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

  fetchPapers: async (from: Date, to: Date, journals?: JournalInfo[]) => {
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
        journals
      );

      // Load ALL cached papers, then filter to active range for display
      const cached = await getCachedPapers();
      const paperMap = new Map<string, Paper>();
      for (const p of cached) paperMap.set(p.pmid, p);
      for (const p of newPapers) paperMap.set(p.pmid, p);

      const allInRange = filterByDateRange(
        Array.from(paperMap.values()),
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
      });
    } catch (err) {
      set({
        isLoading: false,
        progressMessage: null,
        error: err instanceof Error ? err.message : 'Failed to fetch papers',
      });
    }
  },

  loadCachedPapers: async () => {
    try {
      const cached = await getCachedPapers();
      const { activeDateFrom, activeDateTo } = get();
      const filtered = filterByDateRange(cached, activeDateFrom, activeDateTo);
      const sorted = filtered.sort((a, b) => b.pubDate.localeCompare(a.pubDate));
      set({ papers: sorted });
    } catch (err) {
      console.error('Failed to load cached papers:', err);
    }
  },

  clearError: () => set({ error: null }),
}));
