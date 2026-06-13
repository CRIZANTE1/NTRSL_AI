#!/usr/bin/env node
/**
 * Gera food-aliases.json e exercise-aliases.json a partir de calorias.json / exercicios.json.
 * Uso: node scripts/build-search-aliases.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'supabase/functions/_shared/data');

function uniqueStrings(values) {
  const seen = new Set();
  const out = [];
  for (const v of values) {
    const t = String(v ?? '').trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function extractParentheticalEn(name) {
  const match = name.match(/\(([^)]+)\)/);
  if (!match) return [];
  return match[1]
    .split(/[/,]/)
    .map((s) => s.trim())
    .filter((s) => /^[a-z0-9\s-]+$/i.test(s));
}

function isLikelyEnglish(text) {
  return /^[a-z0-9\s()./-]+$/i.test(text) && !/[áàâãéêíóôõúç]/i.test(text);
}

function composeEnTerms(localKey, { tokens, phrases }) {
  if (phrases[localKey]?.length) return [...phrases[localKey]];

  const parenEn = extractParentheticalEn(localKey);
  if (parenEn.length) {
    return uniqueStrings([...parenEn, ...parenEn.map((t) => t.replace(/\s+/g, ' '))]);
  }

  if (isLikelyEnglish(localKey)) {
    return [localKey.trim()];
  }

  const stripped = localKey.replace(/\([^)]*\)/g, '').trim();
  if (phrases[stripped]?.length) return [...phrases[stripped]];

  const words = stripped.split(/\s+/).filter(Boolean);
  const translatedWords = words.map((w) => tokens[w] ?? tokens[w.toLowerCase()] ?? null);
  const composed = translatedWords.filter(Boolean).join(' ');

  const terms = [];
  if (composed) terms.push(composed);
  for (const tw of translatedWords) {
    if (tw) terms.push(tw);
  }

  if (!terms.length) terms.push(stripped);
  return uniqueStrings(terms);
}

function buildEntry(localKey, tokenData) {
  const namePt = localKey.trim();
  const searchTermsEn = composeEnTerms(namePt, tokenData);
  const parenEn = extractParentheticalEn(namePt);
  const aliases = uniqueStrings([
    namePt,
    namePt.replace(/\([^)]*\)/g, '').trim(),
    ...searchTermsEn,
    ...parenEn,
    ...searchTermsEn.flatMap((t) => t.split(/\s+/)),
  ]);

  return { localKey: namePt, namePt, searchTermsEn, aliases };
}

function buildDomain(caloriasOrExerciciosPath, tokenPath, outPath) {
  const source = JSON.parse(readFileSync(caloriasOrExerciciosPath, 'utf8'));
  const tokenData = JSON.parse(readFileSync(tokenPath, 'utf8'));
  const keys = Object.keys(source.nutritional_info ?? source.physical_activity_info ?? {}).sort(
    (a, b) => a.localeCompare(b, 'pt-BR'),
  );

  const entries = keys.map((key) => buildEntry(key, tokenData));
  const payload = { version: 1, generatedAt: new Date().toISOString(), entries };
  writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log(`Wrote ${entries.length} entries → ${outPath}`);
}

buildDomain(
  join(root, 'src/data/calorias.json'),
  join(dataDir, 'pt-en-food-tokens.json'),
  join(dataDir, 'food-aliases.json'),
);

buildDomain(
  join(root, 'src/data/exercicios.json'),
  join(dataDir, 'pt-en-exercise-tokens.json'),
  join(dataDir, 'exercise-aliases.json'),
);
