# API — Supabase Edge Functions + Gemini

> Introduzido na **v1.1.0**; `push-register` na **v1.2.0**. Ver [versions/README.md](./versions/README.md).

O cliente em `src/lib/api.ts` chama Edge Functions do Supabase. A chave Gemini fica **somente** nos secrets do Supabase (`GOOGLE_API_KEY`).

**Configuração da chave:** [GEMINI_SECRETS.md](./GEMINI_SECRETS.md) — não use `VITE_GEMINI_API_KEY` no app.

**Base URL:** `{VITE_SUPABASE_URL}/functions/v1/<nome-da-função>`

**Autenticação:** `Authorization: Bearer <supabase_access_token>` + header `apikey: <anon_key>`

---

## `food-search` (POST)

Busca alimentos com **dicionário estático pt↔en** (gerado de `calorias.json`), correspondência **fuzzy cross-lingual** (local + cache + USDA FDC) e **upsert** automático em `food_catalog` (traduz `name_pt` uma vez no cache).

**Secrets necessários:** `FDC_API_KEY` (ver [GEMINI_SECRETS.md](./GEMINI_SECRETS.md)). **Não usa Gemini.**

**Regenerar dicionário:** `npm run build:search-aliases`

**Body:**

```json
{
  "query": "frango grelhado",
  "limit": 12
}
```

**Response:**

```json
{
  "results": [
    {
      "id": "uuid-ou-null",
      "name": "Frango grelhado",
      "nameEn": "Chicken, grilled",
      "source": "fdc",
      "fdcId": 173944,
      "localKey": null,
      "matchScore": 0.91,
      "per100g": { "calorias": 165, "proteina": 31, "carboidratos": 0, "gordura": 3.6 }
    }
  ],
  "meta": {
    "query": "frango grelhado",
    "translatedTerms": ["grilled chicken", "chicken breast grilled"],
    "fromLocal": 1,
    "fromCache": 0,
    "fromFdc": 2
  }
}
```

**Fluxo server-side:**

1. `queryToEnTerms` (dicionário) traduz consulta pt→en para busca FDC
2. Fuzzy com aliases em local (`calorias.json`), cache (`food_catalog`) e candidatos FDC
3. `rankCandidates` ordena com boost: local > cache > fdc
4. Item FDC novo: `resolveNamePt` + `aliases` → upsert em `food_catalog` (pt-BR persistido)

---

## `exercise-search` (POST)

Busca exercícios com **dicionário estático pt↔en** (gerado de `exercicios.json`), tradução **WGER nativa (pt)**, fuzzy cross-lingual e upsert em `exercise_catalog`.

**Secrets necessários:** `WEGER_API_KEY` (opcional — ver [GEMINI_SECRETS.md](./GEMINI_SECRETS.md)). **Não usa Gemini.**

**Regenerar dicionário:** `npm run build:search-aliases`

**Body:**

```json
{
  "query": "agachamento",
  "limit": 12
}
```

**Response:**

```json
{
  "results": [
    {
      "id": "uuid-ou-null",
      "name": "Agachamento",
      "nameEn": "Squat",
      "source": "wger",
      "wgerId": 124,
      "localKey": null,
      "matchScore": 0.89,
      "caloriasPorMinuto": 5.0,
      "category": "Legs"
    }
  ],
  "meta": {
    "query": "agachamento",
    "translatedTerms": ["squat", "bodyweight squat"],
    "fromLocal": 1,
    "fromCache": 0,
    "fromWger": 2
  }
}
```

**Campos de `source`:**

| Valor | Significado |
|-------|-------------|
| `local` | Lista embarcada `exercicios.json` |
| `cache` | Já persistido em `exercise_catalog` |
| `wger` | Recém-buscado na API WGER e salvo no cache |

**Fluxo server-side:**

