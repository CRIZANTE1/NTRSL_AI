# NTRSL AI — Briefing completo para assistentes (Claude / Cursor)

Documento de handoff do repositório **NTRSL_ANDROID**. Use como contexto único ao continuar desenvolvimento, debug ou deploy.

**Versão npm:** `1.0.1` · **Release documentada:** v1.2.0 + trabalho **Unreleased** (buscas, admin, catálogos)  
**Idioma do produto e das respostas ao usuário:** **pt-BR**

---

## 1. O que é o app

**NTRSL AI** (`com.ntrsl.ai`) é um app mobile de **saúde e bem-estar** (React + Capacitor Android):

- Registro diário de **alimentos** (gramas) e **exercícios** (minutos)
- Cálculo de calorias/macros (offline + opcionalmente via **Gemini**)
- Gráficos de macronutrientes e dashboard semanal
- Recomendações de coach via **IA** (Gemini, com cooldown)
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

| Slug | Versão | JWT | Gemini? | Notas |
|------|--------|-----|---------|--------|
| `food-search` | **37** | sim | **Não** | Dicionário + fuzzy + USDA FDC + `rankCandidates` |
| `exercise-search` | **10** | sim | **Não** | Dicionário + fuzzy + WGER + `rankCandidates` |
| `nutrition-summary` | 4 | sim | **Sim** | Resumo nutricional |
| `ai-recommendations` | 4 | sim | **Sim** | Coach IA, cooldown 30 min |
| `ai-cooldown` | 4 | sim | Não | Consulta cooldown |
| `push-register` | 4 | sim | Não | Registro FCM |
| `fdc-test` | 2 | **não** | Não | Função de teste |

**Deploy recomendado:** Supabase CLI (não MCP Cursor para payloads grandes):

```bash
# .env na raiz (gitignored): SUPABASE_ACCESS_TOKEN=sbp_...
npx supabase functions deploy food-search --project-ref aumvxnccdhcrftvnliwa
npx supabase functions deploy exercise-search --project-ref aumvxnccdhcrftvnliwa
```

Alternativa: `npx supabase login --token sbp_...` (evitar fluxo interativo com código de verificação se der `Transport error`).

---

## 3. Stack técnica

| Camada | Tecnologia |
|--------|------------|
| UI | React 19, React Router 7, Tailwind CSS 4 |
| Build | Vite 6, TypeScript 5.8, ESLint 9 |
| Estado servidor | TanStack Query 5 |
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
NTRSL_ANDROID/
├── src/                    # App React
│   ├── pages/              # Telas (lazy-loaded)
│   ├── components/         # UI (FoodPicker, ExercisePicker, MacroChart, …)
│   ├── layouts/AppLayout.tsx
│   ├── routes/AppRoutes.tsx
│   ├── contexts/AuthContext.tsx
│   ├── lib/                # api, nutrition, supabase, data, admin, localDb
│   ├── capacitor/          # Efeitos nativos (push, sync, biometria)
│   ├── theme/colors.ts     # Design tokens (OBRIGATÓRIO para cores)
│   ├── data/               # calorias.json, exercicios.json (fallback offline)
│   └── types/              # nutrition.ts, profile.ts, supabase.ts (gerado/manual)
├── supabase/
│   ├── functions/          # Edge Functions + _shared/
│   ├── migrations/         # SQL versionado
│   └── config.toml         # verify_jwt por função
├── android/                # Projeto Gradle Capacitor (~54 arquivos; splashes/ícones normais)
├── scripts/                # Utilitários (ver §12)
├── docs/                   # Documentação humana
├── .env.local              # VITE_* (app) — gitignored
├── .env                    # SUPABASE_ACCESS_TOKEN (CLI local) — gitignored
└── .env.example            # Modelo só com VITE_*
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

### Supabase Edge Functions — Secrets no Dashboard ou CLI

| Secret | Função |
|--------|--------|
| `GOOGLE_API_KEY` | `nutrition-summary`, `ai-recommendations` |
| `GEMINI_MODEL` | Opcional; padrão `gemini-3.1-flash-lite` |
| `FDC_API_KEY` | `food-search` (USDA FoodData Central) |
| `WEGER_API_KEY` | `exercise-search` (opcional; WGER funciona sem, com rate limit) |

