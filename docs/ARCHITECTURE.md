# Arquitetura

> Descreve o estado **v1.2.0+** (refactor UX + melhorias de usuário). Versões anteriores: [versions/](./versions/README.md) · [UX_SEU_DIA.md](./UX_SEU_DIA.md) · [UX_MELHORIAS_USUARIO.md](./UX_MELHORIAS_USUARIO.md)

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
| Estado servidor | TanStack Query 5 (`useDailyLog`, `useDailyLogHistory`, `useSaveDailyLog`, `useUserGoals`) |
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
├── hooks/                # useDailyLog, useDailyLogHistory, useUserGoals
├── components/           # CalendarStrip, DaySummaryBar, CoachSection, UndoToast, …
├── contexts/AuthContext.tsx
├── lib/
│   ├── nutrition.ts      # Cálculo offline
│   ├── recentItems.ts    # Recentes, section mode, coach goals, UI compact
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
| `/home` | Sim | **Seu dia** — pickers, auto-save, resumo sticky, coach IA colapsável |
| `/dashboard` | Sim | **Resumo** — anéis, gráficos 7 dias, streak (`CalendarStrip`) |
| `/historico` | Sim | Histórico por mês |
| `/sobre` | Sim | Página institucional |
| `/profile` | Sim | Perfil e logout |
| `/settings` | Sim | Tema, **metas diárias**, atalhos |
| `/settings/privacy` | Sim | Privacidade e biometria |
| `/settings/personalizacao` | Sim | Densidade de UI |

## Fluxo "Seu dia" (`/home`)

Documentação completa: [UX_SEU_DIA.md](./UX_SEU_DIA.md) · Melhorias: [UX_MELHORIAS_USUARIO.md](./UX_MELHORIAS_USUARIO.md)

1. **`CalendarStrip`** — seleciona o dia (hoje ±3); dots em dias com registro
2. **Toggle de seção** — Ambos | Só alimentos | Só exercícios (`ntrsl_section_mode`)
3. **`useDailyLog`** — carrega pickers; `<Skeleton>` enquanto carrega
4. **`ExercisePicker` / `FoodPicker`** — recentes, undo, haptic; busca remota ou fallback local
5. **Auto-save (debounce 1,5 s)** — badge "Salvando…" / "Salvo ✓" / "No celular — sincroniza online"
6. **Streak chip** + botão **Repetir ontem** (quando dia vazio)
7. **`DaySummaryBar`** — progresso vs metas (`useUserGoals`); link "Ver →" `/dashboard?date=`
8. **Ícone cérebro** — refino com IA (`postNutritionSummary` + merge); card `AiRefineResultCard`
9. **`CoachSection`** — contexto semanal + resposta estruturada (alimentos, água, exercícios)

## Fluxo "Resumo" (`/dashboard`)

1. **`CalendarStrip`** — 7 dias (hoje ±3); aceita data inicial via `?date=YYYY-MM-DD`
2. **`useDailyLogHistory(userId, 30)`** — gráficos, streak, `eventDates`
3. **`useDailyLog(userId, logDate)`** — anéis e stat cards
4. **`useUserGoals()`** — metas do perfil nos anéis (substitui constantes hardcoded)
5. **Streak** — relativo a **hoje**, não ao dia filtrado

## TanStack Query (daily logs)

| Hook | Query key | Função |
|------|-----------|--------|
| `useDailyLog` | `['dailyLog', userId, logDate]` | Busca log de um dia |
| `useDailyLogHistory` | `['dailyLogHistory', userId]` | Histórico (default 30 dias) |
| `useSaveDailyLog` | mutation | Upsert + invalidação das queries acima |
| `useUserGoals` | `['userGoals', userId]` | Metas em `profiles` (kcal, proteína, carbs) |

Provider: `src/appShell.tsx` · Hooks: `src/hooks/useDailyLog.ts`, `useDailyLogHistory.ts`, `useUserGoals.ts`

## Componentes compartilhados

| Componente | Arquivo | Uso |
|------------|---------|-----|
| `CalendarStrip` | `components/CalendarStrip.tsx` | Home + Dashboard — props: `selectedDate`, `onDateSelect`, `eventDates?` |
| `DaySummaryBar` | `components/DaySummaryBar.tsx` | Resumo sticky + progresso vs metas |
| `CoachSection` | `components/CoachSection.tsx` | Coach semanal estruturado + chips de meta |
| `AiRefineResultCard` | `components/AiRefineResultCard.tsx` | Confirmação glass pós-refino IA |
| `coachContext` | `lib/coachContext.ts` | Monta contexto dos últimos 7 dias |
| `UndoToast` | `components/UndoToast.tsx` | Desfazer remoção nos pickers |

Bottom nav: `/dashboard` = **Resumo** (`LayoutDashboard`), `/home` = **Seu dia** (`Home`).

## Cálculo nutricional (cliente)

Portado do protótipo Streamlit:

- Alimentos: macros proporcionais à quantidade em **gramas** (`qty / 100`)
- Água: quantidade em **litros** → convertida para ml (`× 1000`) antes do fator
- Exercícios: `calorias_queimadas_por_minuto × duração` (prioriza `caloriasPorMinuto` do entry quando veio da busca WGER)

Fonte local: `src/data/calorias.json`, `src/data/exercicios.json` · cache remoto: `food_catalog`, `exercise_catalog`

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
- Modelo padrão: `gemini-3.1-flash-lite` em `_shared/gemini.ts` (override: secret `GEMINI_MODEL`)
- Chaves de APIs externas (`FDC_API_KEY`, `WEGER_API_KEY`) também **somente nos secrets** — nunca `VITE_*` no bundle
- JWT Supabase enviado no header `Authorization` para as Edge Functions
- Credenciais biométricas em secure storage (nativo)
- Auditoria de erros críticos via `security_audit_events` (quando configurado)
