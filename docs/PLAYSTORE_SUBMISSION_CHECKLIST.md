# Checklist de Publicação — Google Play Store
## NTRSL AI (`com.ntrsl.ai`) · v1.0.1

> Execute este checklist **na ordem apresentada** antes de publicar.  
> ✅ = concluído | ⬜ = pendente | ⚠️ = atenção especial

---

## FASE 1 — Pré-requisitos (fazer uma única vez)

### 1.1 Conta Google Play Developer
- ⬜ Criar conta em https://play.google.com/console
- ⬜ Pagar taxa de registro (US$ 25, única vez)
- ⬜ Verificar identidade (pode levar 1–3 dias úteis)
- ⬜ Aceitar os Termos de Serviço do desenvolvedor

### 1.2 Hospedar a Política de Privacidade
A Play Store exige uma URL pública acessível antes de publicar.

**Passo a passo (GitHub Pages — recomendado):**
1. ⬜ No repositório https://github.com/CRIZANTE1/NTRSL_AI, vá em **Settings → Pages**
2. ⬜ Em "Source", selecione `Deploy from a branch` → branch `main` → pasta `/docs`
3. ⬜ Crie `docs/privacy-policy.html` convertendo `docs/PRIVACY_POLICY.md` para HTML
   - Ferramenta rápida: https://markdowntohtml.com/ (cole o conteúdo do .md)
4. ⬜ Aguardar ativação (1–5 minutos)
5. ⬜ URL resultante: `https://crizante1.github.io/NTRSL_AI/privacy-policy.html`
6. ⬜ Acessar a URL no navegador e confirmar que carrega corretamente

---

## FASE 2 — Preparação do Código

### 2.1 Variáveis de Ambiente de Produção
- ⬜ Criar `.env.local` na raiz com as variáveis reais de produção:
  ```
  VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
  VITE_SUPABASE_ANON_KEY=SUA_ANON_KEY_REAL
  ```
- ⬜ Confirmar que a `anon key` é a de **produção** (não development)
- ⬜ Verificar no Supabase Dashboard que `GOOGLE_API_KEY` está configurada em Edge Functions → Secrets

### 2.2 Build do App React
```bash
# Na raiz do projeto
npm run build
```
- ⬜ Executar `npm run build` sem erros
- ⬜ Verificar que a pasta `dist/` foi gerada com os arquivos corretos
- ⬜ Abrir `dist/index.html` no navegador (opcional — verificação rápida)

### 2.3 Sincronização com Capacitor
```bash
npx cap sync android
```
- ⬜ Executar `npx cap sync android` sem erros
- ⬜ Confirmar que `android/app/src/main/assets/public/` foi atualizado

### 2.4 Keystore de Release (CRÍTICO — só fazer uma vez, guardar com cuidado)
⚠️ **A chave de assinatura não pode ser perdida.** Se perder, nunca mais poderá atualizar o app na Play Store.

**Passo a passo:**
1. ⬜ Abrir Android Studio: `npx cap open android`
2. ⬜ Menu: **Build → Generate Signed Bundle / APK**
3. ⬜ Selecionar **Android App Bundle** (formato exigido pelo Play Store)
4. ⬜ Clicar em **Create new…**
5. ⬜ Preencher:
   - Key store path: `android/keystore/ntrsl-release.jks`
   - Password: (criar senha forte — **anotar em local seguro**)
   - Key alias: `ntrsl-key`
   - Key password: (pode ser a mesma senha)
   - Validity: 25 anos
   - First and Last Name: Cristian Ferreira Carlos
   - Organization: NTRSL AI
   - Country Code: BR
6. ⬜ Salvar o keystore
7. ⬜ Copiar `android/keystore.properties.example` para `android/keystore.properties`
8. ⬜ Preencher `keystore.properties` com os valores reais
9. ⬜ Confirmar que `keystore.properties` e `*.jks` estão no `.gitignore` ✅ (já configurado)
10. ⬜ **Fazer backup do keystore em local seguro** (Google Drive, pen drive seguro, etc.)

