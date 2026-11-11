# Contexto de inundação nas rotas

Objetivo: mostrar ocorrências históricas de alagamento e inundação e o cenário modelado com período de retorno de 5 anos no mapa e associá-los aos trechos das rotas de carro.

- Consultar ocorrências por área e manchas pela geometria da rota com limites; respostas parciais ou falhas não podem ser interpretadas como ausência de dados. No mapa, usar a camada WMS oficial da área visível.
- Comparar pontos a até 100 m da linha e detectar segmentos que intersectam manchas; informar distância, data, fonte e período, sem incluir estes dados na recomendação atual.
- Exibir camadas opcionais, estados de erro/carregamento/truncamento e evidências para a rota selecionada, com destaque dos segmentos no mapa.
- Testar fontes incompletas, associação espacial e controles; executar testes e build. Verificar serviços reais sem pressupor disponibilidade de chave de rotas.

Limites: registros do ano corrente não são eventos atuais; período de retorno não é previsão; distância de 100 m é hipótese experimental, não precisão validada.
