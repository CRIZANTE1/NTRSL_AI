# API — Supabase Edge Functions + Gemini

> Introduzido na **v1.1.0**; `push-register` na **v1.2.0**. Ver [versions/README.md](./versions/README.md).

O cliente em `src/lib/api.ts` chama Edge Functions do Supabase. A chave Gemini fica **somente** nos secrets do Supabase (`GOOGLE_API_KEY`).

**Configuração da chave:** [GEMINI_SECRETS.md](./GEMINI_SECRETS.md) — não use `VITE_GEMINI_API_KEY` no app.

**Base URL:** `{VITE_SUPABASE_URL}/functions/v1/<nome-da-função>`

**Autenticação:** `Authorization: Bearer <supabase_access_token>` + header `apikey: <anon_key>`

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
- Modelo padrão: `gemini-2.5-flash` (override com secret `GEMINI_MODEL`)

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
| 502 | Falha na API Gemini |
| 500 | Secret ou configuração ausente |

---

## Deploy

```bash
# Na raiz do projeto, com Supabase CLI logado no projeto
supabase secrets set GOOGLE_API_KEY=<gemini-api-key>
# Opcional:
supabase secrets set GEMINI_MODEL=gemini-2.5-flash

supabase functions deploy nutrition-summary
supabase functions deploy ai-recommendations
supabase functions deploy ai-cooldown
```

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
└── _shared/          # auth, cors, gemini, dados JSON
```

Cliente: `src/lib/edgeFunctions.ts`, `src/lib/api.ts`
