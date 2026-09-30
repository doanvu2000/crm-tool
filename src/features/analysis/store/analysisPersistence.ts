/// <reference lib="dom" />

import type { AnalysisSettings, SkuInput } from '../model/types';

const DATABASE_NAME = 'crm-tool-local-data';
const DATABASE_VERSION = 1;
const STORE_NAME = 'workspace';
const RECORD_ID = 'latest';

export interface SavedAnalysis {
  raw: SkuInput[];
  original: SkuInput[];
  removed: number[];
  sourceLabel: string;
  settings: AnalysisSettings;
}

interface StoredAnalysis extends SavedAnalysis {
  id: string;
  version: number;
}

let databasePromise: Promise<IDBDatabase> | undefined;
let writeQueue: Promise<void> = Promise.resolve();

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB is unavailable'));
  if (databasePromise) return databasePromise;

  const pending: Promise<IDBDatabase> = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open local data store'));
    request.onblocked = () => reject(new Error('Local data store upgrade is blocked'));
  }).catch((error: unknown) => {
    databasePromise = undefined;
    throw error;
  });
  databasePromise = pending;

  return pending;
}

export async function loadSavedAnalysis(): Promise<SavedAnalysis | null> {
  try {
    const database = await openDatabase();
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(RECORD_ID);
      request.onsuccess = () => {
        const saved = request.result as StoredAnalysis | undefined;
        if (!saved || saved.version !== DATABASE_VERSION || !Array.isArray(saved.raw) || !Array.isArray(saved.original)) {
          resolve(null);
          return;
        }
        resolve({
          raw: saved.raw,
          original: saved.original,
          removed: Array.isArray(saved.removed) ? saved.removed : [],
          sourceLabel: typeof saved.sourceLabel === 'string' ? saved.sourceLabel : '',
          settings: saved.settings
        });
      };
      request.onerror = () => reject(request.error ?? new Error('Could not read local data'));
    });
  } catch {
    // Storage may be disabled by the browser; the app can still run without persistence.
    return null;
  }
}

export function saveAnalysis(snapshot: SavedAnalysis): void {
  const next = { ...snapshot, id: RECORD_ID, version: DATABASE_VERSION } satisfies StoredAnalysis;
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      const database = await openDatabase();
      await new Promise<void>((resolve, reject) => {
        const transaction = database.transaction(STORE_NAME, 'readwrite');
        transaction.objectStore(STORE_NAME).put(next);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error ?? new Error('Could not save local data'));
        transaction.onabort = () => reject(transaction.error ?? new Error('Local data save was aborted'));
      });
    })
    .catch(() => undefined);
}
