import type { CacheRow, OutboxInsert, OutboxRow } from './types';

const SNAP_PREFIX = 'ntrsl_cache_snap_v1::';
const OUTBOX_KEY = 'ntrsl_cache_outbox_v1';
const META_PREFIX = 'ntrsl_cache_meta_v1::';

function readOutbox(): OutboxRow[] {
  try {
    const raw = window.localStorage.getItem(OUTBOX_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as OutboxRow[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeOutbox(rows: OutboxRow[]) {
  window.localStorage.setItem(OUTBOX_KEY, JSON.stringify(rows));
}

export const webStore = {
  async getCache(key: string): Promise<CacheRow | null> {
    const raw = window.localStorage.getItem(SNAP_PREFIX + key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CacheRow;
    } catch {
      return null;
    }
  },

  async setCache(row: CacheRow): Promise<void> {
    window.localStorage.setItem(SNAP_PREFIX + row.cache_key, JSON.stringify(row));
  },

  async deleteCacheByPrefix(prefix: string): Promise<void> {
    const keys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k?.startsWith(SNAP_PREFIX) && k.slice(SNAP_PREFIX.length).startsWith(prefix)) {
        keys.push(k);
      }
    }
    for (const k of keys) window.localStorage.removeItem(k);
  },

  async enqueueOutbox(row: OutboxInsert): Promise<void> {
    const full: OutboxRow = {
      ...row,
      status: row.status ?? 'pending',
      error: null,
      attempts: 0,
    };
    const list = readOutbox();
    list.push(full);
    writeOutbox(list);
  },

  async listOutboxPending(): Promise<OutboxRow[]> {
    return readOutbox()
      .filter((r) => r.status === 'pending')
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async listOutboxAll(): Promise<OutboxRow[]> {
    return readOutbox().sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async updateOutbox(id: string, patch: Partial<Pick<OutboxRow, 'status' | 'error' | 'attempts'>>): Promise<void> {
    const list = readOutbox();
    const idx = list.findIndex((r) => r.id === id);
    if (idx < 0) return;
    list[idx] = { ...list[idx], ...patch };
    writeOutbox(list);
  },

  async removeOutbox(id: string): Promise<void> {
    writeOutbox(readOutbox().filter((r) => r.id !== id));
  },

  async countPendingOutbox(): Promise<number> {
    return readOutbox().filter((r) => r.status === 'pending').length;
  },

  async getSyncMeta(key: string): Promise<string | null> {
    return window.localStorage.getItem(META_PREFIX + key);
  },

  async setSyncMeta(key: string, value: string): Promise<void> {
    window.localStorage.setItem(META_PREFIX + key, value);
  },
};
