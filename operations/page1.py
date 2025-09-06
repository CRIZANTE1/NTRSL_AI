import streamlit as st
from operations.operations import calcular_calorias, carregar_calorias, carregar_exercicios, calcular_nutricao
from IA.AI_operations import PDFQA
import time
from datetime import datetime, timedelta
import random

def frontpage():
    # Carregar dados
    exercicios = carregar_exercicios()
    calorias_alimentos = carregar_calorias()

    st.markdown("### Registre seu dia e receba insights personalizados! ✨")
    st.markdown("---")

    # --- Seção de Registro ---
    with st.expander("🏃‍♀️ Registrar Exercícios", expanded=True):
        exercicios_selecionados = st.multiselect("Escolha os exercícios que você realizou:", list(exercicios.keys()), help="Selecione um ou mais exercícios.")
        duracao = st.number_input("Duração total dos exercícios (em minutos):", min_value=1, value=30, help="Insira a duração total dos exercícios em minutos.")

    st.markdown("---")

    with st.expander("🍎 Registrar Alimentos Consumidos", expanded=True):
        if calorias_alimentos:
            alimentos = st.multiselect("Escolha os alimentos que você consumiu:", list(calorias_alimentos.keys()), help="Selecione os alimentos.")
            quantidades = []
            for alimento in alimentos:
                # Lógica para quantidade de água ou alimentos
                unidade = "litros" if alimento.lower() == 'água' else "gramas"
                valor_padrao = 1.0 if unidade == "litros" else 100.0
                passo = 0.1 if unidade == "litros" else 1.0
                quantidade = st.number_input(f"Quantidade de {alimento} (em {unidade}):", min_value=0.1, value=valor_padrao, step=passo, key=f"qty_{alimento}")
                quantidades.append((alimento, quantidade))
        else:
            st.error("Nenhum alimento disponível para seleção.")
            quantidades = []

    st.markdown("---")

    # --- Botão de Calcular e Salvar Estado ---
    if st.button("📊 Calcular Resumo Nutricional", help="Clique para calcular e preparar os dados para a IA.", type="primary"):
        if not exercicios_selecionados and not quantidades:
            st.error("Por favor, selecione pelo menos um exercício ou um alimento para calcular.")
        else:
            # Cálculos (mesma lógica de antes)
            calorias_gastas_total = sum(calcular_calorias(ex, duracao) for ex in exercicios_selecionados)
            
            calorias_consumidas_total = 0
            proteina_consumida_total = 0
            carboidratos_consumidos_total = 0
            gordura_consumida_total = 0

            alimentos_consumidos_str_list = []
            if quantidades:
                for alimento, quantidade in quantidades:
                    calorias, proteina, carboidratos, gordura = calcular_nutricao(alimento, quantidade)
                    calorias_consumidas_total += calorias
                    proteina_consumida_total += proteina
                    carboidratos_consumidos_total += carboidratos
                    gordura_consumida_total += gordura
                    unidade = "L" if alimento.lower() == 'água' else "g"
                    alimentos_consumidos_str_list.append(f"{alimento} ({quantidade}{unidade})")
            
   
            st.session_state.resumo_dia = {
                "gastas": calorias_gastas_total,
                "consumidas": calorias_consumidas_total,
                "exercicios": ", ".join(exercicios_selecionados) if exercicios_selecionados else "Nenhum",
                "duracao": duracao,
                "alimentos": ", ".join(alimentos_consumidos_str_list) if alimentos_consumidos_str_list else "Nenhum",
                "proteina": proteina_consumida_total,
                "carboidratos": carboidratos_consumidos_total,
                "gordura": gordura_consumida_total
            }
            st.success("Resumo calculado e pronto para a análise da IA!")

    # Exibir o resumo se ele existir no session_state
    if 'resumo_dia' in st.session_state:
        resumo = st.session_state.resumo_dia
        st.markdown("### Resumo Nutricional do Dia")
        col1, col2, col3 = st.columns(3)
        saldo = resumo['consumidas'] - resumo['gastas']
        col1.metric("Calorias Gastas 🏃‍♀️", f"{resumo['gastas']:.0f} kcal")
        col2.metric("Calorias Consumidas 🍎", f"{resumo['consumidas']:.0f} kcal")
        col3.metric("Saldo de Calorias", f"{saldo:.0f} kcal", delta=f"{saldo:.0f} kcal")
        
        st.markdown("#### Detalhes dos Macronutrientes")
        macronutrientes = {'Proteína': resumo['proteina'], 'Carboidratos': resumo['carboidratos'], 'Gordura': resumo['gordura']}
        if sum(macronutrientes.values()) > 0:
            st.bar_chart(macronutrientes)
        else:
            st.info("Nenhum dado de macronutrientes para exibir.")

    st.markdown("---") 

    # --- Seção da IA ---
    st.markdown("### ✨ Receba Recomendações Inteligentes da NTRSL AI ✨")
    st.write("Após calcular seu resumo, descreva seus objetivos e peça uma análise completa para nossa IA!")
    
    user_input_ia = st.text_area(
        "Conte-me sobre suas metas, como se sentiu hoje e o que gostaria de melhorar:",
        height=150,
        placeholder="Ex: 'Meu objetivo é perder peso. Achei difícil evitar doces hoje. Que dicas vocês me dão?'"
    )

    if 'captcha_answer' not in st.session_state:
        num1 = random.randint(1, 10)
        num2 = random.randint(1, 10)
        st.session_state.captcha_answer = num1 + num2
        st.session_state.captcha_question = f"Quanto é {num1} + {num2}?"

    user_captcha_answer = st.number_input(st.session_state.captcha_question, step=1)

    if st.button("Obter Recomendações da IA", type="primary"):
        if int(user_captcha_answer) != st.session_state.captcha_answer:
            st.error("Resposta incorreta. Por favor, tente novamente.")
            del st.session_state.captcha_answer
            return

        if 'resumo_dia' not in st.session_state:
            st.warning("Por favor, clique em 'Calcular Resumo Nutricional' primeiro para fornecer o contexto para a IA.", icon="⚠️")
        elif not user_input_ia:
            st.warning("Por favor, descreva suas metas para a IA poder te ajudar melhor.", icon="ℹ️")
        else:
            now = datetime.now()
            if 'last_ai_usage' in st.session_state:
                last_usage = st.session_state['last_ai_usage']
                if now - last_usage < timedelta(minutes=30):
                    st.warning(f"Você deve esperar 30 minutos entre as solicitações à IA. Por favor, tente novamente em {(last_usage + timedelta(minutes=30) - now).seconds // 60} minutos.")
                    return

            st.session_state['last_ai_usage'] = now
            resumo_contexto = st.session_state.resumo_dia
            contexto_para_ia = f"""
            Aqui estão os dados do meu dia para análise:
            - **Alimentos Consumidos:** {resumo_contexto['alimentos']}.
            - **Exercícios Realizados:** {resumo_contexto['exercicios']} por {resumo_contexto['duracao']} minutos.
            - **Balanço Energético:** Consumi {resumo_contexto['consumidas']:.0f} kcal e gastei {resumo_contexto['gastas']:.0f} kcal.
            - **Macronutrientes:** {resumo_contexto['proteina']:.1f}g de proteína, {resumo_contexto['carboidratos']:.1f}g de carboidratos, {resumo_contexto['gordura']:.1f}g de gordura.

            Com base nesses dados, aqui estão minhas metas e observações pessoais:
            "{user_input_ia}"
            """
            
            try:
                ai_model = PDFQA()
                st.info("Gerando recomendações... Isso pode levar um momento.", icon="⏳")
                # Enviar o prompt completo para a IA
                ai_response, _ = ai_model.answer_question(pdf_files=[], question=contexto_para_ia)
                
                if ai_response:
                    st.markdown("### Suas Recomendações Personalizadas:")
                    st.success(ai_response, icon="✅")
                    st.balloons()
                else:
                    st.warning("Não foi possível obter recomendações da IA. Tente novamente.", icon="⚠️")
            except Exception as e:
                st.error(f"Ocorreu um erro ao processar a solicitação da IA: {e}", icon="❌")
            finally:
                del st.session_state.captcha_answer
