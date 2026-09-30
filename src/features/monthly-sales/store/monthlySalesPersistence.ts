import type { MonthlySaleInput } from '../model/types';

const DATABASE_NAME = 'crm-tool-monthly-sales';
const DATABASE_VERSION = 1;
const STORE_NAME = 'history';
const RECORD_ID = 'latest';

interface SavedMonthlySales {
  rows: MonthlySaleInput[];
  sourceLabel: string;
}

let databasePromise: Promise<IDBDatabase> | undefined;
let writeQueue: Promise<void> = Promise.resolve();

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB is unavailable'));
  if (databasePromise) return databasePromise;
  databasePromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME, { keyPath: 'id' });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Could not open monthly sales storage'));
  }).catch((error: unknown) => {
    databasePromise = undefined;
    throw error;
  });
  return databasePromise!;
}

export async function loadMonthlySales(): Promise<SavedMonthlySales | null> {
  try {
    const database = await openDatabase();
    return await new Promise((resolve, reject) => {
      const request = database.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(RECORD_ID);
      request.onsuccess = () => {
        const saved = request.result as (SavedMonthlySales & { id: string }) | undefined;
        resolve(saved && Array.isArray(saved.rows)
          ? { rows: saved.rows, sourceLabel: typeof saved.sourceLabel === 'string' ? saved.sourceLabel : '' }
          : null);
      };
      request.onerror = () => reject(request.error ?? new Error('Could not read monthly sales storage'));
    });
  } catch {
    return null;
  }
}

export function saveMonthlySales(snapshot: SavedMonthlySales): void {
  writeQueue = writeQueue.catch(() => undefined).then(async () => {
    const database = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      transaction.objectStore(STORE_NAME).put({ ...snapshot, id: RECORD_ID });
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error ?? new Error('Could not save monthly sales'));
      transaction.onabort = () => reject(transaction.error ?? new Error('Monthly sales save was aborted'));
    });
  }).catch(() => undefined);
}
