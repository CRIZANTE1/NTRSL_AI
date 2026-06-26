#!/usr/bin/env node
/**
 * Corrige name_pt em inglês no catálogo (quando name_pt === name_en).
 * Requer SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente.
 *
 * Uso: node scripts/backfill-catalog-pt.mjs
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'supabase/functions/_shared/data');

function loadAliasEntries(filename) {
  const data = JSON.parse(readFileSync(join(dataDir, filename), 'utf8'));
  return data.entries ?? [];
}

function buildEnToPt(entries) {
  const map = new Map();
  for (const entry of entries) {
    for (const en of entry.searchTermsEn ?? []) {
      map.set(en.trim().toLowerCase(), entry.namePt);
    }
    for (const alias of entry.aliases ?? []) {
      if (!/[áàâãéêíóôõúç]/i.test(alias)) {
        map.set(alias.trim().toLowerCase(), entry.namePt);
      }
    }
  }
  return map;
}

function resolveNamePt(nameEn, enToPt) {
  const key = nameEn.trim().toLowerCase();
  if (enToPt.has(key)) return enToPt.get(key);

  let best = '';
  let bestLen = 0;
  for (const [en, pt] of enToPt) {
    if (key.includes(en) && en.length > bestLen) {
      best = pt;
      bestLen = en.length;
    }
  }
  return best || nameEn;
}

async function backfillTable(client, table, enToPt) {
  const { data, error } = await client.from(table).select('id, name_pt, name_en, aliases');
  if (error) throw new Error(`${table}: ${error.message}`);

  let updated = 0;
  for (const row of data ?? []) {
    const en = (row.name_en ?? '').trim();
    const pt = (row.name_pt ?? '').trim();
    if (!en || pt.toLowerCase() !== en.toLowerCase()) continue;

    const resolved = resolveNamePt(en, enToPt);
    if (resolved.toLowerCase() === pt.toLowerCase()) continue;

    const aliases = [...new Set([...(row.aliases ?? []), en, resolved])];
    const { error: upErr } = await client
      .from(table)
      .update({ name_pt: resolved, aliases })
      .eq('id', row.id);

    if (upErr) {
      console.warn(`Falha ${table} ${row.id}:`, upErr.message);
      continue;
    }
    updated++;
    console.log(`${table}: ${en} → ${resolved}`);
  }

  return updated;
}

const url = process.env.SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url || !serviceKey) {
  console.error('Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const client = createClient(url, serviceKey);
const foodEnToPt = buildEnToPt(loadAliasEntries('food-aliases.json'));
const exerciseEnToPt = buildEnToPt(loadAliasEntries('exercise-aliases.json'));

const foodUpdated = await backfillTable(client, 'food_catalog', foodEnToPt);
const exerciseUpdated = await backfillTable(client, 'exercise_catalog', exerciseEnToPt);

console.log(`Concluído: food_catalog=${foodUpdated}, exercise_catalog=${exerciseUpdated}`);
