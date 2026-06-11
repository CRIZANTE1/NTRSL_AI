# NTRSL AI (Android) — React + Capacitor

App mobile **NTRSL AI** (`com.ntrsl.ai`) para **saúde e bem-estar**: registro de exercícios e alimentos, cálculo calórico com Gemini, gráfico de macronutrientes e recomendações via IA.

## Stack

- **Frontend**: React 19 + Vite
- **Mobile**: Capacitor 8 (Android)
- **Auth/dados**: Supabase
- **IA**: Gemini via **Supabase Edge Functions** (`supabase/functions/`)

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

## Edge Functions (Gemini)

Deploy das funções no Supabase e configure o secret `GOOGLE_API_KEY`:

```bash
supabase secrets set GOOGLE_API_KEY=<sua-chave-gemini>
supabase functions deploy nutrition-summary
supabase functions deploy ai-recommendations
supabase functions deploy ai-cooldown
```

Detalhes em [`docs/API.md`](./docs/API.md).

## Build e sincronizar com Android (Capacitor)

```bash
npm run cap:sync
npm run cap:open
```

Após instalar ou atualizar plugins Capacitor, rode **`npm run cap:sync`** para aplicar mudanças ao projeto Android.

## Documentação

Veja a pasta [`docs/`](./docs/README.md):

- [Setup](./docs/SETUP.md) — ambiente e Android
- [Arquitetura](./docs/ARCHITECTURE.md) — rotas, fluxos e offline
- [API](./docs/API.md) — Edge Functions + Gemini
- [Supabase](./docs/SUPABASE.md) — schema e auth
- [Design System](./docs/DESIGN_SYSTEM.md) — tokens de cor e UI

Modelo de variáveis: [`.env.example`](./.env.example)
