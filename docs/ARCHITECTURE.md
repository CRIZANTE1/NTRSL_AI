# Arquitetura

> Descreve o estado **v1.2.0**. Versões anteriores: [versions/](./versions/README.md)

## Visão geral

```mermaid
flowchart TB
    subgraph client [App React + Capacitor]
        UI[Telas e componentes]
        NutritionLib[lib/nutrition.ts offline]
        ApiClient[lib/api.ts + edgeFunctions]
        AuthCtx[AuthContext + Supabase]
        LocalDb[SQLite / localStorage]
    end

    subgraph cloud [Nuvem]
        Supabase[Supabase Auth + DB]
        EdgeFn[Edge Functions + Gemini]
    end

    UI --> NutritionLib
    UI --> ApiClient
    UI --> AuthCtx
    UI --> LocalDb
    AuthCtx --> Supabase
    ApiClient -->|"JWT Bearer"| EdgeFn
    EdgeFn --> Supabase
    LocalDb -->|"outbox daily_logs"| Supabase
```

## Stack

| Camada | Tecnologia |
|--------|------------|
| UI | React 19, React Router 7, Tailwind 4 |
| Build | Vite 6, TypeScript 5.8 |
| Mobile | Capacitor 8 |
| Auth | Supabase Auth (e-mail/senha) |
| Estado servidor | TanStack Query (cache global) |
| Gráficos | Recharts |
| Busca alimentos/exercícios | Fuse.js |

## Estrutura `src/`

```
src/
├── main.tsx              # Entry; valida env Supabase
├── appShell.tsx          # Router + Auth + QueryClient
├── App.tsx               # Efeitos Capacitor + rotas
├── routes/AppRoutes.tsx  # Definição de rotas
├── layouts/AppLayout.tsx # Header + bottom nav + outlet
├── pages/                # Telas por rota
├── components/           # UI reutilizável
├── contexts/AuthContext.tsx
├── lib/
│   ├── nutrition.ts      # Cálculo offline
│   ├── api.ts            # Cliente Edge Functions (Gemini)
│   ├── supabase.ts
│   ├── localDb/          # Cache + fila offline
│   └── data/outboxSync.ts
├── data/
│   ├── calorias.json
│   └── exercicios.json
├── theme/                # Design tokens
└── types/
```

## Rotas

| Rota | Auth | Descrição |
|------|------|-----------|
| `/login` | Não | Login e-mail/senha |
| `/cadastro` | Não | Registro |
| `/` | Sim | Redireciona para `/home` ou `/login` |
| `/home` | Sim | Registro do dia + resumo + IA |
| `/historico` | Sim | Histórico (stub Fase 4) |
| `/sobre` | Sim | Página institucional |
| `/profile` | Sim | Perfil e logout |
| `/settings` | Sim | Tema e atalhos |
| `/settings/privacy` | Sim | Privacidade e biometria |
| `/settings/personalizacao` | Sim | Densidade de UI |

## Fluxo principal (Home)

1. Usuário seleciona exercícios (`ExercisePicker`) e alimentos (`FoodPicker`)
2. **Calcular resumo** → `postNutritionSummary()` (Edge Function `nutrition-summary` + Gemini); fallback offline em `buildSummary()`
3. Exibe kcal gastas/consumidas, balanço e `MacroChart`
4. **Pedir recomendação IA** → Edge Function `ai-recommendations` com JWT
5. Cooldown consultado via `ai-cooldown` (`CooldownBanner`)

## Cálculo nutricional (cliente)

Portado do protótipo Streamlit:

- Alimentos: macros proporcionais à quantidade em **gramas** (`qty / 100`)
- Água: quantidade em **litros** → convertida para ml (`× 1000`) antes do fator
- Exercícios: `calorias_queimadas_por_minuto × duração`

Fonte: `src/data/calorias.json`, `src/data/exercicios.json`

## Offline e sincronização

- **Resumo do dia**: funciona sem rede (cálculo local)
- **Fila outbox** (`localDb` + `outboxSync`): preparada para `daily_logs` (insert/upsert)
- **NetworkBanner**: aviso offline + sincronização manual da fila
- **OfflineSyncEffects**: processa fila ao voltar online ou ao retornar ao app

## Capacitor

| Módulo | Uso |
|--------|-----|
| `NativeShellEffects` | Status bar, splash, teclado |
| `BiometricLock` | Bloqueio ao retornar do background |
| `PushNotificationsEffects` | FCM + registro no Supabase |
| `OfflineSyncEffects` | Sync da fila local |

## Segurança

- Chave Gemini **somente nos secrets das Edge Functions** (`GOOGLE_API_KEY`) — ver [GEMINI_SECRETS.md](./GEMINI_SECRETS.md); nunca `VITE_GEMINI_API_KEY` no cliente
- JWT Supabase enviado no header `Authorization` para as Edge Functions
- Credenciais biométricas em secure storage (nativo)
- Auditoria de erros críticos via `security_audit_events` (quando configurado)
