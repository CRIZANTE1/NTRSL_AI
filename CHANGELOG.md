# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).  
Documentação detalhada por release: [`docs/versions/`](./docs/versions/README.md).

## [Unreleased]

### Documentação

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
