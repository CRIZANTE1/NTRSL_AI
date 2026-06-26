import exerciciosData from '../_shared/data/exercicios.json' with { type: 'json' };
import { requireUser, getServiceClient } from '../_shared/auth.ts';
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import {
  catalogRowToResult,
  searchExerciseCatalog,
  upsertWgerExercise,
  type ExerciseCatalogRow,
  type ExerciseSearchResult,
} from '../_shared/exercise-catalog.ts';
import {
  buildAliasesForExternal,
  buildSearchLabel,
  getLocalAliases,
  queryToEnTerms,
  resolveNamePt,
} from '../_shared/search-dictionary.ts';
import { rankCandidates } from '../_shared/search-rank.ts';
import { fetchWgerExerciseDetail, searchWgerExercises, type WgerExerciseSummary } from '../_shared/wger.ts';

type ExerciciosJson = {
  physical_activity_info: Record<string, { calorias_queimadas_por_minuto: number }>;
};

interface ExerciseCandidate {
  ref: string;
  source: 'local' | 'cache' | 'wger';
  namePt: string;
  nameEn: string;
  caloriasPorMinuto: number;
  category: string | null;
  wgerId?: number;
  localKey?: string;
  catalogRow?: ExerciseCatalogRow;
  wgerExercise?: WgerExerciseSummary;
}

const exercicios = (exerciciosData as ExerciciosJson).physical_activity_info;

function localCaloriasPorMinuto(name: string): number {
  return exercicios[name]?.calorias_queimadas_por_minuto ?? 0;
}

function resolveExerciseNamePt(exercise: WgerExerciseSummary): string {
  return exercise.namePt?.trim() || resolveNamePt(exercise.nameEn, 'exercise');
}

function estimateCaloriasPorMinuto(namePt: string, fallback = 5): number {
  const local = localCaloriasPorMinuto(namePt);
  if (local > 0) return local;
  for (const key of Object.keys(exercicios)) {
    if (key.toLowerCase().includes(namePt.toLowerCase()) || namePt.toLowerCase().includes(key.toLowerCase())) {
      return exercicios[key].calorias_queimadas_por_minuto;
    }
  }
  return fallback;
}

function buildLocalCandidates(): ExerciseCandidate[] {
  return Object.keys(exercicios).map((name) => ({
    ref: `local:${name}`,
    source: 'local' as const,
    namePt: name,
    nameEn: name,
    caloriasPorMinuto: exercicios[name].calorias_queimadas_por_minuto,
    category: null,
    localKey: name,
  }));
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
        meta: { query, translatedTerms: [], fromLocal: 0, fromCache: 0, fromWger: 0 },
      });
    }

    const service = getServiceClient();
    const searchTerms = queryToEnTerms(query, 'exercise', 3);

    const cacheRows = await searchExerciseCatalog(service, query, 40);

    const wgerById = new Map<number, WgerExerciseSummary>();
    for (const term of searchTerms.length ? searchTerms : [query]) {
      const hits = await searchWgerExercises(term, 20);
      for (const hit of hits) {
        if (!wgerById.has(hit.wgerId)) wgerById.set(hit.wgerId, hit);
      }
    }

    const candidateMap = new Map<string, ExerciseCandidate>();

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
        caloriasPorMinuto: Number(row.calorias_por_minuto) || 0,
        category: row.category,
        wgerId: row.wger_id ?? undefined,
        localKey: row.local_key ?? undefined,
        catalogRow: row,
      });
    }

    for (const exercise of wgerById.values()) {
      const ref = `wger:${exercise.wgerId}`;
      const namePt = resolveExerciseNamePt(exercise);
      candidateMap.set(ref, {
        ref,
        source: 'wger',
        namePt,
        nameEn: exercise.nameEn,
        caloriasPorMinuto: estimateCaloriasPorMinuto(namePt),
        category: exercise.category || null,
        wgerId: exercise.wgerId,
        wgerExercise: exercise,
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
          ? getLocalAliases(c.localKey ?? c.namePt, 'exercise')
          : [...(c.catalogRow?.aliases ?? []), ...c.wgerExercise?.aliases ?? []],
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
          fromWger: 0,
        },
      });
    }

    const results: ExerciseSearchResult[] = [];
    let fromWger = 0;

    for (const { item: candidate, matchScore } of ranked) {
      if (candidate.source === 'local') {
        results.push({
          id: null,
          name: candidate.namePt,
          nameEn: candidate.nameEn,
          source: 'local',
          wgerId: null,
          localKey: candidate.localKey ?? null,
          matchScore,
          caloriasPorMinuto: candidate.caloriasPorMinuto,
          category: candidate.category,
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

      if (candidate.wgerId && candidate.wgerExercise) {
        const detail =
          (await fetchWgerExerciseDetail(candidate.wgerId)) ?? candidate.wgerExercise;
        const namePt = resolveExerciseNamePt(detail);
        const caloriasPorMinuto = estimateCaloriasPorMinuto(namePt, candidate.caloriasPorMinuto);
        const aliases = buildAliasesForExternal(
          detail.nameEn,
          namePt,
          'exercise',
          detail.aliases,
        );

        const saved = await upsertWgerExercise(service, detail, {
          namePt,
          caloriasPorMinuto,
          aliases,
        });
        fromWger += 1;
        results.push({
          ...catalogRowToResult(saved, matchScore),
          name: saved.name_pt,
          source: 'wger',
          matchScore,
          caloriasPorMinuto,
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
        fromWger,
      },
    });
  } catch (e) {
    if (e instanceof Response) return e;
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});
