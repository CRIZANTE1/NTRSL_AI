# NTRSL AI — Briefing completo para assistentes (Claude / Cursor)

Documento de handoff do repositório **NTRSL_AI**. Use como contexto único ao continuar desenvolvimento, debug ou deploy.

**Versão npm:** `1.0.1` · **Release documentada:** v1.2.0 + trabalho **Unreleased** (UX v1.3, buscas, admin, catálogos, Coach semanal)  
**Idioma do produto e das respostas ao usuário:** **pt-BR**

---

## 1. O que é o app

**NTRSL AI** (`com.ntrsl.ai`) é um app mobile de **saúde e bem-estar** (React + Capacitor Android):

- Registro diário de **alimentos** (gramas) e **exercícios** (minutos)
- Cálculo de calorias/macros (offline + refino opcional via **Gemini**)
- Gráficos de macronutrientes e dashboard semanal
- **Coach IA** com contexto dos **últimos 7 dias** e resposta estruturada (alimentos, água, exercícios)
- Persistência na nuvem (**Supabase**), fila offline, push (FCM), biometria

Protótipo original inspirado em app Streamlit; lógica nutricional portada para TypeScript.

---

## 2. Projeto Supabase (produção)

| Campo | Valor |
|-------|--------|
| Nome | NTRLS_AI |
| Project ref / ID | `aumvxnccdhcrftvnliwa` |
| Região | us-east-1 |
| URL | `https://aumvxnccdhcrftvnliwa.supabase.co` |

### Edge Functions deployadas (estado recente)

| Slug | JWT | Gemini? | Notas |
|------|-----|---------|--------|
| `food-search` | sim | **Não** | Dicionário + fuzzy + USDA FDC + `rankCandidates` |
| `exercise-search` | sim | **Não** | Dicionário + fuzzy + WGER + `rankCandidates` |
| `nutrition-summary` | sim | **Sim** | Baseline local + merge; pula Gemini se todos itens têm macros |
| `ai-recommendations` | sim | **Sim** | Coach semanal JSON estruturado; cooldown 30 min |
| `ai-cooldown` | sim | Não | Consulta cooldown |
| `push-register` | sim | Não | Registro FCM |
| `fdc-test` | **não** | Não | Função de teste |

**Deploy recomendado:** Supabase CLI (não MCP Cursor para payloads grandes):

```bash
# .env na raiz (gitignored): SUPABASE_ACCESS_TOKEN=sbp_...
npx supabase functions deploy nutrition-summary --project-ref aumvxnccdhcrftvnliwa
npx supabase functions deploy ai-recommendations --project-ref aumvxnccdhcrftvnliwa
npx supabase functions deploy food-search --project-ref aumvxnccdhcrftvnliwa
npx supabase functions deploy exercise-search --project-ref aumvxnccdhcrftvnliwa
```

Alternativa: `npx supabase login --token sbp_...` (evitar fluxo interativo se der `Transport error` no `secrets set`).

---

## 3. Stack técnica

| Camada | Tecnologia |
|--------|------------|
| UI | React 19, React Router 7, Tailwind CSS 4 |
| Build | Vite 6, TypeScript 5.8, ESLint 9 |
| Estado servidor | TanStack Query 5 (`useDailyLog`, `useDailyLogHistory`, `useSaveDailyLog`, `useUserGoals`) |
| Gráficos | Recharts 3 |
| Busca local (fallback) | Fuse.js 7 |
| Mobile | Capacitor 8 (Android) |
| Backend | Supabase Auth + Postgres + Edge Functions (Deno) |
| IA | Google Gemini via `@google/generative-ai` **somente no servidor** |

### Plugins Capacitor relevantes

Biometria, secure storage, SQLite, push, splash, status bar, keyboard, haptics, app lifecycle.

Config: `capacitor.config.ts` — `appId: com.ntrsl.ai`, `webDir: dist`, fundo `#F5F0EA`.

---

## 4. Estrutura de pastas

```
NTRSL_AI/
├── src/
│   ├── pages/              # Telas (lazy-loaded)
│   ├── hooks/              # useDailyLog, useUserGoals, useCountdown, …
│   ├── components/         # FoodPicker, CoachSection, AiRefineResultCard, …
│   ├── layouts/AppLayout.tsx
│   ├── routes/AppRoutes.tsx
│   ├── contexts/AuthContext.tsx
│   ├── lib/
│   │   ├── api.ts          # postNutritionSummary, postAiRecommendations
│   │   ├── nutrition.ts    # buildSummary, mergeNutritionSummary
│   │   ├── coachContext.ts # contexto semanal para Coach IA
│   │   ├── recentItems.ts  # recentes, section mode, coach goals
│   │   ├── data/dailyLogs.ts
│   │   └── localDb/        # SQLite + outbox offline
│   ├── capacitor/          # push, sync, biometria
│   ├── theme/colors.ts     # Design tokens (OBRIGATÓRIO)
│   ├── theme/glass.ts      # makeGlassSurfaceStyle (modais glass)
│   └── types/              # nutrition.ts, profile.ts, supabase.ts
├── supabase/
│   ├── functions/
│   │   ├── nutrition-summary/
│   │   ├── ai-recommendations/
│   │   ├── food-search/
│   │   ├── exercise-search/
│   │   └── _shared/        # gemini, nutrition, search-rank, …
│   └── migrations/
├── android/
├── scripts/
└── docs/
```

