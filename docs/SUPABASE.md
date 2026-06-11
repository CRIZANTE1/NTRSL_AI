# Supabase

> Schema e auth da **v1.2.0**. Histórico de releases: [versions/v1.2.0.md](./versions/v1.2.0.md)

## Auth

O app usa **Supabase Auth** com e-mail e senha (`signInWithPassword` / `signUp`).

Metadados do usuário no cadastro:

- `full_name` / `display_name` → exibidos no perfil

### Google OAuth (planejado)

Para Android com deep link:

1. Configurar provider Google no Supabase
2. Redirect: `com.ntrsl.ai://login-callback` ou App Link verificado
3. Plugin `@capacitor/app` para `appUrlOpen`

## Schema (provisionado)

Migrations em `supabase/migrations/`:

- `20260611120000_ntrsl_initial_schema.sql` — tabelas, RLS, trigger de perfil, bucket `avatars`
- `20260611120100_ntrsl_security_hardening.sql` — revoke RPC do trigger, `search_path` fixo

### Tabelas

| Tabela | Uso |
|--------|-----|
| `profiles` | Perfil do usuário (criado automaticamente no cadastro) |
| `daily_logs` | Registro diário (exercícios, alimentos, resumo) |
| `ai_usage` | Cooldown de recomendações IA |
| `push_tokens` | Tokens FCM |
| `security_audit_events` | Auditoria de erros/ações |

Script de referência original:

```sql
-- Perfil (estende auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now()
);

-- Registro diário
create table public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  exercises jsonb default '[]',
  foods jsonb default '[]',
  summary jsonb,
  created_at timestamptz default now(),
  unique (user_id, log_date)
);

-- Cooldown IA
create table public.ai_usage (
  user_id uuid primary key references auth.users(id) on delete cascade,
  last_request_at timestamptz not null
);

-- RLS: cada usuário só acessa suas linhas
alter table public.profiles enable row level security;
alter table public.daily_logs enable row level security;
alter table public.ai_usage enable row level security;

create policy "profiles_own" on public.profiles
  for all using (auth.uid() = id);

create policy "daily_logs_own" on public.daily_logs
  for all using (auth.uid() = user_id);

create policy "ai_usage_own" on public.ai_usage
  for all using (auth.uid() = user_id);
```

Tipos TypeScript espelhados em `src/types/supabase.ts`. Regenerar com:

```bash
supabase gen types typescript --project-id <id> > src/types/supabase.ts
```

## Storage

Bucket `avatars` (opcional): upload de foto de perfil em `ProfileScreen`.

## Push (FCM)

- Edge Function `push-register` chamada por `src/lib/pushBackend.ts`
- Tokens em `push_tokens` (quando provisionado)
- Preferências locais: `src/lib/notificationPreferences.ts` (`ai_resposta`, `lembrete_diario`)

## Auditoria

Erros críticos do cliente podem ser enviados para `security_audit_events` via `src/lib/audit.ts` (requer tabela e políticas no projeto).
