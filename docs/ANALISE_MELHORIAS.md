# 🔍 Análise do NTRSL AI — Oportunidades de Melhoria

**Data:** 2026-06-21
**Versão atual:** v1.2.0 (embora `package.json` marque 1.0.1)
**Contexto:** Análise completa do código sem edição — apenas identificação de problemas e sugestões.

---

## 1. 🧹 Arquitetura & Organização

### 1.1 `NutritionHomePage.tsx` está gigante (558 linhas, 37 `useState`)

É o componente mais crítico e também o mais sobrecarregado. Ele controla:

- Estado dos exercícios e alimentos
- Salvamento automático com debounce
- Chamadas à IA (cálculo + recomendações)
- Cooldown, modo de seção, status de UI
- Refine results, statuses de food/exercise, etc.

**Sugestão:** Extrair um hook customizado `useNutritionDay` que encapsule estado + auto-save, e um `useAiCoach` para a parte de IA. Isso reduziria o componente pela metade e facilitaria testar cada parte isoladamente.

```ts
// Proposta:
function NutritionHomePage() {
  const { exercises, foods, summary, saveStatus, ... } = useNutritionDay();
  const { aiLoading, aiResponse, cooldown, requestRecommendation } = useAiCoach();
  // ...
}
```

### 1.2 Código duplicado entre `NutritionHomePage` e `DiaryPage`

Ambos implementam o mesmo padrão:

| Padrão | NutritionHomePage.tsx | DiaryPage.tsx |
|--------|----------------------|---------------|
| `SaveStatus` com 4 estados | Linhas 36, 359-371 | Linhas 26, 176-188 |
| Debounce de 1500ms | `triggerAutoSave` (linhas 183-198) | `triggerAutoSave` (linhas 96-108) |
| `pendingSaveRef` | Linha 64 | Linha 42 |
| `saveLabel` / `saveLabelColor` | Idênticos nos dois | Idênticos nos dois |
| Cleanup no unmount | `useEffect` (linhas 200-209) | `useEffect` (linhas 64-73) |

**Sugestão:** Extrair para um hook `useAutoSave` ou um componente wrapper `AutoSaveProvider`.

### 1.3 Mix inconsistente de idiomas

- Funções: `calcularCaloriasExercicio`, `buildSummary`, `mergeNutritionSummary`
- Props: `onRequest`, `isLoading`, `hasSummary` vs `aoConfirmar`
- Tipos: metade inglês (`FoodEntry`, `DiaryEntry`) e metade português (`calorias_queimadas_por_minuto`, `proteína`, `carboidratos`)
- Comentários: mistura de PT e EN

**Sugestão:** Padronizar — inglês para código (nomes de funções, variáveis, tipos), português apenas para UI/texto visível ao usuário. Evita confusão mental em cada `grep`.

---

## 2. ⚡ Performance

### 2.1 `DiaryPage` — loop de processamento ineficiente

O `useDiaryProcessor` envia **cada entrada individualmente** para a Edge Function `nutrition-summary` com parâmetros fixos:

```ts
// useDiaryProcessor.ts, linha 23-26
const result = await postNutritionSummary(
  [],                                          // exercises sempre vazio
  [{ name: entry.rawText, quantity: 100 }],    // quantity fixo = 100
);
```

5 itens = 5 chamadas de rede separadas. 10 itens = 10 chamadas.

**Sugestão:** Fazer batch — acumular entradas pendentes por 300ms e enviar todas juntas em uma única chamada.

### 2.2 `webStore` — varredura linear O(n²)

```ts
// webStore.ts — clearAll()
for (let i = 0; i < window.localStorage.length; i++) {
  const k = window.localStorage.key(i); // O(n) cada iteração = O(n²) total
  if (!k) continue;
  if (k.startsWith(SNAP_PREFIX) || k.startsWith(META_PREFIX) || k === OUTBOX_KEY) {
    keys.push(k);
  }
}
```

