import { supabase } from '../supabase';
import { logger } from '../logger';
import { listOutboxPending, removeOutbox, updateOutbox } from '../localDb';
import type { OutboxRow } from '../localDb/types';
import type { Database } from '../../types/supabase';
import { notifyOfflineDataChanged } from './offlineEvents';

type DailyLogInsert = Database['public']['Tables']['daily_logs']['Insert'];

const MAX_ATTEMPTS = 8;

async function applyRow(row: OutboxRow): Promise<void> {
  const payload = JSON.parse(row.payload) as unknown;

  if (row.table_name === 'daily_logs' && row.operation === 'insert') {
    const { error } = await supabase.from('daily_logs').insert(payload as DailyLogInsert);
    if (error) throw new Error(error.message);
    return;
  }

  if (row.table_name === 'daily_logs' && row.operation === 'upsert') {
    const { error } = await supabase
      .from('daily_logs')
      .upsert(payload as DailyLogInsert, { onConflict: 'user_id,log_date' });
    if (error) throw new Error(error.message);
    return;
  }

  throw new Error(`Outbox não suportado: ${row.table_name} / ${row.operation}`);
}

export async function processOutbox(): Promise<{ processed: number; failed: number }> {
  let processed = 0;
  let failed = 0;
  const pending = await listOutboxPending();
  for (const row of pending) {
    try {
      await applyRow(row);
      await removeOutbox(row.id);
      processed++;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const attempts = (row.attempts ?? 0) + 1;
      logger.warn('outbox-sync', `Falha outbox ${row.id}`, e);
      if (attempts >= MAX_ATTEMPTS) {
        await updateOutbox(row.id, { status: 'failed', error: msg, attempts });
        failed++;
      } else {
        await updateOutbox(row.id, { error: msg, attempts });
      }
    }
  }
  if (processed > 0 || failed > 0) {
    notifyOfflineDataChanged();
  }
  return { processed, failed };
}
