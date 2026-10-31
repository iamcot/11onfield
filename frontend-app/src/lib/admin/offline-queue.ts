'use client';

import { api } from '@/lib/admin/client';

/** One station save waiting for the network. `id` is the clientUuid: the server ignores a resend with the same one. */
export interface QueuedSave {
  id: string;
  stepId: number;
  participantId: number;
  label: string;
  scores: Record<string, string>;
  statuses: Record<string, 'FAULT' | 'DNS'>;
  notes: Record<string, string>;
  createdAt: number;
  /** Set when the server refused the save (not a network problem); the judge decides to discard it. */
  error?: string;
}

const DB = 'onfield-station';
const STORE = 'saves';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB không khả dụng'));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'id' });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const req = fn(tx.objectStore(STORE));
    tx.oncomplete = () => { db.close(); resolve(req.result); };
    tx.onerror = tx.onabort = () => { db.close(); reject(tx.error); };
  });
}

export const newClientUuid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;

export const queueAll = async () => (await run<QueuedSave[]>('readonly', (s) => s.getAll())).sort((a, b) => a.createdAt - b.createdAt);
export const queuePut = (item: QueuedSave) => run('readwrite', (s) => s.put(item));
export const queueRemove = (id: string) => run('readwrite', (s) => s.delete(id));

/** True for a failed fetch (no network), false when the server answered with an error. */
export const isNetworkError = (e: unknown) => !(e as { status?: number })?.status;

export async function sendSave(item: QueuedSave) {
  const { id, stepId, participantId, scores, statuses, notes } = item;
  return api<{ message: string; review?: { key: string; reason: string }[] }>('field-scoring/save', {
    body: { stepId, participantId, scores, statuses, notes, clientUuid: id },
  });
}

/**
 * Sends the waiting saves in the order they were made. Stops at the first network failure (still offline);
 * a refusal from the server is kept on the item with its message so nothing disappears silently.
 */
export async function flushQueue(): Promise<{ sent: number; reviews: number; offline: boolean }> {
  let sent = 0;
  let reviews = 0;
  for (const item of await queueAll()) {
    if (item.error) continue;
    try {
      const r = await sendSave(item);
      reviews += r.review?.length ?? 0;
      await queueRemove(item.id);
      sent++;
    } catch (e) {
      if (isNetworkError(e)) return { sent, reviews, offline: true };
      await queuePut({ ...item, error: (e as Error).message });
    }
  }
  return { sent, reviews, offline: false };
}