**Sugestão:** Manter um índice em memória das chaves gerenciadas, ou iterar uma vez e filtrar.

### 2.3 `liveSummary` recalculado a cada keystroke

Em `NutritionHomePage`, `liveSummary` (linha 118-121) é um `useMemo` que depende de `exercises` e `foods`. Como `handleExercisesChange` / `handleFoodsChange` são chamados em cada alteração (adição de item), o resumo é recalculado muito mais vezes que o necessário.

**Sugestão:** Como o auto-save já tem debounce de 1500ms, o `liveSummary` poderia ser computado com o mesmo debounce.

### 2.4 SVG Glass Filter no `BottomNav` — pesado para Android de entrada

```tsx
// BottomNav.tsx — o GlassFilter roda:
<feTurbulence />         // ruído procedural
<feGaussianBlur />       // blur no ruído
<feSpecularLighting />   // iluminação especular
<feDisplacementMap />    // distorção do conteúdo
```

Em dispositivos Android low-end, isso pode causar jank a cada renderização da nav.

**Sugestão:** Cache do filtro SVG, ou usar só `backdrop-filter: blur()` CSS em dispositivos detectados como low-end (via `navigator.hardwareConcurrency` ou `deviceMemory`).

### 2.5 `useMemo` com array de dependências gigante no `AuthContext`

```ts
// AuthContext.tsx, linha 198-209 — 10 dependências no useMemo
const value = useMemo<AuthContextValue>(() => ({ ... }), [
  session, profile, loading, profileError, avatarUrl,
  refreshProfile, signInWithPassword, signUpWithPassword, signOut, isAdmin,
]);
```

Os callbacks `refreshProfile`, `signInWithPassword`, etc. já são estáveis via `useCallback`, então isso é seguro. Mas 10 dependências é sinal de que o contexto está grande demais.

**Sugestão:** Dividir em `AuthContext` (dados) e `AuthActionsContext` (callbacks) para evitar re-renders desnecessários.

---

## 3. 🎨 UX / UI

### 3.1 Zero suporte a tema escuro

CSS inteiro é hardcoded pra light mode:

```css
/* index.css */
body {
  background-color: #f8f9fa;
  color: #1a1a1a;
}
```

O sistema de cores com `colors.ts` usa tons pastéis que funcionam bem em light mas não foram testados em dark. Está planejado pra v1.3.0.

**Sugestão:** Migrar `colors.ts` para CSS custom properties com variantes claro/escuro:

```css
:root {
  --color-surface: #ffffff;
  --color-background: #f8f9fa;
  --color-text-primary: #1a1a1a;
}
.dark {
  --color-surface: #1c1c1e;
  --color-background: #000000;
  --color-text-primary: #f5f5f7;
}
```

### 3.2 Sem gestos de swipe

O app é mobile-first mas não usa nenhum gesto:
- Navegação entre abas requer toque preciso nos ícones
- `CalendarStrip` avança/recua dias com setas pequenas
- `CoachSection` abre/fecha com toggle

**Sugestão:**
- Swipe horizontal no `CalendarStrip` para mudar semanas
- Swipe entre abas principais (já que usa React Router, pode integrar com `react-router-dom` gestures)
- Swipe-to-dismiss no Coach

### 3.3 Sem confirmação ao deletar no Diário

```ts
// DiaryPage.tsx, linha 136-143
const handleDeleteEntry = useCallback((id: string) => {
  setDiaryEntries((prev) => {
    const next = prev.filter((e) => e.id !== id);
    triggerAutoSave(next);
    return next;
  });
}, [triggerAutoSave]);
```

O item some imediatamente. O `UndoToast` existe como componente mas não é acionado nesse fluxo.

**Sugestão:** Garantir que o `UndoToast` aparece em todos os fluxos de delete, ou adicionar confirmação (swipe-to-delete com reveal).

### 3.4 Densidade do Dashboard em telas pequenas

