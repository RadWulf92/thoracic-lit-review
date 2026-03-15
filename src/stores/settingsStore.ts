import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TARGET_JOURNALS, type JournalInfo } from '../constants/journals';

interface SettingsStore {
  journals: JournalInfo[];

  addJournal: (journal: JournalInfo) => void;
  removeJournal: (abbrev: string) => void;
  resetJournals: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      journals: [...TARGET_JOURNALS],

      addJournal: (journal: JournalInfo) => {
        set(state => {
          if (state.journals.some(j => j.abbrev === journal.abbrev)) return state;
          return { journals: [...state.journals, journal] };
        });
      },

      removeJournal: (abbrev: string) => {
        set(state => ({
          journals: state.journals.filter(j => j.abbrev !== abbrev),
        }));
      },

      resetJournals: () => {
        set({ journals: [...TARGET_JOURNALS] });
      },
    }),
    {
      name: 'thoracic-lit-settings',
    }
  )
);
