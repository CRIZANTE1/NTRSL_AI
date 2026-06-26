# Setup de desenvolvimento

## Pré-requisitos

| Ferramenta | Versão sugerida |
|------------|-----------------|
| Node.js | 20+ |
| npm | 10+ |
| JDK | **21** via Android Studio (JBR) — ver [ANDROID.md § Ambiente Gradle](./ANDROID.md#ambiente-gradle-jdk--rede-corporativa) |
| Android Studio | Ladybug ou superior |

## Instalação

```bash
git clone <url-do-repo>
cd NTRSL_AI
npm install
```

## Variáveis de ambiente

Crie `.env.local` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Opcional (push nativo):

```env
VITE_ENABLE_PUSH=true
```

Sem `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, o app exibe `ConfigMissingScreen` em vez de carregar.

### ⚠️ Gemini: não use `VITE_GEMINI_API_KEY`

A chave do Gemini **não** vai no `.env.local`. Configure `GOOGLE_API_KEY` nos **secrets das Edge Functions** no Supabase.

→ Guia passo a passo: **[GEMINI_SECRETS.md](./GEMINI_SECRETS.md)**

## Desenvolvimento web

```bash
npm run dev
```

Abra `http://localhost:3000`. Use as ferramentas de dispositivo móvel do navegador para simular telas estreitas.

## Android (Capacitor)

Responsabilidade do **repositório**: build web + pasta `android/` sincronizada.  
Responsabilidade do **Android Studio**: compilar APK/AAB e rodar em emulador ou device.

**Primeira vez:**

```bash
npm run build
npx cap add android
```

**Depois de alterar o frontend ou plugins:**

```bash
npm run cap:sync
npm run cap:open
```

No Studio: **▶ Run** ou **Build → Build APK(s)**.

→ Guia detalhado: **[ANDROID.md](./ANDROID.md)** (`local.properties`, debug vs release, **Gradle/JDK/proxy**, troubleshooting).

## Edge Functions (Gemini)

As funções ficam em `supabase/functions/`. Para resumo nutricional, recomendações IA e buscas:

1. Configure secrets no Supabase — ver **[GEMINI_SECRETS.md](./GEMINI_SECRETS.md)** (Dashboard ou CLI):
   - `GOOGLE_API_KEY` (obrigatório para IA e buscas)
   - `GEMINI_MODEL` (opcional; padrão do app: `gemini-3.1-flash-lite`)
   - `FDC_API_KEY` (busca de alimentos — `food-search`)
   - `WEGER_API_KEY` (opcional — busca de exercícios — `exercise-search`)
2. Deploy (se ainda não feito):

```bash
supabase functions deploy nutrition-summary ai-recommendations ai-cooldown push-register
supabase functions deploy food-search exercise-search
```

Detalhes dos contratos em [API.md](./API.md).

**Fallback offline:** se a Edge Function falhar, a Home usa `buildSummary()` em `src/lib/nutrition.ts`. Os pickers (`FoodPicker`, `ExercisePicker`) mostram sugestões locais quando a busca remota está indisponível.

## Qualidade de código

```bash
npm run lint        # tsc + eslint
npm run lint:eslint # só eslint
npm run build       # verifica build de produção
```

## Troubleshooting

| Problema | Solução |
|----------|---------|
| Tela branca / config missing | Verifique `.env.local` e reinicie `npm run dev` |
| IA retorna erro / só cálculo local | `GOOGLE_API_KEY` ausente nos secrets — ver [GEMINI_SECRETS.md](./GEMINI_SECRETS.md) |
| Busca de alimentos offline | `food-search` indisponível — picker usa `calorias.json` local |
| Busca de exercícios offline | `exercise-search` indisponível — picker usa `exercicios.json` local |
| Tinha `VITE_GEMINI_API_KEY` no `.env.local` | Remova; não é usada e vaza no bundle — use secret no Supabase |
| OAuth / sessão não persiste | Confirme PKCE e redirect URIs no Supabase |
| Mudanças não aparecem no APK | `npm run cap:sync` após `npm run build` |