Os anéis SVG ocupam ~128x128px para mostrar apenas 3 métricas. Em telas < 360px de largura, o gráfico semanal fica comprimido.

**Sugestão:** Oferecer variante "compacta" do Dashboard usando `isUiCompact()` (que já existe em `recentItems.ts` mas não é usado no Dashboard).

### 3.5 `left-1/2` no BottomNav — possível bug de centralização

```tsx
// BottomNav.tsx, linha 106
className={`fixed ${NAV_BOTTOM_CLASS} left-1/2 -translate-x-1/2 ...`}
```

`left-1/2` pode não ser reconhecido dependendo da versão do Tailwind. O Tailwind v4 suporta `left-1/2` como `left: 50%`, mas se houver divergência, a nav fica descentralizada.

**Sugestão:** Verificar e, se necessário, usar `left-[50%]`.

---

## 4. 🔒 Segurança

### 4.1 Credenciais salvas para biometria

```ts
// LoginPage.tsx — saveLoginCredentials armazena email + senha
await saveLoginCredentials(loginEmail, loginPassword);
```

É essencial que `saveLoginCredentials` use **SecureStorage** (Android Keystore / iOS Keychain), não `localStorage` ou `Preferences`.

**Sugestão:** Verificar a implementação em `loginCredentials.ts` e garantir que `@aparajita/capacitor-secure-storage` está sendo usado, não `@capacitor/preferences`. Senha em `localStorage` em Android rootado é plaintext.

### 4.2 `audit.ts` — early return silencioso

```ts
// audit.ts
const actor_email = params.actor_email ?? null;
if (!actor_email) return; // NÃO audita ações sem email
```

Erros que ocorrem **antes do login** (ex: falha no `getSession`, erro no `signUp`) nunca são registrados.

**Sugestão:** Logar eventos anônimos com um identificador de sessão (`crypto.randomUUID()`), ou pelo menos `console.warn` quando `audit` é chamado sem email.

### 4.3 PKCE + autoRefresh — ✅ ok

A configuração do Supabase está correta e segue boas práticas:

```ts
auth: {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: 'pkce',
}
```

### 4.4 RLS e trigger anti auto-promoção — ✅ ok

O CHANGELOG menciona:
> Roles `user` e `admin` em `profiles` (enum `app_role`, RLS, trigger anti auto-promoção)

---

## 5. 🧪 Testes

### 5.1 Zero testes automatizados

Não há um único arquivo de teste no projeto. `vitest` não está nas `devDependencies`. As funções puras existentes são **perfeitas** para testes unitários.

**Sugestão — testar pelo menos:**

| Arquivo | Funções testáveis |
|---------|-------------------|
| `nutrition.ts` | `calcularCaloriasExercicio`, `calcularNutricao`, `buildSummary`, `mergeNutritionSummary`, `getSummaryAdjustments` |
| `dailyLogs.ts` | `localLogDate`, `computeStreak`, `parseLogDateString`, `parseDailyLogRow` |
| `coachContext.ts` | `buildWeeklyCoachContext`, `applyLiveDayToWeeklyContext`, `waterLitersFromFoods` |
| `diary.ts` | `parseDiaryFromStoredEntries`, `diaryEntriesToPersistence`, `buildSummaryFromDiary` |

**Setup mínimo:**
```bash
npm install -D vitest @testing-library/react
# + arquivo vitest.config.ts
# + scripts: { "test": "vitest" }
```

---

## 6. 🗄️ Dados & Offline

### 6.1 Outbox só suporta `daily_logs`

```ts
// outboxSync.ts, linhas 15-29
if (row.table_name === 'daily_logs' && row.operation === 'insert') { ... }
if (row.table_name === 'daily_logs' && row.operation === 'upsert') { ... }
throw new Error(`Outbox não suportado: ${row.table_name} / ${row.operation}`);
```

Qualquer outra operação offline (ex: atualizar perfil, registrar push token) é rejeitada.

