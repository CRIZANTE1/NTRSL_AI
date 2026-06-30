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

## Ambiente Gradle (JDK + rede corporativa)

O projeto inclui configuração em [`android/gradle.properties`](../android/gradle.properties) para dois problemas comuns no Windows em ambiente corporativo.

### 1. JDK — não use Java 25 no Gradle

Se o `JAVA_HOME` do sistema apontar para **Java 25** (ou outra versão muito nova), o Gradle 8.x pode falhar com:

```text
Unsupported class file major version 69
BUG! exception in phase 'semantic analysis' in source unit '_BuildScript_'
```

**Solução no projeto:** `org.gradle.java.home` aponta para o **JDK embutido do Android Studio** (JBR 21):

```properties
org.gradle.java.home=C:/Program Files/Android/Android Studio/jbr
```

> Ajuste o caminho se o Android Studio estiver instalado em outro diretório.

**No Android Studio:** *Settings → Build, Execution, Deployment → Build Tools → Gradle → Gradle JDK* → escolha **Embedded JDK (jbr-21)**. Não selecione Java 25 do sistema.

### 2. SSL — proxy / inspeção HTTPS na rede

Em redes com proxy corporativo (certificado interno), o Gradle pode não baixar dependências e o Android Studio exibe:

```text
Failed to resolve: net.zetetic:sqlcipher-android:4.10.0
Failed to resolve: com.google.firebase:firebase-messaging:25.0.1
```

Ou, no log do Gradle:

```text
PKIX path building failed: unable to find valid certification path to requested target
SSLInitializationException: WINDOWS-ROOT not found
```

**Causa:** o Java do Gradle usa o trust store padrão (`cacerts`), que **não** inclui o certificado da empresa. O navegador e o Windows confiam, mas o Gradle não.

**Solução no projeto** (`android/gradle.properties`):

```properties
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8 \
  -Djavax.net.ssl.trustStore=C:/Windows/win.ini \
  -Djavax.net.ssl.trustStoreType=Windows-ROOT

systemProp.javax.net.ssl.trustStore=C\:\\Windows\\win.ini
systemProp.javax.net.ssl.trustStoreType=Windows-ROOT
```

| Propriedade | Função |
|-------------|--------|
| `trustStoreType=Windows-ROOT` | Usa o repositório de certificados raiz do Windows |
| `trustStore=C:/Windows/win.ini` | Arquivo “dummy” exigido pelo Gradle (o conteúdo é ignorado) |

**Importante:** definir **somente** `-Djavax.net.ssl.trustStoreType=WINDOWS-ROOT` em `jvmargs`, **sem** `trustStore`, causa `WINDOWS-ROOT not found`. Use sempre o par completo acima.

Há reforço adicional em [`android/settings.gradle`](../android/settings.gradle) e [`android/build.gradle`](../android/build.gradle) para o sync do Android Studio.

### Dependências afetadas (normais do projeto)

| Artefato | Módulo | Repositório |
|----------|--------|-------------|
| `net.zetetic:sqlcipher-android:4.10.0` | `@capacitor-community/sqlite` | Maven Central |
| `com.google.firebase:firebase-messaging:25.0.1` | `@capacitor/push-notifications` | Google Maven |

Não é necessário adicionar repositório extra — basta o Gradle conseguir acessar HTTPS.

### Após alterar `gradle.properties`

```powershell
cd android
.\gradlew --stop
```

No Android Studio: **File → Sync Project with Gradle Files**. Se o erro persistir na UI: **File → Invalidate Caches → Invalidate and Restart**.

### Validar pela linha de comando (opcional)

```powershell
cd android
.\gradlew --stop
.\gradlew :app:dependencies --configuration debugRuntimeClasspath
.\gradlew assembleDebug
```

Na saída de `dependencies`, devem aparecer `sqlcipher-android:4.10.0` e `firebase-messaging:25.0.1`.

### Aviso `Using flatDir should be avoided`

Mensagem exibida ao configurar o projeto:

```text
WARNING: Using flatDir should be avoided because it doesn't support any meta-data formats.
```

É **esperado** em projetos Capacitor (plugins Cordova legados em `android/app/build.gradle` e `capacitor-cordova-android-plugins`). É apenas um **warning** — **não** impede compilar, sincronizar nem executar o app.

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `SDK location not found` | Crie `android/local.properties` com `sdk.dir` (ver acima) |
| App abre em branco / config missing | Confira `.env.local`, rode `npm run cap:sync` de novo |
| Mudanças da web não aparecem | `npm run cap:sync` antes de rodar no Studio |
| `Failed to resolve: sqlcipher-android` ou `firebase-messaging` | Rede/proxy — ver seção [Ambiente Gradle](#ambiente-gradle-jdk--rede-corporativa); rode `.\gradlew --stop` e sync de novo |
| `PKIX path building failed` | Mesma seção SSL acima |
| `WINDOWS-ROOT not found` | Não use só `trustStoreType` sem `trustStore`; use o par em `gradle.properties` |
| `Unsupported class file major version 69` | Java 25 no PATH; use JBR 21 (`org.gradle.java.home` ou Gradle JDK no Studio) |
| Erro de Java / Gradle na CLI | Prefira compilar pelo Android Studio com Embedded JDK |
| Push (FCM) | Requer `google-services.json` e config Firebase — ver [SUPABASE.md](./SUPABASE.md) |

---

## Referências

- [Capacitor — Workflow](https://capacitorjs.com/docs/basics/workflow)
- [SETUP.md](./SETUP.md) — ambiente geral
- [GEMINI_SECRETS.md](./GEMINI_SECRETS.md) — IA no servidor (não no APK)
