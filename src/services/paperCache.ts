import { openDB, type IDBPDatabase } from 'idb';
import type { Paper } from '../types/paper';
import { IDB_NAME, IDB_VERSION } from '../constants/config';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(IDB_NAME, IDB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('papers')) {
          const store = db.createObjectStore('papers', { keyPath: 'pmid' });
          store.createIndex('pubDate', 'pubDate');
          store.createIndex('journalAbbrev', 'journalAbbrev');
          store.createIndex('fetchedAt', 'fetchedAt');
        }
      },
    });
  }
  return dbPromise;
}

export async function getCachedPapers(): Promise<Paper[]> {
  const db = await getDb();
  return db.getAll('papers');
}

export async function getCachedPmids(): Promise<Set<string>> {
  const db = await getDb();
  const keys = await db.getAllKeys('papers');
  return new Set(keys.map(String));
}

export async function cachePapers(papers: Paper[]): Promise<void> {
  const db = await getDb();
  const tx = db.transaction('papers', 'readwrite');
  for (const paper of papers) {
    tx.store.put(paper);
  }
  await tx.done;
}

export async function getPaperByPmid(pmid: string): Promise<Paper | undefined> {
  const db = await getDb();
  return db.get('papers', pmid);
}

export async function clearCache(): Promise<void> {
  const db = await getDb();
  await db.clear('papers');
}
