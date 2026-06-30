# UX — Melhorias para o Usuário

Documentação das melhorias de UX em **Seu dia** (`/home`), **Resumo** (`/dashboard`), pickers e **Configurações**.

Complementa: [UX_SEU_DIA.md](./UX_SEU_DIA.md) (refactor base com auto-save e TanStack Query).

**Migration aplicada:** `supabase/migrations/20260614120000_profile_goals.sql`

---

## Resumo das melhorias

| Área | Melhoria |
|------|----------|
| Metas | Personalizadas por usuário em `profiles` (Supabase) |
| Seu dia | Toggle Ambos / Só alimentos / Só exercícios |
| Pickers | Recentes, undo ao remover, haptic, modo compacto |
| Seu dia | Streak chip, "Repetir ontem", sync humanizado, haptic ao salvar |
| CTA IA | 3 estados claros + sublabel explicativa |
| Navegação | Link "Ver →" passa `?date=` para o Resumo |
| Coach IA | Metas persistentes + chips rápidos |
| Resumo | Anéis usam metas do perfil (não mais hardcoded) |
| **Velocidade** | Dropdown fecha ao clicar fora / rolar; foco ao trocar seção |
| **Velocidade** | Resumo em tempo real (`liveSummary`); flush de auto-save ao sair |
| **Clareza** | Badges "c/ macros" / "estimado"; countdown no Coach |
| **IA** | Ícone cérebro no header; card glass pós-refino; merge anti-zeragem |
| **Coach IA** | Contexto semanal + resposta estruturada (alimentos, água, exercícios) |

---

## Terceira onda — UX Speed & Clarity

Melhorias focadas em **registro mais rápido** e **feedback imediato** no Android.

### Pickers — dropdown e busca

Arquivos: [`src/components/FoodPicker.tsx`](../src/components/FoodPicker.tsx), [`src/components/ExercisePicker.tsx`](../src/components/ExercisePicker.tsx)

| Comportamento | Implementação |
|---------------|---------------|
| Fechar ao clicar fora | `containerRef` + listener `mousedown` no `document` |
| Fechar ao rolar | listener `scroll` com `{ capture: true }` no `window` |
| Foco ao trocar seção | prop `inputRef`; `NutritionHomePage` chama `.focus()` em "Só alimentos" / "Só exercícios" |
| Quantidade no Android | `type="text"` + `inputMode="decimal"` (gramas, litros, minutos) |
| Badges nos resultados | **"c/ macros"** (dados nutricionais disponíveis) ou **"estimado"** — substitui jargão Local/Cache/USDA/WGER |

### Resumo em tempo real (`liveSummary`)

Arquivo: [`src/pages/NutritionHomePage.tsx`](../src/pages/NutritionHomePage.tsx)

```tsx
const liveSummary = useMemo(() => {
  if (exercises.length === 0 && foods.length === 0) return summary;
  return buildSummary(exercises, foods);
}, [exercises, foods, summary]);
```

- `DaySummaryBar` e `MacroChart` usam `liveSummary` — atualizam **na hora** ao adicionar/editar itens
- O `summary` persistido no servidor continua sendo atualizado pelo auto-save (debounce 1,5 s) ou pelo CTA IA
- Animação de pulse (`pulseKey`) reage a mudanças no balanço de `liveSummary`

### Auto-save — flush ao sair da tela

- Debounce permanece em **1,5 s** enquanto o usuário está em `/home`
- Ao **desmontar** a página (navegar para outra aba), o save pendente é **executado imediatamente** via `pendingSaveRef`
- Evita perda de alterações quando o usuário sai antes do debounce completar

### CTA "Calcular com IA" — ícone no header (substitui botão fixo)

O botão fixo na bottom nav foi **removido** (cliques acidentais). A ação ficou no **ícone de cérebro** (`Brain`), alinhado à direita do título **Seu dia**.

| Estado | Comportamento |
|--------|---------------|
| Sem itens | Ícone desabilitado (opaco); `aria-label`: "Adicione itens para calcular com IA" |
| Com itens | Fundo `accentSoft`; chama `postNutritionSummary` |
| Loading | Spinner no lugar do ícone |

Após sucesso, abre [`AiRefineResultCard`](../src/components/AiRefineResultCard.tsx) — overlay **glassmorphism** com diff dos ajustes e botão **Confirmar**.

### Refinar com IA — proteção contra zeragem

Arquivos: [`src/lib/nutrition.ts`](../src/lib/nutrition.ts), [`supabase/functions/_shared/nutrition.ts`](../supabase/functions/_shared/nutrition.ts), [`supabase/functions/nutrition-summary/index.ts`](../supabase/functions/nutrition-summary/index.ts)

