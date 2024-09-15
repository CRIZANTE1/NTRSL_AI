import streamlit as st
from operations.operations import calcular_calorias, carregar_calorias, carregar_exercicios, calcular_nutricao
from IA.AI_operations import PDFQA # Importar a classe PDFQA

def frontpage():
    # Carregar dados de exercícios e calorias
    exercicios = carregar_exercicios()  # Carrega a lista de exercícios
    calorias_alimentos = carregar_calorias()  # Carrega as informações nutricionais dos alimentos

    st.markdown("### Registre seu dia e receba insights personalizados! ✨")

    # Inputs do usuário para selecionar exercícios e duração
    exercicios_selecionados = st.multiselect(
        "Escolha os exercícios que você realizou:", 
        list(exercicios.keys()), 
        help="Selecione um ou mais exercícios."
    )  # Seleção de exercícios
    duracao = st.number_input(
        "Duração dos exercícios (em minutos):", 
        min_value=1, 
        value=30, 
        help="Insira a duração total dos exercícios em minutos."
    )  # Duração do exercício

    # Verifique se a lista de calorias não está vazia
    if calorias_alimentos:
        # Permitir múltiplas seleções de alimentos
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

        # Seção de Recomendações da IA (agora mais proeminente)
        st.markdown("--- ✨ Recomendações Inteligentes ✨ ---")
        st.write("Compartilhe sobre seus objetivos, o que você comeu e suas atividades para receber sugestões personalizadas da nossa IA!")
        user_input_ia = st.text_area(
            "Conte-me sobre o seu dia (metas, alimentos, exercícios):",
            height=150,
            help="Mantenha a descrição concisa para melhores resultados e para otimizar o uso do modelo de IA."
        )

        if st.button("Obter Recomendações da IA"):
            if user_input_ia:
                try:
                    ai_model = PDFQA()
                    st.info("Gerando recomendações... Isso pode levar um momento. Agradecemos sua paciência!")
                    ai_response, _ = ai_model.answer_question(pdf_files=[], question=user_input_ia)
                    
                    if ai_response:
                        st.markdown("### Suas Recomendações Personalizadas do NutriSlit:")
                        st.success(ai_response) # Usar st.success para destacar a resposta
                        st.balloons() # Um pouco de celebração!
                    else:
                        st.warning("Não foi possível obter recomendações da IA. Tente novamente.")
                except Exception as e:
                    st.error(f"Ocorreu um erro ao processar a solicitação da IA: {e}")
            else:
                st.warning("Por favor, digite suas informações para a IA gerar recomendações.")
        
        st.markdown("---") # Separador

        # Cálculo das calorias queimadas e consumidas (mantido, mas com apresentação refinada)
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
            st.markdown("### Resumo Nutricional do Dia")
            st.info(f"**Calorias gastas:** {calorias_gastas_total} kcal")
            st.info(f"**Calorias consumidas:** {calorias_consumidas_total} kcal")
            st.success(f"**Saldo de calorias:** {calorias_consumidas_total - calorias_gastas_total} kcal")

            st.markdown("#### Detalhes dos Macronutrientes")
            st.write(f"- Proteína: {proteina_consumida_total} g")
            st.write(f"- Carboidratos: {carboidratos_consumidos_total} g")
            st.write(f"- Gordura: {gordura_consumida_total} g")

            # Adicionando um resumo dos hábitos
            st.markdown("#### Análise Rápida")
            if calorias_consumidas_total > calorias_gastas_total:
                st.warning("Você consumiu mais calorias do que gastou. Considere ajustar sua dieta ou aumentar a atividade física.")
            elif calorias_consumidas_total < calorias_gastas_total:
                st.success("Você gastou mais calorias do que consumiu. Continue assim para alcançar seus objetivos!")
            else:
                st.info("Seu consumo de calorias está equilibrado com o gasto. Mantenha esse equilíbrio para uma vida saudável.")

            # Adicionando dicas para melhorar hábitos (mantido)
            st.markdown("### Dicas Rápidas para o Dia a Dia")
            st.write("""
            - **Mantenha um diário alimentar**: Anote o que você come e beba para ter uma visão clara de seus hábitos.
            - **Aumente a atividade física**: Tente incluir mais exercícios em sua rotina diária, como caminhar, correr ou praticar esportes.
            - **Beba mais água**: A hidratação é fundamental para a saúde. Tente beber pelo menos 2 litros de água por dia.
            - **Escolha alimentos saudáveis**: Opte por frutas, vegetais, grãos integrais e proteínas magras em vez de alimentos processados.
            - **Estabeleça metas realistas**: Defina metas alcançáveis para sua dieta e exercícios, e celebre suas conquistas.
            - **Consulte um profissional**: Se possível, busque a orientação de um nutricionista ou personal trainer para um plano personalizado.
            """)

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

    else:
        st.error("Nenhum alimento disponível para seleção. Por favor, verifique os arquivos de dados.")