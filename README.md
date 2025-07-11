# NTRSL AI: Seu Companheiro Inteligente para Saúde e Bem-Estar

## Visão Geral do Projeto

O NTRSL AI (anteriormente NutriSlit) é um protótipo de aplicativo web desenvolvido em Streamlit, projetado para revolucionar a forma como as pessoas abordam a saúde e o bem-estar. Utilizando Inteligência Artificial avançada, o NTRSL AI oferece recomendações personalizadas e inclusivas, promovendo hábitos saudáveis de forma sustentável e acessível para a comunidade.

### Objetivos Principais

*   **Recomendações Personalizadas com IA:** Desenvolver um modelo de IA capaz de analisar as informações do usuário (metas, alimentos consumidos, atividades realizadas) para gerar recomendações que vão além de um dicionário predefinido, adaptando-se às necessidades individuais.
*   **Acessibilidade e Baixo Custo:** Implementar uma funcionalidade inteligente que sugira refeições e atividades físicas de baixo custo, tornando a saúde e o bem-estar mais acessíveis.
*   **Interface Intuitiva e Motivadora:** Criar uma interface web leve e intuitiva que não apenas exiba o cálculo de calorias, mas que apresente os insights e as sugestões geradas pela IA de forma clara, engajadora e motivadora, capacitando o usuário a melhorar seus hábitos.

## Funcionalidades

*   **Sistema de Login Seguro:** Autenticação de usuário via OIDC (OpenID Connect) utilizando o serviço de login nativo do Streamlit (ex: Google).
*   **Registro Diário:** Permite que o usuário insira seus exercícios realizados, duração, alimentos consumidos e suas respectivas quantidades.
*   **Cálculo de Calorias e Macronutrientes:** Calcula as calorias gastas em exercícios, calorias consumidas e a distribuição de proteínas, carboidratos e gorduras.
*   **Insights Personalizados da IA:** Uma seção dedicada onde o usuário pode descrever suas metas, hábitos e rotina para receber recomendações inteligentes e personalizadas de um especialista em saúde e bem-estar (a IA).
*   **Análise de Balanço Energético:** Oferece feedback rápido sobre o saldo calórico do dia.
*   **Dicas para Melhoria de Hábitos:** Sugestões gerais para promover um estilo de vida mais saudável.
*   **Gráficos Visuais:** Apresentação clara da distribuição de macronutrientes.

## Tecnologias Utilizadas

*   **Frontend/Backend:** [Streamlit](https://streamlit.io/)
*   **Inteligência Artificial:** Google Gemini (modelo `gemini-2.5-flash-preview-04-17`)
*   **Autenticação:** Authlib (para OIDC com Streamlit)
*   **Gestão de Dependências:** `pip`
*   **Controle de Versão:** Git

## Configuração e Instalação

Siga os passos abaixo para configurar e rodar o NTRSL AI em sua máquina local ou em um ambiente de implantação.

### Pré-requisitos

*   Python 3.8+
*   pip (gerenciador de pacotes Python)
*   Git

### 1. Clonar o Repositório

```bash
git clone https://github.com/CRIZANTE1/NTRSL_AI.git
cd NTRSL_AI
```

### 2. Configurar o Ambiente Virtual (Recomendado)

```bash
python -m venv venv
source venv/bin/activate  # No Linux/macOS
# venv\Scripts\activate  # No Windows
```

### 3. Instalar Dependências

```bash
pip install -r requirements.txt
```

### 4. Configurar Credenciais OIDC para Login (Essencial para Streamlit Cloud)

Para que o sistema de login funcione, especialmente no Streamlit Cloud, você precisa configurar um arquivo `secrets.toml` no diretório `.streamlit/` na raiz do seu projeto.

Crie um diretório `.streamlit` se ele não existir:
```bash
mkdir .streamlit
```

Dentro de `.streamlit/`, crie um arquivo chamado `secrets.toml` com o seguinte formato, preenchendo com suas próprias credenciais OIDC (Google, por exemplo):

```toml
[oauth]
client_id = "SEU_CLIENT_ID_DO_OAUTH_GOOGLE"
client_secret = "SEU_CLIENT_SECRET_DO_OAUTH_GOOGLE"
redirect_uri = "http://localhost:8501" # ou a URL de redirecionamento do seu app no Streamlit Cloud
authorize_url = "https://accounts.google.com/o/oauth2/auth"
token_url = "https://oauth2.googleapis.com/token"
jwks_url = "https://www.googleapis.com/oauth2/v3/certs"
userinfo_url = "https://openidconnect.googleapis.com/v1/userinfo"

# Gere uma chave secreta forte e aleatória para o cookie
cookie_secret = "SUA_CHAVE_SECRETA_ALEATORIA_E_FORTE"

# O escopo (scopes) necessário para o acesso a informações do usuário
# Ex: para Google, 'openid email profile' é comum
scopes = ["openid", "email", "profile"]
```

**Importante:**
*   `client_id` e `client_secret`: Obtenha-os no Console de Desenvolvedores do Google Cloud (APIs & Services > Credentials). Crie credenciais de tipo "ID do cliente OAuth". Certifique-se de adicionar a URL do seu aplicativo Streamlit como um URI de redirecionamento autorizado.
*   `redirect_uri`: Para desenvolvimento local, `http://localhost:8501` é o padrão. No Streamlit Cloud, será a URL pública do seu aplicativo (ex: `https://your-app.streamlit.app`).
*   `cookie_secret`: Gere uma string longa e aleatória (ex: usando `secrets.token_hex(32)` no Python).

### 5. Configurar a Chave da API Gemini

Para a funcionalidade de IA, você precisará de uma chave de API do Google Gemini. Crie um arquivo `.env` na raiz do seu projeto com sua chave:

```
GOOGLE_API_KEY="SUA_CHAVE_API_GEMINI"
```
Substitua `"SUA_CHAVE_API_GEMINI"` pela sua chave de API real do Google Gemini. Você pode obter uma no [Google AI Studio](https://ai.google.dev/).

### 6. Executar o Aplicativo

Após configurar todas as credenciais, você pode iniciar o aplicativo:

```bash
streamlit run NTRSL_AI.py
```

O aplicativo será aberto em seu navegador padrão.

## Como Usar

1.  **Login:** Faça login usando sua conta do Google.
2.  **Registro:** Insira os exercícios que você realizou e os alimentos que consumiu no dia, juntamente com suas quantidades.
3.  **Obter Recomendações da IA:** Na seção de IA, descreva suas metas e seu dia (hábitos alimentares, atividades) de forma concisa e clique em "Obter Recomendações da IA" para receber insights personalizados.
4.  **Calcular Calorias:** Clique em "Calcular Calorias" para ver um resumo do seu balanço energético e detalhes de macronutrientes.

## Contribuição

Contribuições são bem-vindas! Se você tiver sugestões ou quiser relatar um bug, sinta-se à vontade para abrir uma issue ou enviar um pull request.

## Licença

Este projeto está licenciado sob a Licença MIT. Consulte o arquivo `LICENSE` para mais detalhes.