---

## 5. Variáveis de ambiente

### App (`.env.local`) — embutidas no bundle Vite

```env
VITE_SUPABASE_URL=https://aumvxnccdhcrftvnliwa.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
# VITE_ENABLE_PUSH=true   # opcional
```

**Nunca** colocar no cliente: `GOOGLE_API_KEY`, `FDC_API_KEY`, `WEGER_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### Supabase Edge Functions — Secrets

| Secret | Função |
|--------|--------|
| `GOOGLE_API_KEY` | `nutrition-summary`, `ai-recommendations` |
| `GEMINI_MODEL` | Opcional; código força `gemini-3.1-flash-lite` (ignora `gemini-2.5-flash` legado) |
| `FDC_API_KEY` | `food-search` |
| `WEGER_API_KEY` | `exercise-search` (opcional) |

### CLI local (`.env` na raiz, gitignored)

```env
SUPABASE_ACCESS_TOKEN=sbp_...
```

---

## 6. Rotas e navegação

Bottom nav: **Resumo** (`/dashboard`), **Seu dia** (`/home`), Histórico, Sobre.

| Rota | Auth | Descrição |
|------|------|-----------|
| `/home` | Sim | **Seu dia** — pickers, auto-save, ícone cérebro (refino IA), Coach semanal |
| `/dashboard` | Sim | **Resumo** — anéis, gráficos 7 dias, streak; aceita `?date=` |
| `/settings` | Sim | Metas diárias (kcal, proteína, carbs) |
| `/admin` | Sim + admin | Gerenciar roles |

Guardas: `ProtectedRoute`, `AdminRoute`.

---

## 7. Autenticação e roles

- Supabase Auth e-mail/senha
- `profiles`: display_name, role, avatar, **goal_kcal**, **goal_proteina**, **goal_carbs**
- Enum `app_role`: `user` | `admin`
- RLS: usuário vê só seus dados; admin vê todos

---

## 8. Banco de dados (Postgres)

| Migration | Conteúdo |
|-----------|----------|
| `20260611120000_ntrsl_initial_schema.sql` | Schema base |
| `20260612140000_food_catalog.sql` | Cache alimentos FDC |
| `20260612160000_exercise_catalog.sql` | Cache exercícios WGER |
| `20260614120000_profile_goals.sql` | Metas em `profiles` |

Tabelas: `profiles`, `daily_logs`, `ai_usage`, `food_catalog`, `exercise_catalog`, `push_tokens`.

---

## 9. Edge Functions — contratos

Base: `{VITE_SUPABASE_URL}/functions/v1/{slug}`  
Cliente: `src/lib/edgeFunctions.ts` → `src/lib/api.ts`

### `nutrition-summary` (POST) — Gemini condicional

**Body:** `exercises` e `foods` como `ExerciseEntry` / `FoodEntry` completos (`per100g`, `caloriasPorMinuto`, `localKey`).

**Fluxo** (`nutrition-summary/index.ts` + `_shared/nutrition.ts`):

1. `buildSummaryFromEntries()` — baseline local com macros do catálogo
2. Se todos os itens têm dados locais → retorna baseline **sem** Gemini
3. Senão → Gemini com baseline como piso → `mergeNutritionSummary()` no servidor

**App:** `buildSummary()` local → `postNutritionSummary()` → `mergeNutritionSummary()` no cliente (anti-zeragem).

### `ai-recommendations` (POST) — Coach semanal

**Body:**

```json
{
  "resumo": { "gastas", "consumidas", "exercicios", "alimentos", "proteina", … },
  "userGoals": "texto do usuário",
  "logDate": "YYYY-MM-DD",
  "profileGoals": { "kcal", "proteina", "carbs" },
  "weeklyContext": { "anchorDate", "days": [...], "totals": {...} }
}
```

**Response:**

```json
{
  "recommendation": "texto formatado (fallback)",
  "structured": {
    "visaoSemanal": "…",
    "alimentos": ["…"],
    "agua": ["…"],
    "exercicios": ["…"],
    "proximoPasso": "…"
  },
  "elapsedSeconds": 3.2
}
```

Cooldown: 30 min (`ai_usage`). Ver `docs/API.md` para contratos completos.

### Buscas — **sem Gemini**

- `food-search` — local → cache → USDA FDC → `rankCandidates`
- `exercise-search` — local → cache → WGER → `rankCandidates`

### Modelo Gemini

`supabase/functions/_shared/gemini.ts`:

- `resolveGeminiModelName()` → padrão **`gemini-3.1-flash-lite`**
- Ignora secrets legados `gemini-2.5-flash`, `gemini-2.0-flash`
- `generateJson<T>()` — usado por `nutrition-summary` e `ai-recommendations`

---

## 10. Módulos `_shared` (Edge)

```
supabase/functions/_shared/
├── auth.ts
├── cors.ts
├── gemini.ts              # resolveGeminiModelName, generateJson
├── nutrition.ts           # buildSummaryFromEntries, mergeNutritionSummary, needsAiRefinement
├── search-rank.ts
├── search-dictionary.ts
├── food-catalog.ts
├── exercise-catalog.ts
├── fdc.ts
├── wger.ts
└── data/                  # calorias.json, exercicios.json, aliases
```

---

## 11. App React — fluxos principais

> UX detalhada: [UX_SEU_DIA.md](./UX_SEU_DIA.md) · [UX_MELHORIAS_USUARIO.md](./UX_MELHORIAS_USUARIO.md)

### TanStack Query

| Hook | Uso |
|------|-----|
| `useDailyLog` | Log de um dia |
| `useDailyLogHistory` | Últimos 30 dias (streak, Coach semanal, gráficos) |
| `useSaveDailyLog` | Upsert + invalidação |
| `useUserGoals` | Metas `profiles` (kcal, proteína, carbs) |

### Seu dia (`NutritionHomePage` — `/home`)

| Feature | Implementação |
|---------|---------------|
| Auto-save | Debounce 1,5 s; **flush** ao desmontar (`pendingSaveRef`) |
| Resumo tempo real | `liveSummary` → `DaySummaryBar` + `MacroChart` |
| Toggle seções | Ambos / Só alimentos / Só exercícios; foco no picker |
| Pickers | Recentes, undo, haptic; dropdown fecha fora/scroll; badges "c/ macros" / "estimado" |
| Refinar IA | Ícone **cérebro** no header → `postNutritionSummary` + merge → `AiRefineResultCard` (glass) |
| Coach IA | `buildWeeklyCoachContext` → `postAiRecommendations` → blocos estruturados |

### Contexto semanal (`src/lib/coachContext.ts`)

- `buildWeeklyCoachContext(historyRows, anchorDate)` — 7 dias + totais
- `applyLiveDayToWeeklyContext(...)` — dia atual com dados ao vivo dos pickers
- `waterLitersFromFoods(foods)` — litros de água registrados

### Cálculo local (`src/lib/nutrition.ts`)

- `buildSummary(exercises, foods)` — offline
- `mergeNutritionSummary(local, ai)` — nunca zera se local > 0
- `getSummaryAdjustments(before, after)` — diff para `AiRefineResultCard`

### Componentes IA-chave

| Componente | Arquivo | Função |
|------------|---------|--------|
| `CoachSection` | `components/CoachSection.tsx` | Accordion; resposta em blocos (Alimentos, Água, Exercícios) |
| `AiRefineResultCard` | `components/AiRefineResultCard.tsx` | Modal glass pós-refino |
| `CooldownBanner` | `components/CooldownBanner.tsx` | Countdown via `useCountdown` |

### Resumo (`DashboardPage`)

- `?date=` na URL (sync com Seu dia)
- Anéis com metas de `useUserGoals()` (não hardcoded)

### Offline

- `localDb/` + `outboxSync.ts` — fila `daily_logs`
- Badge "No celular — sincroniza online" na Home

---

## 12. Scripts úteis

| Comando | Uso |
|---------|-----|
| `npm run build:search-aliases` | Regenera aliases JSON |
| `node scripts/backfill-catalog-pt.mjs` | Backfill `name_pt` no catálogo |
| `node scripts/test-food-search.mjs` | Teste manual food-search |

---

## 13. Design System

Fonte: `src/theme/colors.ts` e `.cursor/rules/design-system-colors.mdc`

```ts
background: '#F5F0EA'    surface: '#FFFFFF'    surfaceWarm: '#FDF6EE'
accent: '#E8A87C'        points: '#6B9E78'     border: '#EDEDE9'
textPrimary / textSecondary / textMuted
```

Glass: `src/theme/glass.ts` (`makeGlassSurfaceStyle`) — usado em `AiRefineResultCard`, header, bottom nav.

**Regra:** não inventar hex novos; responder em pt-BR.

---

## 14. Android (Capacitor)

`npm run cap:sync` → `npm run cap:open` → APK no Android Studio. Ver `docs/ANDROID.md`.

---

## 15. Comandos do dia a dia

```bash
npm install
npm run dev              # :3000
npm run build
npm run lint
npm run cap:sync

