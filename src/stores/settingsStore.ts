import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TARGET_JOURNALS, ACUTE_ONCOLOGY_JOURNALS, type JournalInfo } from '../constants/journals';

interface SettingsStore {
  journals: JournalInfo[];
  acuteJournals: JournalInfo[];

  addJournal: (journal: JournalInfo) => void;
  removeJournal: (abbrev: string) => void;
  resetJournals: () => void;

  addAcuteJournal: (journal: JournalInfo) => void;
  removeAcuteJournal: (abbrev: string) => void;
  resetAcuteJournals: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      journals: [...TARGET_JOURNALS],
      acuteJournals: [...ACUTE_ONCOLOGY_JOURNALS],

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

      addAcuteJournal: (journal: JournalInfo) => {
        set(state => {
          if (state.acuteJournals.some(j => j.abbrev === journal.abbrev)) return state;
          return { acuteJournals: [...state.acuteJournals, journal] };
        });
      },

      removeAcuteJournal: (abbrev: string) => {
        set(state => ({
          acuteJournals: state.acuteJournals.filter(j => j.abbrev !== abbrev),
        }));
      },

      resetAcuteJournals: () => {
        set({ acuteJournals: [...ACUTE_ONCOLOGY_JOURNALS] });
      },
    }),
    {
      name: 'thoracic-lit-settings',
    }
  )
);