### 2.5 Gerar o App Bundle (AAB) de Release
1. ⬜ No Android Studio: **Build → Generate Signed Bundle / APK**
2. ⬜ Selecionar **Android App Bundle**
3. ⬜ Selecionar o keystore criado + preencher senhas
4. ⬜ Build variant: **release**
5. ⬜ Aguardar build (2–5 minutos)
6. ⬜ AAB gerado em: `android/app/release/app-release.aab`
7. ⬜ Verificar tamanho do arquivo (esperado: ~5–15 MB)

### 2.6 Testar o Build de Release
- ⬜ Instalar o APK de release em um dispositivo físico Android 7.0+
  ```bash
  # Gerar APK de release para teste local:
  # Android Studio → Build → Build Bundle(s)/APK(s) → Build APK(s)
  ```
- ⬜ Testar fluxo completo: login → registrar refeição → ver gráfico → coach IA
- ⬜ Testar offline: desativar Wi-Fi/dados → registrar item → reativar → verificar sync
- ⬜ Verificar que biometria funciona (se dispositivo suportar)
- ⬜ Verificar que notificações chegam (se `google-services.json` configurado)

---

## FASE 3 — Criação do App no Play Console

### 3.1 Criar o App
1. ⬜ Acessar https://play.google.com/console
2. ⬜ Clicar em **Create app**
3. ⬜ Preencher:
   - App name: `NTRSL AI`
   - Default language: `Portuguese (Brazil) — pt-BR`
   - App or game: `App`
   - Free or paid: `Free`
4. ⬜ Aceitar as políticas do desenvolvedor

### 3.2 Configurações do App (App Setup)
- ⬜ **App access:** Conteúdo totalmente acessível (requer login — fornecer credenciais de teste)
  - E-mail de teste: criar conta `tester@ntrsl.ai` (ou usar conta pessoal)
  - Senha de teste: (criar e documentar aqui)
- ⬜ **Ads:** Não contém anúncios
- ⬜ **Content ratings:** Preencher questionário (ver Fase 4)
- ⬜ **Target audience:** 18+ (app de saúde, sem conteúdo para crianças)
- ⬜ **News apps:** Não é um app de notícias
- ⬜ **COVID-19 contact tracing:** Não aplicável
- ⬜ **Data safety:** Preencher (ver Fase 4)

---

## FASE 4 — Conteúdo e Políticas

### 4.1 Classificação de Conteúdo (IARC)
1. ⬜ Play Console → **App content → Content ratings**
2. ⬜ Iniciar questionário → categoria: **Health & Fitness**
3. ⬜ Responder:
   - Violência: **Não**
   - Linguagem inadequada: **Não**
   - Conteúdo sexual: **Não**
   - Substâncias controladas: **Não**
   - Conteúdo para adultos: **Não**
   - Compartilha dados pessoais: **Sim** (ver docs/DATA_SAFETY.md)
4. ⬜ Classificação esperada: **Livre / Everyone**

### 4.2 Segurança de Dados (Data Safety)
1. ⬜ Play Console → **App content → Data safety**
2. ⬜ Preencher conforme `docs/DATA_SAFETY.md`
3. ⬜ Resumo das respostas principais:
   - Coleta dados: **Sim**
   - Compartilha com terceiros: **Sim** (Supabase, Firebase, Google Gemini)
   - Criptografia em trânsito: **Sim**
   - Usuário pode solicitar exclusão: **Sim**

### 4.3 Política de Privacidade
- ⬜ Play Console → **App content → Privacy policy**
- ⬜ URL: `https://crizante1.github.io/NTRSL_AI/privacy-policy.html`
- ⬜ Verificar que a URL está acessível antes de submeter

---

## FASE 5 — Listagem na Loja

### 5.1 Informações Principais (Main store listing)
Consultar `docs/PLAYSTORE_LISTING.md` para todos os textos.

- ⬜ **Nome do app:** `NTRSL AI` (max 30 chars)
- ⬜ **Descrição curta:** `Registre refeições e exercícios com IA. Metas, gráficos e modo offline.`
- ⬜ **Descrição completa:** (copiar de `PLAYSTORE_LISTING.md` seção 3)
- ⬜ **Categoria:** Saúde e fitness
- ⬜ **E-mail de suporte:** (e-mail vinculado à conta Play)
- ⬜ **Site:** `https://github.com/CRIZANTE1/NTRSL_AI`

