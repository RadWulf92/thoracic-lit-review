import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ReadingListStore {
  pmids: string[];
  addToReadingList: (pmid: string) => void;
  removeFromReadingList: (pmid: string) => void;
  isInReadingList: (pmid: string) => boolean;
  clearReadingList: () => void;
}

export const useReadingListStore = create<ReadingListStore>()(
  persist(
    (set, get) => ({
      pmids: [],

      addToReadingList: (pmid: string) => {
        set(state => {
          if (state.pmids.includes(pmid)) return state;
          return { pmids: [...state.pmids, pmid] };
        });
      },

      removeFromReadingList: (pmid: string) => {
        set(state => ({
          pmids: state.pmids.filter(id => id !== pmid),
        }));
      },

      isInReadingList: (pmid: string) => {
        return get().pmids.includes(pmid);
      },

      clearReadingList: () => set({ pmids: [] }),
    }),
    {
      name: 'thoracic-lit-reading-list',
    }
  )
);
