import { supabase } from '../supabase';
import { enqueueOutbox } from '../localDb';
import { notifyOfflineDataChanged } from './offlineEvents';
import type { ExerciseEntry, FoodEntry, NutritionSummary } from '../../types/nutrition';
import type { Database, Json } from '../../types/supabase';

type DailyLogRow = Database['public']['Tables']['daily_logs']['Row'];
type DailyLogInsert = Database['public']['Tables']['daily_logs']['Insert'];

export function localLogDate(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseDailyLogRow(row: DailyLogRow): {
  exercises: ExerciseEntry[];
  foods: FoodEntry[];
  summary: NutritionSummary | null;
} {
  return {
    exercises: Array.isArray(row.exercises) ? (row.exercises as unknown as ExerciseEntry[]) : [],
    foods: Array.isArray(row.foods) ? (row.foods as unknown as FoodEntry[]) : [],
    summary: row.summary ? (row.summary as unknown as NutritionSummary) : null,
  };
}

export async function fetchDailyLog(
  userId: string,
  logDate = localLogDate(),
): Promise<DailyLogRow | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('log_date', logDate)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function fetchDailyLogHistory(
  userId: string,
  limit = 30,
): Promise<DailyLogRow[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .order('log_date', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchDailyLogsByRange(
  userId: string,
  startDate: string,
  endDate: string,
): Promise<DailyLogRow[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select('*')
    .eq('user_id', userId)
    .gte('log_date', startDate)
    .lte('log_date', endDate)
    .order('log_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function fetchDailyLogCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('daily_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('summary', 'is', null);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function saveDailyLog(params: {
  userId: string;
  logDate?: string;
  exercises: ExerciseEntry[];
  foods: FoodEntry[];
  summary: NutritionSummary | null;
}): Promise<{ synced: boolean }> {
  const logDate = params.logDate ?? localLogDate();
  const payload: DailyLogInsert = {
    user_id: params.userId,
    log_date: logDate,
    exercises: params.exercises as unknown as Json,
    foods: params.foods as unknown as Json,
    summary: (params.summary as unknown as Json) ?? null,
  };

  const { error } = await supabase
    .from('daily_logs')
    .upsert(payload, { onConflict: 'user_id,log_date' });

  if (!error) return { synced: true };

  await enqueueOutbox({
    id: crypto.randomUUID(),
    created_at: new Date().toISOString(),
    operation: 'upsert',
    table_name: 'daily_logs',
    payload: JSON.stringify(payload),
  });
  notifyOfflineDataChanged();
  return { synced: false };
}

export function computeStreak(rows: DailyLogRow[]): number {
  const byDate = new Map(
    rows
      .filter((row) => row.summary != null)
      .map((row) => [row.log_date, row]),
  );

  let streak = 0;
  const cursor = new Date();
  while (true) {
    const key = localLogDate(cursor);
    if (!byDate.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function parseLogDateString(logDate: string): Date {
  const [y, m, d] = logDate.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}
