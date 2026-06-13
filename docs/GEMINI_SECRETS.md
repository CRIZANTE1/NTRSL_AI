# Chave Gemini — onde configurar (e onde não)

As Edge Functions **`nutrition-summary`** e **`ai-recommendations`** chamam a API do Google Gemini **no servidor**. As buscas **`food-search`** e **`exercise-search`** usam dicionário estático (sem Gemini). A chave **nunca** deve estar no app React, no `.env.local` do Vite nem em variáveis `VITE_*`.

## Regra de ouro

| Local | Variável | Usar? |
|-------|----------|-------|
| Supabase → Edge Functions → **Secrets** | `GOOGLE_API_KEY` | ✅ Sim |
| Supabase → Edge Functions → **Secrets** | `FDC_API_KEY` | ✅ Sim (busca USDA — `food-search`) |
| Supabase → Edge Functions → **Secrets** | `WEGER_API_KEY` | ✅ Opcional (`exercise-search`; busca pública funciona sem chave) |
| Supabase → Edge Functions → **Secrets** | `GEMINI_MODEL` (opcional) | ✅ Opcional |
| `.env.local` do app | `VITE_GEMINI_API_KEY` | ❌ **Não** |
| `.env.local` do app | `VITE_FDC_API_KEY` | ❌ **Não** |
| `.env.local` do app | `VITE_WGER_API_KEY` | ❌ **Não** |
| Código em `src/` | qualquer chave Gemini | ❌ **Não** |

O cliente em `src/lib/api.ts` só envia o **JWT do Supabase** para as Edge Functions. Quem lê `GOOGLE_API_KEY` é o runtime Deno em `supabase/functions/_shared/gemini.ts`.

## Modelo Gemini (padrão)

| Item | Valor |
|------|-------|
| **Modelo padrão** | `gemini-3.1-flash-lite` |
| **Definido em** | `supabase/functions/_shared/gemini.ts` (`getGeminiModel`) |
| **Override** | Secret `GEMINI_MODEL` no Supabase (opcional) |
| **Redeploy** | Não obrigatório ao mudar só o secret; obrigatório se alterar o fallback no código |

Funções que usam o modelo (via `getGeminiModel` / `generateJson`):

| Edge Function | Uso do Gemini |
|---------------|----------------|
| `nutrition-summary` | Cálculo nutricional a partir de listas |
| `ai-recommendations` | Texto do coach |

`food-search` e `exercise-search` **não** usam Gemini — dicionário estático em `_shared/data/*-aliases.json` (regenerar com `npm run build:search-aliases`).

Para fixar o modelo em produção sem depender do fallback do código:

```bash
supabase secrets set GEMINI_MODEL=gemini-3.1-flash-lite
```

> **Histórico:** até jun/2026 o padrão era `gemini-2.5-flash`. Se o secret antigo ainda existir no projeto, ele **sobrescreve** o fallback do código — atualize ou remova `GEMINI_MODEL` no Dashboard.

## Por que não usar `VITE_GEMINI_API_KEY`?

1. **Segurança:** variáveis `VITE_*` são embutidas no bundle JavaScript. Qualquer pessoa pode extrair a chave do APK ou do site.
2. **Custo e abuso:** chave exposta pode ser usada fora do app, gerando cobrança na sua conta Google.
3. **Arquitetura:** o app já foi desenhado para IA só via Edge Functions; a chave no cliente **não é usada** pelo código atual.

Se você tinha `VITE_GEMINI_API_KEY` no `.env.local`, **remova** e configure o secret no Supabase (passos abaixo).

## Configurar no Dashboard (recomendado)

1. Abra [Supabase Dashboard](https://supabase.com/dashboard) e selecione o projeto (ex.: `aumvxnccdhcrftvnliwa`).
2. Vá em **Project Settings** (ícone de engrenagem).
3. Menu **Edge Functions** → aba **Secrets**.
4. Clique em **Add new secret** (ou **New secret**).
5. Preencha:
   - **Name:** `GOOGLE_API_KEY`
   - **Value:** sua chave da [Google AI Studio](https://aistudio.google.com/apikey) ou Google Cloud (API Gemini habilitada).
6. Salve.

Opcional — modelo (recomendado alinhar ao padrão do app):

| Name | Value | Exemplo |
|------|-------|---------|
| `GEMINI_MODEL` | ID do modelo Google | `gemini-3.1-flash-lite` |

Os secrets ficam disponíveis automaticamente para **todas** as Edge Functions do projeto via `Deno.env.get('GOOGLE_API_KEY')`.

> Após adicionar ou alterar um secret, não é necessário redeploy das funções para o secret passar a valer (o Supabase injeta em runtime). Se a IA ainda falhar, confira os [logs das Edge Functions](https://supabase.com/dashboard/project/_/functions) no Dashboard.

## Configurar via CLI

Com [Supabase CLI](https://supabase.com/docs/guides/cli) instalada e projeto vinculado:

```bash
supabase login
supabase link --project-ref <seu-project-ref>

supabase secrets set GOOGLE_API_KEY=<sua-chave-gemini>

# Opcional:
supabase secrets set GEMINI_MODEL=gemini-3.1-flash-lite

# Busca de alimentos (USDA FDC):
supabase secrets set FDC_API_KEY=<sua-chave-fdc>

# Busca de exercícios (WGER — token permanente do perfil em wger.de):
supabase secrets set WEGER_API_KEY=<seu-token-wger>
```

Listar secrets (nomes apenas, valores mascarados):

```bash
supabase secrets list
```

## O que pode ficar no `.env.local` do app

Apenas variáveis **públicas** do Supabase (anon key é segura no cliente com RLS):

```env
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
```

Opcional:

```env
VITE_ENABLE_PUSH=true
```

Modelo completo: [`.env.example`](../.env.example).

## Verificar se está funcionando

1. Faça login no app.
2. Na Home, adicione exercícios/alimentos e clique em **Calcular resumo**.
3. Se `GOOGLE_API_KEY` estiver ausente no Supabase, a função retorna erro e o app usa **cálculo local** (fallback) com aviso na tela.
4. Clique em **Pedir recomendação da IA** — deve retornar texto do coach (cooldown de 30 min entre pedidos).
5. Na Home, busque um **exercício** (ex.: "agachamento") ou **alimento** (ex.: "frango") — deve retornar resultados com badge Local / Cache / WGER ou USDA.

Erros comuns no Dashboard → **Edge Functions** → **Logs**:

| Mensagem | Causa |
|----------|--------|
| `GOOGLE_API_KEY não configurada` | Secret não criado ou nome errado (tem que ser exatamente `GOOGLE_API_KEY`) |
| `401` / token | Sessão expirada — faça login de novo |
| `502` / Gemini | Chave inválida, quota ou modelo indisponível |
| `502` / WGER | API WGER indisponível ou rate-limit (configure `WEGER_API_KEY`) |

## Rotação da chave (se vazou)

Se a chave já foi commitada ou usada em `VITE_GEMINI_API_KEY`:

1. **Revogue** a chave antiga no Google AI Studio / Google Cloud Console.
2. Gere uma **nova** chave.
3. Atualize o secret `GOOGLE_API_KEY` no Supabase (Dashboard ou CLI).
4. Remova `VITE_GEMINI_API_KEY` do `.env.local` e de qualquer histórico git (se aplicável).
5. **Não** commite `.env.local` — ele está no `.gitignore`.

## Referências

- [API.md](./API.md) — contratos das Edge Functions
- [SETUP.md](./SETUP.md) — ambiente de desenvolvimento
- [versions/v1.1.0.md](./versions/v1.1.0.md) — introdução do Gemini no projeto
