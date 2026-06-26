# Google Play — Formulário de Segurança de Dados (Data Safety)

Este documento contém as respostas para o formulário de **Data Safety** do Google Play Console.  
Seção acessada em: Play Console → App content → Data safety

---

## Seção 1: Coleta e Compartilhamento de Dados

**O app coleta dados dos usuários?**  
✅ Sim

**O app compartilha dados com terceiros?**  
✅ Sim

**O app permite que os usuários solicitem exclusão dos dados?**  
✅ Sim — via solicitação pelo repositório: https://github.com/CRIZANTE1/NTRSL_AI/issues

---

## Seção 2: Tipos de Dados Coletados

### 📍 Localização
| Tipo | Coletado? | Compartilhado? | Obrigatório? | Finalidade |
|------|-----------|----------------|-------------|-----------|
| Localização precisa | ❌ Não | — | — | — |
| Localização aproximada | ❌ Não | — | — | — |

### 👤 Informações Pessoais
| Tipo | Coletado? | Compartilhado? | Obrigatório? | Finalidade |
|------|-----------|----------------|-------------|-----------|
| Nome | ✅ Sim | ❌ Não | Opcional | Personalização do perfil |
| Endereço de e-mail | ✅ Sim | ❌ Não | ✅ Obrigatório | Autenticação da conta |
| IDs de usuário | ✅ Sim (UUID interno) | Supabase somente | ✅ Obrigatório | Identificação no banco de dados |
| Endereço | ❌ Não | — | — | — |
| Número de telefone | ❌ Não | — | — | — |
| Raça e etnia | ❌ Não | — | — | — |
| Crenças políticas | ❌ Não | — | — | — |
| Orientação sexual | ❌ Não | — | — | — |

### 💰 Informações Financeiras
| Tipo | Coletado? |
|------|-----------|
| Dados de pagamento | ❌ Não |
| Histórico de compras | ❌ Não |

### 🏥 Saúde e Fitness
| Tipo | Coletado? | Compartilhado? | Obrigatório? | Finalidade |
|------|-----------|----------------|-------------|-----------|
| Informações de saúde (calorias, macros, metas) | ✅ Sim | Google (Gemini — resumo anônimo) | ✅ Obrigatório | Registro nutricional e recomendações de IA |
| Informações de fitness (exercícios, duração) | ✅ Sim | Google (Gemini — resumo anônimo) | ✅ Obrigatório | Monitoramento de atividade física |

> **Nota sobre Gemini:** O app envia ao servidor Supabase um **resumo agregado** dos registros do período (ex: "registrou 1.800 kcal hoje, 40g de proteínas"). O servidor então chama a API do Gemini. Dados identificáveis do usuário (e-mail, nome) **não são enviados** à API do Gemini.

### 📩 Mensagens
| Tipo | Coletado? |
|------|-----------|
| E-mails | ❌ Não |
| Mensagens SMS/MMS | ❌ Não |
| Outras mensagens internas | ❌ Não |

### 📷 Fotos e Vídeos
| Tipo | Coletado? | Compartilhado? | Obrigatório? | Finalidade |
|------|-----------|----------------|-------------|-----------|
| Fotos (avatar) | ✅ Sim | Supabase Storage | Opcional | Foto de perfil do usuário |
| Vídeos | ❌ Não | — | — | — |

### 🎵 Áudio
| Tipo | Coletado? |
|------|-----------|
| Gravações de voz | ❌ Não |
| Músicas | ❌ Não |
| Sons do ambiente | ❌ Não |

### 📁 Arquivos e Documentos
| Tipo | Coletado? |
|------|-----------|
| Arquivos / documentos | ❌ Não |

### 📅 Calendário
| Tipo | Coletado? |
|------|-----------|
| Eventos do calendário | ❌ Não |

### 📞 Contatos
| Tipo | Coletado? |
|------|-----------|
| Contatos do dispositivo | ❌ Não |

### 🔐 Credenciais
| Tipo | Coletado? | Observação |
|------|-----------|-----------|
| Nome de usuário | ✅ Sim (e-mail) | Usado para autenticação |
| Senha | ✅ Sim (hash bcrypt) | Nunca armazenada em texto puro |

### 📊 Dados de Uso do App
| Tipo | Coletado? | Compartilhado? | Obrigatório? | Finalidade |
|------|-----------|----------------|-------------|-----------|
| Interações com o app | ✅ Sim (logs de erro) | ❌ Não | Opcional | Diagnóstico e melhoria |
| Histórico de busca no app | ❌ Não | — | — | — |
| Outros dados de uso | ✅ Sim (timestamp do último uso da IA) | ❌ Não | Obrigatório | Controle do intervalo de 30 min entre recomendações |

### 🔔 Diagnóstico
| Tipo | Coletado? | Finalidade |
|------|-----------|-----------|
| Logs de crash | ✅ Sim (interno) | Diagnóstico de erros |
| Outros dados de diagnóstico | ❌ Não | — |

### 📱 IDs do Dispositivo
| Tipo | Coletado? | Compartilhado? | Obrigatório? | Finalidade |
|------|-----------|----------------|-------------|-----------|
| Token de notificação push (FCM) | ✅ Sim | Firebase/Google | Opcional | Entrega de notificações de lembrete |
| Android Advertising ID | ❌ Não | — | — | — |

---

## Seção 3: Práticas de Segurança

**Os dados são criptografados em trânsito?**  
✅ Sim — HTTPS/TLS em todas as comunicações

**Os usuários podem solicitar exclusão dos dados?**  
✅ Sim — via GitHub Issues: https://github.com/CRIZANTE1/NTRSL_AI/issues

**O app segue a política de Famílias do Google Play?**  
❌ Não (app não destinado a crianças)

---

## Seção 4: Resumo para Exibição na Play Store

Este é o resumo que aparecerá na página do app na Play Store:

### Dados compartilhados com terceiros
| Dado | Finalidade | Pode ser recusado? |
|------|-----------|-------------------|
| Informações de saúde (resumo agregado) | Recomendações de IA (Google Gemini) | Sim — não usar a função de coach IA |
| Token de push | Notificações de lembrete (Firebase) | Sim — negar permissão de notificação |
| E-mail e dados de conta | Autenticação (Supabase) | Não — obrigatório para usar o app |

### Dados coletados e não compartilhados
| Dado | Finalidade |
|------|-----------|
| Registros de alimentação e exercício | Monitoramento nutricional |
| Foto de perfil | Personalização |
| Logs de erro | Diagnóstico |

### Práticas de privacidade declaradas
- ✅ Dados criptografados em trânsito
- ✅ Usuário pode solicitar exclusão
- ✅ Dados de saúde tratados como sensíveis (LGPD)
- ❌ Dados não usados para rastreamento ou publicidade

---

## Referências para Preenchimento no Play Console

- Acessar: **Play Console → [Seu App] → App content → Data safety**
- Documentação Google: https://support.google.com/googleplay/android-developer/answer/10787469
- Esta seção deve ser revisada a cada atualização significativa do app que altere a coleta de dados