**Sugestão:** Se o escopo é só `daily_logs` mesmo, documentar essa limitação. Se pretende crescer, usar um pattern de handler por tabela:

```ts
const HANDLERS: Record<string, (row: OutboxRow) => Promise<void>> = {
  daily_logs: async (row) => { /* ... */ },
  // profiles: async (row) => { /* ... */ },  // futuro
};
```

### 6.2 `localStorage` no webStore — limite de ~5MB

O app salva no `localStorage`:
- Cache rows (SNAP_PREFIX)
- Outbox rows (OUTBOX_KEY)
- Sync metadata (META_PREFIX)
- Itens recentes (alimentos + exercícios)
- Preferências de UI (compacto, modo seção)
- Goals do coach
- Email lembrado

Tudo compete pelos mesmos ~5MB do `localStorage`.

**Sugestão:** Priorizar SQLite nativo (já implementado via `@capacitor-community/sqlite`) e usar `localStorage` só como fallback real. No Android, o SQLite já é usado, mas o `webStore` ainda é o default via `useWeb = true` inicial.

### 6.3 Dados JSON estáticos carregados no bundle

```ts
// nutrition.ts
import caloriasData from '../data/calorias.json';
import exerciciosData from '../data/exercicios.json';
```

**Sugestão:** Se esses JSONs crescerem, considerar lazy-load ou usar o catálogo do Supabase (`exercise_catalog`, `food_catalog` via Edge Functions).

---

## 7. 🚀 Funcionalidades

### 7.1 Tracking de água é frágil

```ts
// coachContext.ts
return name.includes('água') || name.includes('agua');
```

Se o usuário registrar "Água de coco" (200ml), conta como 200 litros de água. "Melancia" não contém a palavra "água", então não conta.

**Sugestão:** Criar uma categoria dedicada "Água" no picker, ou um botão rápido de hidratação (+copo, +garrafa).

### 7.2 Metas de usuário incompletas

```ts
// types/profile.ts
export interface UserGoals {
  kcal: number;
  proteina: number;
  carbs: number;
}
```

Gordura é calculada mas não tem meta. Peso corporal, % gordura, medidas corporais — nada é rastreado.

**Sugestão:** Adicionar `goal_gorduras` e, a médio prazo, tracking de peso na tabela `profiles` ou em uma nova tabela `weight_log`.

### 7.3 `DiaryPage` parece redundante com `NutritionHomePage`

O app tem **duas** interfaces de input de dados:

| Tela | Mecanismo | Precisão |
|------|-----------|----------|
| **Seu dia** (`/home`) | Pickers com busca, IA, quantidade configurável | Alta |
| **Diário** (`/diario`) | Texto livre processado por IA com `quantity: 100` fixo | Baixa |

É confuso para o usuário. O Diário processa entradas como comida com `quantity: 100` fixo.

**Sugestão:** Unificar as telas ou deixar muito claro na UI que o Diário é "modo rápido" (estimativas) e o Seu Dia é "modo completo" (preciso).

### 7.4 Sem push notifications funcionais

Infra parcialmente pronta:
- ✅ Edge Function `push-register`
- ✅ Tabela `push_tokens`
- ✅ `PushNotificationsEffects.tsx`
- ❌ `google-services.json` não configurado
- ❌ `VITE_ENABLE_PUSH=true` não documentado/testado

Está planejado pra v1.3.0.

---

## 8. 🔧 Manutenibilidade

### 8.1 Versão do `package.json` desalinhada

| Fonte | Versão |
|-------|--------|
| `package.json` | `1.0.1` |
| `CHANGELOG.md` | v1.2.0 (atual) |
| `docs/versions/v1.3.0.md` | v1.3.0 (planejada) |

**Sugestão:** Alinhar `package.json` → `1.2.0` e automatizar o bump via `npm version` no release.

### 8.2 `metadata.json` não utilizado

O arquivo `metadata.json` existe na raiz mas não é referenciado em lugar nenhum. Contém apenas:

```json
{ "name": "NTRSL AI" }
```

