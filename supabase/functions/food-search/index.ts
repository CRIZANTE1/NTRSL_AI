import caloriasData from './calorias.json' with { type: 'json' };
import { requireUser, getServiceClient } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { fetchFdcFoodDetail, searchFdcFoods, type FdcFoodSummary } from '../_shared/fdc.ts';
import {
  rowToMacros,
  searchFoodCatalog,
  upsertFdcFood,
  type FoodCatalogRow,
} from '../_shared/food-catalog.ts';
import {
  buildAliasesForExternal,
  buildSearchLabel,
  getLocalAliases,
  queryToEnTerms,
  resolveNamePt,
} from '../_shared/search-dictionary.ts';
import { rankCandidates } from '../_shared/search-rank.ts';

type CaloriasJson = {
  nutritional_info: Record<
    string,
    { calorias: number; proteína: number; carboidratos: number; gordura: number }
  >;
};

interface FoodSearchResult {
  id: string | null;
  name: string;
  nameEn: string | null;
  source: 'local' | 'fdc' | 'cache';
  fdcId: number | null;
  localKey: string | null;
  matchScore: number;
  per100g: {
    calorias: number;
    proteina: number;
    carboidratos: number;
    gordura: number;
  };
}

interface FoodCandidate {
  ref: string;
  source: 'local' | 'cache' | 'fdc';
  namePt: string;
  nameEn: string;
  per100g: FoodSearchResult['per100g'];
  fdcId?: number;
  localKey?: string;
  catalogRow?: FoodCatalogRow;
  fdcFood?: FdcFoodSummary;
}

const calorias = (caloriasData as CaloriasJson).nutritional_info;

function localMacros(name: string) {
  const info = calorias[name];
  if (!info) return null;
  return {
    calorias: info.calorias,
    proteina: info.proteína,
    carboidratos: info.carboidratos,
    gordura: info.gordura,
  };
}

function catalogRowToResult(row: FoodCatalogRow, matchScore: number): FoodSearchResult {
  return {
    id: row.id,
    name: row.name_pt,
    nameEn: row.name_en,
    source: row.source === 'fdc' ? 'cache' : row.source,
    fdcId: row.fdc_id,
    localKey: row.local_key,
    matchScore,
    per100g: rowToMacros(row),
  };
}

function buildLocalCandidates(): FoodCandidate[] {
  return Object.keys(calorias).map((name) => {
    const macros = localMacros(name)!;
    return {
      ref: `local:${name}`,
      source: 'local' as const,
      namePt: name,
      nameEn: name,
      per100g: macros,
      localKey: name,
    };
  });
}

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Método não permitido.' }, 405);
  }

  try {
    await requireUser(req);
    const body = (await req.json()) as { query?: string; limit?: number };
    const query = (body.query ?? '').trim();
    const limit = Math.min(Math.max(body.limit ?? 12, 1), 25);

    if (query.length < 2) {
      return jsonResponse({
        results: [],
        meta: { query, translatedTerms: [], fromLocal: 0, fromCache: 0, fromFdc: 0 },
      });
    }

    const service = getServiceClient();
    const searchTerms = queryToEnTerms(query, 'food', 3);

    const cacheRows = await searchFoodCatalog(service, query, 40);

    const fdcById = new Map<number, FdcFoodSummary>();
    for (const term of searchTerms.length ? searchTerms : [query]) {
      const hits = await searchFdcFoods(term, 20);
      for (const hit of hits) {
        if (!fdcById.has(hit.fdcId)) fdcById.set(hit.fdcId, hit);
      }
    }

    const candidateMap = new Map<string, FoodCandidate>();

    for (const candidate of buildLocalCandidates()) {
      candidateMap.set(candidate.ref, candidate);
    }

    for (const row of cacheRows) {
      const ref = `cache:${row.id}`;
      candidateMap.set(ref, {
        ref,
        source: 'cache',
        namePt: row.name_pt,
        nameEn: row.name_en ?? row.name_pt,
        per100g: rowToMacros(row),
        fdcId: row.fdc_id ?? undefined,
        localKey: row.local_key ?? undefined,
        catalogRow: row,
      });
    }

    for (const food of fdcById.values()) {
      const ref = `fdc:${food.fdcId}`;
      const namePt = resolveNamePt(food.description, 'food');
      candidateMap.set(ref, {
        ref,
        source: 'fdc',
        namePt,
        nameEn: food.description,
        per100g: food.macros,
        fdcId: food.fdcId,
        fdcFood: food,
      });
    }

    const rankable = [...candidateMap.values()].map((c) => ({
      ref: c.ref,
      source: c.source,
      item: c,
      label: buildSearchLabel(
        c.namePt,
        c.nameEn,
        c.source === 'local'
          ? getLocalAliases(c.localKey ?? c.namePt, 'food')
          : c.catalogRow?.aliases ?? [],
      ),
    }));

    const ranked = rankCandidates(query, rankable, limit);

    if (!ranked.length) {
      return jsonResponse({
        results: [],
        meta: {
          query,
          translatedTerms: searchTerms,
          fromLocal: 0,
          fromCache: 0,
          fromFdc: 0,
        },
      });
    }

    const results: FoodSearchResult[] = [];
    let fromFdc = 0;

    for (const { item: candidate, matchScore } of ranked) {
      if (candidate.source === 'local') {
        results.push({
          id: null,
          name: candidate.namePt,
          nameEn: candidate.nameEn,
          source: 'local',
          fdcId: null,
          localKey: candidate.localKey ?? null,
          matchScore,
          per100g: candidate.per100g,
        });
        continue;
      }

      if (candidate.source === 'cache' && candidate.catalogRow) {
        results.push({
          ...catalogRowToResult(candidate.catalogRow, matchScore),
          matchScore,
        });
        continue;
      }

      if (candidate.fdcId && candidate.fdcFood) {
        const detail =
          (await fetchFdcFoodDetail(candidate.fdcId)) ?? candidate.fdcFood;
        const nameEn = detail.description.trim();
        const namePt = resolveNamePt(nameEn, 'food');
        const aliases = buildAliasesForExternal(nameEn, namePt, 'food', detail.brandOwner ? [detail.brandOwner] : []);

        const saved = await upsertFdcFood(service, detail, { namePt, aliases });
        fromFdc += 1;
        results.push({
          ...catalogRowToResult(saved, matchScore),
          name: saved.name_pt,
          source: 'fdc',
          matchScore,
        });
      }
    }

    return jsonResponse({
      results: results.slice(0, limit),
      meta: {
        query,
        translatedTerms: searchTerms,
        fromLocal: results.filter((r) => r.source === 'local').length,
        fromCache: results.filter((r) => r.source === 'cache').length,
        fromFdc,
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});
