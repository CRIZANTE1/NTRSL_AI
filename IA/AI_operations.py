import os
from dotenv import load_dotenv
import google.generativeai as genai
from IA.load import load_api
import time
import tempfile
import numpy as np
import streamlit as st
import re
import os
import pandas as pd
import logging
from prompts import PROMPT_HEALTH_EXPERT 

class PDFQA:
    def __init__(self):
        load_api()  
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.embedding_model = 'models/embedding-001'

    def clean_text(self, text):
        text = re.sub(r'\s+', ' ', text)
        text = re.sub(r'[^\\w\\s,.!?\"\\\'-]', '', text)
        return text.strip()

    def ask_gemini(self, full_prompt_text):
        try:
            st.info("Enviando pergunta para o modelo Gemini...")
            time.sleep(1)
            response = self.model.generate_content(full_prompt_text)
            st.success("Resposta recebida do modelo Gemini.")
            return response.text
        except Exception as e:
            st.error(f"Erro ao obter resposta do modelo Gemini: {str(e)}")
            return None

    def answer_question(self, pdf_files, question):
        start_time = time.time()

        try:
            full_prompt_for_gemini = PROMPT_HEALTH_EXPERT.format(question=question)

            with st.spinner("Gerando resposta com o modelo Gemini..."):
                answer = self.ask_gemini(full_prompt_for_gemini)
                st.info("Resposta gerada com sucesso.")
            st.success("Resposta gerada com sucesso.")

            end_time = time.time()
            elapsed_time = end_time - start_time

            return answer, elapsed_time
        except Exception as e:
            st.error(f"Erro inesperado ao processar a pergunta: {str(e)}")
            st.exception(e)
            return f"Ocorreu um erro ao processar a pergunta: {str(e)}", 0
