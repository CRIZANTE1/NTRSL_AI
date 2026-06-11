# Documentação — NTRSL AI

Índice da documentação do app mobile **NTRSL AI** (`com.ntrsl.ai`).

| Documento | Conteúdo |
|-----------|----------|
| [SETUP.md](./SETUP.md) | Pré-requisitos, variáveis de ambiente, dev web e Android |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Stack, pastas, rotas, fluxos e offline |
| [API.md](./API.md) | Edge Functions Supabase + Gemini |
| [SUPABASE.md](./SUPABASE.md) | Auth, tabelas sugeridas, RLS e push |
| [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) | Tokens de cor e regras de UI |

## Visão rápida

O NTRSL AI é um app de saúde e bem-estar que permite:

- Registrar exercícios e alimentos do dia
- Calcular resumo calórico via **Gemini** (Edge Function), com fallback offline (JSON embarcado)
- Solicitar recomendações de coach via **Gemini** (Edge Functions Supabase; chave nunca no cliente)
- Autenticar com Supabase (e-mail/senha; Google OAuth planejado)

## Repositório

```
NTRSL_ANDROID/
├── src/              # Frontend React + Capacitor
├── docs/             # Esta pasta
├── android/          # Gerado após npx cap add android
├── supabase/functions/  # Edge Functions (Gemini)
├── package.json
└── capacitor.config.ts
```

## Comandos úteis

```bash
npm run dev          # Web em http://localhost:3000
npm run lint         # TypeScript + ESLint
npm run build        # Build produção → dist/
npm run cap:sync     # Build + sync Android
npm run cap:open     # Abre Android Studio
```
