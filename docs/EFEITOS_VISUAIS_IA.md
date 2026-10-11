# ✨ Efeitos Visuais, Microinterações e Design System da IA (NTRSL)

Documento espelho sincronizado com o Obsidian Vault: `[[32 - Efeitos Visuais, Microinteracoes e Design System da IA]]`.

---

## 🎨 1. Identidade Cromática: "Warm Minimalist" (iOS-Like)

Tokens de cores definidos em `src/theme/colors.ts`:
- **`background` (`#F5F0EA`):** Fundo acolhedor estilo linho/papel aquecido.
- **`surface` (`#FFFFFF`) & `surfaceWarm` (`#FDF6EE`):** Cards e superfícies translúcidas.
- **`accent` (`#E8A87C`):** Terracota suave — cor hero da IA (ícones `Sparkles`, `Brain`, mic ativo, botões primários).
- **`accentSoft` (`#F0D5B8`):** Fundo atenuado para pílulas, chips e callout "Próximo Passo".
- **`points` (`#6B9E78`):** Verde sábia — validação, calorias gastas e itens resolvidos.
- **Mesh Gradients:** `gradientStart` (`#F2C9A0`), `gradientMid` (`#C8B8D8`), `gradientEnd` (`#A8C4D4`).

---

## 🫧 2. Efeito de Fundo Animado: Blobs em Mesh Gradient (`AppBackground.tsx`)

- Dois orbes desfocados com `filter blur-3xl`, `mix-blend-multiply` e `opacity-70`.
- Animação contínua e assíncrona (`animate-blob` e `animation-delay-2000`) nas cores `#F2C9A0` e `#C8B8D8`.

---

## 🌟 3. Shimmer Text Gradient Animado ("Calculando...") (`SkeletonText.tsx`)

- Ativado enquanto a IA processa a entrada em linguagem natural.
- Keyframe `@keyframes shimmer-text` de 1.6s em ciclo infinito com `-webkit-background-clip: text` e texto transparente:
```css
@keyframes shimmer-text {
  0%   { background-position: 200% center; }
  100% { background-position: -200% center; }
}
```

---

## 🌊 4. Skeleton Shimmer de Alta Performance (`ui/Skeleton.tsx` & `SkeletonBox.tsx`)

- Onda horizontal contínua de 1.15s / 1.4s via pseudoelemento `::after` com gradiente translúcido.
- Acessibilidade: desativado em `@media (prefers-reduced-motion: reduce)`.

---

## 🎙️ 5. Microinteração de Ditado por Voz (`DiaryInput.tsx`)

- Botão de microfone pulsa continuamente a 1.2s com opacidade variando de 1 a 0.45 (`@keyframes mic-pulse`).
- Cor transiciona instantaneamente para `colors.accent` (`#E8A87C`).

---

## 📷 6. Visão Computacional Multimodal (Foto de Refeição)

- Ao capturar imagem, o input bloqueia (`disabled`), placeholder muda para `"Analisando foto…"`, exibe `<SkeletonText />` e trata falhas com feedback textual suave inline.

---

## 🪟 7. Modal Glassmorphism de Refinamento da IA (`AiRefineResultCard.tsx`)

- Backdrop Blur de 10px em `rgba(245, 240, 234, 0.72)`.
- Card modal flutuante com blur de 20px, opacidade 88% e sombra difusa profunda `0 18px 50px rgba(0, 0, 0, 0.10)`.
- Ícone `Brain` em cápsula `accentSoft` + `accent`.
- Lista comparativa de deltas antes vs depois com números tabulares (`tabular-nums`) e grid semântico de calorias.

---

## 🧠 8. Painel do Coach IA (`CoachSection.tsx`)

- Accordion com ícone cintilante `Sparkles` e contador regressivo (`CooldownBanner`).
- Chips rápidos de objetivos com bordas e fundos dinâmicos (`accentSoft` quando ativos).
- Blocos estruturados com ícones temáticos (`UtensilsCrossed`, `Droplets`, `Dumbbell`) e card "Próximo Passo" em destaque dourado/terracota.

---

## 💊 9. Pílula Flutuante de Totais da IA (`DiaryTotalsBar.tsx`)

- Barra suspensa centralizada com cantos totalmente arredondados (`rounded-full`), flutuando sobre a navegação inferior com elevação suave (`0 2px 16px rgba(0,0,0,0.08)`).
- Ícones contextuais por nutriente (`Flame`, `Wheat`, `Beef`, `Droplets`).

---

## 📳 10. Feedback Multissensorial Tátil e Auditivo (`haptics.ts` & `sounds.ts`)

- Feedback tátil nativo via `@capacitor/haptics` (`NotificationType.Success` / `ImpactStyle.Light`).
- Síntese auditiva pura via Web Audio API: oscilador senoidal com acorde duplo 880Hz $\rightarrow$ 1175Hz para sucesso de cálculo.
