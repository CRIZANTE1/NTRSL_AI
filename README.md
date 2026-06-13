# NTRSL AI (Android) — React + Capacitor

App mobile **NTRSL AI** (`com.ntrsl.ai`) para **saúde e bem-estar**: registro de exercícios e alimentos, cálculo calórico com Gemini, gráfico de macronutrientes, persistência na nuvem e recomendações via IA.

**Versão documentada atual:** [v1.2.0](./docs/versions/v1.2.0.md)

## Stack

- **Frontend**: React 19 + Vite
- **Mobile**: Capacitor 8 (Android)
- **Auth/dados**: Supabase (Auth, Postgres, Storage)
- **IA**: Gemini via **Supabase Edge Functions**

## Rodar local (web)

```bash
npm install
npm run dev
```

## Variáveis de ambiente (`.env.local`)

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Modelo: [`.env.example`](./.env.example)

## Edge Functions (Gemini)

Configure `GOOGLE_API_KEY` nos **secrets do Supabase** — **não** use `VITE_GEMINI_API_KEY` no `.env.local`.

Modelo Gemini padrão nas Edge Functions: **`gemini-3.1-flash-lite`** (override opcional: secret `GEMINI_MODEL`).

Para buscas remotas, configure também `FDC_API_KEY` (alimentos) e `WEGER_API_KEY` (exercícios, opcional) nos secrets.

→ **[docs/GEMINI_SECRETS.md](./docs/GEMINI_SECRETS.md)** (Dashboard, CLI, troubleshooting, rotação de chave)

```bash
supabase secrets set GOOGLE_API_KEY=<sua-chave-gemini>
```

Contratos das funções: [`docs/API.md`](./docs/API.md).

## Android (Capacitor)

O repo prepara a pasta `android/`; o **APK você gera no Android Studio**.

```bash
# Primeira vez (se não existir android/):
npm run build && npx cap add android

# Após mudanças no código web:
npm run cap:sync
npm run cap:open
```

Guia completo: **[docs/ANDROID.md](./docs/ANDROID.md)** — sync, `local.properties`, APK debug/release.

## Documentação

| Tipo | Link |
|------|------|
| **Versões** | [`docs/versions/`](./docs/versions/README.md) — v1.0.0 → v1.2.0 (atual) |
| Changelog | [`CHANGELOG.md`](./CHANGELOG.md) |
| Setup | [`docs/SETUP.md`](./docs/SETUP.md) |
| Arquitetura | [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) |
| API / Gemini | [`docs/API.md`](./docs/API.md) |
| Supabase | [`docs/SUPABASE.md`](./docs/SUPABASE.md) |
| Design System | [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) |
