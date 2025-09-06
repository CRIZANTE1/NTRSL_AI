# NTRSL AI: Seu Companheiro Inteligente para Saúde e Bem-Estar 🥗

**NTRSL AI** é um protótipo de aplicativo web, construído com Streamlit e Python, que vai além do simples monitoramento de calorias. Utilizando o poder da Inteligência Artificial do Google Gemini, a aplicação oferece uma experiência de coaching de saúde personalizada, acessível e focada em promover hábitos sustentáveis.

[![Python](https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![Streamlit](https://img.shields.io/badge/Streamlit-FF4B4B?style=for-the-badge&logo=streamlit&logoColor=white)](https://streamlit.io/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

---

## 📋 Sumário

- [Sobre o Projeto](#-sobre-o-projeto)
- [Contexto do Projeto: Atividade Extensionista UNINTER](#-contexto-do-projeto-atividade-extensionista-uninter)
- [✨ Funcionalidades Principais](#-funcionalidades-principais)
- [🚀 Acesso ao Protótipo (Live Demo)](#-acesso-ao-protótipo-live-demo)
- [🛠️ Tecnologias Utilizadas](#️-tecnologias-utilizadas)
- [⚙️ Configuração e Instalação Local](#️-configuração-e-instalação-local)
  - [Pré-requisitos](#pré-requisitos)
  - [Passo a Passo](#passo-a-passo)
- [▶️ Como Executar](#️-como-executar)
- [📄 Licença](#-licença)
- [📧 Contato](#-contato)

---

## 🎯 Sobre o Projeto

O NTRSL AI nasceu da ideia de democratizar o acesso a um estilo de vida mais saudável. Em vez de apenas apresentar números, a aplicação atua como um coach de saúde digital, analisando os dados diários do usuário para fornecer recomendações que se encaixam na sua realidade. O projeto está alinhado com o **Objetivo de Desenvolvimento Sustentável (ODS) 3 da ONU: Saúde e Bem-Estar**, buscando oferecer uma ferramenta de inclusão digital para a promoção da saúde.

### 🎓 Contexto do Projeto: Atividade Extensionista UNINTER

Este projeto foi desenvolvido como o Trabalho Final da disciplina de **Atividades Extensionistas** do curso de Engenharia da Computação do **Centro Universitário Internacional UNINTER**. O objetivo foi aplicar os conhecimentos técnicos de desenvolvimento de software e inteligência artificial para criar uma solução de tecnologia com impacto social positivo, focada na comunidade.

---

### ⚠️ Aviso Importante sobre o Uso da IA

Este projeto utiliza a API gratuita do Google Gemini para fornecer as recomendações inteligentes. Para garantir a sustentabilidade do protótipo e evitar a exaustão da cota de uso, foi implementado um **período de espera (cooldown) de 30 minutos** entre cada solicitação de análise por usuário.

Isso significa que, após receber uma recomendação da IA, você precisará aguardar 30 minutos antes de poder solicitar uma nova análise. Agradecemos a sua compreensão!

## ✨ Funcionalidades Principais

-   🔐 **Sistema de Login Seguro:** Autenticação de usuário via OIDC (Google), garantindo a privacidade dos dados.
-   📝 **Registro Diário Simplificado:** Interface intuitiva para registrar refeições, quantidades, exercícios realizados e duração.
-   📊 **Cálculo Nutricional Automático:** Resumo do balanço calórico e visualização gráfica da distribuição de macronutrientes (proteínas, carboidratos e gorduras).
-   🤖 **Insights Personalizados com IA:** Um coach de saúde virtual que analisa seu dia e suas metas para fornecer um plano de ação claro, motivador e com sugestões de baixo custo.
-   💡 **Feedback Imediato:** Métricas claras sobre o saldo de calorias para uma compreensão rápida do seu progresso diário.

---

## 🚀 Acesso ao Protótipo (Live Demo)

O aplicativo está hospedado e pode ser acessado publicamente através do Streamlit Cloud.

**[➡️ Acesse o NTRSL AI aqui!](https://ntrslai.streamlit.app/)**  

---

## 🛠️ Tecnologias Utilizadas

-   **Backend e Frontend:** Python com a biblioteca **Streamlit**.
-   **Inteligência Artificial:** API do **Google Gemini** (`gemini-2.5-flash`).
-   **Autenticação:** Funcionalidade nativa OIDC do Streamlit.
-   **Gestão de Dependências:** `pip` e `requirements.txt`.
-   **Controle de Versão:** Git e GitHub.

---

## ⚙️ Configuração e Instalação Local

Siga os passos abaixo para executar o NTRSL AI em sua máquina.

### Pré-requisitos

-   Python 3.8+
-   Git

### Passo a Passo

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/CRIZANTE1/NTRSL_AI.git
    cd NTRSL_AI
    ```

2.  **Crie e ative um ambiente virtual (recomendado):**
    ```bash
    # Linux/macOS
    python3 -m venv venv
    source venv/bin/activate

    # Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3.  **Instale as dependências:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure as credenciais de Autenticação (OIDC):**
    Crie uma pasta `.streamlit` na raiz do projeto e, dentro dela, um arquivo chamado `secrets.toml`. Adicione o seguinte conteúdo, substituindo pelos seus próprios valores obtidos no Google Cloud Console:
    ```toml
    # .streamlit/secrets.toml

    [oauth]
    client_id = "SEU_CLIENT_ID_DO_OAUTH_GOOGLE"
    client_secret = "SEU_CLIENT_SECRET_DO_OAUTH_GOOGLE"
    redirect_uri = "http://localhost:8501" # Para produção, use a URL do seu app no Streamlit Cloud
    authorize_url = "https://accounts.google.com/o/oauth2/auth"
    token_url = "https://oauth2.googleapis.com/token"
    jwks_url = "https://www.googleapis.com/oauth2/v3/certs"
    userinfo_url = "https://openidconnect.googleapis.com/v1/userinfo"

    # Gere uma chave secreta forte (ex: python -c 'import secrets; print(secrets.token_hex(32))')
    cookie_secret = "SUA_CHAVE_SECRETA_ALEATORIA_E_FORTE"
    
    scopes = ["openid", "email", "profile"]
    ```

5.  **Configure a chave da API do Google Gemini:**
    Crie um arquivo `.env` na raiz do projeto e adicione sua chave de API:
    ```
    # .env
    GOOGLE_API_KEY="SUA_CHAVE_API_GEMINI_AQUI"
    ```

---

## ▶️ Como Executar

Após configurar tudo, inicie o aplicativo com o comando:

```bash
streamlit run NTRSL_AI.py