Injetados automaticamente pelo Supabase: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### CLI local (`.env` na raiz, gitignored)

```env
SUPABASE_ACCESS_TOKEN=sbp_...
```

---

## 6. Rotas e navegação

Definidas em `src/routes/AppRoutes.tsx`. Bottom nav (`BottomNav.tsx`): Home, Dashboard, Histórico, Sobre.

| Rota | Auth | Descrição |
|------|------|-----------|
| `/login` | Não | Login e-mail/senha |
| `/cadastro` | Não | Registro |
| `/` | Sim | Redireciona (`RootRedirect`) |
| `/home` | Sim | Registro do dia, pickers, resumo, IA |
| `/dashboard` | Sim | Gráficos 7 dias, metas calorias/macros |
| `/historico` | Sim | Histórico (em evolução) |
| `/sobre` | Sim | Institucional |
| `/profile` | Sim | Perfil, avatar, logout, link admin |
| `/settings` | Sim | Configurações |
| `/settings/privacy` | Sim | Privacidade, biometria |
| `/settings/personalizacao` | Sim | Densidade UI |
| `/admin` | Sim + **role admin** | Gerenciar roles de usuários |

Guardas: `ProtectedRoute`, `AdminRoute` (`AuthContext.isAdmin`).

---

## 7. Autenticação e roles

- **Supabase Auth** e-mail/senha (`AuthContext`)
- Perfil em `public.profiles` criado por trigger no cadastro
- Enum `app_role`: `user` | `admin`
- RLS: usuário vê só seus dados; admin vê todos profiles/logs/audit
- Trigger impede auto-promoção a admin
- Promover primeiro admin via SQL Editor:

```sql
update public.profiles set role = 'admin' where email = 'seu@email.com';
```

Código admin: `src/lib/admin/users.ts`, `src/pages/AdminPage.tsx`.

---

## 8. Banco de dados (Postgres)

Migrations em `supabase/migrations/`:

| Arquivo | Conteúdo |
|---------|----------|
| `20260611120000_ntrsl_initial_schema.sql` | profiles, daily_logs, ai_usage, push_tokens, security_audit, avatars |
| `20260611120100_ntrsl_security_hardening.sql` | Hardening RLS/RPC |
| `20260612120000_profile_roles.sql` | Roles user/admin |
| `20260612140000_food_catalog.sql` | Cache alimentos (FDC + local) |
| `20260612160000_exercise_catalog.sql` | Cache exercícios (WGER + local) |
| `20260613120000_backfill_catalog_pt_names.sql` | Doc operacional backfill |

### Tabelas principais

- **profiles** — display_name, role, avatar
- **daily_logs** — `log_date`, exercises/foods/summary JSONB, unique (user_id, log_date)
- **ai_usage** — cooldown recomendações IA
- **food_catalog** — name_pt, name_en, fdc_id, macros, aliases[], raw_fdc
- **exercise_catalog** — name_pt, name_en, wger_id, calorias_por_minuto, aliases[]

Catálogos: SELECT para authenticated; INSERT/UPDATE via service role nas Edge Functions.

---

## 9. Edge Functions — contratos e fluxos

Base URL: `{VITE_SUPABASE_URL}/functions/v1/{slug}`  
Headers: `Authorization: Bearer <jwt>`, `apikey: <anon>`, `Content-Type: application/json`

Cliente: `src/lib/edgeFunctions.ts` → `src/lib/api.ts`

### Busca de alimentos — `food-search` (POST) — **sem Gemini**

Body: `{ "query": "frango", "limit": 12 }`

Fluxo (`supabase/functions/food-search/index.ts`):

1. Candidatos **local** (`calorias.json` embarcado)
2. Cache **`food_catalog`**
3. API **USDA FDC** (`FDC_API_KEY`) com termos en de `queryToEnTerms`
4. **`rankCandidates`** (`search-rank.ts`) — boost: local > cache > fdc
5. Novos FDC: `resolveNamePt` + upsert em `food_catalog`

Shared: `search-dictionary.ts`, `food-catalog.ts`, `fdc.ts`, `fuzzy.ts`, `food-aliases.json`.

### Busca de exercícios — `exercise-search` (POST) — **sem Gemini**

Body: `{ "query": "agachamento", "limit": 12 }`

