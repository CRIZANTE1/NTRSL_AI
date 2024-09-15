import streamlit as st
from operations.operations import calcular_calorias, carregar_calorias, carregar_exercicios, calcular_nutricao

def frontpage():
    # Carregar dados de exercícios e calorias
    exercicios = carregar_exercicios()  # Carrega a lista de exercícios
    calorias_alimentos = carregar_calorias()  # Carrega as informações nutricionais dos alimentos

    # Inputs do usuário para selecionar exercícios e duração
    exercicios_selecionados = st.multiselect(
        "Escolha os exercícios:", 
        list(exercicios.keys()), 
        help="Selecione um ou mais exercícios que você realizou."
    )  # Seleção de exercícios
    duracao = st.number_input(
        "Duração (em minutos):", 
        min_value=1, 
        value=30, 
        help="Insira a duração do exercício em minutos."
    )  # Duração do exercício

    # Verifique se a lista de calorias não está vazia
    if calorias_alimentos:
        # Permitir múltiplas seleções de alimentos
        alimentos = st.multiselect(
            "Escolha os alimentos:", 
            list(calorias_alimentos.keys()), 
            help="Selecione os alimentos que você consumiu."
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

        # Cálculo das calorias queimadas e consumidas
        if st.button("Calcular Calorias", help="Clique para calcular as calorias queimadas e consumidas."):
            if not exercicios_selecionados:
                st.error("Por favor, selecione pelo menos um exercício.")
                return
            
            if not quantidades:
                st.error("Por favor, selecione pelo menos um alimento.")
                return

            calorias_gastas_total = 0
            for exercicio in exercicios_selecionados:
                calorias_gastas = calcular_calorias(exercicio, duracao)  # Calcula as calorias queimadas
                calorias_gastas_total += calorias_gastas

            calorias_consumidas_total = 0
            proteina_consumida_total = 0
            carboidratos_consumidos_total = 0
            gordura_consumida_total = 0

            for alimento, quantidade in quantidades:
                calorias, proteina, carboidratos, gordura = calcular_nutricao(alimento, quantidade)
                calorias_consumidas_total += calorias
                proteina_consumida_total += proteina
                carboidratos_consumidos_total += carboidratos
                gordura_consumida_total += gordura

            # Exibir resultados de forma organizada
            st.markdown("### Resultados")
            st.markdown(f"**Calorias gastas:** {calorias_gastas_total} kcal")
            st.markdown(f"**Calorias consumidas:** {calorias_consumidas_total} kcal")
            st.markdown(f"**Proteína consumida:** {proteina_consumida_total} g")
            st.markdown(f"**Carboidratos consumidos:** {carboidratos_consumidos_total} g")
            st.markdown(f"**Gordura consumida:** {gordura_consumida_total} g")
            st.markdown(f"**Saldo de calorias:** {calorias_consumidas_total - calorias_gastas_total} kcal")

            # Adicionando um resumo dos hábitos
            if calorias_consumidas_total > calorias_gastas_total:
                st.warning("Você consumiu mais calorias do que gastou. Considere ajustar sua dieta ou aumentar a atividade física.")
            elif calorias_consumidas_total < calorias_gastas_total:
                st.success("Você gastou mais calorias do que consumiu. Continue assim para alcançar seus objetivos!")
            else:
                st.info("Seu consumo de calorias está equilibrado com o gasto. Mantenha esse equilíbrio para uma vida saudável.")

            # Adicionando dicas para melhorar hábitos
            st.markdown("### Dicas para Melhorar Seus Hábitos")
            st.write("""
            - **Mantenha um diário alimentar**: Anote o que você come e beba para ter uma visão clara de seus hábitos.
            - **Aumente a atividade física**: Tente incluir mais exercícios em sua rotina diária, como caminhar, correr ou praticar esportes.
            - **Beba mais água**: A hidratação é fundamental para a saúde. Tente beber pelo menos 2 litros de água por dia.
            - **Escolha alimentos saudáveis**: Opte por frutas, vegetais, grãos integrais e proteínas magras em vez de alimentos processados.
            - **Estabeleça metas realistas**: Defina metas alcançáveis para sua dieta e exercícios, e celebre suas conquistas.
            - **Consulte um profissional**: Se possível, busque a orientação de um nutricionista ou personal trainer para um plano personalizado.
            """)

            # Gráfico de distribuição de macronutrientes usando Streamlit
            macronutrientes = {
                'Proteína': proteina_consumida_total,
                'Carboidratos': carboidratos_consumidos_total,
                'Gordura': gordura_consumida_total
            }

            st.bar_chart(macronutrientes)  # Exibir gráfico de barras

    else:
        st.error("Nenhum alimento disponível para seleção.")