# Deploy funções IA (após alterar _shared/gemini.ts ou nutrition.ts)
npx supabase functions deploy nutrition-summary --project-ref aumvxnccdhcrftvnliwa
npx supabase functions deploy ai-recommendations --project-ref aumvxnccdhcrftvnliwa
```

---

## 16. Documentação humana

| Arquivo | Conteúdo |
|---------|----------|
| [UX_SEU_DIA.md](./UX_SEU_DIA.md) | Refactor Seu dia, auto-save, componentes |
| [UX_MELHORIAS_USUARIO.md](./UX_MELHORIAS_USUARIO.md) | Metas, pickers, Coach semanal, refino IA |
| [API.md](./API.md) | Contratos Edge Functions |
| [GEMINI_SECRETS.md](./GEMINI_SECRETS.md) | Chaves e modelo |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Diagramas, rotas |
| [SUPABASE.md](./SUPABASE.md) | Schema, RLS |
| [versions/v1.3.0.md](./versions/v1.3.0.md) | Planejado / em progresso |

---

## 17. Convenções para assistentes

1. Responder em **português (pt-BR)**.
2. Cores: tokens de `src/theme/colors.ts` apenas.
3. **Gemini só no servidor** — nunca `VITE_GEMINI_*`.
4. Buscas food/exercise: dicionário + fuzzy, **não** Gemini.
5. Deploy Edge Functions: **CLI** (MCP trunca payloads grandes).
6. Não commitar `.env`, tokens `sbp_`.
7. Commits só quando o usuário pedir.
8. Diffs mínimos; seguir estilo existente.

---

## 18. Trabalho recente (Unreleased — jun/2026)

### UX Speed & Clarity
- `liveSummary` em tempo real; flush auto-save ao sair
- Pickers: dropdown dismiss, `inputMode="decimal"`, badges "c/ macros"
- Countdown Coach no header (`useCountdown`)

### Refino com IA
- CTA fixo **removido** → ícone cérebro no header
- `mergeNutritionSummary` cliente + servidor (anti-zeragem)
- `nutrition-summary`: baseline local, payload completo, merge
- `AiRefineResultCard` — modal glass com diff e confirmação

### Coach IA semanal
- `coachContext.ts` — últimos 7 dias (kcal, água, exercício)
- `ai-recommendations` — JSON estruturado: alimentos, água, exercícios, próximo passo
- `CoachSection` — blocos com ícones

### Infra / Gemini
- `resolveGeminiModelName()` ignora `gemini-2.5-flash` (evita 503)
- Deploy: `nutrition-summary`, `ai-recommendations`

### Anterior (v1.2)
- Buscas `rankCandidates`, admin `/admin`, catálogos FDC/WGER
- Metas em `profiles`, toggle seções, recentes, undo

### Próximos passos (não implementados)

- Histórico completo (`HistoricoPage`)
- Google OAuth Android
- FCM produção (`google-services.json`)
- Tema escuro dedicado
- CI GitHub Actions

---

## 19. Mapa rápido de arquivos-chave

| Tarefa | Arquivo |
|--------|---------|
| Tela Seu dia | `src/pages/NutritionHomePage.tsx` |
| Coach UI | `src/components/CoachSection.tsx` |
| Card pós-refino | `src/components/AiRefineResultCard.tsx` |
| Contexto semanal | `src/lib/coachContext.ts` |
| Cálculo + merge | `src/lib/nutrition.ts` |
| API cliente | `src/lib/api.ts` |
| Metas usuário | `src/hooks/useUserGoals.ts` |
| Pickers | `src/components/FoodPicker.tsx`, `ExercisePicker.tsx` |
| Dashboard | `src/pages/DashboardPage.tsx` |
| Edge nutrition-summary | `supabase/functions/nutrition-summary/index.ts` |
| Edge ai-recommendations | `supabase/functions/ai-recommendations/index.ts` |
| Edge nutrition shared | `supabase/functions/_shared/nutrition.ts` |
| Gemini / modelo | `supabase/functions/_shared/gemini.ts` |
| Edge food-search | `supabase/functions/food-search/index.ts` |
| Tipos nutrição | `src/types/nutrition.ts` (`CoachRecommendationStructured`) |
| Cores / glass | `src/theme/colors.ts`, `src/theme/glass.ts` |
| Nova migration | `supabase/migrations/` |

---

*Atualizado jun/2026. Mantenha este arquivo alinhado a mudanças estruturais em Edge Functions, fluxos de IA e UX de `/home`.*
