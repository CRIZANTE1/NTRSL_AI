import { CapacitorSQLite } from '@capacitor-community/sqlite';
import type { CacheRow, OutboxInsert, OutboxRow, OutboxStatus } from './types';

export const DB_NAME = 'ntrsl_ai';

const DDL = `
CREATE TABLE IF NOT EXISTS cache_snapshot (
  cache_key TEXT PRIMARY KEY NOT NULL,
  payload TEXT NOT NULL,
  fetched_at TEXT NOT NULL,
  source TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS outbox (
  id TEXT PRIMARY KEY NOT NULL,
  created_at TEXT NOT NULL,
  operation TEXT NOT NULL,
  table_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  attempts INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_outbox_status_created ON outbox(status, created_at);

CREATE TABLE IF NOT EXISTS sync_meta (
  meta_key TEXT PRIMARY KEY NOT NULL,
  meta_value TEXT NOT NULL
);
`;

let opened = false;
let opening: Promise<void> | null = null;

function parseQueryValues<T extends Record<string, unknown>>(res: { values?: unknown[] } | undefined): T[] {
  const v = res?.values;
  if (!Array.isArray(v)) return [];
  return v as T[];
}

export async function openNativeDatabase(): Promise<void> {
  if (opened) return;
  if (opening) return opening;
  opening = (async () => {
    try {
      await CapacitorSQLite.createConnection({
        database: DB_NAME,
        encrypted: false,
        mode: 'no-encryption',
        version: 1,
        readonly: false,
      });
    } catch {
      /* conexão já pode existir na mesma sessão */
    }
    await CapacitorSQLite.open({ database: DB_NAME });
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: DDL,
      transaction: true,
    });
    opened = true;
  })();
  try {
    await opening;
  } finally {
    opening = null;
  }
}

export const nativeStore = {
  async getCache(key: string): Promise<CacheRow | null> {
    await openNativeDatabase();
    const res = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT cache_key, payload, fetched_at, source FROM cache_snapshot WHERE cache_key = ?',
      values: [key],
    });
    const rows = parseQueryValues<CacheRow>(res);
    return rows[0] ?? null;
  },

  async setCache(row: CacheRow): Promise<void> {
    await openNativeDatabase();
    await CapacitorSQLite.run({
      database: DB_NAME,
      statement:
        'INSERT OR REPLACE INTO cache_snapshot (cache_key, payload, fetched_at, source) VALUES (?,?,?,?)',
      values: [row.cache_key, row.payload, row.fetched_at, row.source],
    });
  },

  async deleteCacheByPrefix(prefix: string): Promise<void> {
    await openNativeDatabase();
    await CapacitorSQLite.run({
      database: DB_NAME,
      statement: 'DELETE FROM cache_snapshot WHERE cache_key LIKE ?',
      values: [`${prefix}%`],
    });
  },

  async enqueueOutbox(row: OutboxInsert): Promise<void> {
    await openNativeDatabase();
    const status: OutboxStatus = row.status ?? 'pending';
    await CapacitorSQLite.run({
      database: DB_NAME,
      statement:
        'INSERT INTO outbox (id, created_at, operation, table_name, payload, status, error, attempts) VALUES (?,?,?,?,?,?,?,?)',
      values: [
        row.id,
        row.created_at,
        row.operation,
        row.table_name,
        row.payload,
        status,
        null,
        0,
      ],
    });
  },

  async listOutboxPending(): Promise<OutboxRow[]> {
    await openNativeDatabase();
    const res = await CapacitorSQLite.query({
      database: DB_NAME,
      statement:
        'SELECT id, created_at, operation, table_name, payload, status, error, attempts FROM outbox WHERE status = ? ORDER BY created_at ASC',
      values: ['pending'],
    });
    return parseQueryValues<OutboxRow>(res);
  },

  async listOutboxAll(): Promise<OutboxRow[]> {
    await openNativeDatabase();
    const res = await CapacitorSQLite.query({
      database: DB_NAME,
      statement:
        'SELECT id, created_at, operation, table_name, payload, status, error, attempts FROM outbox ORDER BY created_at ASC',
      values: [],
    });
    return parseQueryValues<OutboxRow>(res);
  },

  async updateOutbox(id: string, patch: Partial<Pick<OutboxRow, 'status' | 'error' | 'attempts'>>): Promise<void> {
    await openNativeDatabase();
    const cur = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT status, error, attempts FROM outbox WHERE id = ?',
      values: [id],
    });
    const row = parseQueryValues<Pick<OutboxRow, 'status' | 'error' | 'attempts'>>(cur)[0];
    if (!row) return;
    await CapacitorSQLite.run({
      database: DB_NAME,
      statement: 'UPDATE outbox SET status = ?, error = ?, attempts = ? WHERE id = ?',
      values: [
        patch.status ?? row.status,
        patch.error !== undefined ? patch.error : row.error,
        patch.attempts ?? row.attempts,
        id,
      ],
    });
  },

  async removeOutbox(id: string): Promise<void> {
    await openNativeDatabase();
    await CapacitorSQLite.run({
      database: DB_NAME,
      statement: 'DELETE FROM outbox WHERE id = ?',
      values: [id],
    });
  },

  async getSyncMeta(key: string): Promise<string | null> {
    await openNativeDatabase();
    const res = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: 'SELECT meta_value FROM sync_meta WHERE meta_key = ?',
      values: [key],
    });
    const rows = parseQueryValues<{ meta_value: string }>(res);
    return rows[0]?.meta_value ?? null;
  },

  async setSyncMeta(key: string, value: string): Promise<void> {
    await openNativeDatabase();
    await CapacitorSQLite.run({
      database: DB_NAME,
      statement: 'INSERT OR REPLACE INTO sync_meta (meta_key, meta_value) VALUES (?,?)',
      values: [key, value],
    });
  },
};
