# Política de Privacidade — NTRSL AI

**Versão:** 1.0  
**Última atualização:** junho de 2026  
**Aplicativo:** NTRSL AI (`com.ntrsl.ai`)  
**Desenvolvedor:** Cristian Ferreira Carlos  
**Repositório:** https://github.com/CRIZANTE1/NTRSL_AI

---

## 1. Introdução

Este documento descreve como o aplicativo **NTRSL AI** coleta, armazena, utiliza e protege as informações pessoais dos usuários, em conformidade com a **Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)** e com as demais legislações aplicáveis.

Ao criar uma conta ou utilizar o NTRSL AI, você concorda com as práticas descritas nesta Política de Privacidade.

---

## 2. Responsável pelo Tratamento dos Dados

| Campo | Valor |
|-------|-------|
| Nome | Cristian Ferreira Carlos |
| Contato | Pelo repositório oficial: https://github.com/CRIZANTE1/NTRSL_AI/issues |

---

## 3. Dados Coletados e Finalidade

### 3.1 Dados de Conta
| Dado | Finalidade |
|------|------------|
| Endereço de e-mail | Autenticação e comunicação essencial do serviço |
| Senha (armazenada com hash — nunca em texto puro) | Autenticação |
| Nome de exibição | Personalização da experiência |
| Foto de perfil (opcional) | Exibição no perfil do usuário |
| Tipo de conta (`user` / `admin`) | Controle de acesso às funcionalidades |

### 3.2 Dados de Saúde e Hábitos
| Dado | Finalidade |
|------|------------|
| Registros diários de refeições (alimentos, calorias, macronutrientes) | Monitoramento nutricional e geração de relatórios |
| Registros diários de exercícios (tipo, duração, calorias) | Monitoramento de atividade física |
| Metas calóricas e de macronutrientes definidas pelo usuário | Personalização dos relatórios e comparações |

> **Atenção:** Esses dados são considerados **dados pessoais sensíveis** pela LGPD. São coletados somente mediante seu consentimento explícito ao criar uma conta.

### 3.3 Dados de Uso do Serviço
| Dado | Finalidade |
|------|------------|
| Horário da última solicitação de recomendação ao coach de IA | Controle do intervalo de 30 minutos entre análises |
| Eventos de erro e exceções (anonimizados) | Diagnóstico e melhoria do app |

### 3.4 Dados do Dispositivo
| Dado | Finalidade |
|------|------------|
| Token de notificação push (FCM) | Envio de lembretes e notificações (somente se o usuário permitir) |

---

## 4. Como os Dados São Usados

Os dados coletados são utilizados **exclusivamente** para:

- Autenticar e manter sua sessão ativa;
- Exibir e atualizar seus registros diários de alimentação e exercícios;
- Gerar resumos nutricionais e gráficos de progresso;
- Fornecer recomendações personalizadas por Inteligência Artificial;
- Enviar notificações de lembrete (somente com sua autorização);
- Melhorar o desempenho e a segurança do aplicativo.

**O NTRSL AI não vende, aluga nem compartilha seus dados com terceiros para fins comerciais ou publicitários.**

---

## 5. Compartilhamento com Terceiros

Para que o aplicativo funcione, utilizamos os seguintes serviços de terceiros:

| Serviço | Empresa | Dado compartilhado | Finalidade |
|---------|---------|-------------------|------------|
| **Supabase** | Supabase Inc. (EUA) | Todos os dados da seção 3 | Banco de dados, autenticação, armazenamento de arquivos |
| **Google Firebase / FCM** | Google LLC (EUA) | Token de notificação push | Entrega de notificações |
| **Google Gemini AI** | Google LLC (EUA) | Resumo dos registros nutricionais do período (sem identificação pessoal direta) | Geração de recomendações de saúde |
| **USDA FoodData Central** | Departamento de Agricultura dos EUA | Nenhum — consulta somente leitura | Base de dados de alimentos |
| **WGER Project** | Open source | Nenhum — consulta somente leitura | Base de dados de exercícios |

Todos os terceiros listados possuem suas próprias políticas de privacidade, disponíveis em seus respectivos sites.

