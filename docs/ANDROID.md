# Android — Capacitor

Este projeto usa **Capacitor 8** com `appId` **`com.ntrsl.ai`**.

## Divisão de responsabilidades

| Etapa | Onde | Comando / ferramenta |
|-------|------|----------------------|
| Build web (React → `dist/`) | Terminal (repo) | `npm run build` ou `npm run cap:sync` |
| Pasta nativa `android/` | Terminal (repo) | `npx cap add android` (só na **primeira vez**) |
| Copiar web + plugins para Android | Terminal (repo) | `npm run cap:sync` |
| Abrir projeto nativo | Terminal ou Studio | `npm run cap:open` |
| **Gerar APK / AAB / instalar no device** | **Android Studio** | *Build* → *Build Bundle(s) / APK(s)* ou ▶ Run |

O repositório **não exige** `gradlew assembleDebug` na linha de comando. A compilação do APK fica no **Android Studio**.

Config do app: [`capacitor.config.ts`](../capacitor.config.ts).

---

## Pré-requisitos

| Ferramenta | Notas |
|------------|--------|
| Node.js 20+ | `npm install` na raiz |
| Android Studio | Com **Android SDK** instalado (SDK Manager) |
| `.env.local` | `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` — embutidos no build web |

Variáveis `VITE_*` entram no bundle no momento do **`npm run build`**. Rode `cap:sync` **depois** de alterar `.env.local`.

---

## Primeira vez (sem pasta `android/`)

Na raiz do projeto:

```bash
npm install
npm run build
npx cap add android
```

Isso cria a pasta [`android/`](../android/) com o projeto Gradle e copia `dist/` para os assets do app.

### `local.properties` (SDK)

O Android Studio costuma criar automaticamente ao abrir o projeto. Se o Gradle pedir o SDK, copie o exemplo:

```bash
# Windows (PowerShell) — ajuste o usuário se necessário
copy android\local.properties.example android\local.properties
```

Edite `android/local.properties`:

```properties
sdk.dir=C\:\\Users\\SEU_USUARIO\\AppData\\Local\\Android\\Sdk
```

Esse arquivo **não é commitado** (máquina local).

---

## Fluxo após mudanças no código web

Sempre que alterar `src/`, `.env.local`, plugins Capacitor ou `capacitor.config.ts`:

```bash
npm run cap:sync
```

Equivale a `npm run build` + `npx cap sync android`.

Depois abra o Android Studio:

```bash
npm run cap:open
```

---

## Gerar APK no Android Studio

1. Abra o projeto: **File → Open** → pasta `android/` do repositório (ou `npm run cap:open`).
2. Aguarde o **Gradle Sync** terminar.
3. Escolha variante **debug** (desenvolvimento) ou **release** (distribuição).

### APK de debug (teste rápido)

- Menu **Build → Build Bundle(s) / APK(s) → Build APK(s)**  
- Ou clique em **▶ Run** com emulador/dispositivo USB conectado.

APK gerado (caminho típico):

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### APK / AAB de release (Play Store)

1. **Build → Generate Signed Bundle / APK**
2. Siga o assistente (keystore, alias, senhas).
3. Prefira **Android App Bundle (.aab)** para publicação na Play Store.

> Keystore e assinatura são configurados **no Android Studio**, não no npm.

---

## Scripts npm

| Script | O que faz |
|--------|-----------|
| `npm run build` | Só gera `dist/` |
| `npm run cap:sync` | `build` + sincroniza com `android/` |
| `npm run cap:open` | Abre o projeto no Android Studio |

---

## Plugins nativos incluídos

Após `cap sync`, o Capacitor registra plugins como:

- Biometria, secure storage, SQLite
- Push notifications, splash, status bar, teclado
- Haptics, app lifecycle

Se adicionar um plugin npm com parte nativa, rode **`npm run cap:sync`** de novo.

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `SDK location not found` | Crie `android/local.properties` com `sdk.dir` (ver acima) |
| App abre em branco / config missing | Confira `.env.local`, rode `npm run cap:sync` de novo |
| Mudanças da web não aparecem | `npm run cap:sync` antes de rodar no Studio |
| Erro de Java / Gradle na CLI | Use o **JDK embutido do Android Studio** ao abrir pelo Studio; não é obrigatório configurar Java no terminal |
| `Unsupported class file major version` | Terminal com Java muito novo; compile pelo Android Studio |
| Push (FCM) | Requer `google-services.json` e config Firebase — ver [SUPABASE.md](./SUPABASE.md) |

---

## Referências

- [Capacitor — Workflow](https://capacitorjs.com/docs/basics/workflow)
- [SETUP.md](./SETUP.md) — ambiente geral
- [GEMINI_SECRETS.md](./GEMINI_SECRETS.md) — IA no servidor (não no APK)
