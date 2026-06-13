/**
 * Teste rápido da Edge Function food-search.
 * Uso: node scripts/test-food-search.mjs [query]
 */
import fs from 'fs';
import path from 'path';

function loadEnvLocal() {
  const envPath = path.resolve(import.meta.dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) return {};
  const out = {};
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) out[m[1].trim()] = m[2].trim();
  }
  return out;
}

const env = loadEnvLocal();
const url = (env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const anon = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const query = process.argv[2] || 'frango';

if (!url || !anon) {
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY ausentes em .env.local');
  process.exit(1);
}

async function callFoodSearch(token, q) {
  const res = await fetch(`${url}/functions/v1/food-search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: q, limit: 5 }),
  });
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

// 1) Sem JWT
const noAuth = await callFoodSearch(anon, query);
console.log('=== Sem JWT de usuário (só apikey) ===');
console.log('status:', noAuth.status, JSON.stringify(noAuth.body).slice(0, 160));

// 2) Criar usuário temporário
const email = `ntrsl-food-test-${Date.now()}@mailinator.com`;
const password = 'NtrslTestFood2026!';
const signUp = await fetch(`${url}/auth/v1/signup`, {
  method: 'POST',
  headers: { apikey: anon, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const signUpBody = await signUp.json();
const token = signUpBody.access_token ?? signUpBody.session?.access_token;

console.log('\n=== Signup temporário ===');
console.log('email:', email);
console.log('status:', signUp.status, 'hasToken:', Boolean(token));
if (signUpBody.msg) console.log('msg:', signUpBody.msg);
if (signUpBody.error_description) console.log('detail:', signUpBody.error_description);

if (!token) {
  console.error('\nNão foi possível obter JWT. Confirme se confirmação de e-mail está desativada no Supabase.');
  process.exit(1);
}

const t0 = Date.now();
const result = await callFoodSearch(token, query);
const ms = Date.now() - t0;

console.log(`\n=== food-search "${query}" ===`);
console.log('status:', result.status, `(${ms} ms)`);

if (result.status !== 200) {
  console.log('erro:', JSON.stringify(result.body, null, 2).slice(0, 800));
  process.exit(1);
}

const { meta, results } = result.body;
console.log('meta:', meta);
console.log('resultados:');
for (const r of results ?? []) {
  console.log(
    `  - ${r.name} [${r.source}] score=${r.matchScore?.toFixed?.(2) ?? r.matchScore} | ${r.per100g?.calorias ?? '?'} kcal/100g`,
  );
}

console.log('\nOK — food-search respondeu com sucesso.');
