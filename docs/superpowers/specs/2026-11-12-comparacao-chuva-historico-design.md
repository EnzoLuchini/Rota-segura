# Comparação experimental com chuva e histórico — aprovada

## Objetivo

Incluir chuva observada e ocorrências históricas na comparação das alternativas reais de carro, mantendo a explicação dos dados e suas limitações. A recomendação continua experimental: não é previsão de alagamento nem garantia de segurança. Esta proposta não adiciona notificações, relatos reais ou outras modalidades.

## Dados disponíveis

- GeoSampa: extensão do trajeto dentro de polígonos de risco hidrológico, cuja cobertura é limitada a áreas mapeadas.
- Defesa Civil / GeoSampa: pontos de alagamento e inundação da camada consultada, atualmente do ano corrente. A proximidade de até 100 m é uma hipótese existente, não precisão comprovada nem registro de ocorrência atual.
- SIBH / SP Águas: acumulados observados por estação para o período consultado. Uma medição vale para a estação e não comprova a chuva no trajeto. A reutilização da API e estabilidade ainda precisam de confirmação.

## Critério proposto

Comparar três indicadores para cada alternativa: metros de interseção com áreas mapeadas; quantidade de registros históricos distintos a até 100 m; maior acumulado observado nas estações associadas à rota. São evidências de natureza diferente e a pontuação combinada não representa probabilidade de alagamento nem risco absoluto.

Para associar estações, amostrar cada trajeto a cada 250 m e incluir as extremidades. Uma amostra tem cobertura quando há estação válida e não desatualizada a até 3 km; associar a estação mais próxima e considerar o maior acumulado entre as estações associadas. Exibir quais estações foram usadas, distância, acumulado e intervalo de cada leitura. As distâncias e a amostragem são hipóteses experimentais, não limites de representatividade meteorológica comprovados. A cobertura por proximidade é apenas uma condição técnica mínima, não prova de chuva uniforme entre estação e via.

A proposta é usar pesos experimentais de **50% para áreas mapeadas, 30% para histórico e 20% para chuva**. Para cada indicador, atribuir zero ao menor valor entre as alternativas e um ao maior, interpolando linearmente os demais; quando todos forem iguais, o indicador contribui zero para todas. A pontuação relativa de cada rota é `100 × (0,5 × áreas + 0,3 × histórico + 0,2 × chuva)`. Assim, menor pontuação indica menor exposição relativa conhecida somente entre as alternativas consultadas. Se as mesmas estações representarem todas as alternativas, a chuva será contexto comum, sem distinção artificial.

Recomendar apenas a menor pontuação única, com diferença de pelo menos um ponto para a segunda; caso contrário, informar empate. Exibir os três valores originais, a pontuação e a fórmula, com os pesos identificados como hipóteses ainda não calibradas. O resultado pode mudar quando as alternativas disponíveis mudarem e não pode ser comparado a outra viagem. Os pesos não derivam de calibração científica nem estabelecem que um fator tem essa importância em condições reais.

## Qualidade dos dados e comportamento em falhas

- Para recomendar, as mesmas fontes precisam estar disponíveis e completas para todas as alternativas; nenhuma contagem ou medição ausente será transformada em zero. Se risco estiver indisponível, qualquer tipo de histórico falhar ou for truncado, chuva estiver desativada, falhar, vier parcial ou não houver cobertura técnica em alguma amostra de qualquer trajeto, exibir os valores que forem conhecidos, indicar limitações e não recomendar.
- O histórico exibirá a fonte, o período efetivo conhecido e a distância; deduplicar por tipo e identificador estável, sem unir ocorrências distintas que por acaso tenham IDs iguais entre camadas. Sem período confiável, não assumir uma série de vários anos. Zero significa somente nenhum registro encontrado na consulta.
- Chuva com observação futura inválida, antiga (mais de 90 minutos), valores inválidos ou sem período identificável não entra no indicador. A ausência ou invalidez de dados é indisponibilidade, não ausência de chuva. Mostrar data de consulta e intervalos das leituras, inclusive se elas forem diferentes.
- As chamadas adicionais devem ser concorrentes quando independentes, com limite de duração já existente, sem bloquear a exibição das rotas por falha de chuva ou histórico. A recomendação e os dados devem ser calculados para o mesmo conjunto de fontes.
- Atualizar o cache de comparação: não reaproveitar além da validade mais curta da chuva; verificar a idade das leituras mesmo em cache e não guardar respostas parciais ou indisponíveis. O cache permanece temporário e independente por instância.

## Interface e verificação

Cada alternativa exibirá os três indicadores, fonte, período e disponibilidade, distinguindo medições pontuais, registros anteriores e áreas mapeadas. Explicar por que houve recomendação ou por que ela não foi possível, inclusive conflito ou falta de dados. Não exibir termos de segurança garantida, previsão ou risco absoluto.

Cobrir geometria e amostragem, distâncias-limite, estações antigas ou ausentes, fontes parciais, deduplicação, empate, conflito, dominância, fontes indisponíveis e cache. Verificar a API e a interface em celular e desktop, incluindo falhas simuladas, antes de disponibilizar em produção. Não há mudança nos relatos ou nas rotas salvas.

## Decisões e aprovação

O usuário aprovou a pontuação combinada, os pesos, a normalização e os limites acima em 12/11/2026. Esses parâmetros não são cientificamente calibrados.
