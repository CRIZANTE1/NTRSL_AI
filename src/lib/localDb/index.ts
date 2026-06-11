import { Capacitor } from '@capacitor/core';
import { webStore } from './webStore';
import { nativeStore, openNativeDatabase } from './nativeSqlite';
import type { CacheRow, OutboxInsert, OutboxRow } from './types';

let useWeb = true;

/**
 * Persistência local: SQLite nativo (Android/iOS) ou localStorage na web / dev.
 */
export async function ensureLocalDb(): Promise<void> {
  if (Capacitor.getPlatform() === 'web') {
    useWeb = true;
    return;
  }
  useWeb = false;
  await openNativeDatabase();
}

function store() {
  return useWeb ? webStore : nativeStore;
}

export async function getCacheRow(key: string): Promise<CacheRow | null> {
  await ensureLocalDb();
  return store().getCache(key);
}

export async function setCacheRow(row: CacheRow): Promise<void> {
  await ensureLocalDb();
  return store().setCache(row);
}

export async function deleteCacheByPrefix(prefix: string): Promise<void> {
  await ensureLocalDb();
  return store().deleteCacheByPrefix(prefix);
}

export async function enqueueOutbox(row: OutboxInsert): Promise<void> {
  await ensureLocalDb();
  return store().enqueueOutbox(row);
}

export async function listOutboxPending(): Promise<OutboxRow[]> {
  await ensureLocalDb();
  return store().listOutboxPending();
}

export async function listOutboxAll(): Promise<OutboxRow[]> {
  await ensureLocalDb();
  return store().listOutboxAll();
}

export async function updateOutbox(
  id: string,
  patch: Partial<Pick<OutboxRow, 'status' | 'error' | 'attempts'>>,
): Promise<void> {
  await ensureLocalDb();
  return store().updateOutbox(id, patch);
}

export async function removeOutbox(id: string): Promise<void> {
  await ensureLocalDb();
  return store().removeOutbox(id);
}

export async function countPendingOutbox(): Promise<number> {
  await ensureLocalDb();
  return (await store().listOutboxPending()).length;
}

export async function getSyncMeta(key: string): Promise<string | null> {
  await ensureLocalDb();
  return store().getSyncMeta(key);
}

export async function setSyncMeta(key: string, value: string): Promise<void> {
  await ensureLocalDb();
  return store().setSyncMeta(key, value);
}

export type { CacheRow, OutboxRow, OutboxInsert } from './types';
