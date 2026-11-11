# Rotas frequentes reais no navegador

Em 11/11/2026, o usuário pediu para reutilizar o mock e armazenar as rotas no navegador nesta etapa. Essa decisão substitui a proposta de banco local no servidor. Não há login nem sincronização entre dispositivos.

Reutilizar as telas existentes de salvar, listar, editar e excluir rotas. A consulta real armazena nome, dias, horários, modalidade carro e os rótulos e coordenadas de origem e destino escolhidos no fluxo real, sob chave separada dos dados fictícios. Permitir carregar os pontos para uma nova consulta, recalculando as alternativas. Não guardar geometria ou histórico de deslocamento.

Informar que os dados ficam neste navegador, podem ser acessados por outras pessoas que o utilizem e podem desaparecer ao limpar seus dados. Tratar falhas de armazenamento sem informar sucesso falso. Excluir apenas a rota selecionada após confirmação. Alertas reais não são enviados. Dados e formulários da simulação permanecem independentes; relatos ficam para último.

Verificar salvamento dos pontos reais, persistência após recarregar, edição, cancelamento e exclusão, reutilização dos pontos, isolamento da simulação e falha de gravação; executar testes, build e verificar no navegador.