| Camada | Comportamento |
|--------|---------------|
| Cliente | `buildSummary()` local → IA → `mergeNutritionSummary()` (nunca aceita zero se local > 0) |
| API | Envia `FoodEntry` / `ExerciseEntry` completos (`per100g`, `caloriasPorMinuto`, `localKey`) |
| Servidor | Calcula baseline local; pula Gemini se todos os itens têm macros; merge antes de responder |

Funções: `mergeNutritionSummary()`, `getSummaryAdjustments()` (diff para o card de confirmação).

### Coach IA — countdown no header

Arquivos: [`src/components/CoachSection.tsx`](../src/components/CoachSection.tsx), [`src/hooks/useCountdown.ts`](../src/hooks/useCountdown.ts)

- Hook compartilhado `useCountdown` + `formatCountdown` (reutilizado em `CooldownBanner`)
- Quando a seção está **fechada** e há cooldown ativo, o header exibe o tempo restante (ex.: `4:32`)
- Com a seção aberta, o `CooldownBanner` continua mostrando a mensagem completa

---

## Quarta onda — Coach semanal e IA refinada

### Contexto semanal do Coach

Arquivo: [`src/lib/coachContext.ts`](../src/lib/coachContext.ts)

Monta os **últimos 7 dias** a partir de `useDailyLogHistory`:

| Export | Descrição |
|--------|-----------|
| `buildWeeklyCoachContext(rows, anchorDate)` | 7 dias + totais (médias kcal, min exercício, água total) |
| `applyLiveDayToWeeklyContext(...)` | Substitui o dia âncora pelos dados ao vivo dos pickers |
| `waterLitersFromFoods(foods)` | Soma litros de água registrados |

Cada dia inclui: `consumidas`, `gastas`, `proteina`, `duracaoMin`, `aguaLitros`, listas de alimentos/exercícios.

Enviado para `ai-recommendations` junto com `resumo`, `logDate`, `profileGoals` e `userGoals`.

### Resposta estruturada do Coach

Edge Function [`ai-recommendations`](../supabase/functions/ai-recommendations/index.ts) retorna JSON via `generateJson`:

```ts
interface CoachRecommendationStructured {
  visaoSemanal: string;
  alimentos: string[];   // 2–4 sugestões
  agua: string[];        // meta, observação, dica
  exercicios: string[];  // tipo, frequência, duração
  proximoPasso: string;
}
```

UI em [`CoachSection`](../src/components/CoachSection.tsx): blocos separados com ícones (UtensilsCrossed, Droplets, Dumbbell) + card de **Próximo passo**.

Fallback: se `structured` ausente, exibe `recommendation` (texto plano).

### Card pós-refino (`AiRefineResultCard`)

Após **Refinar com IA** (ícone cérebro):

- Overlay fosco (`backdrop-filter: blur`) + card glass (`makeGlassSurfaceStyle`)
- Lista de métricas alteradas (`getSummaryAdjustments`)
- Resumo final Gastas / Consumidas / Balanço
- Botão **Confirmar** (haptic success)

---

## Metas personalizadas (Supabase)

### Schema

Colunas em `public.profiles` (migration `20260614120000_profile_goals.sql`):

| Coluna | Tipo | Default | Descrição |
|--------|------|---------|-----------|
| `goal_kcal` | integer | 2000 | Meta diária de calorias consumidas |
| `goal_proteina` | integer | 50 | Meta diária de proteína (g) |
| `goal_carbs` | integer | 250 | Meta diária de carboidratos (g) |

RLS existente em `profiles` já permite que o usuário leia/atualize apenas a própria linha.

### Hook `useUserGoals`

Arquivo: [`src/hooks/useUserGoals.ts`](../src/hooks/useUserGoals.ts)

| Export | Descrição |
|--------|-----------|
| `useUserGoals()` | Retorna `{ goals, isLoading, updateGoals, isUpdating }` |
| Query key | `['userGoals', userId]` |
| Defaults | `{ kcal: 2000, proteina: 50, carbs: 250 }` (`DEFAULT_USER_GOALS`) |

### Onde aparece

| Tela | Comportamento |
|------|---------------|
| **Configurações** (`/settings`) | Card "Metas diárias" — inputs + botão "Salvar metas" |
| **Resumo** (`/dashboard`) | Anéis `ProgressRings` e barras usam `goals.kcal`, `goals.proteina`, `goals.carbs` |
| **Seu dia** (`/home`) | `DaySummaryBar` exibe mini-barras de progresso (kcal e proteína) |

---

## Toggle de seções (Seu dia)