### 5.2 Assets Gráficos
- ⬜ **Ícone 512×512 px** (PNG, sem transparência)
  - Exportar do ícone atual (`mipmap-xxxhdpi/ic_launcher.png`) escalado para 512×512
- ⬜ **Feature Graphic 1024×500 px** (JPG ou PNG)
  - Criar imagem com logo + tagline (ex: "Seu coach de saúde com IA")
- ⬜ **Screenshots — mínimo 2** (formatos válidos: portrait 9:16 ou landscape 16:9)
  - Capturar em dispositivo físico ou emulador com `adb screencap`
  - Telas prioritárias: `/home`, `/dashboard`, coach IA, busca de alimentos

### 5.3 Localização (opcional mas recomendado)
- ⬜ Idioma padrão: `pt-BR` ✓
- ⬜ Se quiser alcançar usuários em inglês: adicionar listagem em `en-US`

---

## FASE 6 — Upload e Publicação

### 6.1 Enviar o AAB
1. ⬜ Play Console → **Release → Testing → Internal testing** (começar aqui)
2. ⬜ Clicar em **Create new release**
3. ⬜ Upload do `android/app/release/app-release.aab`
4. ⬜ Preencher notas de versão (copiar de `PLAYSTORE_LISTING.md` seção 10)
5. ⬜ Clicar em **Save and review → Start rollout to Internal testing**

### 6.2 Teste Interno (Internal Testing)
- ⬜ Adicionar e-mails de testadores (até 100 pessoas)
- ⬜ Compartilhar link de opt-in com testadores
- ⬜ Cada testador deve instalar, testar e reportar bugs
- ⬜ Aguardar 1–3 dias e coletar feedback

### 6.3 Promover para Produção
1. ⬜ Play Console → **Release → Production**
2. ⬜ Criar novo release a partir do mesmo AAB
3. ⬜ **Rollout gradual recomendado:** começar com 10% dos usuários
4. ⬜ Revisar todas as seções obrigatórias (um badge verde deve aparecer em cada)
5. ⬜ Clicar em **Start rollout to Production**
6. ⬜ **Tempo de revisão:** 1–7 dias úteis para apps novos

---

## FASE 7 — Pós-Publicação

### 7.1 Monitoramento
- ⬜ Verificar **Android vitals** no Play Console (crashes, ANRs)
- ⬜ Responder reviews dos usuários
- ⬜ Monitorar taxa de desinstalação e avaliações

### 7.2 Atualizações Futuras
A cada nova versão, lembrar de:
- ⬜ Incrementar `versionCode` em `android/app/build.gradle` (ex: 1→2→3)
- ⬜ Atualizar `versionName` em `build.gradle` e `version` em `package.json`
- ⬜ Gerar novo AAB assinado com o **mesmo keystore**
- ⬜ Atualizar as notas de versão

---

## Resumo de Arquivos Relevantes

| Arquivo | Finalidade |
|---------|-----------|
| `docs/PRIVACY_POLICY.md` | Política de Privacidade (converter para HTML para hospedar) |
| `docs/TERMS_OF_USE.md` | Termos de Uso |
| `docs/PLAYSTORE_LISTING.md` | Textos completos da listagem na Play Store |
| `docs/DATA_SAFETY.md` | Respostas para o formulário Data Safety |
| `android/app/build.gradle` | Versão, signingConfigs, release |
| `android/app/src/main/AndroidManifest.xml` | Permissões declaradas |
| `android/app/proguard-rules.pro` | Regras de ofuscação R8/ProGuard |
| `android/keystore.properties.example` | Modelo para configurar a assinatura |
| `android/keystore/ntrsl-release.jks` | ⚠️ Keystore — criar localmente, NUNCA commitar |

---

## Contatos Úteis

| Recurso | URL |
|---------|-----|
| Play Console | https://play.google.com/console |
| Central de ajuda Play Console | https://support.google.com/googleplay/android-developer |
| Políticas do Play Store | https://play.google.com/about/developer-content-policy |
| Supabase Dashboard | https://supabase.com/dashboard |
| Repositório do projeto | https://github.com/CRIZANTE1/NTRSL_AI |
