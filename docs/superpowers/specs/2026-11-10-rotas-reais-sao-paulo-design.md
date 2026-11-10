# Rotas reais em São Paulo — proposta de design

## Objetivo e escopo

Permitir que uma pessoa informe origem e destino no município de São Paulo, consulte trajetos de carro e compare a exposição conhecida a informações geográficas relacionadas a enchentes e inundações. A experiência atual permanece disponível em `/simulacao`, identificada como fictícia e independente dos resultados reais. A página principal passa a oferecer a consulta real. Caminhadas ficam para uma etapa posterior; contas, login, notificações e relatos reais não integram esta entrega.

Esta é uma proposta para aprovação. As escolhas técnicas abaixo são recomendações, não decisões previamente tomadas pelo usuário.

## Jornada

1. A pessoa busca origem e destino e confirma os locais encontrados. A interface esclarece que a cobertura é limitada ao município de São Paulo.
2. O backend busca alternativas para carro e analisa as geometrias retornadas, apresentando duração estimada, distância e evidências disponíveis no mapa e nos cartões. Pode haver apenas uma alternativa.
3. Cada evidência mostra fonte, tipo, data ou período disponíveis e relação espacial com o trajeto. Áreas mapeadas e registros históricos não são ocorrências atuais.
4. Quando for possível comparar as alternativas com a mesma cobertura, destacar a de menor exposição conhecida segundo o critério experimental descrito abaixo. Quando não houver base suficiente, apresentar os trajetos sem afirmar que um é mais seguro.
5. Caso a busca, as rotas ou a fonte de risco falhem, mostrar o problema e permitir nova tentativa. A ausência de registros não equivale a ausência de risco. Dados fictícios nunca são usados como resultado real ou alternativa automática.

## Serviços e dados

- API Node.js separada da interface, com adaptadores para geocodificação, rotas e fontes de risco, e configuração por ambiente. React, Vite e Leaflet continuam na interface.
- Avaliar primeiro o openrouteservice/HeiGIT para geocodificação e rotas de carro, sujeito à verificação de documentação, cobertura, condições e chave da API. Credenciais permanecem no servidor. Disponibilidade, cotas e alternativas retornadas não são garantidas; se a chave não estiver configurada, a aplicação informa essa condição.
- Validar o limite municipal usando geometria oficial adequada, tanto para origem quanto para destino e para o percurso inteiro. Não aceitar um retângulo aproximado como prova de que o trajeto permanece na cidade. Informar quando uma alternativa sai do município.
- Investigar as camadas adequadas do GeoSampa e seus metadados antes de definir como usá-las: significado, abrangência, data, formato, condições de uso e disponibilidade. A camada de risco hidrológico em assentamentos precários tem cobertura específica e não representa toda a cidade. Somente camadas cujo significado e acesso estejam verificados entram no cálculo.
- A SP Águas/SIBH é candidata para uma etapa de chuva observada, mas fica fora do cálculo inicial até que acesso, cobertura, atualização e uso dos dados estejam validados. Não tratar uma estação como medição exata de todo o trajeto.
- Começar sem banco persistente: consultar fonte validada com limites, timeout e cache temporário quando adequado. Caso o volume ou a confiabilidade exijam ingestão geográfica persistente, justificar a escolha em etapa própria.

## Comparação explicável

Comparar a geometria real de cada alternativa com as geometrias de fontes verificadas. Quando houver polígonos aplicáveis, mostrar se há interseção e a extensão aproximada do trajeto dentro das áreas mapeadas, identificando o tipo de área e suas limitações. Não somar polígonos sobrepostos duas vezes. Não converter classificação residencial em classificação oficial da via. Registros históricos pontuais só entram se sua precisão espacial e período forem compreendidos; qualquer tolerância espacial deve ser explícita, testada e identificada como hipótese experimental.

Para uma primeira ordenação, comparar apenas alternativas avaliadas com as mesmas fontes disponíveis e uma geometria válida; entre elas, menor extensão em áreas aplicáveis pode indicar menor exposição conhecida **àquela camada**, não risco absoluto. Empates, ausência de diferenças observáveis, indisponibilidade da fonte ou cobertura insuficiente não produzem recomendação. Não inventar pesos, probabilidade, condições em tempo real ou segurança garantida. Exibir também as limitações da cobertura mesmo quando houver uma diferença observável.

## Isolamento da simulação

O fluxo atual, seus dados e persistência local permanecem na página de simulação. O fluxo real não importa cenários, ocorrências, alertas ou relatos fictícios e não compartilha seus dados locais como se fossem reais. Manter uma navegação clara entre as duas experiências, com rótulos visíveis para a simulação. Ajustar o roteamento para que `/simulacao` funcione também após recarregar, inclusive na hospedagem escolhida.

## Contratos e tratamento de falhas

A API deve oferecer busca de locais e comparação de rotas, com contratos específicos definidos no plano de implementação. A resposta de comparação deve conter geometria, distância, duração, evidências por rota, fontes e datas disponíveis, estado de cada fonte e motivo de eventual ausência de recomendação. Validar entrada, coordenadas e limites; não registrar endereços ou coordenadas desnecessariamente. Definir timeout, limites de resposta e mensagens para falha de provedor, resultados vazios, cota excedida e fonte indisponível. Atribuir os provedores e dados conforme seus termos.

## Verificação e critérios de aceite

- O protótipo existente abre em `/simulacao` e conserva seus fluxos e dados locais.
- No fluxo real, dois locais válidos de São Paulo produzem rota(s) de carro reais quando os serviços e a chave estão disponíveis; a geometria mostrada corresponde à resposta do provedor.
- Fontes de risco verificadas são comparadas com as alternativas e identificadas com suas limitações; histórico não aparece como ocorrência atual.
- Uma rota fora dos limites, falhas, ausência de chave, nenhuma alternativa e dados de risco indisponíveis são tratados sem resultados inventados ou recomendação indevida.
- Testes cobrem comparação espacial, sobreposição, empate, cobertura insuficiente, validação e falhas de serviços; testes de integração com respostas controladas são complementados por uma verificação manual real com credenciais, quando disponíveis.
- A interface é conferida em celular e desktop, incluindo teclado, estados de carregamento/erro, atribuições e distinção entre real e simulação.

## Referências iniciais

- Metadados GeoSampa, Risco Hidrológico: https://metadados.geosampa.prefeitura.sp.gov.br/geonetwork/srv/api/records/cefffc6d-8d1d-419b-a267-8d87a37b9e0e
- SIBH / SP Águas: https://apps.spaguas.sp.gov.br/sibh/
- Restrições de API openrouteservice: https://staging.openrouteservice.org/restrictions/

Essas referências identificam candidatos, não comprovam que as integrações tenham sido testadas ou aprovadas para esta aplicação.
