import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { queryToEnTerms } from './search-dictionary.ts';
import type { WgerExerciseSummary } from './wger.ts';

export interface ExerciseCatalogRow {
  id: string;
  wger_id: number | null;
  local_key: string | null;
  name_pt: string;
  name_en: string | null;
  source: 'local' | 'wger';
  category: string | null;
  calorias_por_minuto: number;
  aliases: string[] | null;
  raw_wger: Record<string, unknown> | null;
  fetched_at: string;
}

export interface ExerciseSearchResult {
  id: string | null;
  name: string;
  nameEn: string | null;
  source: 'local' | 'wger' | 'cache';
  wgerId: number | null;
  localKey: string | null;
  matchScore: number;
  caloriasPorMinuto: number;
  category: string | null;
}

function sanitizeIlikeQuery(value: string): string {
  return value.trim().replace(/[%_,.()]/g, ' ').replace(/\s+/g, ' ');
}

function shouldReplaceNamePt(
  existing: ExerciseCatalogRow | null,
  resolvedPt: string,
  nameEn: string,
): string {
  const next = resolvedPt.trim();
  const en = nameEn.trim();
  if (!existing?.name_pt?.trim()) return next || en;
  const current = existing.name_pt.trim();
  if (!current) return next || en;
  if (current.toLowerCase() === en.toLowerCase()) return next || current;
  if (existing.name_en && current.toLowerCase() === existing.name_en.toLowerCase()) {
    return next || current;
  }
  return current;
}

export async function searchExerciseCatalog(
  service: SupabaseClient,
  query: string,
  limit = 30,
): Promise<ExerciseCatalogRow[]> {
  const term = sanitizeIlikeQuery(query);
  if (!term) return [];

  const pattern = `%${term}%`;
  const enTerms = queryToEnTerms(query, 'exercise', 3);
  const orParts = new Set<string>([
    `name_pt.ilike."${pattern}"`,
    `name_en.ilike."${pattern}"`,
  ]);

  for (const en of enTerms) {
    const enTerm = sanitizeIlikeQuery(en);
    if (!enTerm) continue;
    const enPattern = `%${enTerm}%`;
    orParts.add(`name_en.ilike."${enPattern}"`);
    orParts.add(`name_pt.ilike."${enPattern}"`);
  }

  const { data, error } = await service
    .from('exercise_catalog')
    .select('*')
    .or([...orParts].join(','))
    .order('fetched_at', { ascending: false })
    .limit(limit * 2);

  if (error) {
    throw new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const rows = (data ?? []) as ExerciseCatalogRow[];
  const normalizedQuery = term.toLowerCase();

  const aliasMatches = rows.filter((row) =>
    (row.aliases ?? []).some((alias) => alias.toLowerCase().includes(normalizedQuery)),
  );

  const byId = new Map<string, ExerciseCatalogRow>();
  for (const row of [...rows, ...aliasMatches]) {
    byId.set(row.id, row);
  }

  return [...byId.values()].slice(0, limit);
}

export async function upsertWgerExercise(
  service: SupabaseClient,
  exercise: WgerExerciseSummary,
  options: { namePt: string; caloriasPorMinuto: number; aliases: string[] },
): Promise<ExerciseCatalogRow> {
  const { data: existingRow } = await service
    .from('exercise_catalog')
    .select('*')
    .eq('wger_id', exercise.wgerId)
    .maybeSingle();

  const existing = (existingRow ?? null) as ExerciseCatalogRow | null;
  const nameEn = exercise.nameEn.trim();
  const namePt = shouldReplaceNamePt(existing, options.namePt, nameEn);

  const payload = {
    wger_id: exercise.wgerId,
    name_pt: namePt,
    name_en: nameEn,
    source: 'wger' as const,
    category: exercise.category || null,
    calorias_por_minuto: options.caloriasPorMinuto,
    aliases: options.aliases,
    raw_wger: exercise.raw,
    fetched_at: new Date().toISOString(),
  };

  const { data, error } = await service
    .from('exercise_catalog')
    .upsert(payload, { onConflict: 'wger_id' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Response(JSON.stringify({ error: error?.message ?? 'Falha ao salvar exercício.' }), {
      status: 500,
    });
  }

  return data as ExerciseCatalogRow;
}

export function rowToCaloriasPorMinuto(
  row: Pick<ExerciseCatalogRow, 'calorias_por_minuto'>,
): number {
  return Number(row.calorias_por_minuto) || 0;
}

export function catalogRowToResult(
  row: ExerciseCatalogRow,
  matchScore: number,
): ExerciseSearchResult {
  return {
    id: row.id,
    name: row.name_pt,
    nameEn: row.name_en,
    source: row.source === 'wger' ? 'cache' : row.source,
    wgerId: row.wger_id,
    localKey: row.local_key,
    matchScore,
    caloriasPorMinuto: rowToCaloriasPorMinuto(row),
    category: row.category,
  };
}
