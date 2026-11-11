# Chuva observada em São Paulo — proposta

## Objetivo

Adicionar à consulta real uma camada informativa de chuva observada por estações no município de São Paulo, mantendo separada a simulação. Esta etapa não altera a recomendação de rotas e não prevê alagamentos.

## Fonte e limites

Investigar e utilizar, se os significados e as condições de uso forem confirmados, as medições públicas do SIBH/SP Águas para a última hora. A resposta do serviço usado pelo portal foi acessível em 11/11/2026, mas não foi identificado contrato público de estabilidade da API. Tratar a integração como experimental e sujeita a indisponibilidade. Validar o significado e a unidade dos campos antes de exibir valores.

A observação pertence à estação e ao período informado; não representa a chuva em toda a região nem garante que uma via esteja segura. Uma estação sem medição válida ou recente não deve aparecer como chuva zero. A rede pode ter cobertura incompleta.

## Comportamento proposto

- A API consulta o serviço com timeout e cache temporário limitado; filtra as estações do município e valida coordenadas, valores e horários antes de devolver dados normalizados com identificação, fonte e período.
- A resposta deve distinguir disponibilidade, falta de dados válidos e falha da fonte; medições antigas são identificadas individualmente, sem inventar horários ou valores.
- A interface oferece uma camada opcional no mapa real, com marcadores e detalhes acessíveis por teclado e toque. Exibe horário, período, origem e limitações; carregamento, dados antigos, ausência e indisponibilidade são explícitos.
- Não adicionar a observação ao cálculo de exposição nem associá-la automaticamente a uma rota. Não criar banco, conta ou notificações nesta etapa.

## Verificação

Testar normalização, estações fora do município, valores nulos ou inválidos, datas antigas, falha e timeout da fonte, cache e apresentação dos estados. Executar os testes e o build existentes. Quando o serviço estiver acessível, conferir o resultado real contra o portal; documentar se os campos ou condições de uso não puderem ser confirmados.
