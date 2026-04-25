import { doc, setDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';
import { useTrackingStore } from '../stores/trackingStore';
import { useReadingListStore } from '../stores/readingListStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useAuthStore } from '../stores/authStore';
import type { PaperTracking } from '../types/paper';

// Prevents sync loop: when applying remote data, skip writing back to Firestore
let isSyncingFromRemote = false;

// Debounce timers for each document type
const debounceTimers: Record<string, ReturnType<typeof setTimeout>> = {};

function debouncedWrite(key: string, fn: () => void, delayMs = 1500) {
  if (debounceTimers[key]) clearTimeout(debounceTimers[key]);
  debounceTimers[key] = setTimeout(fn, delayMs);
}

/**
 * Merge tracking data without losing separate edits made on different devices.
 */
function mergeTracking(
  local: Record<string, PaperTracking>,
  remote: Record<string, PaperTracking>
): Record<string, PaperTracking> {
  const merged: Record<string, PaperTracking> = {};
  const pmids = new Set([...Object.keys(remote), ...Object.keys(local)]);

  for (const pmid of pmids) {
    const localEntry = local[pmid];
    const remoteEntry = remote[pmid];
    if (localEntry && !remoteEntry) {
      // Only in local — keep it
      merged[pmid] = localEntry;
      continue;
    }

    if (remoteEntry && !localEntry) {
      merged[pmid] = remoteEntry;
      continue;
    }

    if (localEntry && remoteEntry) {
      // Both exist — compare most recent timestamp
      merged[pmid] = mergeTrackingEntry(localEntry, remoteEntry);
    }
  }

  return merged;
}

function timeValue(ts: string | undefined): number {
  if (!ts) return 0;
  const time = new Date(ts).getTime();
  return Number.isNaN(time) ? 0 : time;
}

function mergeField(
  merged: PaperTracking,
  local: PaperTracking,
  remote: PaperTracking,
  field: keyof PaperTracking,
  timestampField: keyof PaperTracking
) {
  const mergedRecord = merged as unknown as Record<string, unknown>;
  const localRecord = local as unknown as Record<string, unknown>;
  const remoteRecord = remote as unknown as Record<string, unknown>;
  const localTime = timeValue(localRecord[timestampField] as string | undefined);
  const remoteTime = timeValue(remoteRecord[timestampField] as string | undefined);
  const localValue = localRecord[field];
  const remoteValue = remoteRecord[field];

  if (localTime > remoteTime) {
    mergedRecord[field] = localValue;
    mergedRecord[timestampField] = localRecord[timestampField];
    return;
  }

  if (remoteTime === 0 && localValue != null && localValue !== '' && (remoteValue == null || remoteValue === '')) {
    mergedRecord[field] = localValue;
  }
}

function mergeTrackingEntry(local: PaperTracking, remote: PaperTracking): PaperTracking {
  const merged: PaperTracking = { ...remote, pmid: remote.pmid || local.pmid };

  mergeField(merged, local, remote, 'isRead', 'readStatusUpdatedAt');
  if (timeValue(local.readStatusUpdatedAt) === 0 && timeValue(remote.readStatusUpdatedAt) === 0) {
    mergeField(merged, local, remote, 'isRead', 'readAt');
  }

  mergeField(merged, local, remote, 'rating', 'ratedAt');
  mergeField(merged, local, remote, 'notes', 'notesUpdatedAt');
  mergeField(merged, local, remote, 'relevance', 'relevanceUpdatedAt');
  mergeField(merged, local, remote, 'priority', 'priorityUpdatedAt');
  mergeField(merged, local, remote, 'takeaway', 'takeawayUpdatedAt');

  const localTagsTime = timeValue(local.tagsUpdatedAt);
  const remoteTagsTime = timeValue(remote.tagsUpdatedAt);
  if (localTagsTime > remoteTagsTime) {
    merged.tags = local.tags ?? [];
    merged.tagsUpdatedAt = local.tagsUpdatedAt;
  } else if (localTagsTime === 0 && remoteTagsTime === 0) {
    merged.tags = Array.from(new Set([...(remote.tags ?? []), ...(local.tags ?? [])])).sort();
  }

  const localTrialTime = Math.max(timeValue(local.trialDataUpdatedAt), timeValue(local.trialData?.trialDataUpdatedAt));
  const remoteTrialTime = Math.max(timeValue(remote.trialDataUpdatedAt), timeValue(remote.trialData?.trialDataUpdatedAt));
  if (localTrialTime > remoteTrialTime) {
    merged.trialData = local.trialData;
    merged.trialDataUpdatedAt = local.trialDataUpdatedAt;
  } else if (remoteTrialTime === 0 && local.trialData && !remote.trialData) {
    merged.trialData = local.trialData;
    merged.trialDataUpdatedAt = local.trialDataUpdatedAt;
  }

  return merged;
}

/**
 * Merge reading lists: union + deduplicate, preserving order (local first).
 */
function mergeReadingList(local: string[], remote: string[]): string[] {
  const set = new Set(local);
  for (const pmid of remote) set.add(pmid);
  return Array.from(set);
}

/**
 * Start two-way sync between Zustand stores and Firestore.
 * Returns a cleanup function to stop syncing.
 */
export function startSync(uid: string): () => void {
  const unsubscribers: Unsubscribe[] = [];
  const zustandUnsubscribers: (() => void)[] = [];
  const isFirstSnapshot: Record<string, boolean> = {
    tracking: true,
    readingList: true,
    settings: true,
  };

  const setSyncStatus = useAuthStore.getState().setSyncStatus;
  setSyncStatus('syncing');

  // ── Tracking sync ──────────────────────────────────────────────────

  const trackingDocRef = doc(db, 'users', uid, 'data', 'tracking');

  // Listen to remote changes
  unsubscribers.push(
    onSnapshot(trackingDocRef, (snap) => {
      if (!snap.exists()) {
        // No remote data yet — upload local data
        const localTracking = useTrackingStore.getState().tracking;
        if (Object.keys(localTracking).length > 0) {
          setDoc(trackingDocRef, { tracking: localTracking, lastModified: new Date().toISOString() });
        }
        isFirstSnapshot.tracking = false;
        setSyncStatus('synced');
        return;
      }

      const remoteData = snap.data();
      const remoteTracking = (remoteData.tracking ?? {}) as Record<string, PaperTracking>;

      isSyncingFromRemote = true;
      try {
        if (isFirstSnapshot.tracking) {
          // First load: merge local + remote
          const localTracking = useTrackingStore.getState().tracking;
          const merged = mergeTracking(localTracking, remoteTracking);
          useTrackingStore.setState({ tracking: merged });
          // Write merged back if it differs from remote
          if (Object.keys(localTracking).length > 0) {
            setDoc(trackingDocRef, { tracking: merged, lastModified: new Date().toISOString() });
          }
          isFirstSnapshot.tracking = false;
        } else {
          // Subsequent updates: apply remote directly
          useTrackingStore.setState({ tracking: remoteTracking });
        }
      } finally {
        isSyncingFromRemote = false;
      }
      setSyncStatus('synced');
    }, (error) => {
      console.error('Tracking sync error:', error);
      setSyncStatus('error');
    })
  );

  // Listen to local changes → push to Firestore
  zustandUnsubscribers.push(
    useTrackingStore.subscribe((state) => {
      if (isSyncingFromRemote) return;
      debouncedWrite('tracking', () => {
        setSyncStatus('syncing');
        setDoc(trackingDocRef, {
          tracking: state.tracking,
          lastModified: new Date().toISOString(),
        }).then(() => setSyncStatus('synced'))
          .catch(() => setSyncStatus('error'));
      });
    })
  );

  // ── Reading List sync ──────────────────────────────────────────────

  const readingListDocRef = doc(db, 'users', uid, 'data', 'readingList');

  unsubscribers.push(
    onSnapshot(readingListDocRef, (snap) => {
      if (!snap.exists()) {
        const localPmids = useReadingListStore.getState().pmids;
        if (localPmids.length > 0) {
          setDoc(readingListDocRef, { pmids: localPmids, lastModified: new Date().toISOString() });
        }
        isFirstSnapshot.readingList = false;
        return;
      }

      const remotePmids = (snap.data().pmids ?? []) as string[];

      isSyncingFromRemote = true;
      try {
        if (isFirstSnapshot.readingList) {
          const localPmids = useReadingListStore.getState().pmids;
          const merged = mergeReadingList(localPmids, remotePmids);
          useReadingListStore.setState({ pmids: merged });
          if (localPmids.length > 0) {
            setDoc(readingListDocRef, { pmids: merged, lastModified: new Date().toISOString() });
          }
          isFirstSnapshot.readingList = false;
        } else {
          useReadingListStore.setState({ pmids: remotePmids });
        }
      } finally {
        isSyncingFromRemote = false;
      }
    }, (error) => {
      console.error('Reading list sync error:', error);
      setSyncStatus('error');
    })
  );

  zustandUnsubscribers.push(
    useReadingListStore.subscribe((state) => {
      if (isSyncingFromRemote) return;
      debouncedWrite('readingList', () => {
        setDoc(readingListDocRef, {
          pmids: state.pmids,
          lastModified: new Date().toISOString(),
        }).catch(() => setSyncStatus('error'));
      });
    })
  );

  // ── Settings sync ──────────────────────────────────────────────────

  const settingsDocRef = doc(db, 'users', uid, 'data', 'settings');

  unsubscribers.push(
    onSnapshot(settingsDocRef, (snap) => {
      if (!snap.exists()) {
        const { journals, acuteJournals } = useSettingsStore.getState();
        setDoc(settingsDocRef, { journals, acuteJournals, lastModified: new Date().toISOString() });
        isFirstSnapshot.settings = false;
        return;
      }

      const data = snap.data();
      const remoteJournals = data.journals;
      const remoteAcuteJournals = data.acuteJournals;

      isSyncingFromRemote = true;
      try {
        const update: Record<string, unknown> = {};
        if (remoteJournals) update.journals = remoteJournals;
        if (remoteAcuteJournals) update.acuteJournals = remoteAcuteJournals;

        if (isFirstSnapshot.settings) {
          useSettingsStore.setState(update);
          isFirstSnapshot.settings = false;
        } else {
          useSettingsStore.setState(update);
        }
      } finally {
        isSyncingFromRemote = false;
      }
    }, (error) => {
      console.error('Settings sync error:', error);
      setSyncStatus('error');
    })
  );

  zustandUnsubscribers.push(
    useSettingsStore.subscribe((state) => {
      if (isSyncingFromRemote) return;
      debouncedWrite('settings', () => {
        setDoc(settingsDocRef, {
          journals: state.journals,
          acuteJournals: state.acuteJournals,
          lastModified: new Date().toISOString(),
        }).catch(() => setSyncStatus('error'));
      });
    })
  );

  // ── Cleanup ────────────────────────────────────────────────────────

  return () => {
    unsubscribers.forEach(unsub => unsub());
    zustandUnsubscribers.forEach(unsub => unsub());
    Object.values(debounceTimers).forEach(clearTimeout);
    setSyncStatus('idle');
  };
}
