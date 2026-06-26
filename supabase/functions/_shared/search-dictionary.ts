import foodAliasesData from './data/food-aliases.json' with { type: 'json' };
import exerciseAliasesData from './data/exercise-aliases.json' with { type: 'json' };
import { fuzzyScore, normalizeText } from './fuzzy.ts';

export type SearchDomain = 'food' | 'exercise';

export interface AliasEntry {
  localKey: string;
  namePt: string;
  searchTermsEn: string[];
  aliases: string[];
}

interface AliasIndex {
  entries: AliasEntry[];
  byLocalKey: Map<string, AliasEntry>;
  enToPt: Map<string, string>;
  ptToEn: Map<string, string[]>;
}

function buildIndex(data: { entries: AliasEntry[] }): AliasIndex {
  const byLocalKey = new Map<string, AliasEntry>();
  const enToPt = new Map<string, string>();
  const ptToEn = new Map<string, string[]>();

  for (const entry of data.entries) {
    byLocalKey.set(entry.localKey, entry);
    ptToEn.set(normalizeText(entry.localKey), entry.searchTermsEn);

    for (const en of entry.searchTermsEn) {
      enToPt.set(normalizeText(en), entry.namePt);
    }
    for (const alias of entry.aliases) {
      if (/[áàâãéêíóôõúç]/i.test(alias)) {
        enToPt.set(normalizeText(alias), entry.namePt);
      } else {
        enToPt.set(normalizeText(alias), entry.namePt);
      }
    }
  }

  return { entries: data.entries, byLocalKey, enToPt, ptToEn };
}

let foodIndex: AliasIndex | null = null;
let exerciseIndex: AliasIndex | null = null;

export function loadFoodAliasIndex(): AliasIndex {
  if (!foodIndex) foodIndex = buildIndex(foodAliasesData as { entries: AliasEntry[] });
  return foodIndex;
}

export function loadExerciseAliasIndex(): AliasIndex {
  if (!exerciseIndex) {
    exerciseIndex = buildIndex(exerciseAliasesData as { entries: AliasEntry[] });
  }
  return exerciseIndex;
}

function getIndex(domain: SearchDomain): AliasIndex {
  return domain === 'food' ? loadFoodAliasIndex() : loadExerciseAliasIndex();
}

export function getLocalAliases(localKey: string, domain: SearchDomain): string[] {
  const entry = getIndex(domain).byLocalKey.get(localKey);
  return entry?.aliases ?? [localKey];
}

export function buildSearchLabel(namePt: string, nameEn: string | null, aliases: string[]): string {
  return [namePt, nameEn ?? '', ...aliases].filter(Boolean).join(' ');
}

export function queryToEnTerms(query: string, domain: SearchDomain, maxTerms = 3): string[] {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const index = getIndex(domain);
  const normalizedQuery = normalizeText(trimmed);
  const terms = new Set<string>();

  if (isLikelyEnglish(trimmed)) {
    terms.add(trimmed);
  }

  const phraseEntry = index.entries.find(
    (e) => normalizeText(e.localKey) === normalizedQuery || normalizeText(e.namePt) === normalizedQuery,
  );
  if (phraseEntry) {
    for (const en of phraseEntry.searchTermsEn) terms.add(en);
  }

  const mapped = index.ptToEn.get(normalizedQuery);
  if (mapped) {
    for (const en of mapped) terms.add(en);
  }

  for (const entry of index.entries) {
    if (fuzzyScore(trimmed, entry.localKey) >= 0.85) {
      for (const en of entry.searchTermsEn) terms.add(en);
    }
  }

  const tokenized = composeFromTokens(trimmed, domain);
  for (const t of tokenized) terms.add(t);

  if (!terms.size) terms.add(trimmed);

  return [...terms].slice(0, maxTerms);
}

function isLikelyEnglish(text: string): boolean {
  return /^[a-z0-9\s()./-]+$/i.test(text) && !/[áàâãéêíóôõúç]/i.test(text);
}

function composeFromTokens(query: string, domain: SearchDomain): string[] {
  const index = getIndex(domain);
  const words = query.split(/\s+/).filter(Boolean);
  const out: string[] = [];

  for (const entry of index.entries) {
    const entryWords = entry.localKey.split(/\s+/);
    if (entryWords.length !== words.length) continue;
    let hits = 0;
    for (let i = 0; i < words.length; i++) {
      if (fuzzyScore(words[i], entryWords[i]) >= 0.8) hits++;
    }
    if (hits === words.length) {
      out.push(...entry.searchTermsEn);
    }
  }

  return out;
}

export function resolveNamePt(enText: string, domain: SearchDomain): string {
  const trimmed = enText.trim();
  if (!trimmed) return trimmed;

  const index = getIndex(domain);
  const normalized = normalizeText(trimmed);

  const exact = index.enToPt.get(normalized);
  if (exact) return exact;

  let bestPt = '';
  let bestScore = 0;
  for (const [enKey, namePt] of index.enToPt) {
    const score = fuzzyScore(trimmed, enKey);
    if (score > bestScore && score >= 0.72) {
      bestScore = score;
      bestPt = namePt;
    }
  }
  if (bestPt) return bestPt;

  for (const entry of index.entries) {
    for (const en of entry.searchTermsEn) {
      const score = fuzzyScore(trimmed, en);
      if (score >= 0.8) return entry.namePt;
    }
  }

  return trimmed;
}

export function buildAliasesForExternal(
  nameEn: string,
  namePt: string,
  domain: SearchDomain,
  extra: string[] = [],
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const add = (value: string) => {
    const t = value.trim();
    if (!t) return;
    const key = normalizeText(t);
    if (seen.has(key)) return;
    seen.add(key);
    out.push(t);
  };

  add(namePt);
  add(nameEn);
  for (const a of extra) add(a);
  for (const token of nameEn.split(/[\s,()/]+/)) {
    if (token.length >= 3) add(token);
  }

  const entry = getIndex(domain).entries.find((e) => e.namePt === namePt);
  if (entry) {
    for (const a of entry.aliases) add(a);
    for (const en of entry.searchTermsEn) add(en);
  }

  return out;
}
