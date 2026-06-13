# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).  
Documentação detalhada por release: [`docs/versions/`](./docs/versions/README.md).

## [Unreleased]

### Adicionado

- Edge Function `exercise-search` — busca de exercícios (local + cache + WGER; dicionário estático, sem Gemini)
- Tabela `exercise_catalog` (migration `20260612160000_exercise_catalog.sql`)
- `ExercisePicker` com busca remota, debounce e fallback local (espelha `FoodPicker`)
- `postExerciseSearch()` em `src/lib/api.ts`; tipos `ExerciseSearchResult` / `ExerciseSearchResponse`
- Secret `WEGER_API_KEY` nos secrets do Supabase (opcional; evita rate-limit na WGER)
- Scripts: `build-search-aliases.mjs`, `backfill-catalog-pt.mjs`, `test-food-search.mjs`

- Roles `user` e `admin` em `profiles` (enum `app_role`, RLS, trigger anti auto-promoção)
- Painel `/admin` para admins gerenciarem roles
- `AuthContext.isAdmin`, badge de role no perfil

### Alterado

- Modelo Gemini padrão: `gemini-2.5-flash` → **`gemini-3.1-flash-lite`** (`_shared/gemini.ts`; override via secret `GEMINI_MODEL`)

### Documentação

- [GEMINI_SECRETS.md](./docs/GEMINI_SECRETS.md) — seção **Modelo Gemini (padrão)**; `gemini-3.1-flash-lite`
- [API.md](./docs/API.md) — contrato `exercise-search`, deploy via Supabase CLI
- [GEMINI_SECRETS.md](./docs/GEMINI_SECRETS.md) — secret `WEGER_API_KEY`
- [SUPABASE.md](./docs/SUPABASE.md) — tabela `exercise_catalog`
- [ARCHITECTURE.md](./docs/ARCHITECTURE.md) — fluxo de busca remota no `ExercisePicker`
- [ANDROID.md](./docs/ANDROID.md) — sync Capacitor; APK gerado no Android Studio (não via CLI)
- [GEMINI_SECRETS.md](./docs/GEMINI_SECRETS.md) — configuração de `GOOGLE_API_KEY` no Supabase; proibição de `VITE_GEMINI_API_KEY` no cliente

---

## [v1.2.0] — 2026-06-11

### Adicionado

- Schema Supabase: `profiles`, `daily_logs`, `ai_usage`, `push_tokens`, `security_audit_events`
- RLS, trigger de perfil no cadastro, bucket `avatars`
- `src/lib/data/dailyLogs.ts` — persistência e histórico
- Home carrega/salva registro do dia; Histórico funcional
- `AuthContext` integrado à tabela `profiles`
- Edge Function `push-register` deployada
- Migrations versionadas em `supabase/migrations/`
- Tipos TypeScript regenerados (`src/types/supabase.ts`)

### Alterado

- `outboxSync` usa `onConflict: 'user_id,log_date'`
- `audit.ts` tipado contra schema real

### Segurança

- Revoke de execução pública em `handle_new_user()`
- `set_updated_at()` com `search_path` fixo

**Doc:** [docs/versions/v1.2.0.md](./docs/versions/v1.2.0.md)

---

## [v1.1.0] — 2026-06-11

### Adicionado

- Edge Functions: `nutrition-summary`, `ai-recommendations`, `ai-cooldown`
- `src/lib/edgeFunctions.ts`
- Cálculo de resumo via Gemini na Home (com fallback offline)

### Removido

- Dependência de FastAPI e `VITE_API_BASE_URL`

**Doc:** [docs/versions/v1.1.0.md](./docs/versions/v1.1.0.md)

---

## [v1.0.0] — baseline

### Adicionado

- App React 19 + Capacitor 8
- Auth e-mail/senha, telas principais, bottom nav
- Cálculo nutricional offline (`nutrition.ts` + JSON)
- Infraestrutura offline preparada (localDb, outbox)

**Doc:** [docs/versions/v1.0.0.md](./docs/versions/v1.0.0.md)

---

## [v1.3.0] — planejado

- Google OAuth, tema escuro, push FCM, testes e CI

**Doc:** [docs/versions/v1.3.0.md](./docs/versions/v1.3.0.md)
