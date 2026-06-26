import { rankFuzzy } from './fuzzy.ts';

export type SearchSource = 'local' | 'cache' | 'fdc' | 'wger';

export interface RankableCandidate<T> {
  ref: string;
  source: SearchSource;
  item: T;
  label: string;
}

const SOURCE_BOOST: Record<SearchSource, number> = {
  local: 0.12,
  cache: 0.06,
  fdc: 0,
  wger: 0,
};

export function rankCandidates<T>(
  query: string,
  candidates: RankableCandidate<T>[],
  limit: number,
  minScore = 0.25,
): Array<{ ref: string; source: SearchSource; item: T; matchScore: number }> {
  const ranked = rankFuzzy(
    query,
    candidates.map((c) => ({ item: c, label: c.label })),
    minScore,
  );

  return ranked
    .map(({ item: candidate, score }) => ({
      ref: candidate.ref,
      source: candidate.source,
      item: candidate.item,
      matchScore: Math.min(1, score + SOURCE_BOOST[candidate.source]),
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, limit);
}
