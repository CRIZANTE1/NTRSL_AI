# NTRSL AI (Android) — React + Capacitor

App mobile **NTRSL AI** (`com.ntrsl.ai`) para **saúde e bem-estar**: registro de exercícios e alimentos, cálculo calórico offline, gráfico de macronutrientes e recomendações via IA (Gemini no backend).

## Stack

- **Frontend**: React 19 + Vite
- **Mobile**: Capacitor 8 (Android)
- **Auth/dados**: Supabase
- **API**: FastAPI (pasta `api/` — a implementar)

## Rodar local (web)

```bash
npm install
npm run dev
```

## Variáveis de ambiente (`.env.local`)

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_API_BASE_URL=http://localhost:8000
```

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
- [API](./docs/API.md) — contratos FastAPI
- [Supabase](./docs/SUPABASE.md) — schema e auth
- [Design System](./docs/DESIGN_SYSTEM.md) — tokens de cor e UI

Modelo de variáveis: [`.env.example`](./.env.example)