Controle segmentado abaixo do `CalendarStrip`:

- **Ambos** — exercícios + alimentos (padrão)
- **Só alimentos** — oculta seção de exercícios
- **Só exercícios** — oculta seção de alimentos

Persistência: `localStorage` chave `ntrsl_section_mode`.

Helpers: [`src/lib/recentItems.ts`](../src/lib/recentItems.ts) — `getSectionMode()`, `setSectionMode()`.

**Importante:** itens da seção oculta continuam no estado e no auto-save; apenas a UI é filtrada.

---

## Pickers — recentes, undo, compacto

### Recentes

Arquivo: [`src/lib/recentItems.ts`](../src/lib/recentItems.ts)

| Função | Chave localStorage | Máx |
|--------|-------------------|-----|
| `getRecentFoods()` / `pushRecentFood()` | `ntrsl_recent_foods_v1` | 10 |
| `getRecentExercises()` / `pushRecentExercise()` | `ntrsl_recent_exercises_v1` | 10 |

Exibidos no dropdown quando a busca está vazia (seção "Recentes").

### Undo ao remover

Componente: [`src/components/UndoToast.tsx`](../src/components/UndoToast.tsx)

- Ao remover item → toast "X removido" + botão **Desfazer** (5 s)
- Posição fixa acima da bottom nav
- Implementado em `FoodPicker` e `ExercisePicker`

### Haptic

- **Adicionar item:** `hapticsImpactLight()` em ambos os pickers
- **Salvar com sucesso:** `hapticsSuccess()` no auto-save de `NutritionHomePage`

### Modo compacto

Lê `localStorage` chave `ntrsl_ui_compact` (`'1'` = compacta).

Reduz padding nos cards de entrada dos pickers. Configurável em **Personalização** (`/settings/personalizacao`).

---

## Seu dia — polimentos adicionais

### Streak chip

Chip no header: `🔥 N dias` (calculado via `computeStreak()` em [`dailyLogs.ts`](../src/lib/data/dailyLogs.ts)).

Visível apenas quando `streak > 0`.

### Repetir ontem

Botão exibido quando:

- Dia selecionado é **hoje**
- Exercícios e alimentos estão **vazios**
- Existe registro de **ontem** em `useDailyLogHistory`

Copia `exercises` e `foods` do dia anterior e dispara auto-save.

### Status de sync (linguagem humana)

| Estado | Texto | Extra |
|--------|-------|-------|
| `saving` | Salvando… | — |
| `saved` | Salvo ✓ | haptic success |
| `pending-sync` | No celular — sincroniza online | ícone `CloudOff` |

### CTA "Calcular / Refinar com IA"

