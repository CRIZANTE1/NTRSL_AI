import streamlit as st
from operations.operations import calcular_calorias, carregar_calorias, carregar_exercicios, calcular_nutricao
from IA.AI_operations import PDFQA # Importar a classe PDFQA

def frontpage():
    # Carregar dados de exercícios e calorias
    exercicios = carregar_exercicios()  # Carrega a lista de exercícios
    calorias_alimentos = carregar_calorias()  # Carrega as informações nutricionais dos alimentos

    st.markdown("### Registre seu dia e receba insights personalizados! ✨")
    st.markdown("---")

    # Seção de Exercícios com Expander
    with st.expander("🏃‍♀️ Registrar Exercícios", expanded=True):
        exercicios_selecionados = st.multiselect(
            "Escolha os exercícios que você realizou:", 
            list(exercicios.keys()), 
            help="Selecione um ou mais exercícios."
        )  # Seleção de exercícios
        duracao = st.number_input(
            "Duração total dos exercícios (em minutos):", 
            min_value=1, 
            value=30, 
            help="Insira a duração total dos exercícios em minutos."
        )  # Duração do exercício

    st.markdown("---")

    # Seção de Alimentos com Expander
    with st.expander("🍎 Registrar Alimentos Consumidos", expanded=True):
        if calorias_alimentos:
            alimentos = st.multiselect(
                "Escolha os alimentos que você consumiu:", 
                list(calorias_alimentos.keys()), 
                help="Selecione os alimentos."
            )  # Seleção de alimentos
            quantidades = []
            for alimento in alimentos:
                if alimento.lower() == 'água':
                    quantidade = st.number_input(
                        f"Quantidade de {alimento} (em litros):", 
                        min_value=0.1, 
                        value=1.0, 
                        step=0.1,
                        help="Insira a quantidade de água em litros."
                    )
                else:
                    quantidade = st.number_input(
                        f"Quantidade de {alimento} (em gramas):", 
                        min_value=1, 
                        value=100, 
                        help="Insira a quantidade do alimento em gramas."
                    )
                quantidades.append((alimento, quantidade))
        else:
            st.error("Nenhum alimento disponível para seleção. Por favor, verifique os arquivos de dados.")
            quantidades = [] # Ensure quantidades is defined even if empty

    st.markdown("---")

    # Botão para calcular calorias (agora fora dos expanders, mais visível)
    if st.button("📊 Calcular Resumo Nutricional", help="Clique para calcular as calorias queimadas e consumidas.", type="primary"):
        if not exercicios_selecionados and not quantidades:
            st.error("Por favor, selecione pelo menos um exercício ou um alimento para calcular.")
            return
        
        calorias_gastas_total = 0
        if exercicios_selecionados:
            for exercicio in exercicios_selecionados:
                calorias_gastas = calcular_calorias(exercicio, duracao)  # Calcula as calorias queimadas
                calorias_gastas_total += calorias_gastas

        calorias_consumidas_total = 0
        proteina_consumida_total = 0
        carboidratos_consumidos_total = 0
        gordura_consumida_total = 0

        if quantidades:
            for alimento, quantidade in quantidades:
                calorias, proteina, carboidratos, gordura = calcular_nutricao(alimento, quantidade)
                calorias_consumidas_total += calorias
                proteina_consumida_total += proteina
                carboidratos_consumidos_total += carboidratos
                gordura_consumida_total += gordura

        # Exibir resultados de forma organizada
        st.markdown("### Resumo Nutricional do Dia")
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric(label="Calorias Gastas 🏃‍♀️", value=f"{calorias_gastas_total} kcal")
        with col2:
            st.metric(label="Calorias Consumidas 🍎", value=f"{calorias_consumidas_total} kcal")
        with col3:
            saldo = calorias_consumidas_total - calorias_gastas_total
            st.metric(label="Saldo de Calorias", value=f"{saldo} kcal", delta=f"{saldo} kcal")

        st.markdown("#### Detalhes dos Macronutrientes")
        st.write(f"- **Proteína:** {proteina_consumida_total} g")
        st.write(f"- **Carboidratos:** {carboidratos_consumidos_total} g")
        st.write(f"- **Gordura:** {gordura_consumida_total} g")

        # Adicionando um resumo dos hábitos
        st.markdown("#### Análise Rápida")
        if calorias_consumidas_total > calorias_gastas_total:
            st.warning("Você consumiu mais calorias do que gastou. Considere ajustar sua dieta ou aumentar a atividade física.")
        elif calorias_consumidas_total < calorias_gastas_total:
            st.success("Você gastou mais calorias do que consumiu. Continue assim para alcançar seus objetivos!")
        else:
            st.info("Seu consumo de calorias está equilibrado com o gasto. Mantenha esse equilíbrio para uma vida saudável.")

        # Gráfico de distribuição de macronutrientes usando Streamlit
        st.markdown("### Distribuição de Macronutrientes Consumidos")
        macronutrientes = {
            'Proteína': proteina_consumida_total,
            'Carboidratos': carboidratos_consumidos_total,
            'Gordura': gordura_consumida_total
        }
        if sum(macronutrientes.values()) > 0: # Evita erro se todos forem zero
            st.bar_chart(macronutrientes)  # Exibir gráfico de barras
        else:
            st.info("Nenhum dado de macronutrientes para exibir o gráfico.")

st.markdown("---") # Separador para a seção de IA

# Seção de Recomendações da IA
st.markdown("### ✨ Receba Recomendações Inteligentes da NTRSL AI ✨")
st.write("""
Compartilhe sobre seus objetivos, o que você comeu e suas atividades para receber sugestões personalizadas da nossa IA. 
Nossa IA é um profissional de saúde e bem-estar que te ajudará com dicas de nutrição e exercícios, focando em opções de baixo custo e acessíveis!
""")
user_input_ia = st.text_area(
    "Conte-me sobre o seu dia (metas, alimentos, exercícios) para obter recomendações:",
    height=150,
    help="Mantenha a descrição concisa para melhores resultados e para otimizar o uso do modelo de IA."
)

if st.button("Obter Recomendações da IA", type="primary"):
    if user_input_ia:
        try:
            ai_model = PDFQA()
            st.info("Gerando recomendações... Isso pode levar um momento. Agradecemos sua paciência!", icon="⏳")
            ai_response, _ = ai_model.answer_question(pdf_files=[], question=user_input_ia)
            
            if ai_response:
                st.markdown("### Suas Recomendações Personalizadas do NTRSL AI:")
                st.success(ai_response, icon="✅") # Usar st.success para destacar a resposta
                st.balloons() # Um pouco de celebração!
            else:
                st.warning("Não foi possível obter recomendações da IA. Tente novamente.", icon="⚠️")
        except Exception as e:
            st.error(f"Ocorreu um erro ao processar a solicitação da IA: {e}", icon="❌")
    else:
        st.warning("Por favor, digite suas informações para a IA gerar recomendações.", icon="ℹ️")