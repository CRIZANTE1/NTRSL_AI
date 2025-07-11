import streamlit as st
from operations.page1 import frontpage 
from operations.sobre import sobre
from auth.login_page import show_login_page, show_user_header, show_logout_button
from auth.auth_utils import is_user_logged_in

st.set_page_config(page_title="NTRSL AI", page_icon="🥗", layout="wide")

def main():
    if not is_user_logged_in():
        show_login_page()
        return

    # Se o usuário está logado, mostra o cabeçalho e o botão de logout
    show_user_header()
    show_logout_button()

    # Título e descrição da aplicação
    st.title("Bem-vindo ao NutriSlit")
    st.caption('Aplicação simples de monitoramento diário de dieta e exercícios')
   
    # Navegação entre páginas
    pages = {
        "🏠 Página Inicial": frontpage,
        "ℹ️ Sobre": sobre
    }
    
    page = st.sidebar.selectbox("Escolha uma página:", list(pages.keys()))
    
    pages[page]()
    
if __name__ == "__main__":
    main()
