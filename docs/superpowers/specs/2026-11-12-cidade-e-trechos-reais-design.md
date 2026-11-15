# Situação da cidade e detalhes por trecho — proposta

## Objetivo

Oferecer, na consulta real, uma visão da cidade sem exigir rota e detalhes por trecho da alternativa selecionada, usando dados realmente disponíveis. A simulação permanece acessível em `/simulacao`, claramente identificada. A aplicação apoia decisões, não prevê alagamentos nem garante segurança.

## Fonte para a visão “Agora” — combinação escolhida

O usuário optou por combinar as duas frentes: aproveitar as fontes reais existentes e investigar uma fonte oficial de ocorrências atuais. A aba exibirá medições SIBH nas estações, avisos vigentes do INMET para o município e acesso direto à página de alagamentos do CGE, com horários e ressalvas. Se uma fonte CGE ou outra fonte oficial tiver acesso técnico, atualização, cobertura e condições de uso verificadas, ela poderá ser integrada; na ausência dessas confirmações, não simular pontos nem presumir que uma página HTML ofereça API estável.

Investigação inicial em 12/11/2026: a página pública do CGE apresenta pontos ativos e inativos com data, mas não foi encontrada documentação de uma API ou licença de redistribuição; observou-se HTML gerado no servidor. A estrutura visual de uma consulta isolada e o robots.txt não comprovam estabilidade ou autorização para redistribuir dados. O link oficial será oferecido para consulta direta, com distinção clara entre aviso meteorológico e alagamento confirmado.

## Situação da cidade

- Substituir o acesso da consulta real que hoje abre o mapa demonstrativo por uma visão real no mesmo mapa, sem exigir rota, conta ou permissão de localização. Manter a montagem de rotas acessível e não alterar dados pessoais existentes.
- Em **Agora**, combinar as fontes existentes com a investigação do CGE descrita acima. Exibir fonte, período/horário de cada medição e de cada aviso, horário da consulta, atualizações e estados independentes de carregamento, vazio, antigos, parciais ou indisponíveis. Não inferir ausência de alagamentos a partir de uma lista vazia ou falha. A chuva observada é pontual e sua ausência não garante via seca.
- Em **Histórico**, reutilizar as camadas reais de alagamento e inundação do GeoSampa para a área visível do mapa. A lista e os marcadores devem refletir a mesma consulta e preservar tipo, local disponível, data da ocorrência/carga, fonte, agrupamento e estado parcial/indisponível. Informar que a camada é histórica, pode ter cobertura incompleta e que não representa alagamento ativo ou automaticamente uma série de vários anos.
- Compartilhar os resultados e estados das fontes entre o mapa e o painel, filtrando a lista pelos limites efetivamente visíveis, inclusive quando a consulta usar uma área ampliada. Manter separados os estados das duas camadas históricas, respeitar o limite de extensão da consulta e descartar respostas obsoletas. Eventos associados a uma rota não devem aparecer como ocorrências atuais.
- Permitir selecionar um item por toque ou teclado e localizá-lo no mapa. Atualizar consulta ao movimentar ou aproximar o mapa, respeitar limites do serviço, evitar requisições obsoletas e manter as atribuições visíveis. Não converter a área de aviso meteorológico em ponto nem identificar via afetada sem dados que comprovem isso.

## Explicação e detalhes reais por trecho

- A partir da comparação real, oferecer “Entenda esta comparação” e “Detalhes por trecho” para a alternativa selecionada; voltar preserva a viagem e a seleção. Explicar a fórmula experimental 50/30/20, as medições e suas fontes, a validade e o motivo da recomendação, empate ou ausência dela. A pontuação continua relativa à viagem inteira, não uma medida atribuída individualmente aos trechos.
- Dividir a geometria real da rota em trechos sequenciais identificados por distância aproximada desde a origem, sem inventar nome de rua. Permitir selecionar cada trecho com teclado ou toque e destacá-lo no mapa. Relacionar apenas evidências cuja posição ou geometria foram efetivamente analisadas: registros históricos próximos, cruzamentos de área de risco e de mancha modelada, quando consultadas.
- Chuva permanece medição de estação: preservar as amostras já aplicadas ao cálculo, inclusive as sem cobertura, para identificar estação, distância, horário e cobertura por trecho, respeitando a validade da medição sem alterar a pontuação global. Não sugerir medição da via. Em caso de dados insuficientes ou parciais, indicá-los por fonte e não atribuir valor zero nem classificar trecho como seguro.
- Projetar os registros históricos sobre a rota para associá-los aos trechos, tratando fronteiras e deduplicando pela combinação de fonte e identificador. A geometria original pode atravessar vários trechos: calcular os cruzamentos com as áreas reais ou informar apenas o cruzamento comprovado, sem apresentar toda a geometria como atingida. A mancha de retorno de 5 anos é cenário potencial e não histórico dos últimos cinco anos nem previsão atual.

## Implementação e verificações

Conectar o painel da cidade aos resultados reais já carregados pelo mapa, com estados de dados explícitos e sem duplicar consultas desnecessariamente; manter a resposta à mudança de viewport. Ampliar o contrato da API de rotas somente quando necessário para associar evidências a trechos, preservando campos atuais e os critérios aprovados de comparação.

Testar ausência de ocorrências, dados parciais, fontes lentas/indisponíveis, chuva antiga, avisos vencidos, histórico sem coordenadas ou incompleto, mudança de viewport e foco, alternância entre modos e preservação da rota. Testar o mapeamento de evidências e geometrias por trecho, inclusive mudanças de alternativa e pontos nas fronteiras. Verificar o fluxo no navegador em celular e desktop, rodar testes e build e registrar limitações. Não publicar sem solicitação.

## Fontes e limites

- GeoSampa, alagamentos: https://metadados.geosampa.prefeitura.sp.gov.br/geonetwork/srv/api/records/432c06b1-03a1-4b1f-9210-423e1b58e869 — manutenção indicada como mensal e ETL sem sincronismo; não caracteriza situação atual.
- CGE, classificação de alagamentos: https://cge.prefeitura.sp.gov.br/v3/alagamentos-classificacao.jsp — distingue pontos ativos/inativos e informa foco em vias principais.
- SIBH e INMET: integrações existentes, com restrições de uso, cobertura e completude já registradas em `docs/rotas-reais.md`.
