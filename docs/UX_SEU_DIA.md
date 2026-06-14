# UX "Seu dia" — Refactor `/home`

Documentação do refactor da tela **Seu dia** (`/home`) e das melhorias transversais em **Resumo** (`/dashboard`).

**Arquivos principais:** `src/pages/NutritionHomePage.tsx`, `src/pages/DashboardPage.tsx`, `src/hooks/useDailyLog.ts`, `src/hooks/useDailyLogHistory.ts`

---

## Problemas resolvidos

| Antes | Depois |
|-------|--------|
| Cálculo manual — usuário precisava clicar em "Calcular resumo" | Auto-save com debounce (1,5 s) recalcula e persiste ao alterar pickers |
| Alterações nos pickers não persistiam até calcular | `saveDailyLog` dispara automaticamente após debounce |
| Só o dia de hoje — sem navegação por data | `CalendarStrip` igual ao Dashboard; edição de dias anteriores |
| Página longa — IA enterrada no final | `CoachSection` colapsável; resumo sticky no topo |
| Feedback fraco (`dayLoading` = texto pequeno) | `<Skeleton>` nos pickers enquanto carrega |
| Duas visualizações sem ligação clara | `DaySummaryBar` com link "Ver →" para `/dashboard` |
| `useEffect` manual em Home e Dashboard | TanStack Query (`useDailyLog`, `useDailyLogHistory`, `useSaveDailyLog`) |
| Nav confusa ("Início" vs ícone Home) | Aba `/dashboard` renomeada para **"Resumo"** |

---

## Navegação (bottom nav)

| Rota | Ícone | Label | Função |
|------|-------|-------|--------|
| `/dashboard` | `LayoutDashboard` | **Resumo** | Visão analítica: anéis, gráficos 7 dias, streak |
| `/home` | `Home` | **Seu dia** | Registro e edição: pickers, auto-save, coach IA |
| `/historico` | `Calendar` | Histórico | Histórico mensal |
| `/sobre` | `Info` | Sobre | Institucional |

Arquivo: `src/components/BottomNav.tsx`

---

## Fluxo de dados

```mermaid
flowchart TD
    CalStrip[CalendarStrip] -->|selectedDate| useDailyLog
    useDailyLog -->|data| Pickers
    useDailyLog -->|data| DaySummaryBar
    Pickers -->|onChange + debounce 1.5s| buildSummary
    buildSummary -->|auto| useSaveDailyLog
    useSaveDailyLog -->|invalida| useDailyLog
    useSaveDailyLog -->|invalida| useDailyLogHistory
    useDailyLogHistory -->|eventDates| CalStrip
    CTA[CTA fixo Calcular com IA] -->|postNutritionSummary| Gemini
    CoachSection -->|postAiRecommendations| AiResponse
```

---

## TanStack Query

Provider global em `src/appShell.tsx` (`staleTime: 5 min`, `gcTime: 24 h`, `retry: 2`).

### `useDailyLog(userId, logDate)`

- **Query key:** `['dailyLog', userId, logDate]`
- **Retorno:** `{ exercises, foods, summary } | null` (via `parseDailyLogRow`)
- **Usado em:** `NutritionHomePage`, `DashboardPage`

### `useDailyLogHistory(userId, limit?)`

- **Query key:** `['dailyLogHistory', userId]`
- **Retorno:** array de rows `daily_logs` (default: últimos 30 dias)
- **Usado em:** `CalendarStrip` (`eventDates`), gráficos semanais, streak

### `useSaveDailyLog()`

- **Mutation:** upsert em `daily_logs` via `saveDailyLog()`
- Se `summary` omitido, calcula com `buildSummary()` (local, sem IA)
- **Invalidação:** `dailyLog` do dia + `dailyLogHistory` do usuário
- **Retorno:** `{ synced: boolean, summary }` — `synced: false` enfileira no outbox offline

Arquivos: `src/hooks/useDailyLog.ts`, `src/hooks/useDailyLogHistory.ts`

---

## Tela "Seu dia" (`/home`)

### Layout (de cima para baixo)

1. **Header** — título "Seu dia" + badge de status de save (`aria-live="polite"`)
2. **`CalendarStrip`** — 7 dias (hoje ±3); dots em dias com registro
3. **`DaySummaryBar`** (sticky) — Gastas / Consumidas / Balanço + link "Ver →" `/dashboard`
4. **Pickers** — `ExercisePicker` + `FoodPicker` (ou `<Skeleton>` durante load)
5. **`MacroChart`** — macronutrientes (quando há `summary`)
6. **`CoachSection`** — seção colapsável de recomendação IA
7. **CTA fixo** — "Calcular com IA" / "Atualizar com IA" (`CTA_BOTTOM_CLASS`)

