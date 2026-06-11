# Setup de desenvolvimento

## Pré-requisitos

| Ferramenta | Versão sugerida |
|------------|-----------------|
| Node.js | 20+ |
| npm | 10+ |
| JDK | 17 (para Android) |
| Android Studio | Ladybug ou superior |

## Instalação

```bash
git clone <url-do-repo>
cd NTRSL_ANDROID
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

## Desenvolvimento web

```bash
npm run dev
```

Abra `http://localhost:3000`. Use as ferramentas de dispositivo móvel do navegador para simular telas estreitas.

## Android (Capacitor)

1. Gere a pasta nativa (primeira vez):

```bash
npx cap add android
```

2. Build e sincronize:

```bash
npm run cap:sync
npm run cap:open
```

3. No Android Studio: escolha um emulador ou dispositivo físico e rode o app.

Após alterar plugins Capacitor ou `capacitor.config.ts`, execute `npm run cap:sync` novamente.

## Edge Functions (Gemini)

As funções ficam em `supabase/functions/`. Para resumo nutricional e recomendações IA:

1. Instale a [Supabase CLI](https://supabase.com/docs/guides/cli)
2. Vincule ao projeto: `supabase link --project-ref <id>`
3. Configure o secret: `supabase secrets set GOOGLE_API_KEY=<chave>`
4. Deploy: `supabase functions deploy nutrition-summary ai-recommendations ai-cooldown`

Detalhes dos contratos em [API.md](./API.md).

**Fallback offline:** se a Edge Function falhar, a Home usa `buildSummary()` em `src/lib/nutrition.ts`.

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
| IA retorna erro de rede | Edge Functions não deployadas ou `GOOGLE_API_KEY` ausente |
| OAuth / sessão não persiste | Confirme PKCE e redirect URIs no Supabase |
| Mudanças não aparecem no APK | `npm run cap:sync` após `npm run build` |
