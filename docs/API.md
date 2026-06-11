# API REST (FastAPI)

Contratos esperados pelo cliente em `src/lib/api.ts`. O backend deve ser implementado separadamente (pasta `api/`).

**Base URL:** valor de `VITE_API_BASE_URL` (padrão `http://localhost:8000`)

**Autenticação:** `Authorization: Bearer <supabase_access_token>`

---

## `GET /health`

Health check. Retorno sugerido: `{ "status": "ok" }`

---

## `POST /api/nutrition/summary`

Valida payload e retorna resumo calculado (espelha `nutrition.ts`).

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

---

## `POST /api/ai/recommendations`

Gera recomendação via Gemini. Requer JWT válido.

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
- Rate limit global (ex.: 60 req/min por IP ou usuário)
- Modelo sugerido: `gemini-2.5-flash`

---

## `GET /api/ai/cooldown`

Retorna tempo restante até próxima solicitação permitida.

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
| 429 | Rate limit ou cooldown IA |
| 502 | Falha na API Gemini |

---

## Variáveis de ambiente (servidor)

```env
GOOGLE_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_JWT_SECRET=...
CORS_ORIGINS=http://localhost:3000,capacitor://localhost,https://localhost
```

> Nunca expor `GOOGLE_API_KEY` no app mobile.
