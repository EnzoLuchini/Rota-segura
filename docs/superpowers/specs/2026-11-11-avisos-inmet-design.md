# Avisos meteorológicos oficiais no aplicativo

## Objetivo

Exibir no aplicativo avisos meteorológicos oficiais aplicáveis ao município de São Paulo. Nesta etapa, os avisos são consultados dentro do aplicativo, sem notificações externas ou identificação de usuário. Relatos permanecem para último. A tela e os dados simulados continuam disponíveis em `/simulacao` e não se misturam aos avisos reais.

## Fonte e significado

O portal do INMET aponta para o feed RSS público `https://apiprevmet3.inmet.gov.br/avisos/rss`. Os itens observados apontam para documentos CAP do próprio INMET com status, tipo, identificação, horário com fuso, vigência e polígonos. Em 11/11/2026, o feed retornou 100 itens, inclusive avisos futuros; não foi confirmada a completude ou a existência de paginação. A consulta deve atribuir o INMET e respeitar as condições e exceções de reprodução divulgadas na fonte. Não presumir que todo aviso é vigente, que cobre toda a cidade, ou que confirme um alagamento em uma via.

## Comportamento

- Na área real do aplicativo, a central apresenta título, grau de severidade, início, fim, órgão emissor e link oficial de cada aviso vigente cujo polígono intersecte o município. Apresentar o texto da fonte em detalhe, com tratamento seguro de conteúdo remoto.
- Determinar município por interseção dos polígonos CAP com o limite municipal já utilizado pela API. CAP codifica vértices como latitude,longitude; validar e converter para longitude,latitude. Um aviso da região metropolitana não se aplica automaticamente ao município ou a uma rota específica. Não associar o aviso a uma rota frequente e não inferir que uma via está alagada.
- Aceitar somente avisos públicos e reais com vigência válida e explícita, levando em conta fuso, atualizações, referências e cancelamentos. Se um item, geometria, vínculo de atualização, limite municipal ou fonte não puder ser interpretado de forma segura, indicar resultado incompleto ou indisponível; não apresentar ausência de avisos como situação segura. Avisos futuros não aparecem como vigentes.
- Identificar data e hora da consulta, avisar que a cobertura do feed não foi confirmada e distinguir carregamento, nenhuma correspondência entre os itens consultados, consulta parcial e indisponibilidade. Uma falha de atualização não deve apresentar avisos expirados como vigentes.
- A central deve poder ser aberta sem conta, permissão de localização ou rota. A consulta só ocorre quando a pessoa abrir a central. Não alterar recomendação de rota, não enviar push e não substituir mensagens da Defesa Civil.

## Implementação proposta

- Criar adaptador no backend para RSS e CAP, com URLs fixas e verificação de que links de detalhe pertencem ao domínio do INMET; nunca consultar URLs arbitrárias vindas do feed. Limitar tamanho de resposta, número de itens, concorrência e tempo de espera. Reutilizar cache em memória por período curto e compartilhar consultas simultâneas. Não permitir acesso a entidades externas no parser XML.
- Expor um endpoint de leitura de avisos normalizados com estado, atualização, limitações e itens. Usar identificadores de origem estáveis; falhas ou limites por item devem ser visíveis como resultado parcial. Adicionar biblioteca XML mantida, se necessária, verificando a documentação oficial.
- Reutilizar a composição visual da central do mock com dados e textos reais distintos; manter tratamento acessível de status, lista, detalhes e retorno. Não salvar dados meteorológicos no navegador como se fossem atuais indefinidamente.

## Verificação

Testar interpretação de fuso e vigência, CAP futuro e expirado, geometria em São Paulo e fora dela, aviso atualizado/cancelado, dados inválidos, falhas parciais, feed vazio ou truncado, conteúdo remoto malicioso, limites de tempo e cache. Testar interface real e isolamento da simulação. Conferir a resposta atual contra o portal, sem exigir que necessariamente exista um aviso vigente durante o teste. Documentar limites ainda não confirmados e executar testes e build.
