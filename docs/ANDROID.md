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

### 2. SSL — proxy / inspeção HTTPS na rede (rede corporativa)

Em redes com proxy corporativo (Netskope, Zscaler, CA interna etc.), o Gradle não baixa dependências e o Android Studio exibe:

```text
PKIX path building failed: unable to find valid certification path to requested target
(certificate_unknown) unable to find valid certification path to requested target
Could not GET 'https://dl.google.com/dl/android/maven2/...'
```

**Causa:** o JBR do Gradle não confia no certificado da empresa. O navegador e o Windows confiam; o Java do Gradle, não.

#### O que NÃO funciona com o JBR do Android Studio

| Abordagem | Erro |
|-----------|------|
| `trustStoreType=Windows-ROOT` + `trustStore=C:/Windows/win.ini` | `Windows-ROOT KeyStore not available` |
| Plugin `foojay-resolver-convention` em `settings.gradle` | Falha ao baixar o plugin (mesmo problema de rede) |
| `distributionUrl=file:/Users/.../gradle-8.14.3-all.zip` (caminho de outra máquina) | Arquivo não encontrado no Windows |

O projeto já evita esses casos: wrapper com URL HTTPS pública, sem plugin foojay, `org.gradle.java.home` apontando para o JBR.

#### Solução validada (Windows + rede BR / Netskope)

Gera um truststore JKS em `%USERPROFILE%\.gradle\windows-truststore.jks` e configura `%USERPROFILE%\.gradle\gradle.properties` (fora do git — por máquina).

**Passo 1 — Exportar certificados da empresa**

Abra `certmgr.msc` → **Autoridades de Certificação Raiz Confiáveis** → **Computador Local** e exporte em `.cer` (DER):

| Certificado típico (rede BR) | Uso |
|------------------------------|-----|
| Netskope / proxy SSL | Inspeção HTTPS do proxy |
| `BR Distribuidora CA Enterprise` | CA interna da empresa |
| Outras CAs internas listadas pela TI | Se o sync ainda falhar após o primeiro |

> Peça à TI a lista de CAs se não souber quais exportar.

**Passo 2 — Importar no truststore do Gradle**

Na raiz do repositório:

```powershell
# Certificado principal (ex.: Netskope)
.\scripts\setup-gradle-ssl-windows.ps1 -CertFile C:\caminho\netskope.cer

# Se ainda falhar PKIX, importe CAs adicionais no mesmo truststore:
$keytool = "C:\Program Files\Android\Android Studio\jbr\bin\keytool.exe"
& $keytool -importcert -noprompt -alias br-enterprise `
  -file C:\caminho\br-distribuidora-enterprise.cer `
  -keystore "$env:USERPROFILE\.gradle\windows-truststore.jks" `
  -storepass changeit
```

O script [`scripts/setup-gradle-ssl-windows.ps1`](../scripts/setup-gradle-ssl-windows.ps1):

1. Copia o `cacerts` do JBR como base
2. Importa o `.cer` informado
3. Grava em `~/.gradle/gradle.properties`:

```properties
# NTRSL — truststore Windows (scripts/setup-gradle-ssl-windows.ps1)
systemProp.javax.net.ssl.trustStore=C:/Users/SEU_USUARIO/.gradle/windows-truststore.jks
systemProp.javax.net.ssl.trustStorePassword=changeit
```

**Passo 3 — Reiniciar o Gradle e sincronizar**

```powershell
cd android
.\gradlew --stop
```

No Android Studio:

1. *Settings → Gradle → Gradle JDK* → **Embedded JDK (jbr-21)**
2. **File → Sync Project with Gradle Files**

**Passo 4 — Validar (opcional)**

```powershell
cd android
.\gradlew :app:dependencies --configuration debugRuntimeClasspath
.\gradlew assembleDebug
```

#### Alternativa rápida (sem certificado)

Build em rede **sem** inspeção SSL (ex.: hotspot do celular) → Sync no Studio. Útil para confirmar que o problema é só a rede corporativa.

#### Dependências afetadas (normais do projeto)

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
| `Failed to resolve: sqlcipher-android` ou `firebase-messaging` | Rede/proxy — ver [SSL rede corporativa](#2-ssl--proxy--inspeção-https-na-rede-rede-corporativa); `.\gradlew --stop` + sync |
| `PKIX path building failed` / `certificate_unknown` | Rode `setup-gradle-ssl-windows.ps1` + importe CAs extras se necessário (seção SSL) |
| `Windows-ROOT KeyStore not available` | Não use `Windows-ROOT` com JBR; use o script de truststore JKS |
| `gradle-8.x-all.zip` em `/Users/...` (outro usuário) | Corrija `android/gradle/wrapper/gradle-wrapper.properties` para URL `https://services.gradle.org/...` |
| `foojay-resolver-convention` not found | Remova o plugin de `android/settings.gradle` (não é necessário no Capacitor Android) |
| `Unsupported class file major version 69` | Java 25 no PATH; use JBR 21 (`org.gradle.java.home` ou Gradle JDK no Studio) |
| Erro de Java / Gradle na CLI | Prefira compilar pelo Android Studio com Embedded JDK |
| Push (FCM) | Requer `google-services.json` e config Firebase — ver [SUPABASE.md](./SUPABASE.md) |

---

## Referências

- [Capacitor — Workflow](https://capacitorjs.com/docs/basics/workflow)
- [SETUP.md](./SETUP.md) — ambiente geral
- [GEMINI_SECRETS.md](./GEMINI_SECRETS.md) — IA no servidor (não no APK)
