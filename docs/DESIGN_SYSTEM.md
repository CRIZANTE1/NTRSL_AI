# Design System

Paleta e regras de UI do NTRSL AI. Fonte de verdade no código: `src/theme/colors.ts` e `.cursor/rules/design-system-colors.mdc`.

## Tokens de cor

| Token | Hex | Uso |
|-------|-----|-----|
| `background` | `#F5F0EA` | Fundo de tela |
| `surface` | `#FFFFFF` | Cards principais |
| `surfaceWarm` | `#FDF6EE` | Cards secundários |
| `gradientStart` | `#F2C9A0` | Mesh warm (início) |
| `gradientMid` | `#C8B8D8` | Mesh warm (meio) |
| `gradientEnd` | `#A8C4D4` | Mesh warm (fim) |
| `textPrimary` | `#1A1A1A` | Títulos e texto principal |
| `textSecondary` | `#8A8A8A` | Texto secundário |
| `textMuted` | `#BBBBBB` | Placeholders / desabilitado |
| `accent` | `#E8A87C` | CTA, destaques |
| `accentSoft` | `#F0D5B8` | Hover / estados suaves |
| `border` | `#EDEDE9` | Bordas e divisores |
| `iconActive` | `#1A1A1A` | Ícones ativos |
| `iconInactive` | `#BBBBBB` | Ícones inativos |
| `badge` | `#FF4444` | Urgência / erro |
| `points` | `#6B9E78` | Progresso, OK, macros |

## Regras de uso

- **Fundo de tela:** `colors.background` (`AppBackground`, body)
- **Cards:** `surface` ou `surfaceWarm`
- **CTA primário:** `accent` (ex.: "Calcular resumo", login)
- **CTA secundário / sucesso:** `points` (ex.: botão IA)
- **Não inventar hex novos** — importar de `src/theme/colors.ts`

## Componentes visuais

| Padrão | Onde |
|--------|------|
| Glass morphism | `BottomNav`, `login-form`, `HeaderApp` via `theme/glass.ts` |
| Blobs gradiente | `AppBackground.tsx` |
| Bottom nav fixa | `BottomNav` + `lib/layout.ts` (`NAV_BOTTOM_CLASS`) |
| Safe area | `env(safe-area-inset-*)` em `index.css` e layout |

## Tipografia

- Fonte base: Inter (via `index.css`)
- Títulos de tela: `font-light` / `text-2xl`–`text-3xl`
- Labels de seção: `text-xs font-bold uppercase tracking-wide` + `textSecondary`

## Tema claro/escuro

- Persistência: `localStorage` chave `ntrsl_theme`
- API: `src/lib/theme.ts` (`getTheme`, `setTheme`, `toggleTheme`)
- Classe `dark` no `<html>` quando escuro

## Capacitor

Splash e status bar usam `#F5F0EA` (`capacitor.config.ts`), alinhado a `colors.background`.

## Exemplo de import

```typescript
import { colors } from '../theme/colors';

<div style={{ background: colors.surface, borderColor: colors.border }}>
  <p style={{ color: colors.textPrimary }}>Título</p>
</div>
```