Substituído por **ícone de cérebro** no header (ver [Quarta onda](#quarta-onda--coach-semanal-e-ia-refinada)). Não há mais botão fixo acima da bottom nav.

### Sincronização de data com Resumo

`DaySummaryBar` link "Ver →":

```
/dashboard?date=YYYY-MM-DD
```

`DashboardPage` lê `?date=` via `useSearchParams()` e inicializa o `CalendarStrip` na mesma data.

Props adicionais em `DaySummaryBar`:

| Prop | Tipo | Descrição |
|------|------|-----------|
| `dashboardDate?` | `string` | Data ISO para o link |
| `goals?` | `UserGoals` | Mini-barras de progresso |
| `pulseKey?` | `string \| number` | Animação breve quando o balanço muda |

---

## Coach IA — metas persistentes e resposta semanal

Arquivo: [`src/components/CoachSection.tsx`](../src/components/CoachSection.tsx)

- Textarea persiste em `localStorage` (`ntrsl_coach_goals`)
- Chips rápidos: **Perder peso**, **Ganhar massa**, **Mais proteína**, **Mais energia**
- Toque no chip preenche a textarea e salva automaticamente
- Countdown no **header** quando fechado e em cooldown (`useCountdown`)
- **Resposta estruturada:** Visão da semana, Alimentos, Água, Exercícios, Próximo passo (ver [Quarta onda](#quarta-onda--coach-semanal-e-ia-refinada))

Helpers: `getCoachGoals()`, `setCoachGoals()` em `recentItems.ts`.

---

## Arquivos

### Novos

| Arquivo | Função |
|---------|--------|
| `supabase/migrations/20260614120000_profile_goals.sql` | Colunas de meta em `profiles` |
| `src/hooks/useUserGoals.ts` | TanStack Query para metas |
| `src/hooks/useCountdown.ts` | Countdown reutilizável (`CoachSection`, `CooldownBanner`) |
| `src/lib/coachContext.ts` | Contexto semanal para Coach IA |
| `src/components/AiRefineResultCard.tsx` | Card glass pós-refino com IA |
| `supabase/functions/_shared/nutrition.ts` | `buildSummaryFromEntries`, `mergeNutritionSummary` (servidor) |
| `src/lib/recentItems.ts` | Recentes, section mode, coach goals, compact |
| `src/components/UndoToast.tsx` | Toast de desfazer |

### Modificados

| Arquivo | Mudança principal |
|---------|-------------------|
| `src/types/profile.ts` | `UserGoals`, `DEFAULT_USER_GOALS` |
| `src/types/supabase.ts` | Colunas `goal_*` em `profiles` |
| `src/pages/SettingsPage.tsx` | Card Metas diárias |
| `src/pages/DashboardPage.tsx` | `useUserGoals`, `?date=` na URL |
| `src/pages/NutritionHomePage.tsx` | Toggle, streak, ícone IA, `liveSummary`, flush auto-save, contexto semanal Coach |
| `src/components/DaySummaryBar.tsx` | Progresso + link com data |
| `src/components/CoachSection.tsx` | Chips + resposta estruturada semanal + countdown |
| `src/lib/nutrition.ts` | `mergeNutritionSummary`, `getSummaryAdjustments` |
| `supabase/functions/nutrition-summary/index.ts` | Baseline local + merge; payload completo |
| `supabase/functions/ai-recommendations/index.ts` | Coach semanal JSON estruturado |
| `supabase/functions/_shared/gemini.ts` | `resolveGeminiModelName` — ignora modelos legados |
| `src/components/CooldownBanner.tsx` | Usa `useCountdown` |
| `src/components/FoodPicker.tsx` | Recentes, undo, haptic, compact, dropdown dismiss, badges, `inputRef` |
| `src/components/ExercisePicker.tsx` | Idem |
| `src/lib/data/dailyLogs.ts` | `computeStreak`, `parseLogDateString` |

---

## Fluxo de dados (metas + registro)

```mermaid
flowchart TD
    Settings[SettingsPage Metas] -->|updateGoals| Profiles[(profiles goal_*]
    Profiles -->|useUserGoals| Dashboard[DashboardPage anéis]
    Profiles -->|useUserGoals| Home[NutritionHomePage DaySummaryBar]
    Pickers[FoodPicker ExercisePicker] -->|pushRecent| LocalStorage[(localStorage recentes)]
    Pickers -->|onChange| LiveSummary[liveSummary buildSummary]
    LiveSummary --> DayBar[DaySummaryBar tempo real]
    Pickers -->|onChange debounce| AutoSave[useSaveDailyLog]
    AutoSave -->|flush unmount| AutoSave
    AutoSave -->|hapticsSuccess| Haptic[Capacitor Haptics]
    History -->|buildWeeklyCoachContext| Coach[CoachSection]
    Coach -->|postAiRecommendations| AiCoach[ai-recommendations JSON]
    BrainIcon[Ícone cérebro header] -->|postNutritionSummary merge| RefineCard[AiRefineResultCard]
```

---

## Testar manualmente

1. **Metas:** Configurações → alterar kcal/proteína/carbs → Salvar → Resumo mostra anéis atualizados
2. **Toggle:** Seu dia → "Só alimentos" → só FoodPicker visível; campo de busca recebe foco; adicionar alimento → auto-save funciona
3. **Recentes:** adicionar "Arroz" → limpar busca → "Arroz" aparece em Recentes
4. **Undo:** remover item → toast 5 s → Desfazer restaura
5. **Repetir ontem:** dia vazio hoje → botão copia registro de ontem
6. **Date sync:** Seu dia dia 10 → "Ver →" → Resumo abre no dia 10
7. **Refinar IA:** ícone cérebro → card glass com ajustes → Confirmar
8. **Coach:** resposta em blocos (Alimentos, Água, Exercícios, Próximo passo)
9. **Offline:** badge "No celular — sincroniza online" + ícone nuvem
10. **Dropdown:** abrir busca → clicar fora ou rolar → dropdown fecha
11. **Resumo instantâneo:** adicionar alimento → `DaySummaryBar` atualiza kcal sem esperar 1,5 s
12. **Flush save:** adicionar item → navegar para Resumo antes de 1,5 s → voltar → item persistiu
13. **Anti-zeragem:** refinar com IA não zera calorias já calculadas localmente

---

## Referências

- [UX_SEU_DIA.md](./UX_SEU_DIA.md) — refactor base (auto-save, TanStack Query)
- [ARCHITECTURE.md](./ARCHITECTURE.md) — stack e rotas
- [SUPABASE.md](./SUPABASE.md) — schema `profiles` com metas