Fluxo (`exercise-search/index.ts`):

1. Local `exercicios.json`
2. Cache `exercise_catalog`
3. API **WGER** (`wger.ts`, token opcional)
4. **`rankCandidates`** — boost: local > cache > wger
5. Upsert WGER com nome pt e calorias/min (local ou estimada)

### IA — **com Gemini**

| Função | Método | Uso |
|--------|--------|-----|
| `nutrition-summary` | POST | Calcula resumo a partir de listas |
| `ai-recommendations` | POST | Texto coach; cooldown 30 min |
| `ai-cooldown` | GET | Segundos restantes |

Modelo: `supabase/functions/_shared/gemini.ts` — padrão `gemini-3.1-flash-lite`.

### Outras

- **`push-register`** — registra token FCM
- Fallback app: se Edge Function falhar, Home usa `buildSummary()` em `src/lib/nutrition.ts`
- Pickers: debounce ~400 ms; fallback Fuse.js em `src/data/*.json` se offline

---

## 10. Módulos `_shared` (Edge)

```
supabase/functions/_shared/
├── auth.ts              # requireUser, getServiceClient
├── cors.ts              # CORS + jsonResponse
├── gemini.ts            # GOOGLE_API_KEY, generateJson
├── fuzzy.ts             # normalizeText, fuzzyScore, rankFuzzy
├── search-dictionary.ts # queryToEnTerms, resolveNamePt, aliases
├── search-rank.ts       # rankCandidates (boost por source)
├── food-catalog.ts      # searchFoodCatalog, upsertFdcFood
├── exercise-catalog.ts  # searchExerciseCatalog, upsertWgerExercise
├── fdc.ts               # USDA FDC API
├── wger.ts              # WGER API (pt/en translations)
└── data/
    ├── food-aliases.json      # gerado por build:search-aliases
    ├── exercise-aliases.json
    ├── pt-en-food-tokens.json
    ├── pt-en-exercise-tokens.json
    ├── calorias.json          # cópia/ref para functions
    └── exercicios.json
```

---

## 11. App React — fluxos principais

### Home (`NutritionHomePage`)

1. `FoodPicker` → `postFoodSearch()` ou fallback local
2. `ExercisePicker` → `postExerciseSearch()` ou fallback local
3. Calcular → `postNutritionSummary()` ou `buildSummary()` offline
4. `MacroChart` — proteína, carbs, gordura
5. Recomendação → `postAiRecommendations()` + `CooldownBanner` / `getAiCooldown()`

### Cálculo local (`src/lib/nutrition.ts`)

- Alimentos: macros proporcionais `qty/100` gramas; água em litros → ml
- Exercícios: `calorias_queimadas_por_minuto × minutos` (prioriza valor da busca remota)

### Offline

- `src/lib/localDb/` — SQLite (native) / webStore
- `src/lib/data/outboxSync.ts` — fila para `daily_logs`
- `NetworkBanner`, `OfflineSyncEffects`

### Dashboard

- `fetchDailyLogHistory` — últimos 7 dias, gráficos Recharts, metas fixas (2000 kcal etc.)

---

## 12. Scripts úteis (`scripts/`)

| Script | Comando |
|--------|---------|
| `build-search-aliases.mjs` | `npm run build:search-aliases` — regera aliases JSON |
| `backfill-catalog-pt.mjs` | Corrige `name_pt` em inglês no catálogo (service role) |
| `test-food-search.mjs` | Teste HTTP manual da Edge Function |
| `sql/food-search-sql-editor.sql` | DDL referência `food_catalog` |

**Removidos do repo:** centenas de artefatos temporários MCP (`.mcp-*`, deploy steps). Não recriar.

---

## 13. Design System

Fonte: `src/theme/colors.ts` e `.cursor/rules/design-system-colors.mdc`

```ts
background: '#F5F0EA'    // fundo tela
surface: '#FFFFFF'       // cards
surfaceWarm: '#FDF6EE'
accent: '#E8A87C'        // CTA
textPrimary / textSecondary / textMuted
border: '#EDEDE9'
points: '#6B9E78'        // progresso/ok
badge: '#FF4444'         // notificações
```

**Regra:** não inventar hex novos na UI; usar tokens.

Estilo: glass morphism leve (`src/theme/glass.ts`), bottom nav com filtro SVG.

