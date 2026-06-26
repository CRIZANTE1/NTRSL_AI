export type OutboxStatus = 'pending' | 'done' | 'failed';

export type OutboxOperation = 'insert' | 'upsert' | 'delete' | 'delete_clear';

export type CacheRow = {
  cache_key: string;
  payload: string;
  fetched_at: string;
  source: string;
};

export type OutboxRow = {
  id: string;
  created_at: string;
  operation: OutboxOperation;
  table_name: string;
  payload: string;
  status: OutboxStatus;
  error: string | null;
  attempts: number;
};

export type OutboxInsert = Omit<OutboxRow, 'status' | 'error' | 'attempts'> & {
  status?: OutboxStatus;
};

