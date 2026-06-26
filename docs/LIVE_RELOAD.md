# Live Reload no Emulador Android (macOS)

Rodar o app com **live reload real**: alterações no código React refletem **instantaneamente** no emulador, sem precisar rebuildar o APK.

## Pré-requisitos

| Ferramenta | Como instalar |
|------------|---------------|
| JDK 21 | `brew install openjdk@21` |
| Android Studio | `brew install --cask android-studio` |
| Node.js 20+ | `brew install node` |

### Variáveis de ambiente (`~/.zshrc`)

```bash
# Java (JDK 21)
export JAVA_HOME="/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
export PATH="$JAVA_HOME/bin:$PATH"

# Android SDK
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
```

Depois de editar, recarregue:

```bash
source ~/.zshrc
```

Verifique:

```bash
java -version        # openjdk version "21.0.11"
adb --version        # Android Debug Bridge version 1.0.41
emulator -list-avds  # Pixel_10_Pro (ou o nome do seu AVD)
```

### Imagem do emulador (Apple Silicon)

No AVD Manager do Android Studio, use imagem **arm64-v8a** (não x86_64). Performance nativa nos chips M1/M2/M3.

---

## Live Reload — passo a passo

### Terminal 1: servidor de desenvolvimento

```bash
cd NTRSL_AI
npm run dev
```

O Vite sobe em `http://localhost:3000`. **Mantenha este terminal aberto.**

### Terminal 2: emulador com live reload

```bash
cd NTRSL_AI
npx cap run android \
  --live-reload \
  --host=localhost \
  --port=3000 \
  --forwardPorts=3000:3000 \
  --target-name "Pixel 10 Pro"
```

O que cada flag faz:

| Flag | Função |
|------|--------|
| `--live-reload` | WebView carrega do servidor de dev em vez dos assets do APK |
| `--host=localhost` | Endereço que o WebView usa para alcançar o servidor |
| `--port=3000` | Porta do servidor Vite |
| `--forwardPorts=3000:3000` | Redireciona `localhost:3000` do dispositivo → `localhost:3000` do Mac (via `adb reverse`) |
| `--target-name "Pixel 10 Pro"` | Nome do AVD (use `npx cap run android --list` para ver os disponíveis) |

---

## Como funciona

```
┌──────────────┐     adb reverse      ┌──────────────┐
│  Emulador    │  localhost:3000 ────▶ │    Mac       │
│  WebView     │                       │  Vite :3000  │
└──────────────┘                       └──────────────┘
```

O Capacitor faz **deploy de um APK único** que carrega a URL `http://localhost:3000`. O `adb reverse` encaminha essa porta para o Mac. Qualquer save no código dispara HMR (Hot Module Replacement) do Vite — o WebView recarrega o módulo alterado sem perder estado.

---

## Dicas

- **Deixar o emulador aberto**: feche só o app (arraste pra cima no emulador), não o emulador inteiro. Da próxima vez é só rodar o comando do terminal 2 de novo — o deploy leva ~3s.
- **Mudar o AVD**: substitua `"Pixel 10 Pro"` pelo nome do seu device. Liste com `npx cap run android --list`.
- **HMR não funciona?** Dê um swipe pra baixo (refresh) no WebView, ou aperte `r` no terminal do Vite.
- **Erro de conexão (chrome-error)?** Verifique se o terminal 1 (Vite) está rodando e se o `adb reverse` está ativo:
  ```bash
  adb reverse --list   # deve mostrar tcp:3000 tcp:3000
  ```

---

## Troubleshooting rápido

| Problema | Solução |
|----------|---------|
| `gradlew: Permission denied` | `chmod +x android/gradlew` |
| `invalid source release: 21` | Precisa do JDK 21 — `brew install openjdk@21` |
| `SDK location not found` | Crie `android/local.properties` com `sdk.dir=/Users/$USER/Library/Android/sdk` |
| `chrome-error://chromewebdata` | Servidor Vite não está rodando ou `adb reverse` caiu |
| Emulador não abre | Abra pelo Android Studio primeiro: **Device Manager → ▶** no AVD |
| `Windows-ROOT not found` | Removeu as configs Windows do `gradle.properties`, `build.gradle` e `settings.gradle`? |

---

## Referências

- [SETUP.md](./SETUP.md) — ambiente geral do projeto
- [IOS.md](./IOS.md) — live reload no iOS, Xcode, safe area
- [ANDROID.md](./ANDROID.md) — build de release, keystore, Play Store
- [Capacitor — Live Reload](https://capacitorjs.com/docs/guides/live-reload)
