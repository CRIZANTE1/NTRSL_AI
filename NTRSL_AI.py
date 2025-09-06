import streamlit as st
from operations.page1 import frontpage 
from operations.sobre import sobre
from auth.login_page import show_login_page, show_user_header, show_logout_button
from auth.auth_utils import is_user_logged_in
import time

st.set_page_config(page_title="NTRSL AI", page_icon="🥗", layout="wide")

MAX_REQUESTS_PER_MINUTE = 20
TIME_WINDOW_SECONDS = 60

def main():
    if 'request_timestamps' not in st.session_state:
        st.session_state.request_timestamps = []

    current_time = time.time()
    st.session_state.request_timestamps = [
        t for t in st.session_state.request_timestamps if current_time - t < TIME_WINDOW_SECONDS
    ]

    if len(st.session_state.request_timestamps) >= MAX_REQUESTS_PER_MINUTE:
        st.error("Muitas solicitações em um curto período de tempo. Por favor, tente novamente em alguns instantes.")
        return

    st.session_state.request_timestamps.append(current_time)

    if not is_user_logged_in():
        show_login_page()
        return

    # Se o usuário está logado, mostra o cabeçalho e o botão de logout
    show_user_header()
    show_logout_button()

    # Título e descrição da aplicação
    st.title("Bem-vindo ao Ntrsl IA")
    st.caption('Aplicação simples e inteligênte de monitoramento diário de dieta e exercícios')
   
    # Navegação entre páginas
    pages = {
        "🏠 Página Inicial": frontpage,
        "ℹ️ Sobre": sobre
    }
    
    page = st.sidebar.selectbox("Escolha uma página:", list(pages.keys()))
    
    pages[page]()
    
if __name__ == "__main__":
    main()
