/** Normaliza texto para comparação fuzzy (pt-BR). */
export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

/** Score 0–1 (1 = match perfeito). */
export function fuzzyScore(query: string, candidate: string): number {
  const q = normalizeText(query);
  const c = normalizeText(candidate);
  if (!q || !c) return 0;
  if (c === q) return 1;
  if (c.includes(q) || q.includes(c)) return 0.92;

  const qTokens = q.split(' ').filter(Boolean);
  const cTokens = c.split(' ').filter(Boolean);
  const tokenHits = qTokens.filter((t) => cTokens.some((ct) => ct.includes(t) || t.includes(ct))).length;
  const tokenRatio = qTokens.length ? tokenHits / qTokens.length : 0;

  const maxLen = Math.max(q.length, c.length);
  const dist = levenshtein(q, c);
  const levRatio = 1 - dist / maxLen;

  return Math.max(0, Math.min(1, levRatio * 0.65 + tokenRatio * 0.35));
}

export interface FuzzyCandidate<T> {
  item: T;
  label: string;
}

export function rankFuzzy<T>(
  query: string,
  candidates: FuzzyCandidate<T>[],
  minScore = 0.25,
): Array<{ item: T; label: string; score: number }> {
  return candidates
    .map(({ item, label }) => ({ item, label, score: fuzzyScore(query, label) }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score);
}
