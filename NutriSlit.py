import streamlit as st
from operations.page1 import frontpage 
from operations.sobre import sobre

st.set_page_config(page_title="NutriSlit", page_icon="🍏", layout="wide")

def main():
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