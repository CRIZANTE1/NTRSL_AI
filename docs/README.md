# Documentação — NTRSL AI

Índice da documentação do app mobile **NTRSL AI** (`com.ntrsl.ai`).

## Versões (releases)

Documentação **por versão** — o que mudou, como configurar e limitações de cada release:

| Versão | Documento |
|--------|-----------|
| Índice | [versions/README.md](./versions/README.md) |
| v1.0.0 | [Shell + offline](./versions/v1.0.0.md) |
| v1.1.0 | [Gemini Edge Functions](./versions/v1.1.0.md) |
| **v1.2.0** | **[Atual — DB + sync](./versions/v1.2.0.md)** |
| v1.3.0 | [Planejado](./versions/v1.3.0.md) |

Changelog resumido: [`CHANGELOG.md`](../CHANGELOG.md) na raiz.

## Guias técnicos

| Documento | Conteúdo |
|-----------|----------|
| [SETUP.md](./SETUP.md) | Pré-requisitos, variáveis de ambiente, dev web |
| [ANDROID.md](./ANDROID.md) | **Capacitor → pasta `android/` + APK no Android Studio** (incl. Gradle, JDK, proxy/SSL) |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, pastas, rotas, fluxos e offline |
| [UX_SEU_DIA.md](./UX_SEU_DIA.md) | Refactor "Seu dia" — auto-save, TanStack Query, componentes |
| [UX_DIARIO.md](./UX_DIARIO.md) | Página **Diário** (`/diario`) — texto livre, layout, estilos, fluxo IA |
| [UX_MELHORIAS_USUARIO.md](./UX_MELHORIAS_USUARIO.md) | **Metas**, recentes, undo, **Coach semanal**, refino IA, glass card |
| [API.md](./API.md) | Edge Functions Supabase + Gemini |
| [GEMINI_SECRETS.md](./GEMINI_SECRETS.md) | **Onde configurar `GOOGLE_API_KEY`** (e por que não no `.env.local`) |
| [SUPABASE.md](./SUPABASE.md) | Auth, schema, RLS e push |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Tokens de cor e regras de UI |

## Visão rápida (v1.2.0)

O NTRSL AI permite:

- Registrar exercícios e alimentos do dia (busca remota USDA + WGER com fallback offline)
- **Auto-save** com debounce ao editar pickers; badge de status (Salvando / Salvo / Pendente sync)
- Calcular/refinar resumo via **ícone cérebro** + Gemini (`nutrition-summary`); confirmação em card glass
- **Coach IA** — analisa **7 dias**, resposta estruturada (alimentos, água, exercícios)
- Salvar e consultar histórico em **`daily_logs`** (TanStack Query: `useDailyLog`, `useDailyLogHistory`)
- **Metas personalizadas** em `profiles` (kcal, proteína, carbs) — Configurações + anéis do Resumo
- **Seu dia** — toggle Ambos/Só alimentos/Só exercícios, recentes, undo, streak, "Repetir ontem"
- **Resumo em tempo real** — `DaySummaryBar` e gráfico atualizam ao editar pickers (sem esperar auto-save)
- **Pickers** — dropdown fecha ao clicar fora/rolar; foco automático ao trocar seção; badges "c/ macros" / "estimado"
- **Resumo** (`/dashboard`) — anéis com metas do perfil; aceita `?date=` vindo do Seu dia
- Solicitar recomendações de coach via **Gemini**
- Autenticar com Supabase (e-mail/senha; Google OAuth em v1.3.0)

## Repositório

```
NTRSL_AI/
├── src/                   # Frontend React + Capacitor
├── docs/                  # Esta pasta
│   └── versions/          # Documentação por release
├── supabase/
│   ├── migrations/        # Schema versionado
│   └── functions/         # Edge Functions (Gemini)
├── android/               # Gerado após npx cap add android
├── CHANGELOG.md
└── package.json
```

## Comandos úteis

```bash
npm run dev          # Web em http://localhost:3000
npm run lint         # TypeScript + ESLint
npm run build        # Build produção → dist/
npm run cap:sync     # Build + sync Android
npm run cap:open     # Abre Android Studio
```
