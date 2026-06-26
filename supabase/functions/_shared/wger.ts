const WGER_BASE = 'https://wger.de/api/v2';

/** WGER language id: 2 = English, 4 = Portuguese (Brazil). */
const WGER_LANG_EN = 2;
const WGER_LANG_PT = 4;

export interface WgerExerciseSummary {
  wgerId: number;
  nameEn: string;
  namePt: string | null;
  category: string;
  aliases: string[];
  raw: Record<string, unknown>;
}

interface WgerTranslation {
  name?: string;
  language?: number;
  aliases?: Array<{ alias?: string } | string>;
}

interface WgerExerciseInfo {
  id?: number;
  category?: { name?: string };
  translations?: WgerTranslation[];
}

function getWgerApiKey(): string | null {
  return Deno.env.get('WEGER_API_KEY') ?? null;
}

function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const key = getWgerApiKey();
  if (key) {
    headers['Authorization'] = `Token ${key}`;
  }
  return headers;
}

export function pickEnglishName(translations: WgerTranslation[] | undefined): string {
  if (!translations?.length) return '';
  const en = translations.find((t) => t.language === WGER_LANG_EN);
  if (en?.name?.trim()) return en.name.trim();
  const first = translations.find((t) => t.name?.trim());
  return first?.name?.trim() ?? '';
}

export function pickPortugueseName(translations: WgerTranslation[] | undefined): string {
  if (!translations?.length) return '';
  const pt = translations.find((t) => t.language === WGER_LANG_PT);
  if (pt?.name?.trim()) return pt.name.trim();
  return '';
}

function extractAliases(translations: WgerTranslation[] | undefined): string[] {
  if (!translations?.length) return [];
  const aliases = new Set<string>();
  for (const t of translations) {
    const list = t.aliases ?? [];
    for (const a of list) {
      const value = typeof a === 'string' ? a : a.alias;
      if (value?.trim()) aliases.add(value.trim());
    }
  }
  return [...aliases];
}

function mapExerciseInfo(item: WgerExerciseInfo): WgerExerciseSummary | null {
  const wgerId = Number(item.id);
  if (!Number.isFinite(wgerId)) return null;

  const nameEn = pickEnglishName(item.translations);
  if (!nameEn) return null;

  return {
    wgerId,
    nameEn,
    namePt: pickPortugueseName(item.translations) || null,
    category: String(item.category?.name ?? '').trim(),
    aliases: extractAliases(item.translations),
    raw: item as Record<string, unknown>,
  };
}

async function fetchWgerSearch(query: string, languageCode: string, limit: number): Promise<WgerExerciseSummary[]> {
  const url = new URL(`${WGER_BASE}/exerciseinfo/`);
  url.searchParams.set('name__search', query);
  url.searchParams.set('language__code', languageCode);
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url, { headers: buildAuthHeaders() });
  if (!res.ok) return [];

  const data = (await res.json()) as { results?: WgerExerciseInfo[] };
  const results = Array.isArray(data.results) ? data.results : [];

  const byId = new Map<number, WgerExerciseSummary>();
  for (const item of results) {
    const mapped = mapExerciseInfo(item);
    if (mapped && !byId.has(mapped.wgerId)) {
      byId.set(mapped.wgerId, mapped);
    }
  }

  return [...byId.values()];
}

export async function searchWgerExercises(query: string, limit = 25): Promise<WgerExerciseSummary[]> {
  const ptHits = await fetchWgerSearch(query, 'pt', limit);
  if (ptHits.length >= limit) return ptHits.slice(0, limit);

  const enHits = await fetchWgerSearch(query, 'en', limit);
  const byId = new Map<number, WgerExerciseSummary>();
  for (const hit of [...ptHits, ...enHits]) {
    if (!byId.has(hit.wgerId)) byId.set(hit.wgerId, hit);
  }

  return [...byId.values()].slice(0, limit);
}

export async function fetchWgerExerciseDetail(wgerId: number): Promise<WgerExerciseSummary | null> {
  const url = new URL(`${WGER_BASE}/exerciseinfo/${wgerId}/`);

  const res = await fetch(url, { headers: buildAuthHeaders() });
  if (!res.ok) return null;

  const item = (await res.json()) as WgerExerciseInfo;
  return mapExerciseInfo(item);
}
