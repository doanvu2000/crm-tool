import type { PilotSkuInput } from '@/features/analysis';

const DB_NAME = 'crm-tool-sku-pilot';
const STORE = 'workspace';
const KEY = 'latest';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadPilotData(): Promise<{ rows: PilotSkuInput[]; source: string } | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE);
      const request = transaction.objectStore(STORE).get(KEY);
      let result: { rows: PilotSkuInput[]; source: string } | null = null;
      request.onsuccess = () => { result = request.result ?? null; };
      request.onerror = () => reject(request.error);
      transaction.oncomplete = () => { db.close(); resolve(result); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
    });
  } catch {
    return null;
  }
}

export async function savePilotData(rows: PilotSkuInput[], source: string): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE, 'readwrite');
      transaction.objectStore(STORE).put({ rows, source }, KEY);
      transaction.oncomplete = () => { db.close(); resolve(); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
      transaction.onabort = () => { db.close(); reject(transaction.error); };
    });
  } catch {
    // Keep the dashboard usable when browser storage is disabled or full.
  }
}
