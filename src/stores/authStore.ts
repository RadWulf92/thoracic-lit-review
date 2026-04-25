import { create } from 'zustand';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface AuthStore {
  user: User | null;
  loading: boolean;
  syncStatus: SyncStatus;
  setSyncStatus: (status: SyncStatus) => void;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()((set) => ({
  user: null,
  loading: true,
  syncStatus: 'idle',

  setSyncStatus: (syncStatus: SyncStatus) => set({ syncStatus }),

  signIn: async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  },

  signOut: async () => {
    try {
      await firebaseSignOut(auth);
      set({ syncStatus: 'idle' });
    } catch (error) {
      console.error('Sign-out failed:', error);
    }
  },
}));

// Initialize auth state listener (runs once on import)
onAuthStateChanged(auth, (user) => {
  useAuthStore.setState({ user, loading: false });
});
