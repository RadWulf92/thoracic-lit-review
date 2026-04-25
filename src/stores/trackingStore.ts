import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PaperTracking, ClinicalRelevance, PaperPriority, TrialData } from '../types/paper';
import { STORAGE_KEYS } from '../constants/config';

interface TrackingStore {
  tracking: Record<string, PaperTracking>;

  toggleRead: (pmid: string) => void;
  setRating: (pmid: string, rating: number) => void;
  updateNotes: (pmid: string, notes: string) => void;
  addTag: (pmid: string, tag: string) => void;
  removeTag: (pmid: string, tag: string) => void;
  setRelevance: (pmid: string, relevance: ClinicalRelevance | undefined) => void;
  setPriority: (pmid: string, priority: PaperPriority | undefined) => void;
  setTakeaway: (pmid: string, takeaway: string) => void;
  setTrialData: (pmid: string, trialData: TrialData) => void;
  getTracking: (pmid: string) => PaperTracking;
  getAllTags: () => string[];
}

function defaultTracking(pmid: string): PaperTracking {
  return {
    pmid,
    isRead: false,
    rating: 0,
    notes: '',
    tags: [],
    relevance: undefined,
    takeaway: '',
  };
}

export const useTrackingStore = create<TrackingStore>()(
  persist(
    (set, get) => ({
      tracking: {},

      toggleRead: (pmid: string) => {
        set(state => {
          const existing = state.tracking[pmid] ?? defaultTracking(pmid);
          const isRead = !existing.isRead;
          return {
            tracking: {
              ...state.tracking,
              [pmid]: {
                ...existing,
                isRead,
                readAt: isRead ? new Date().toISOString() : undefined,
                readStatusUpdatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      setRating: (pmid: string, rating: number) => {
        set(state => {
          const existing = state.tracking[pmid] ?? defaultTracking(pmid);
          return {
            tracking: {
              ...state.tracking,
              [pmid]: {
                ...existing,
                rating,
                ratedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      updateNotes: (pmid: string, notes: string) => {
        set(state => {
          const existing = state.tracking[pmid] ?? defaultTracking(pmid);
          return {
            tracking: {
              ...state.tracking,
              [pmid]: {
                ...existing,
                notes,
                notesUpdatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      addTag: (pmid: string, tag: string) => {
        const normalized = tag.trim().toLowerCase();
        if (!normalized) return;
        set(state => {
          const existing = state.tracking[pmid] ?? defaultTracking(pmid);
          const tags = existing.tags ?? [];
          if (tags.includes(normalized)) return state;
          return {
            tracking: {
              ...state.tracking,
              [pmid]: {
                ...existing,
                tags: [...tags, normalized],
                tagsUpdatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      removeTag: (pmid: string, tag: string) => {
        set(state => {
          const existing = state.tracking[pmid] ?? defaultTracking(pmid);
          const tags = existing.tags ?? [];
          return {
            tracking: {
              ...state.tracking,
              [pmid]: {
                ...existing,
                tags: tags.filter(t => t !== tag),
                tagsUpdatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      setRelevance: (pmid: string, relevance: ClinicalRelevance | undefined) => {
        set(state => {
          const existing = state.tracking[pmid] ?? defaultTracking(pmid);
          return {
            tracking: {
              ...state.tracking,
              [pmid]: {
                ...existing,
                relevance,
                relevanceUpdatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      setPriority: (pmid: string, priority: PaperPriority | undefined) => {
        set(state => {
          const existing = state.tracking[pmid] ?? defaultTracking(pmid);
          return {
            tracking: {
              ...state.tracking,
              [pmid]: {
                ...existing,
                priority,
                priorityUpdatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      setTakeaway: (pmid: string, takeaway: string) => {
        set(state => {
          const existing = state.tracking[pmid] ?? defaultTracking(pmid);
          return {
            tracking: {
              ...state.tracking,
              [pmid]: {
                ...existing,
                takeaway,
                takeawayUpdatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      setTrialData: (pmid: string, trialData: TrialData) => {
        set(state => {
          const existing = state.tracking[pmid] ?? defaultTracking(pmid);
          return {
            tracking: {
              ...state.tracking,
              [pmid]: {
                ...existing,
                trialData: {
                  ...trialData,
                  trialDataUpdatedAt: new Date().toISOString(),
                },
                trialDataUpdatedAt: new Date().toISOString(),
              },
            },
          };
        });
      },

      getTracking: (pmid: string) => {
        return get().tracking[pmid] ?? defaultTracking(pmid);
      },

      getAllTags: () => {
        const allTags = new Set<string>();
        for (const t of Object.values(get().tracking)) {
          for (const tag of (t.tags ?? [])) {
            allTags.add(tag);
          }
        }
        return Array.from(allTags).sort();
      },
    }),
    {
      name: STORAGE_KEYS.tracking,
    }
  )
);