### Auto-save

- **Gatilho:** qualquer mudança em exercícios ou alimentos
- **Debounce:** 1,5 s
- **Cálculo:** `buildSummary()` local (sem chamar Gemini)
- **Persistência:** `useSaveDailyLog().mutate(...)`

### Indicador de status

| Estado | Texto | Cor (`colors.*`) |
|--------|-------|------------------|
| `saving` | Salvando… | `textMuted` |
| `saved` | Salvo ✓ | `points` |
| `pending-sync` | Pendente sync | `accent` |
| `idle` | (oculto) | — |

O badge some automaticamente 3 s após `saved` ou `pending-sync`.

### CTA "Calcular com IA"

- Posição fixa acima da bottom nav (`CTA_BOTTOM_CLASS` em `src/lib/layout.ts`)
- Conteúdo com `SECTION_WITH_CTA_PADDING_CLASS` para não ficar atrás do botão
- Chama `postNutritionSummary()` (Edge Function + Gemini); fallback offline em `buildSummary()`
- Label dinâmica: **"Calcular com IA"** (sem summary) → **"Atualizar com IA"** (com summary)

---

## Componentes novos

### `DaySummaryBar`

Arquivo: `src/components/DaySummaryBar.tsx`

| Prop | Tipo | Descrição |
|------|------|-----------|
| `summary` | `NutritionSummary` | Dados do dia |
| `showDashboardLink?` | `boolean` | Exibe link "Ver →" para `/dashboard` |

- `position: sticky; top: 0` — visível enquanto rola
- Cores: gastas (`points`), consumidas (`accent`), balanço (`points` ou `accent`)

### `CoachSection`

Arquivo: `src/components/CoachSection.tsx`

| Prop | Tipo | Descrição |
|------|------|-----------|
| `summary` | `NutritionSummary \| null` | Resumo do dia (obrigatório para pedir recomendação) |
| `onRequest` | `(goals: string) => Promise<void>` | Callback ao pedir recomendação |
| `isLoading` | `boolean` | Estado de loading da IA |
| `cooldownSeconds` | `number` | Segundos restantes de cooldown |
| `response` | `string \| null` | Texto da recomendação |
| `error` | `string \| null` | Mensagem de erro |

- Começa **fechado** (colapsável)
- Integra `CooldownBanner` quando em cooldown
- Textarea de metas + botão "Pedir recomendação"

---

## Tela "Resumo" (`/dashboard`)

Migrada para TanStack Query — sem `useEffect` manual.

- `useDailyLogHistory(userId, 30)` — histórico, streak, `eventDates`, gráficos semanais
- `useDailyLog(userId, selectedKey)` — dados do dia selecionado
- Opacidade reduzida nos anéis enquanto `isFetching`
- Acessibilidade: `aria-label` nos anéis SVG, barras de progresso e `StatCard`

---

## Tokens de layout

Definidos em `src/lib/layout.ts`:

| Constante | Uso |
|-----------|-----|
| `CTA_BOTTOM_CLASS` | Posição do botão fixo acima da bottom nav |
| `SECTION_WITH_CTA_PADDING_CLASS` | Padding inferior do conteúdo para não sobrepor o CTA |
| `MAIN_BOTTOM_PADDING_CLASS` | Padding do `<main>` para a bottom nav |
| `NAV_BOTTOM_CLASS` | Posição da bottom nav |

---

## Testar manualmente

1. **Auto-save:** adicionar alimento → aguardar 1,5 s → badge "Salvo ✓"; recarregar página → item persiste
2. **Offline:** desligar rede → alterar picker → badge "Pendente sync"; voltar online → sync via outbox
3. **CalendarStrip:** selecionar dia anterior com dot → pickers carregam dados daquele dia
4. **Resumo sticky:** rolar a página → barra Gastas/Consumidas/Balanço permanece visível
5. **Coach IA:** expandir seção → pedir recomendação (requer summary); cooldown após uso
6. **CTA fixo:** botão "Calcular com IA" visível acima da nav; não cobre conteúdo ao rolar
7. **Navegação cruzada:** link "Ver →" na barra sticky leva a `/dashboard` com mesmo contexto de data (usuário seleciona manualmente no strip)
8. **Resumo:** trocar dia no strip → anéis e gráficos atualizam

---

## Referências

- [ARCHITECTURE.md](./ARCHITECTURE.md) — visão geral da stack e rotas
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — tokens de cor
- [API.md](./API.md) — Edge Functions `nutrition-summary`, `ai-recommendations`