1. `queryToEnTerms` (dicionário) + busca WGER em `pt` com fallback `en`
2. Fuzzy com aliases em local (`exercicios.json`), cache e WGER
3. `rankCandidates` com boost: local > cache > wger
4. Item WGER novo: nome pt (WGER ou dicionário) + aliases → upsert; calorias estimadas da lista local

**Cliente:** `postExerciseSearch()` em `src/lib/api.ts` · UI: `ExercisePicker` (debounce 400 ms, fallback local se offline)

---

## `nutrition-summary` (POST)

Calcula resumo nutricional via **Gemini**, usando as tabelas embarcadas de alimentos e exercícios.

**Body:**

```json
{
  "exercises": [
    { "name": "caminhada rapida", "durationMinutes": 30 }
  ],
  "foods": [
    { "name": "banana", "quantity": 100 }
  ]
}
```

**Response:** objeto `NutritionSummary` (ver `src/types/nutrition.ts`)

**Fallback no app:** se a função falhar (rede/offline), a Home usa `buildSummary()` local.

---

## `ai-recommendations` (POST)

Gera recomendação de coach via Gemini. Requer JWT válido.

**Body:**

```json
{
  "resumo": {
    "gastas": 120,
    "consumidas": 1800,
    "exercicios": ["caminhada rapida (30 min)"],
    "duracao": 30,
    "alimentos": ["banana (100 g)"],
    "proteina": 45,
    "carboidratos": 200,
    "gordura": 60
  },
  "userGoals": "Quero perder peso mantendo proteína alta"
}
```

**Response:**

```json
{
  "recommendation": "Texto formatado do coach...",
  "elapsedSeconds": 3.2
}
```

**Regras server-side:**

- Cooldown **30 minutos** por `user_id` (tabela `ai_usage`)
- Modelo padrão: `gemini-3.1-flash-lite` (override com secret `GEMINI_MODEL`)

---

## `ai-cooldown` (GET)

Retorna tempo restante até próxima solicitação de recomendação permitida.

**Response:**

```json
{
  "remainingSeconds": 1240,
  "allowed": false
}
```

---

## Códigos de erro

| HTTP | Situação |
|------|----------|
| 401 | Token ausente ou inválido |
| 429 | Cooldown IA ativo |
| 502 | Falha na API Gemini, FDC ou WGER |
| 500 | Secret ou configuração ausente |

---

## Deploy

```bash
# Na raiz do projeto, com Supabase CLI logado no projeto
supabase secrets set GOOGLE_API_KEY=<gemini-api-key>
supabase secrets set FDC_API_KEY=<usda-fdc-key>      # food-search
supabase secrets set WEGER_API_KEY=<wger-token>      # exercise-search (opcional)
# Opcional:
supabase secrets set GEMINI_MODEL=gemini-3.1-flash-lite

supabase functions deploy nutrition-summary
supabase functions deploy ai-recommendations
supabase functions deploy ai-cooldown
supabase functions deploy food-search
supabase functions deploy exercise-search
```

**Scripts úteis** (pasta `scripts/`):

```bash
npm run build:search-aliases          # gera food/exercise-aliases.json
node scripts/backfill-catalog-pt.mjs  # corrige name_pt no catálogo (requer service role)
node scripts/test-food-search.mjs       # teste manual da Edge Function
```

Configure `SUPABASE_ACCESS_TOKEN` no `.env` (local, gitignored) ou rode `supabase login` antes do deploy CLI.

Variáveis injetadas automaticamente pelo Supabase em runtime:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

> Nunca expor `GOOGLE_API_KEY` no app mobile.

---

## Código-fonte

```
supabase/functions/
├── nutrition-summary/
├── ai-recommendations/
├── ai-cooldown/
├── food-search/
├── exercise-search/
└── _shared/          # auth, cors, gemini, fuzzy, search-dictionary, fdc, wger, catálogos
```

Cliente: `src/lib/edgeFunctions.ts`, `src/lib/api.ts` (`postFoodSearch`, `postExerciseSearch`)
