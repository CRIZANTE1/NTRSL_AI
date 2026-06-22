# iOS (Capacitor)

## Pré-requisitos

| Ferramenta | Como instalar |
|------------|---------------|
| Xcode (ou Command Line Tools) | `xcode-select --install` |
| CocoaPods (gerenciador de dependências iOS) | `brew install cocoapods` |
| Node.js 20+ | `brew install node` |

> Para subir na App Store, você precisa do **Xcode completo** (App Store). Para só testar no simulador, as Command Line Tools + CocoaPods já bastam.

---

## Adicionar a plataforma iOS

```bash
npm install @capacitor/ios
npx cap add ios
```

Isso cria a pasta `ios/` com o projeto Xcode.

---

## Sincronizar o frontend com o iOS

Toda vez que alterar o código web (`src/`, `index.html`, plugins, configs):

```bash
npm run build && npx cap sync ios
```

| Comando | O que faz |
|---------|-----------|
| `npm run build` | Gera os arquivos estáticos em `dist/` |
| `npx cap sync ios` | Copia `dist/` → `ios/App/App/public/` e atualiza plugins nativos |

Para abrir o Xcode:

```bash
npx cap open ios
```

Depois dê **▶ Run** no Xcode.

---

## Live Reload no iOS

Com live reload, o app carrega do servidor Vite em vez dos arquivos estáticos. Qualquer save no código aparece **instantaneamente** no simulador/device — sem rebuild, sem sync manual.

### Configuração

No `capacitor.config.ts`:

```typescript
const isDev = process.env.NODE_ENV !== 'production';

const config: CapacitorConfig = {
  // ...
  ...(isDev && {
    server: {
      url: 'http://<IP-DO-SEU-MAC>:5173',
      cleartext: true,
    },
  }),
  // ...
};
```

> Para descobrir o IP do Mac: `ipconfig getifaddr en0`

### Uso diário

**Terminal 1 — servidor de desenvolvimento:**

```bash
cd NTRSL_ANDROID
npm run dev
```

Mantenha este terminal aberto.

**Terminal 2 — abrir no Xcode e rodar:**

```bash
npx cap open ios
```

Dê **▶ Run** no Xcode.

O app vai carregar de `http://<IP>:5173` — o HMR do Vite atualiza o app a cada save.

### Como funciona

```
┌──────────────────┐                      ┌──────────────────┐
│  Simulador iOS   │   HTTP na rede local  │      Mac         │
│  WKWebView       │ ────────────────────▶ │  Vite :5173      │
│                  │   carrega os assets   │  (HMR ativo)     │
└──────────────────┘                      └──────────────────┘
```

O Capacitor detecta a chave `server.url` e instrui o WKWebView a carregar a URL remota em vez dos arquivos locais de `ios/App/App/public/`. Como está na mesma rede, a latência é mínima. O Vite faz Hot Module Replacement — só o módulo alterado é recarregado.

### Viewport e Safe Area (iOS)

Para evitar zoom indesejado e garantir que o app respeite a Dynamic Island, notch e home indicator:

**`index.html` — viewport:**
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover" />
```

**`src/index.css` — safe area no #root:**
```css
#root {
  min-height: 100dvh;
  box-sizing: border-box;
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
```

### Status Bar no iOS

O plugin `@capacitor/status-bar` controla o estilo e overlay:

```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

StatusBar.setOverlaysWebView({ overlay: true });
StatusBar.setStyle({ style: Style.Dark }); // ou Style.Light
```

### Keyboard

O plugin `@capacitor/keyboard` ajusta o layout quando o teclado abre:

```typescript
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

if (Capacitor.getPlatform() === 'ios') {
  Keyboard.setResizeMode({ mode: KeyboardResize.Body });
}
```

---

## Build de produção

```bash
npm run build
npx cap sync ios
npx cap open ios
```

No Xcode: **Product → Archive** para gerar o `.ipa` para App Store ou TestFlight.

> Para distribuir na App Store você precisa de uma conta Apple Developer (US$ 99/ano).

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `ios platform has not been added yet` | Rode `npm install @capacitor/ios && npx cap add ios` |
| App com zoom em tudo | Verifique se a meta viewport em `index.html` tem `maximum-scale=1.0, user-scalable=no` |
| Barras superior/inferior invadem notch/Home Indicator | Adicione `padding-top: env(safe-area-inset-top)` e `padding-bottom: env(safe-area-inset-bottom)` no CSS |
| Live reload não conecta | Mac e simulador precisam estar na mesma rede; confirme o IP com `ipconfig getifaddr en0` |
| `CocoaPods` não encontrado | `brew install cocoapods` |
| `xcrun: error: unable to find simulator` | Abra o Xcode pelo menos uma vez e instale os componentes adicionais |
| Certificado SSL do npm expirado | `npm config set strict-ssl false` (temporário) ou `brew reinstall ca-certificates` |
| "No provisioning profile" no Archive | Configure o signing no Xcode: **Signing & Capabilities → Team** |

---

## Referências

- [SETUP.md](./SETUP.md) — ambiente geral do projeto
- [LIVE_RELOAD.md](./LIVE_RELOAD.md) — live reload no Android
- [Documentação oficial — Capacitor iOS](https://capacitorjs.com/docs/ios)
- [Documentação oficial — Live Reload](https://capacitorjs.com/docs/guides/live-reload)
