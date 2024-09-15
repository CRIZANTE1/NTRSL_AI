import streamlit as st
import json
import os
from typing import Dict, Any, Tuple


# Caminhos para os arquivos JSON
CALORIAS_JSON_PATH = os.path.join('data', 'calorias.json')  # Usar '/' para evitar problemas de escape
EXERCICIOS_JSON_PATH = os.path.join('data', 'exercicios.json')  # Usar '/' para evitar problemas de escape


# Função para calcular calorias queimadas durante um exercício
def calcular_calorias(exercicio: str, duracao: int) -> float:
    exercicios = carregar_exercicios()
    calorias_por_minuto = exercicios.get(exercicio, {}).get('calorias_queimadas_por_minuto', 0)
    return calorias_por_minuto * duracao

# Função para carregar as calorias dos alimentos
def carregar_calorias() -> Dict[str, Any]:
    calorias = carregar_json(CALORIAS_JSON_PATH)
    return calorias.get('nutritional_info', {})

# Função para carregar a lista de exercícios
def carregar_exercicios() -> Dict[str, Any]:
    exercicios = carregar_json(EXERCICIOS_JSON_PATH)
    return exercicios.get('physical_activity_info', {})

# Função para validar os dados de exercícios
def validar_dados(dados: Dict[str, Any], chave_esperada: str) -> bool:
    if chave_esperada not in dados:
        st.error(f"Dados estão no formato incorreto. Chave '{chave_esperada}' não encontrada.")
        return False
    return True

def carregar_json(caminho: str) -> Dict[str, Any]:
    try:
        with open(caminho, encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        st.error(f"Arquivo não encontrado: {caminho}")
        return {}

def calcular_nutricao(alimento: str, quantidade: float) -> Tuple[float, float, float, float]:
    calorias = carregar_calorias()
    info = calorias.get(alimento, {})
    
    if alimento.lower() == 'água':
        # Para água, a quantidade é em litros, então convertemos para ml
        quantidade = quantidade * 1000
    else:
        # Para outros alimentos, a quantidade permanece em gramas
        pass

    calorias = info.get('calorias', 0) * (quantidade / 100)
    proteina = info.get('proteína', 0) * (quantidade / 100)
    carboidratos = info.get('carboidratos', 0) * (quantidade / 100)
    gordura = info.get('gordura', 0) * (quantidade / 100)

    return calorias, proteina, carboidratos, gordura