> **Nota de segurança:** A chave de acesso à API do Google Gemini **nunca é incluída no aplicativo instalado no celular**. Todas as chamadas à IA são realizadas exclusivamente pelo servidor (Supabase Edge Functions), protegendo sua privacidade e a segurança da integração.

---

## 6. Transferência Internacional de Dados

Os dados são armazenados em servidores operados pela **Supabase Inc.** Dependendo da região de hospedagem escolhida pelo desenvolvedor, os dados podem ser processados fora do Brasil. Quando isso ocorre, a Supabase garante mecanismos adequados de proteção de dados conforme as legislações aplicáveis.

---

## 7. Armazenamento Local no Dispositivo

O NTRSL AI armazena dados localmente no seu dispositivo (via SQLite e preferências nativas) para:

- Permitir o uso do aplicativo **sem conexão à internet**;
- Salvar registros temporariamente enquanto não há conexão (fila offline);
- Sincronizar automaticamente os dados com o servidor quando a conexão for restabelecida.

Esses dados locais são de uso exclusivo do app e não são acessíveis a outros aplicativos.

---

## 8. Segurança dos Dados

Adotamos as seguintes medidas de segurança:

- **Autenticação segura** via Supabase Auth (senhas com hash bcrypt);
- **Row Level Security (RLS)** no banco de dados — cada usuário acessa somente os próprios dados;
- **HTTPS/TLS** em todas as comunicações entre o app e os servidores;
- **Chaves de API críticas** mantidas exclusivamente no servidor (nunca no bundle do app);
- **Biometria opcional** para proteger o acesso ao app no dispositivo;
- **Auditoria de eventos** de segurança registrada internamente.

---

## 9. Direitos do Usuário (LGPD)

Em conformidade com a LGPD, você tem direito a:

| Direito | Como exercer |
|---------|-------------|
| **Acesso** — saber quais dados temos sobre você | Acesse seu perfil no app ou entre em contato |
| **Correção** — atualizar dados incorretos | Edite diretamente no app (perfil e metas) |
| **Exclusão** — solicitar a remoção dos seus dados | Entre em contato via repositório do projeto |
| **Portabilidade** — receber seus dados em formato estruturado | Solicite via contato abaixo |
| **Revogação do consentimento** — retirar o consentimento dado | Exclusão da conta + desinstalação do app |
| **Informação** — saber com quem compartilhamos seus dados | Seção 5 desta política |

Para exercer qualquer desses direitos, abra uma *issue* em: https://github.com/CRIZANTE1/NTRSL_AI/issues

---

## 10. Retenção dos Dados

| Dado | Período de retenção |
|------|---------------------|
| Dados de conta e perfil | Enquanto a conta estiver ativa |
| Registros de alimentação e exercício | Enquanto a conta estiver ativa |
| Tokens de push | Até remoção do app ou solicitação do usuário |
| Dados de auditoria de erros | 90 dias |

Após a exclusão da conta, os dados são removidos dos servidores em até **30 dias**.

---

## 11. Dados de Menores

O NTRSL AI **não é destinado a crianças menores de 13 anos** e não coleta conscientemente dados de menores. Se identificarmos que dados de um menor foram coletados, os removeremos imediatamente.

---

## 12. Notificações Push

As notificações push são **opcionais**. O app solicitará sua permissão explícita antes de enviar qualquer notificação. Você pode revogar essa permissão a qualquer momento nas configurações do seu dispositivo Android.

---

## 13. Alterações nesta Política

Podemos atualizar esta Política de Privacidade periodicamente. Quando isso acontecer:

- A data de "Última atualização" no topo será alterada;
- Para mudanças significativas, notificaremos via notificação push ou e-mail.

O uso continuado do app após as alterações constitui concordância com a nova versão.

---

## 14. Contato

Para dúvidas, solicitações ou reclamações relacionadas a esta Política de Privacidade:

- **GitHub Issues:** https://github.com/CRIZANTE1/NTRSL_AI/issues
- **Repositório oficial:** https://github.com/CRIZANTE1/NTRSL_AI

---

*Esta política está disponível em português (pt-BR) e é o documento oficial para fins de conformidade com a LGPD e com os requisitos do Google Play Store.*
