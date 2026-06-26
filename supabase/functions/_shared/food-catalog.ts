import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';
import { queryToEnTerms } from './search-dictionary.ts';
import type { FdcFoodSummary } from './fdc.ts';

export interface FoodCatalogRow {
  id: string;
  fdc_id: number | null;
  local_key: string | null;
  name_pt: string;
  name_en: string | null;
  source: 'local' | 'fdc';
  data_type: string | null;
  calorias: number;
  proteina: number;
  carboidratos: number;
  gordura: number;
  aliases: string[] | null;
  raw_fdc: Record<string, unknown> | null;
  fetched_at: string;
}

export interface FoodMacros {
  calorias: number;
  proteina: number;
  carboidratos: number;
  gordura: number;
}

function sanitizeIlikeQuery(value: string): string {
  return value.trim().replace(/[%_,.()]/g, ' ').replace(/\s+/g, ' ');
}

function shouldReplaceNamePt(
  existing: FoodCatalogRow | null,
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

export async function searchFoodCatalog(
  service: SupabaseClient,
  query: string,
  limit = 30,
): Promise<FoodCatalogRow[]> {
  const term = sanitizeIlikeQuery(query);
  if (!term) return [];

  const pattern = `%${term}%`;
  const enTerms = queryToEnTerms(query, 'food', 3);
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
    .from('food_catalog')
    .select('*')
    .or([...orParts].join(','))
    .order('fetched_at', { ascending: false })
    .limit(limit * 2);

  if (error) {
    throw new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  const rows = (data ?? []) as FoodCatalogRow[];
  const normalizedQuery = term.toLowerCase();

  const aliasMatches = rows.filter((row) =>
    (row.aliases ?? []).some((alias) => alias.toLowerCase().includes(normalizedQuery)),
  );

  const byId = new Map<string, FoodCatalogRow>();
  for (const row of [...rows, ...aliasMatches]) {
    byId.set(row.id, row);
  }

  return [...byId.values()].slice(0, limit);
}

export async function upsertFdcFood(
  service: SupabaseClient,
  food: FdcFoodSummary,
  options: { namePt: string; aliases: string[] },
): Promise<FoodCatalogRow> {
  const { data: existingRow } = await service
    .from('food_catalog')
    .select('*')
    .eq('fdc_id', food.fdcId)
    .maybeSingle();

  const existing = (existingRow ?? null) as FoodCatalogRow | null;
  const nameEn = food.description.trim();
  const namePt = shouldReplaceNamePt(existing, options.namePt, nameEn);

  const detail = food.raw;
  const payload = {
    fdc_id: food.fdcId,
    name_pt: namePt,
    name_en: nameEn,
    source: 'fdc' as const,
    data_type: food.dataType,
    calorias: food.macros.calorias,
    proteina: food.macros.proteina,
    carboidratos: food.macros.carboidratos,
    gordura: food.macros.gordura,
    aliases: options.aliases,
    raw_fdc: detail,
    fetched_at: new Date().toISOString(),
  };

  const { data, error } = await service
    .from('food_catalog')
    .upsert(payload, { onConflict: 'fdc_id' })
    .select('*')
    .single();

  if (error || !data) {
    throw new Response(JSON.stringify({ error: error?.message ?? 'Falha ao salvar alimento.' }), {
      status: 500,
    });
  }

  return data as FoodCatalogRow;
}

export function rowToMacros(row: Pick<FoodCatalogRow, 'calorias' | 'proteina' | 'carboidratos' | 'gordura'>): FoodMacros {
  return {
    calorias: Number(row.calorias) || 0,
    proteina: Number(row.proteina) || 0,
    carboidratos: Number(row.carboidratos) || 0,
    gordura: Number(row.gordura) || 0,
  };
}