**Sugestão:** Remover ou integrar (ex: como `apple-mobile-web-app-title` no `index.html`).

### 8.3 Comentário desatualizado no `DiaryInput`

O `todo` indica intenção de adicionar um `FoodPicker`, mas o Diário foi mantido como texto livre.

---

## 9. ♿ Acessibilidade

### 9.1 O que está bom ✅

- Vários `aria-label`, `role`, `aria-live="polite"` implementados
- `prefers-reduced-motion: reduce` respeitado nos skeletons
- Estados de loading com `aria-label="Carregando…"`
- `role="progressbar"` com `aria-valuenow/min/max` nos anéis
- `role="tablist"` / `role="tab"` / `aria-selected` no seletor de modo
- `aria-expanded` no toggle do Coach

### 9.2 O que melhorar

- **Contraste:** `colors.textMuted` (#94a3b8 sobre #f8f9fa = 2.6:1 — abaixo do mínimo WCAG AA de 4.5:1)
- **Touch targets:** Chips de goal do Coach (`GOAL_CHIPS`) precisam de mínimo 44x44px — hoje são `py-1` (4px)
- **`prefers-color-scheme: dark`:** Não implementado
- **Navegação por teclado:** Não testada (importante para dispositivos com teclado físico Android)
- **`focus-visible`:** Poucos componentes têm estilo de foco visível para teclado

---

## 📊 Resumo de Prioridades

| # | Melhoria | Impacto | Complexidade | Status |
|---|----------|---------|--------------|--------|
| 1 | Extrair hooks do `NutritionHomePage` | 🔴 Alto — manutenibilidade | Média | — |
| 2 | Adicionar testes (`nutrition`, `dailyLogs`) | 🔴 Alto — segurança contra regressão | Baixa | — |
| 3 | Tema escuro | 🔴 Alto — UX para todos usuários | Média-Alta | Planejado v1.3.0 |
| 4 | Verificar SecureStorage na biometria | 🔴 Alto — segurança dos dados | Baixa | — |
| 5 | Dedup `SaveStatus` entre páginas | 🟡 Médio — manutenibilidade | Baixa | — |
| 6 | Batch no processador do Diário | 🟡 Médio — performance e custo ($) | Baixa | — |
| 7 | Corrigir `left-1/2` no BottomNav | 🟡 Médio — UI potencialmente quebrada | Trivial | — |
| 8 | Tracking de água dedicado | 🟡 Médio — funcionalidade core | Média | — |
| 9 | Gestos de swipe | 🟡 Médio — UX mobile | Média | — |
| 10 | Unificar Diário vs Seu Dia | 🟡 Médio — UX confusa | Alta | — |
| 11 | Adicionar meta de gordura | 🟢 Baixo — completude | Baixa | — |
| 12 | Alinhar versão `package.json` | 🟢 Baixo — documentação | Trivial | — |
| 13 | Corrigir contraste `textMuted` | 🟢 Baixo — acessibilidade | Trivial | — |
| 14 | Remover `metadata.json` não usado | 🟢 Baixo — limpeza | Trivial | — |
| 15 | Touch targets de 44px nos chips | 🟢 Baixo — acessibilidade | Baixa | — |

---

## 🧭 Conclusão

O app tem uma **base sólida**:

- Arquitetura Capacitor + Supabase + Edge Functions bem montada
- Sistema offline/online com outbox inteligente e funcional
- Uso de React Query + code splitting (`lazy`) mostrando maturidade React
- Atenção a acessibilidade (muitos `aria-*` já presentes)
- Tipagem TypeScript contra o schema real do Supabase

Os pontos acima são majoritariamente de **polimento, segurança e manutenibilidade**, não de reescrita. As duas ações de maior retorno imediato seriam:

1. **Adicionar testes** nas funções puras (baixo custo, altíssimo retorno)
2. **Extrair hooks** do `NutritionHomePage` para reduzir acoplamento antes que a tela cresça mais