---

## 14. Android (Capacitor)

- Pasta `android/` versionada — template Capacitor + ícones/splashes múltiplas densidades (normal)
- **Não commitar:** `android/local.properties`, `build/`, `.gradle/`
- Fluxo: `npm run cap:sync` → `npm run cap:open` → APK no **Android Studio**
- Doc: `docs/ANDROID.md`

---

## 15. Comandos do dia a dia

```bash
npm install
npm run dev              # web :3000
npm run build
npm run lint
npm run cap:sync         # build + sync android
npm run cap:open
npm run build:search-aliases

# Deploy função
npx supabase functions deploy food-search --project-ref aumvxnccdhcrftvnliwa
```

---

## 16. Git e arquivos ignorados

`.gitignore` relevante:

- `.env*` (exceto `.env.example`)
- `node_modules/`, `dist/`, `build/`
- `android/.idea/`, `android/local.properties`, builds Gradle
- `supabase/.temp/`
- Artefatos deploy: `deploy-*.json`, `scripts/.*/`, `scripts/*-deploy-steps/`

---

## 17. Documentação existente (humana)

| Arquivo | Conteúdo |
|---------|----------|
| `docs/SETUP.md` | Ambiente, secrets, deploy |
| `docs/ARCHITECTURE.md` | Diagramas, rotas, offline |
| `docs/API.md` | Contratos Edge Functions |
| `docs/SUPABASE.md` | Schema, RLS, roles |
| `docs/GEMINI_SECRETS.md` | Chaves, modelo, rotação |
| `docs/ANDROID.md` | Capacitor, APK |
| `docs/DESIGN_SYSTEM.md` | UI |
| `CHANGELOG.md` | Unreleased + releases |
| `docs/versions/` | Notas v1.0–v1.2 |

---

## 18. Convenções para assistentes

1. Responder em **português (pt-BR)**.
2. Cores: sempre tokens de `src/theme/colors.ts`.
3. **Gemini só no servidor** — nunca `VITE_GEMINI_*`.
4. Buscas **food/exercise** usam dicionário + fuzzy, **não** Gemini (desde refactor recente).
5. Deploy Edge Functions grandes: **CLI**, não MCP (payload ~80 KB+ trunca).
6. Não commitar `.env`, tokens `sbp_`, artefatos MCP.
7. Commits só quando o usuário pedir explicitamente.
8. Preferir diffs mínimos; seguir estilo do arquivo existente.

---

## 19. Trabalho recente (Unreleased)

- Refactor buscas: `rankCandidates`, `search-dictionary`, aliases estáticos
- Deploy remoto: `food-search` v37, `exercise-search` v10
- Admin panel `/admin`, roles em profiles
- Dashboard semanal
- Limpeza de scripts MCP temporários
- Pasta `android/` adicionada ao repo

### Possíveis próximos passos (não implementados aqui)

- Histórico completo (`HistoricoPage`)
- Google OAuth Android
- FCM / `google-services.json` produção
- Backfill catálogo pt (`backfill-catalog-pt.mjs`)
- Rotacionar token `sbp_` se exposto

---

## 20. Mapa rápido de arquivos-chave

| Tarefa | Arquivo |
|--------|---------|
| Nova rota | `src/routes/AppRoutes.tsx` |
| Chamada API | `src/lib/api.ts`, `src/lib/edgeFunctions.ts` |
| Tipos nutrição | `src/types/nutrition.ts` |
| Tipos DB | `src/types/supabase.ts` |
| Auth | `src/contexts/AuthContext.tsx` |
| Picker alimentos | `src/components/FoodPicker.tsx` |
| Picker exercícios | `src/components/ExercisePicker.tsx` |
| Lógica offline | `src/lib/nutrition.ts` |
| Edge food-search | `supabase/functions/food-search/index.ts` |
| Edge exercise-search | `supabase/functions/exercise-search/index.ts` |
| Gemini server | `supabase/functions/_shared/gemini.ts` |
| Ranking busca | `supabase/functions/_shared/search-rank.ts` |
| Nova migration | `supabase/migrations/` |
| Capacitor config | `capacitor.config.ts` |

---

*Gerado para handoff entre sessões de IA. Atualize este arquivo quando houver mudanças estruturais relevantes.*
